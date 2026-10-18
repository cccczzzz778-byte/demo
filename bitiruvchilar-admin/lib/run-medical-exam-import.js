'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { DatabaseSync } = require('node:sqlite');
const { migrateGraduateDb } = require('./graduate-db');
const { canonicalHudud } = require('./graduate-utils');

function pickLatest(rows) {
  const byKey = new Map();
  for (const r of rows) {
    const key = `${r.pinfl}|${r.hudud}`;
    const prev = byKey.get(key);
    if (!prev || String(r.medical_exam_date || '') >= String(prev.medical_exam_date || '')) byKey.set(key, r);
  }
  return [...byKey.values()];
}

module.exports = function runMedicalExamImport() {
  const version = String(process.env.MEDICAL_EXAM_IMPORT_VERSION || '').trim();
  const parts = [];
  for (let i = 0; i < 100; i++) {
    const v = process.env[`MEDICAL_EXAM_IMPORT_${String(i).padStart(2, '0')}`];
    if (v) parts.push(v);
  }
  if (!version || !parts.length) return;

  const compact = JSON.parse(zlib.brotliDecompressSync(Buffer.from(parts.join(''), 'base64')).toString('utf8'));
  const rows = (compact.r || []).map(r => ({
    pinfl: String(r[0] || '').replace(/\D/g, ''),
    hudud: canonicalHudud(r[1] || ''),
    medical_institution: String(r[2] || '').trim(),
    medical_exam_date: String(r[3] || '').trim(),
    diagnosis: String(r[4] || '').trim(),
    health_status: String(r[5] || 'Aniqlanmagan').trim(),
    ambulatory: Number(r[6]) || 0,
    inpatient: Number(r[7]) || 0,
    operative: Number(r[8]) || 0,
    wellness_district: Number(r[9]) || 0,
    wellness_region: Number(r[10]) || 0,
    wellness_republic: Number(r[11]) || 0,
  }));
  const meta = compact.m || {};
  if (rows.length !== 2548) throw new Error(`Tibbiy ko‘rik payload qatorlari mos emas: ${rows.length}`);
  const unique = pickLatest(rows);
  if (unique.length !== 2540) throw new Error(`Tibbiy ko‘rik unique JSHSHIR+hudud mos emas: ${unique.length}`);

  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;CREATE TABLE IF NOT EXISTS seed_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL DEFAULT '');");
  migrateGraduateDb(db);
  const done = db.prepare("SELECT value FROM seed_meta WHERE key='medical_exam_import_version'").get();
  if (done && done.value === version) { db.close(); return; }

  const cols = new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x => x.name));
  for (const [n, t, def] of [
    ['medical_institution', 'TEXT', "''"], ['medical_exam_date', 'TEXT', "''"], ['diagnosis', 'TEXT', "''"],
    ['diagnosis_category', 'TEXT', "''"], ['health_status', 'TEXT', "'Aniqlanmagan'"],
    ['ambulatory', 'INTEGER', '0'], ['inpatient', 'INTEGER', '0'], ['operative', 'INTEGER', '0'],
    ['wellness_district', 'INTEGER', '0'], ['wellness_region', 'INTEGER', '0'], ['wellness_republic', 'INTEGER', '0'],
    ['op_oshp', 'TEXT', "''"]
  ]) if (!cols.has(n)) db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${n} ${t} NOT NULL DEFAULT ${def}`);

  const backupDir = path.join(path.dirname(dbPath), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const safe = version.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80);
  const backupPath = path.join(backupDir, `bitiruvchilar-before-medical-${safe}.sqlite`);
  if (!fs.existsSync(backupPath)) {
    db.exec('PRAGMA wal_checkpoint(FULL)');
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
  }

  const exists = db.prepare('SELECT COUNT(*) n FROM excel_graduates WHERE pinfl=? AND hudud=?');
  for (const r of unique) {
    const n = Number(exists.get(r.pinfl, r.hudud).n || 0);
    if (!n) throw new Error(`Asosiy 9823 ichida topilmadi: ${r.pinfl} / ${r.hudud}`);
  }

  const upd = db.prepare(`UPDATE excel_graduates SET
    medical_institution=?, op_oshp=?, medical_exam_date=?, diagnosis=?, diagnosis_category=?, health_status=?,
    ambulatory=?, inpatient=?, operative=?, wellness_district=?, wellness_region=?, wellness_republic=?
    WHERE pinfl=? AND hudud=?`);
  const expected = {
    'Когон шаҳар': { rows: 278, examined: 274, healthy: 244, sick: 13, other: 19, unknown: 2 },
    'Жондор тумани': { rows: 911, examined: 911, healthy: 900, sick: 0, other: 11, unknown: 0 },
    'Пешку тумани': { rows: 486, examined: 486, healthy: 475, sick: 11, other: 0, unknown: 0 },
    'Қоракўл тумани': { rows: 874, examined: 873, healthy: 788, sick: 73, other: 12, unknown: 1 },
  };

  db.exec('BEGIN IMMEDIATE');
  try {
    let changed = 0;
    for (const r of unique) {
      const category = r.health_status === 'Kasal' ? r.diagnosis : '';
      changed += Number(upd.run(
        r.medical_institution, r.medical_institution, r.medical_exam_date, r.diagnosis, category, r.health_status,
        r.ambulatory, r.inpatient, r.operative, r.wellness_district, r.wellness_region, r.wellness_republic,
        r.pinfl, r.hudud
      ).changes || 0);
    }
    if (changed !== 2548) throw new Error(`Yangilangan asosiy qatorlar soni xato: ${changed}`);

    const total = Number(db.prepare('SELECT COUNT(*) n FROM excel_graduates').get().n || 0);
    if (total !== 9823) throw new Error(`Jami bitiruvchi soni o‘zgardi: ${total}`);

    const byHudud = {};
    for (const [hudud, exp] of Object.entries(expected)) {
      const got = db.prepare(`SELECT
        COUNT(*) rows,
        SUM(CASE WHEN medical_exam_date<>'' THEN 1 ELSE 0 END) examined,
        SUM(CASE WHEN health_status='Sog‘lom' THEN 1 ELSE 0 END) healthy,
        SUM(CASE WHEN health_status='Kasal' THEN 1 ELSE 0 END) sick,
        SUM(CASE WHEN health_status='Boshqa holat' THEN 1 ELSE 0 END) other,
        SUM(CASE WHEN health_status='Aniqlanmagan' THEN 1 ELSE 0 END) unknown
        FROM excel_graduates WHERE hudud=?`).get(hudud);
      const clean = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, Number(v || 0)]));
      byHudud[hudud] = clean;
      for (const [k, v] of Object.entries(exp)) if (clean[k] !== v) throw new Error(`${hudud} ${k}: ${clean[k]} != ${v}`);
    }

    const all = db.prepare(`SELECT
      SUM(CASE WHEN medical_exam_date<>'' THEN 1 ELSE 0 END) examined,
      SUM(CASE WHEN health_status='Sog‘lom' THEN 1 ELSE 0 END) healthy,
      SUM(CASE WHEN health_status='Kasal' THEN 1 ELSE 0 END) sick,
      SUM(CASE WHEN medical_exam_date<>'' AND health_status NOT IN ('Sog‘lom','Kasal') THEN 1 ELSE 0 END) other
      FROM excel_graduates`).get();
    const overall = Object.fromEntries(Object.entries(all).map(([k,v])=>[k,Number(v||0)]));
    const expectedOverall = { examined: 3148, healthy: 3008, sick: 100, other: 40 };
    for (const [k,v] of Object.entries(expectedOverall)) if (overall[k] !== v) throw new Error(`Yakuniy ${k}: ${overall[k]} != ${v}`);
    const result = { version, total, uniquePayload: unique.length, changed, byHudud, overall, backupPath, sourceMeta: meta };
    db.prepare("INSERT INTO seed_meta(key,value) VALUES('medical_exam_import_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(version);
    db.prepare("INSERT INTO seed_meta(key,value) VALUES('medical_exam_import_result',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(result));
    db.exec('COMMIT');
    console.log('MEDICAL EXAM IMPORT OK', JSON.stringify(result));
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch {}
    throw e;
  } finally { db.close(); }
};

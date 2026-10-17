'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const express = require('express');

const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'bitiruvchilar.db');
const PROD = process.env.NODE_ENV === 'production';
const rawSecret = String(process.env.SESSION_SECRET || '');
if (PROD && rawSecret.length < 32) throw new Error('Production uchun SESSION_SECRET kamida 32 belgidan iborat bo‘lishi shart.');
const SECRET = rawSecret || (() => {
  const f = path.join(path.dirname(DB_PATH), '.session-secret');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch {}
  const s = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s, { mode: 0o600 });
  return s;
})();
const SESSION_HOURS = 8;
const COOKIE_NAME = PROD ? '__Host-sid' : 'sid';

const HUDUDLAR = [
  ['buxoro-shahri', 'Buxoro shahri'], ['kogon-shahri', 'Kogon shahri'], ['olot', 'Olot tumani'], ['buxoro-tumani', 'Buxoro tumani'],
  ['vobkent', 'Vobkent tumani'], ['gijduvon', 'Gʻijduvon tumani'], ['jondor', 'Jondor tumani'], ['kogon-tumani', 'Kogon tumani'],
  ['qorakol', 'Qorakoʻl tumani'], ['qorovulbozor', 'Qorovulbozor tumani'], ['peshku', 'Peshku tumani'], ['romitan', 'Romitan tumani'],
  ['shofirkon', 'Shofirkon tumani']
];
const HUDUD_KEYS = new Set(HUDUDLAR.map((h) => h[0]));
const HOLAT = ['Ishlayapti', 'Ishsiz', 'Oʻqishda', 'Harbiy xizmatda', 'Bola parvarishi taʼtilida', 'Boshqa'];
const DARAJA = ['Oliy', 'Oʻrta tibbiy'];

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL UNIQUE COLLATE NOCASE,
  fio TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('admin','operator')),
  hudud TEXT,
  pass_hash TEXT NOT NULL,
  must_change INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  token_ver INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fio TEXT NOT NULL,
  muassasa TEXT NOT NULL,
  mutaxassislik TEXT NOT NULL DEFAULT '',
  daraja TEXT NOT NULL,
  hudud TEXT NOT NULL,
  holat TEXT NOT NULL,
  ish_joyi TEXT NOT NULL DEFAULT '',
  lavozim TEXT NOT NULL DEFAULT '',
  ish_hududi TEXT NOT NULL DEFAULT '',
  yil INTEGER NOT NULL DEFAULT 2026,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS records_hudud ON records(hudud);
CREATE UNIQUE INDEX IF NOT EXISTS records_uniq ON records(yil, fio COLLATE NOCASE, muassasa COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS shtat (hudud TEXT PRIMARY KEY, bosh_shtat INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT
);
`);

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  return 'scrypt$' + salt.toString('hex') + '$' + key.toString('hex');
}
function checkPassword(pw, stored) {
  const [alg, saltHex, keyHex] = String(stored).split('$');
  if (alg !== 'scrypt') return false;
  try {
    const key = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 32, { N: 16384, r: 8, p: 1 });
    const want = Buffer.from(keyHex, 'hex');
    return want.length === key.length && crypto.timingSafeEqual(want, key);
  } catch { return false; }
}
const DUMMY_HASH = hashPassword(crypto.randomBytes(8).toString('hex'));

if (!db.prepare('SELECT COUNT(*) AS n FROM users').get().n) {
  const login = String(process.env.ADMIN_LOGIN || (PROD ? '' : 'Admin')).trim();
  const pass = String(process.env.ADMIN_PASSWORD || (PROD ? '' : 'Admin'));
  if (PROD && (!login || pass.length < 12 || /^(admin|password|parol|123456|qwerty)/i.test(pass))) {
    throw new Error('Production birinchi ishga tushishida kuchli ADMIN_LOGIN va ADMIN_PASSWORD berilishi shart.');
  }
  db.prepare('INSERT INTO users (login, fio, role, pass_hash, must_change) VALUES (?, ?, ?, ?, 1)').run(login, 'Administrator', 'admin', hashPassword(pass));
}

const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
function makeToken(u) {
  const body = Buffer.from(JSON.stringify({ id: u.id, v: u.token_ver, exp: Date.now() + SESSION_HOURS * 3600e3 })).toString('base64url');
  return body + '.' + sign(body);
}
function readToken(t) {
  if (!t || typeof t !== 'string' || !t.includes('.')) return null;
  const [body, mac] = t.split('.');
  const good = sign(body);
  if (mac.length !== good.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
const cookieOpts = () => `Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}${PROD ? '; Secure' : ''}`;
function getCookie(req, name) {
  const c = req.headers.cookie || '';
  for (const part of c.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

const app = express();
app.disable('x-powered-by');
if (PROD) app.set('trust proxy', 1);
app.use((req, res, next) => {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'",
    'Cache-Control': 'no-store'
  };
  if (PROD) headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  res.set(headers);
  next();
});
app.use(express.json({ limit: '256kb', type: 'application/json' }));
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    const fetchSite = String(req.headers['sec-fetch-site'] || '');
    if (fetchSite === 'cross-site') return res.status(403).json({ error: 'Ruxsat etilmagan manba.' });
    if (origin) {
      try {
        const u = new URL(origin);
        if (u.host !== req.headers.host || !['http:', 'https:'].includes(u.protocol)) return res.status(403).json({ error: 'Ruxsat etilmagan manba.' });
      } catch { return res.status(403).json({ error: 'Ruxsat etilmagan manba.' }); }
    }
  }
  next();
});

function auth(req, res, next) {
  const p = readToken(getCookie(req, COOKIE_NAME));
  const u = p && db.prepare('SELECT * FROM users WHERE id = ?').get(p.id);
  if (!u || !u.active || u.token_ver !== p.v) return res.status(401).json({ error: 'Tizimga qayta kiring.' });
  req.user = u;
  if (u.must_change && !['/api/me', '/api/password', '/api/logout'].includes(req.path)) return res.status(403).json({ error: 'Avval parolni almashtiring.', mustChange: true });
  next();
}
const adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Faqat administrator uchun.' });
const audit = (uid, action, detail) => db.prepare('INSERT INTO audit (user_id, action, detail) VALUES (?, ?, ?)').run(uid, action, detail == null ? null : String(detail).slice(0, 500));
const pub = (u) => ({ id: u.id, login: u.login, fio: u.fio, role: u.role, hudud: u.hudud, mustChange: !!u.must_change, active: !!u.active });
const scope = (u) => u.role === 'operator' && u.hudud ? { sql: ' AND hudud = ?', args: [u.hudud] } : { sql: '', args: [] };

const fails = new Map();
const failKey = (req, login) => (req.ip || '') + '|' + String(login).toLowerCase();
function tooMany(k) { const f = fails.get(k); return f && f.n >= 8 && Date.now() - f.t < 15 * 60e3; }
function noteFail(k) {
  if (fails.size > 5000) { const now = Date.now(); for (const [key, f] of fails) if (now - f.t > 15 * 60e3) fails.delete(key); }
  const f = fails.get(k); if (!f || Date.now() - f.t > 15 * 60e3) fails.set(k, { n: 1, t: Date.now() }); else f.n++;
}

app.post('/api/login', (req, res) => {
  const login = String(req.body?.login || '').trim().slice(0, 80);
  const pass = String(req.body?.password || '').slice(0, 256);
  const k = failKey(req, login);
  if (tooMany(k)) return res.status(429).json({ error: 'Juda koʻp notoʻgʻri urinish. 15 daqiqadan soʻng qayta urinib koʻring.' });
  const u = db.prepare('SELECT * FROM users WHERE login = ?').get(login);
  const ok = checkPassword(pass, u ? u.pass_hash : DUMMY_HASH) && u && u.active;
  if (!ok) { noteFail(k); return res.status(401).json({ error: 'Login yoki parol notoʻgʻri.' }); }
  fails.delete(k);
  audit(u.id, 'login');
  res.set('Set-Cookie', COOKIE_NAME + '=' + encodeURIComponent(makeToken(u)) + '; ' + cookieOpts());
  res.json({ user: pub(u) });
});
app.post('/api/logout', (req, res) => {
  res.set('Set-Cookie', COOKIE_NAME + '=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0' + (PROD ? '; Secure' : ''));
  res.json({ ok: true });
});
app.get('/api/me', auth, (req, res) => res.json({ user: pub(req.user), hududlar: HUDUDLAR, holat: HOLAT, daraja: DARAJA }));

function weak(pw, login) {
  if (pw.length < 8) return 'Parol kamida 8 belgidan iborat boʻlsin.';
  if (pw.toLowerCase() === String(login).toLowerCase() || /^(admin|password|parol|12345678|qwerty)/i.test(pw)) return 'Bu parol juda oddiy. Boshqasini tanlang.';
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return 'Parolda harf va raqam boʻlsin.';
  return null;
}
app.post('/api/password', auth, (req, res) => {
  const cur = String(req.body?.current || '').slice(0, 256);
  const next = String(req.body?.next || '').slice(0, 256);
  if (!checkPassword(cur, req.user.pass_hash)) return res.status(400).json({ error: 'Joriy parol notoʻgʻri.' });
  const w = weak(next, req.user.login); if (w) return res.status(400).json({ error: w });
  db.prepare('UPDATE users SET pass_hash = ?, must_change = 0, token_ver = token_ver + 1 WHERE id = ?').run(hashPassword(next), req.user.id);
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  audit(u.id, 'password');
  res.set('Set-Cookie', COOKIE_NAME + '=' + encodeURIComponent(makeToken(u)) + '; ' + cookieOpts());
  res.json({ user: pub(u) });
});

const clean = (s, max = 200) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function validRecord(b, user) {
  const r = {
    fio: clean(b.fio, 120), muassasa: clean(b.muassasa, 200), mutaxassislik: clean(b.mutaxassislik, 120), daraja: clean(b.daraja, 30),
    hudud: clean(b.hudud, 40), holat: clean(b.holat, 40), ish_joyi: clean(b.ish_joyi, 200), lavozim: clean(b.lavozim, 120), ish_hududi: clean(b.ish_hududi, 40)
  };
  if (r.fio.length < 5) return { error: 'FIO toʻliq kiritilmagan.' };
  if (!r.muassasa) return { error: 'Bitirgan muassasa kiritilmagan.' };
  if (!DARAJA.includes(r.daraja)) return { error: 'Daraja notoʻgʻri.' };
  if (!HUDUD_KEYS.has(r.hudud)) return { error: 'Yashash hududi notoʻgʻri.' };
  if (!HOLAT.includes(r.holat)) return { error: 'Holat notoʻgʻri.' };
  if (r.ish_hududi && !HUDUD_KEYS.has(r.ish_hududi) && r.ish_hududi !== 'boshqa') return { error: 'Ish joyi hududi notoʻgʻri.' };
  if (r.holat === 'Ishlayapti' && !r.ish_joyi) return { error: 'Ishlayotgan boʻlsa, ish joyini kiriting.' };
  if (user.role === 'operator' && user.hudud && r.hudud !== user.hudud) return { error: 'Siz faqat oʻz hududingiz bitiruvchilarini kiritasiz.' };
  return { r };
}

app.get('/api/records', auth, (req, res) => {
  const sc = scope(req.user);
  let sql = 'SELECT id, fio, muassasa, mutaxassislik, daraja, hudud, holat, ish_joyi, lavozim, ish_hududi, updated_at FROM records WHERE yil = 2026' + sc.sql;
  const args = [...sc.args];
  for (const k of ['hudud', 'holat', 'daraja', 'muassasa']) if (req.query[k]) { sql += ` AND ${k} = ?`; args.push(String(req.query[k]).slice(0, 200)); }
  if (req.query.q) { const q = '%' + String(req.query.q).slice(0, 80) + '%'; sql += ' AND (fio LIKE ? OR ish_joyi LIKE ? OR lavozim LIKE ? OR mutaxassislik LIKE ?)'; args.push(q, q, q, q); }
  sql += ' ORDER BY fio COLLATE NOCASE LIMIT 5000';
  res.json({ records: db.prepare(sql).all(...args) });
});
app.get('/api/muassasalar', auth, (req, res) => {
  const sc = scope(req.user);
  res.json({
    muassasa: db.prepare('SELECT DISTINCT muassasa AS v FROM records WHERE 1=1' + sc.sql + ' ORDER BY v').all(...sc.args).map((x) => x.v),
    mutaxassislik: db.prepare("SELECT DISTINCT mutaxassislik AS v FROM records WHERE mutaxassislik <> ''" + sc.sql + ' ORDER BY v').all(...sc.args).map((x) => x.v)
  });
});
const insertRec = db.prepare(`INSERT INTO records (fio, muassasa, mutaxassislik, daraja, hudud, holat, ish_joyi, lavozim, ish_hududi, created_by, updated_by)
VALUES (:fio, :muassasa, :mutaxassislik, :daraja, :hudud, :holat, :ish_joyi, :lavozim, :ish_hududi, :uid, :uid)
ON CONFLICT(yil, fio, muassasa) DO UPDATE SET mutaxassislik=excluded.mutaxassislik, daraja=excluded.daraja, hudud=excluded.hudud, holat=excluded.holat, ish_joyi=excluded.ish_joyi, lavozim=excluded.lavozim, ish_hududi=excluded.ish_hududi, updated_by=excluded.updated_by, updated_at=datetime('now')`);
app.post('/api/records', auth, (req, res) => {
  const v = validRecord(req.body || {}, req.user); if (v.error) return res.status(400).json({ error: v.error });
  insertRec.run({ ...v.r, uid: req.user.id }); audit(req.user.id, 'record.save', v.r.fio); res.json({ ok: true });
});
function ownRecord(req, res) {
  const r = db.prepare('SELECT * FROM records WHERE id = ?').get(Number(req.params.id));
  if (!r) { res.status(404).json({ error: 'Yozuv topilmadi.' }); return null; }
  if (req.user.role === 'operator' && req.user.hudud && r.hudud !== req.user.hudud) { res.status(403).json({ error: 'Bu yozuv sizning hududingizga tegishli emas.' }); return null; }
  return r;
}
app.put('/api/records/:id', auth, (req, res) => {
  const old = ownRecord(req, res); if (!old) return;
  const v = validRecord(req.body || {}, req.user); if (v.error) return res.status(400).json({ error: v.error });
  try {
    db.prepare(`UPDATE records SET fio=:fio, muassasa=:muassasa, mutaxassislik=:mutaxassislik, daraja=:daraja, hudud=:hudud, holat=:holat, ish_joyi=:ish_joyi, lavozim=:lavozim, ish_hududi=:ish_hududi, updated_by=:uid, updated_at=datetime('now') WHERE id=:id`).run({ ...v.r, uid: req.user.id, id: old.id });
  } catch { return res.status(400).json({ error: 'Shu FIO va muassasa bilan yozuv allaqachon bor.' }); }
  audit(req.user.id, 'record.edit', old.id); res.json({ ok: true });
});
app.delete('/api/records/:id', auth, (req, res) => {
  const old = ownRecord(req, res); if (!old) return;
  db.prepare('DELETE FROM records WHERE id = ?').run(old.id); audit(req.user.id, 'record.delete', old.fio); res.json({ ok: true });
});
app.post('/api/import', auth, (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows.slice(0, 5000) : [];
  let ok = 0; const bad = [];
  db.exec('BEGIN');
  try {
    rows.forEach((b, i) => { const v = validRecord(b, req.user); if (v.error) { bad.push({ qator: b._line || i + 1, xato: v.error }); return; } insertRec.run({ ...v.r, uid: req.user.id }); ok++; });
    db.exec('COMMIT');
  } catch { db.exec('ROLLBACK'); return res.status(500).json({ error: 'Import bajarilmadi.' }); }
  audit(req.user.id, 'import', ok); res.json({ ok, bad: bad.slice(0, 200), badCount: bad.length });
});

app.get('/api/hisobot', auth, (req, res) => {
  const sc = scope(req.user);
  const rows = db.prepare(`SELECT hudud, COUNT(*) AS jami, SUM(daraja='Oliy') AS oliy, SUM(daraja<>'Oliy') AS texnikum, SUM(holat='Ishlayapti') AS ishda, SUM(holat='Ishlayapti' AND ish_hududi=hudud) AS oz_hududida, SUM(holat='Ishsiz') AS ishsiz FROM records WHERE yil=2026${sc.sql} GROUP BY hudud`).all(...sc.args);
  const by = new Map(rows.map((r) => [r.hudud, r]));
  const sh = new Map(db.prepare('SELECT hudud, bosh_shtat FROM shtat').all().map((r) => [r.hudud, r.bosh_shtat]));
  const visible = req.user.role === 'operator' && req.user.hudud ? HUDUDLAR.filter(([k]) => k === req.user.hudud) : HUDUDLAR;
  res.json({ hududlar: visible.map(([k, name]) => ({ key: k, name, ...(by.get(k) || { jami: 0, oliy: 0, texnikum: 0, ishda: 0, oz_hududida: 0, ishsiz: 0 }), bosh_shtat: sh.get(k) ?? 0 })) });
});
app.put('/api/shtat', auth, adminOnly, (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, HUDUDLAR.length) : [];
  const st = db.prepare('INSERT INTO shtat (hudud, bosh_shtat) VALUES (?, ?) ON CONFLICT(hudud) DO UPDATE SET bosh_shtat=excluded.bosh_shtat');
  for (const it of items) { const n = Math.round(Number(it.bosh_shtat)); if (HUDUD_KEYS.has(it.key) && Number.isFinite(n) && n >= 0 && n <= 100000) st.run(it.key, n); }
  audit(req.user.id, 'shtat'); res.json({ ok: true });
});

app.get('/api/users', auth, adminOnly, (req, res) => res.json({ users: db.prepare('SELECT * FROM users ORDER BY role, login').all().map(pub) }));
app.post('/api/users', auth, adminOnly, (req, res) => {
  const login = clean(req.body?.login, 40), fio = clean(req.body?.fio, 120), role = req.body?.role === 'admin' ? 'admin' : 'operator';
  const hudud = req.body?.hudud && HUDUD_KEYS.has(req.body.hudud) ? req.body.hudud : null;
  const pass = String(req.body?.password || '').slice(0, 256);
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(login)) return res.status(400).json({ error: 'Login 3–40 ta lotin harfi, raqam yoki . _ - belgisidan iborat boʻlsin.' });
  const w = weak(pass, login); if (w) return res.status(400).json({ error: w });
  try { db.prepare('INSERT INTO users (login, fio, role, hudud, pass_hash, must_change) VALUES (?, ?, ?, ?, ?, 1)').run(login, fio, role, role === 'admin' ? null : hudud, hashPassword(pass)); }
  catch { return res.status(400).json({ error: 'Bunday login allaqachon bor.' }); }
  audit(req.user.id, 'user.create', login); res.json({ ok: true });
});
app.put('/api/users/:id', auth, adminOnly, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!u) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
  if (u.id === req.user.id && req.body?.active === false) return res.status(400).json({ error: 'Oʻzingizni oʻchira olmaysiz.' });
  if (typeof req.body?.active === 'boolean') db.prepare('UPDATE users SET active=?, token_ver=token_ver+1 WHERE id=?').run(req.body.active ? 1 : 0, u.id);
  if (req.body?.password) {
    const p = String(req.body.password).slice(0, 256); const w = weak(p, u.login); if (w) return res.status(400).json({ error: w });
    db.prepare('UPDATE users SET pass_hash=?, must_change=1, token_ver=token_ver+1 WHERE id=?').run(hashPassword(p), u.id);
  }
  if ('hudud' in (req.body || {}) && u.role === 'operator') db.prepare('UPDATE users SET hudud=? WHERE id=?').run(HUDUD_KEYS.has(req.body.hudud) ? req.body.hudud : null, u.id);
  audit(req.user.id, 'user.edit', u.login); res.json({ ok: true });
});

app.get('/health', (req, res) => {
  try { db.prepare('SELECT 1').get(); res.status(200).json({ ok: true }); }
  catch { res.status(503).json({ ok: false }); }
});
app.use(express.static(path.join(__dirname, 'public'), { index: false, etag: true, maxAge: 0 }));
app.get('/', (req, res) => res.redirect('/panel'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/panel', (req, res) => res.sendFile(path.join(__dirname, 'public', 'panel.html')));
app.use('/api', (req, res) => res.status(404).json({ error: 'Topilmadi.' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server xatosi.' }); });

const server = app.listen(PORT, () => console.log(`Panel ishga tushdi: http://localhost:${PORT}`));
function shutdown() {
  server.close(() => { try { db.close(); } catch {} process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

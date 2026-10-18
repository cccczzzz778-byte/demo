'use strict';
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {DatabaseSync}=require('node:sqlite');
const {migrateGraduateDb}=require('./graduate-db');

module.exports=function runMedicalExamImport(){
  const version=String(process.env.MEDICAL_EXAM_IMPORT_VERSION||'').trim();
  const parts=[];
  for(let i=0;i<100;i++){
    const v=process.env[`MEDICAL_EXAM_IMPORT_${String(i).padStart(2,'0')}`];
    if(v)parts.push(v);
  }
  if(!version||!parts.length)return;

  const dbPath=process.env.DB_PATH||path.join(__dirname,'..','data.sqlite');
  const db=new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;CREATE TABLE IF NOT EXISTS seed_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL DEFAULT '');");
  migrateGraduateDb(db);
  const done=db.prepare("SELECT value FROM seed_meta WHERE key='medical_exam_import_version'").get();
  if(done&&done.value===version){db.close();return;}

  const payload=JSON.parse(zlib.brotliDecompressSync(Buffer.from(parts.join(''),'base64')).toString('utf8'));
  const rows=(payload.r||[]).map(r=>({
    pinfl:String(r[0]||''),institution:String(r[1]||''),examDate:String(r[2]||''),diagnosis:String(r[3]||''),
    diagnosisCategory:String(r[4]||''),healthStatus:String(r[5]||'Aniqlanmagan'),recommendation:String(r[6]||''),
    ambulatory:Number(r[7])||0,inpatient:Number(r[8])||0,operative:Number(r[9])||0,district:Number(r[10])||0,region:Number(r[11])||0,republic:Number(r[12])||0
  }));
  if(rows.length!==2545)throw new Error(`Tibbiy ko‘rik nazorat soni mos emas: ${rows.length} != 2545`);
  if(rows.some(r=>!r.pinfl||!r.examDate))throw new Error('Tibbiy ko‘rik payloadida JSHSHIR yoki sana bo‘sh.');

  const cols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));
  for(const [n,t] of [['medical_institution','TEXT'],['medical_exam_date','TEXT'],['diagnosis','TEXT'],['diagnosis_category','TEXT'],['health_status','TEXT'],['recommendation','TEXT'],['ambulatory','INTEGER'],['inpatient','INTEGER'],['operative','INTEGER'],['wellness_district','INTEGER'],['wellness_region','INTEGER'],['wellness_republic','INTEGER']]){
    if(!cols.has(n))db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${n} ${t} NOT NULL DEFAULT ${t==='INTEGER'?'0':"''"}`);
  }

  const missing=[];
  const exists=db.prepare('SELECT COUNT(*) n FROM excel_graduates WHERE pinfl=?');
  for(const r of rows)if(Number(exists.get(r.pinfl).n||0)===0)missing.push(r.pinfl);
  if(missing.length)throw new Error(`Asosiy 9823 ro‘yxatda topilmagan JSHSHIR: ${missing.length}`);

  const backupDir=path.join(path.dirname(dbPath),'backups');
  fs.mkdirSync(backupDir,{recursive:true});
  const safe=version.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(0,80);
  const backupPath=path.join(backupDir,`bitiruvchilar-before-medical-${safe}.sqlite`);
  if(!fs.existsSync(backupPath)){
    db.exec('PRAGMA wal_checkpoint(FULL)');
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g,"''")}'`);
  }

  const update=db.prepare(`UPDATE excel_graduates SET
    medical_institution=?,medical_exam_date=?,diagnosis=?,diagnosis_category=?,health_status=?,recommendation=?,
    ambulatory=?,inpatient=?,operative=?,wellness_district=?,wellness_region=?,wellness_republic=?
    WHERE pinfl=?`);

  db.exec('BEGIN IMMEDIATE');
  try{
    let affected=0;
    for(const r of rows){
      affected+=Number(update.run(r.institution,r.examDate,r.diagnosis,r.diagnosisCategory,r.healthStatus,r.recommendation,r.ambulatory,r.inpatient,r.operative,r.district,r.region,r.republic,r.pinfl).changes||0);
    }
    const q=s=>Number(db.prepare(s).get().n||0);
    const stats={
      total:q('SELECT COUNT(*) n FROM excel_graduates'),
      examined:q("SELECT COUNT(*) n FROM excel_graduates WHERE medical_exam_date<>''"),
      healthy:q("SELECT COUNT(*) n FROM excel_graduates WHERE health_status='Sog‘lom'"),
      sick:q("SELECT COUNT(*) n FROM excel_graduates WHERE health_status='Kasal'"),
      other:q("SELECT COUNT(*) n FROM excel_graduates WHERE medical_exam_date<>'' AND health_status NOT IN ('Sog‘lom','Kasal')")
    };
    if(stats.total!==9823||stats.examined!==3149||stats.healthy!==3009||stats.sick!==100||stats.other!==40){
      throw new Error('Tibbiy ko‘rik yakuniy nazorat sonlari mos emas: '+JSON.stringify(stats));
    }
    db.prepare("INSERT INTO seed_meta(key,value) VALUES('medical_exam_import_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(version);
    db.prepare("INSERT INTO seed_meta(key,value) VALUES('medical_exam_import_result',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify({rows:rows.length,affected,backupPath,stats,meta:payload.m||{}}));
    db.exec('COMMIT');
    console.log('MEDICAL EXAM IMPORT OK',JSON.stringify({rows:rows.length,affected,...stats,backupPath}));
  }catch(e){try{db.exec('ROLLBACK')}catch{}throw e}
  finally{db.close()}
};

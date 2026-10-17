'use strict';
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {DatabaseSync}=require('node:sqlite');
const {migrateGraduateDb}=require('./graduate-db');
const {canonicalHudud}=require('./graduate-utils');
module.exports=function run(){
 const version=String(process.env.REAL_DATA_REBUILD_VERSION||'').trim();
 const parts=[];for(let i=0;i<100;i++){const v=process.env[`REAL_DATA_REBUILD_${String(i).padStart(2,'0')}`];if(v)parts.push(v)}
 if(!version||!parts.length)return;
 const dbPath=process.env.DB_PATH||path.join(__dirname,'..','data.sqlite');const db=new DatabaseSync(dbPath);
 db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS excel_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',imported_at TEXT NOT NULL DEFAULT (datetime('now'))); CREATE TABLE IF NOT EXISTS seed_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL DEFAULT '');");
 migrateGraduateDb(db);
 const done=db.prepare("SELECT value FROM seed_meta WHERE key='real_data_rebuild_version'").get();if(done&&done.value===version){db.close();return}
 const payload=JSON.parse(zlib.gunzipSync(Buffer.from(parts.join(''),'base64')).toString('utf8'));
 if(payload.main?.length!==9823||payload.exams?.length!==651||payload.medical?.length!==283)throw new Error('Rebuild payload nazorat sonlari mos emas.');
 if(payload.main.filter(x=>x.bitirgan_turi==='OTM').length!==3184)throw new Error('OTM soni 3184 emas.');
 if(payload.medical.filter(x=>x.education_level==='OTM').length!==210||payload.medical.filter(x=>x.education_level==='Texnikum').length!==73)throw new Error('Tibbiyot 210+73 mos emas.');
 const backupDir=path.join(path.dirname(dbPath),'backups');fs.mkdirSync(backupDir,{recursive:true});const safe=version.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(0,80);const backupPath=path.join(backupDir,`bitiruvchilar-before-${safe}.sqlite`);
 if(!fs.existsSync(backupPath)){db.exec('PRAGMA wal_checkpoint(FULL)');db.exec(`VACUUM INTO '${backupPath.replace(/'/g,"''")}'`)}
 const cols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));for(const [n,t] of [['tugilgan_sana','TEXT'],['yil','TEXT'],['yosh','TEXT'],['jins','TEXT'],['bitirgan_turi','TEXT'],['telefon','TEXT'],['izoh','TEXT'],['medical_institution','TEXT'],['medical_exam_date','TEXT'],['diagnosis','TEXT'],['recommendation','TEXT'],['ambulatory','INTEGER'],['inpatient','INTEGER'],['operative','INTEGER'],['wellness_district','INTEGER'],['wellness_region','INTEGER'],['wellness_republic','INTEGER']])if(!cols.has(n))db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${n} ${t} NOT NULL DEFAULT ${t==='INTEGER'?'0':"''"}`);
 db.exec("CREATE TABLE IF NOT EXISTS medical_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',education_level TEXT NOT NULL DEFAULT '',institution TEXT NOT NULL DEFAULT '',specialty TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT '',workplace TEXT NOT NULL DEFAULT '',position TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT (datetime('now')));");
 const mc=new Set(db.prepare('PRAGMA table_info(medical_graduates)').all().map(x=>x.name));if(!mc.has('pinfl'))db.exec("ALTER TABLE medical_graduates ADD COLUMN pinfl TEXT NOT NULL DEFAULT ''");db.exec('CREATE INDEX IF NOT EXISTS idx_medgrad_pinfl ON medical_graduates(pinfl); CREATE INDEX IF NOT EXISTS idx_medgrad_hudud ON medical_graduates(hudud);');
 const ins=db.prepare('INSERT INTO excel_graduates(fio,pinfl,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,izoh,education_level,employment_status,medical_education,medical_education_level,education_institution,specialty,health_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 const exam=db.prepare('UPDATE excel_graduates SET medical_institution=?,medical_exam_date=?,diagnosis=?,health_status=?,recommendation=?,ambulatory=?,inpatient=?,operative=?,wellness_district=?,wellness_region=?,wellness_republic=? WHERE pinfl=?');
 const mi=db.prepare('INSERT INTO medical_graduates(fio,pinfl,hudud,mahalla,education_level,institution,specialty,status,workplace,position,phone,note) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');const link=db.prepare('UPDATE excel_graduates SET medical_education=1,medical_education_level=?,education_institution=?,specialty=? WHERE pinfl=?');
 db.exec('BEGIN IMMEDIATE');try{
  db.exec('DELETE FROM graduate_audit; DELETE FROM medical_graduates; DELETE FROM excel_graduates;');
  for(const r of payload.main)ins.run(r.fio||'',r.pinfl||'',canonicalHudud(r.hudud||''),r.mahalla||'',r.toifa||'',r.holat||'','',r.tugilgan_sana||'',r.yil||'',r.yosh||'',r.jins||'',r.bitirgan_turi||'',r.telefon||'',r.izoh||'',r.bitirgan_turi||'unknown',r.employment_status||'Aniqlanmagan',0,'','','','Aniqlanmagan');
  let em=0;for(const r of payload.exams){const x=exam.run(r.medical_institution||'',r.medical_exam_date||'',r.diagnosis||'',r.health_status||'Aniqlanmagan',r.recommendation||'',Number(r.ambulatory)||0,Number(r.inpatient)||0,Number(r.operative)||0,Number(r.wellness_district)||0,Number(r.wellness_region)||0,Number(r.wellness_republic)||0,r.pinfl||'');em+=Number(x.changes||0)}
  let ml=0;for(const r of payload.medical){mi.run(r.fio||'',r.pinfl||'',canonicalHudud(r.hudud||''),r.mahalla||'',r.education_level||'',r.institution||'',r.specialty||'',r.status||'',r.workplace||'',r.position||'',r.phone||'',r.note||'');ml+=Number(link.run(r.education_level||'',r.institution||'',r.specialty||'',r.pinfl||'').changes||0)}
  const c={total:Number(db.prepare('SELECT COUNT(*) n FROM excel_graduates').get().n),higher:Number(db.prepare("SELECT COUNT(*) n FROM excel_graduates WHERE education_level='OTM'").get().n),romitan:Number(db.prepare("SELECT COUNT(*) n FROM excel_graduates WHERE hudud='Ромитан тумани'").get().n),examined:Number(db.prepare("SELECT COUNT(*) n FROM excel_graduates WHERE medical_exam_date<>''").get().n),medical:Number(db.prepare('SELECT COUNT(*) n FROM medical_graduates').get().n),medOtm:Number(db.prepare("SELECT COUNT(*) n FROM medical_graduates WHERE education_level='OTM'").get().n),medTech:Number(db.prepare("SELECT COUNT(*) n FROM medical_graduates WHERE education_level='Texnikum'").get().n)};
  if(c.total!==9823||c.higher!==3184||c.romitan!==651||c.examined!==651||c.medical!==283||c.medOtm!==210||c.medTech!==73||em!==651)throw new Error('Rebuild tekshiruvi xato: '+JSON.stringify({...c,em,ml}));
  db.prepare("INSERT INTO seed_meta(key,value) VALUES('real_data_rebuild_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(version);db.prepare("INSERT INTO seed_meta(key,value) VALUES('real_data_rebuild_result',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify({...c,examsMatched:em,medicalLinked:ml,backupPath}));db.exec('COMMIT');console.log('REAL DATA REBUILD OK',JSON.stringify({...c,examsMatched:em,medicalLinked:ml,backupPath}));
 }catch(e){try{db.exec('ROLLBACK')}catch{}throw e}finally{db.close()}
};

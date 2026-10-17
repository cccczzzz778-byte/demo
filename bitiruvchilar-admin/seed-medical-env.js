'use strict';
const zlib=require('node:zlib');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {canonicalHudud}=require('./normalize-hudud');

const version=String(process.env.MEDICAL_SEED_VERSION||'').trim();
if(!version)process.exit(0);
let parts=[];
for(let i=0;i<100;i++){
  const k=`MEDICAL_SEED_${String(i).padStart(2,'0')}`;
  if(!(k in process.env))break;
  if(process.env[k])parts.push(process.env[k]);
}
if(!parts.length)process.exit(0);
const DB_PATH=process.env.DB_PATH||path.join(__dirname,'data.sqlite');
const db=new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS seed_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS excel_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',imported_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS medical_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',education_level TEXT NOT NULL DEFAULT '',institution TEXT NOT NULL DEFAULT '',specialty TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT '',workplace TEXT NOT NULL DEFAULT '',position TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT (datetime('now')));`);
const cols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));
for(const [name,type,def] of [['medical_institution','TEXT',"''"],['medical_exam_date','TEXT',"''"],['diagnosis','TEXT',"''"],['recommendation','TEXT',"''"],['ambulatory','INTEGER','0'],['inpatient','INTEGER','0'],['operative','INTEGER','0'],['wellness_district','INTEGER','0'],['wellness_region','INTEGER','0'],['wellness_republic','INTEGER','0']]){
  if(!cols.has(name))db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${name} ${type} NOT NULL DEFAULT ${def}`);
}
const prev=db.prepare("SELECT value FROM seed_meta WHERE key='medical_seed_version'").get();
if(prev?.value===version){db.close();process.exit(0)}
let data;
try{data=JSON.parse(zlib.gunzipSync(Buffer.from(parts.join(''),'base64')).toString('utf8'))}catch(e){db.close();throw new Error('Medical seed ochilmadi: '+e.message)}
const clean=(v,n=500)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const bit=v=>v?1:0;
const exams=Array.isArray(data.e)?data.e:[];
const meds=Array.isArray(data.m)?data.m:[];
const find=db.prepare('SELECT id FROM excel_graduates WHERE lower(fio)=lower(?) LIMIT 1');
const insGrad=db.prepare('INSERT INTO excel_graduates(fio,hudud,mahalla) VALUES(?,?,?)');
const updExam=db.prepare(`UPDATE excel_graduates SET hudud=CASE WHEN hudud='' THEN ? ELSE hudud END,mahalla=CASE WHEN mahalla='' THEN ? ELSE mahalla END,medical_institution=?,medical_exam_date=?,diagnosis=?,recommendation=?,ambulatory=?,inpatient=?,operative=?,wellness_district=?,wellness_region=?,wellness_republic=? WHERE id=?`);
const insMed=db.prepare(`INSERT INTO medical_graduates(fio,hudud,mahalla,address,education_level,institution,specialty,status,workplace,position,phone,note) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
let examOk=0,medOk=0,created=0;
db.exec('BEGIN IMMEDIATE');
try{
  for(const a of exams){
    const [fio,hudud,mahalla,inst,dt,diag,rec,amb,inp,oper,wd,wr,wp]=a;
    if(clean(fio,180).length<5)continue;
    let row=find.get(clean(fio,180));
    if(!row){const x=insGrad.run(clean(fio,180),canonicalHudud(clean(hudud,120)),clean(mahalla,180));row={id:Number(x.lastInsertRowid)};created++}
    updExam.run(canonicalHudud(clean(hudud,120)),clean(mahalla,180),clean(inst,180),clean(dt,30),clean(diag,300),clean(rec,500),bit(amb),bit(inp),bit(oper),bit(wd),bit(wr),bit(wp),row.id);examOk++;
  }
  db.exec('DELETE FROM medical_graduates');
  for(const a of meds){
    const [fio,hudud,mahalla,address,level,institution,specialty,status,workplace,position,phone,note]=a;
    if(clean(fio,180).length<5)continue;
    insMed.run(clean(fio,180),canonicalHudud(clean(hudud,120)),clean(mahalla,180),clean(address,300),clean(level,80),clean(institution,250),clean(specialty,180),clean(status,180),clean(workplace,250),clean(position,180),clean(phone,60),clean(note,800));medOk++;
  }
  db.prepare("INSERT INTO seed_meta(key,value) VALUES('medical_seed_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(version);
  db.exec('COMMIT');
  console.log(`Excel ro'yxat seed: ${examOk} tibbiy ko'rik, ${medOk} tibbiyot bitiruvchi; ${created} yangi asosiy yozuv yaratildi.`);
}catch(e){try{db.exec('ROLLBACK')}catch{};db.close();throw e}
db.close();

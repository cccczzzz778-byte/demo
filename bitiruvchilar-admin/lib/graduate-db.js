'use strict';
const {canonicalHudud,norm}=require('./graduate-utils');
const FIELDS=[
 ['pinfl','TEXT'],['education_level','TEXT'],['medical_education','INTEGER'],['medical_education_level','TEXT'],['education_institution','TEXT'],['specialty','TEXT'],
 ['employment_status','TEXT'],['workplace','TEXT'],['position','TEXT'],['order_date','TEXT'],['order_number','TEXT'],['health_status','TEXT'],['diagnosis_category','TEXT'],['address','TEXT']
];
function migrateGraduateDb(db){
 const cols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));
 for(const [name,type] of FIELDS){if(!cols.has(name))db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${name} ${type} NOT NULL DEFAULT ${type==='INTEGER'?'0':"''"}`)}
 db.exec(`CREATE INDEX IF NOT EXISTS idx_excel_pinfl ON excel_graduates(pinfl);
 CREATE INDEX IF NOT EXISTS idx_excel_edu ON excel_graduates(education_level);
 CREATE INDEX IF NOT EXISTS idx_excel_mededu ON excel_graduates(medical_education);
 CREATE INDEX IF NOT EXISTS idx_excel_emp ON excel_graduates(employment_status);
 CREATE INDEX IF NOT EXISTS idx_excel_health ON excel_graduates(health_status);
 CREATE TABLE IF NOT EXISTS graduate_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT,graduate_id INTEGER NOT NULL,actor TEXT NOT NULL DEFAULT '',action TEXT NOT NULL DEFAULT 'update',old_json TEXT NOT NULL DEFAULT '{}',new_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now'))
 );
 CREATE INDEX IF NOT EXISTS idx_graduate_audit_gid ON graduate_audit(graduate_id);
 CREATE TABLE IF NOT EXISTS medical_graduates(
  id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,pinfl TEXT NOT NULL DEFAULT '',hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',education_level TEXT NOT NULL DEFAULT '',institution TEXT NOT NULL DEFAULT '',specialty TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT '',workplace TEXT NOT NULL DEFAULT '',position TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT (datetime('now'))
 );`);
 const mcols=new Set(db.prepare('PRAGMA table_info(medical_graduates)').all().map(x=>x.name));if(!mcols.has('pinfl'))db.exec("ALTER TABLE medical_graduates ADD COLUMN pinfl TEXT NOT NULL DEFAULT ''");
 db.exec('CREATE INDEX IF NOT EXISTS idx_medgrad_pinfl ON medical_graduates(pinfl); CREATE INDEX IF NOT EXISTS idx_medgrad_hudud ON medical_graduates(hudud); CREATE INDEX IF NOT EXISTS idx_medgrad_edu ON medical_graduates(education_level);');
}
function digits(v){return String(v??'').replace(/\D/g,'')}
function findGraduateForMerge(db,row={}){
 const pinfl=digits(row.pinfl||row.jshshir);if(pinfl){const xs=db.prepare('SELECT id FROM excel_graduates WHERE pinfl=?').all(pinfl);if(xs.length===1)return {id:Number(xs[0].id),match:'pinfl'};if(xs.length>1)return {id:null,match:'ambiguous'};}
 const fio=norm(row.fio),hud=canonicalHudud(row.hudud||row.tuman||''),dob=String(row.tugilgan_sana||row.birth_date||'').trim();
 if(!fio||!hud||!dob)return {id:null,match:'none'};
 const xs=db.prepare('SELECT id,fio FROM excel_graduates WHERE hudud=? AND tugilgan_sana=?').all(hud,dob).filter(x=>norm(x.fio)===fio);
 if(xs.length===1)return {id:Number(xs[0].id),match:'fallback'};if(xs.length>1)return {id:null,match:'ambiguous'};return {id:null,match:'none'};
}
const ALLOWED=new Set(['fio','pinfl','telefon','jins','tugilgan_sana','yosh','hudud','mahalla','address','op_oshp','education_level','medical_education','medical_education_level','education_institution','specialty','employment_status','workplace','position','order_date','order_number','health_status','diagnosis','diagnosis_category','medical_institution','medical_exam_date','recommendation','ambulatory','inpatient','operative','wellness_district','wellness_region','wellness_republic','izoh']);
function updateGraduateWithAudit(db,id,patch={},actor='admin'){
 const old=db.prepare('SELECT * FROM excel_graduates WHERE id=?').get(id);if(!old)return false;
 const entries=Object.entries(patch).filter(([k])=>ALLOWED.has(k));if(!entries.length)return true;
 const set=entries.map(([k])=>`${k}=?`).join(','),vals=entries.map(([k,v])=>k==='hudud'?canonicalHudud(v):k==='medical_education'?Number(Boolean(v)):v??'');
 db.exec('BEGIN IMMEDIATE');try{db.prepare(`UPDATE excel_graduates SET ${set} WHERE id=?`).run(...vals,id);const neu=db.prepare('SELECT * FROM excel_graduates WHERE id=?').get(id);db.prepare('INSERT INTO graduate_audit(graduate_id,actor,action,old_json,new_json) VALUES(?,?,?,?,?)').run(id,String(actor||''),'update',JSON.stringify(old),JSON.stringify(neu));db.exec('COMMIT');return true}catch(e){try{db.exec('ROLLBACK')}catch{}throw e}
}
module.exports={migrateGraduateDb,findGraduateForMerge,updateGraduateWithAudit};

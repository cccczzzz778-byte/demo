'use strict';
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(process.env.DB_PATH||path.join(__dirname,'..','data.sqlite'));
const has=(t)=>!!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t);
const cols=has('excel_graduates')?new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name)):new Set();
const q=(sql,...a)=>{try{return Number(db.prepare(sql).get(...a)?.n||0)}catch{return -1}};
const out={
 total:q('SELECT COUNT(*) n FROM excel_graduates'),
 pinfl:q("SELECT COUNT(*) n FROM excel_graduates WHERE pinfl<>''"),
 pinflUnique:q("SELECT COUNT(DISTINCT pinfl) n FROM excel_graduates WHERE pinfl<>''"),
 higher:q("SELECT COUNT(*) n FROM excel_graduates WHERE education_level='OTM'"),
 working:q("SELECT COUNT(*) n FROM excel_graduates WHERE employment_status='Ishlaydi'"),
 unemployed:q("SELECT COUNT(*) n FROM excel_graduates WHERE employment_status='Ishsiz'"),
 examined:q("SELECT COUNT(*) n FROM excel_graduates WHERE medical_exam_date<>''"),
 medical:has('medical_graduates')?q('SELECT COUNT(*) n FROM medical_graduates'):-1,
 byHudud:{}
};
for(const h of ['Когон шаҳар','Жондор тумани','Пешку тумани','Қоракўл тумани','Ромитан тумани'])out.byHudud[h]={total:q('SELECT COUNT(*) n FROM excel_graduates WHERE hudud=?',h),pinfl:q("SELECT COUNT(*) n FROM excel_graduates WHERE hudud=? AND pinfl<>''",h),examined:q("SELECT COUNT(*) n FROM excel_graduates WHERE hudud=? AND medical_exam_date<>''",h)};
console.log('DB INSPECT',JSON.stringify(out));
db.close();

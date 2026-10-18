'use strict';
const {canonicalHudud}=require('./graduate-utils');
const {aggregateGraduateRows,normalizeEducationLevel}=require('./graduate-model');
const {sourceSummary}=require('./source-aggregates');
function tableExists(db,name){return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)}
function liveReady(db){
 const t=Number(db.prepare('SELECT COUNT(*) n FROM excel_graduates').get().n||0);
 const h=Number(db.prepare("SELECT COUNT(*) n FROM excel_graduates WHERE education_level='OTM'").get().n||0);
 const e=Number(db.prepare("SELECT COUNT(*) n FROM excel_graduates WHERE medical_exam_date<>''").get().n||0);
 const m=tableExists(db,'medical_graduates')?Number(db.prepare('SELECT COUNT(*) n FROM medical_graduates').get().n||0):0;
 return t===9823&&h===3184&&e===604&&m===283;
}
function topCounts(rows,key,limit=5){const c=new Map();for(const r of rows){const v=String(r[key]||'').trim();if(v)c.set(v,(c.get(v)||0)+1)}return [...c.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).slice(0,limit)}
function buildDashboardSummary(db,hudud=''){
 if(tableExists(db,'seed_meta')&&!liveReady(db))return sourceSummary(hudud);
 const filter=hudud?canonicalHudud(hudud):'';
 const fields='hudud,jins,education_level,bitirgan_turi,employment_status,holat,medical_exam_date,health_status,diagnosis,diagnosis_category,medical_education,medical_education_level,ambulatory,inpatient,operative,wellness_district,wellness_region,wellness_republic';
 const rows=filter?db.prepare(`SELECT ${fields} FROM excel_graduates WHERE hudud=?`).all(filter):db.prepare(`SELECT ${fields} FROM excel_graduates`).all();
 const a=aggregateGraduateRows(rows);
 const diag=new Map();for(const r of rows){if(String(r.health_status||'').trim()!=='Kasal')continue;const name=String(r.diagnosis_category||r.diagnosis||'').trim();if(name)diag.set(name,(diag.get(name)||0)+1)}
 let medicalEducation=a.medicalEducation,medicalSpecialties=[];
 if(tableExists(db,'medical_graduates')){
  const mrows=filter?db.prepare('SELECT education_level,specialty,institution,status FROM medical_graduates WHERE hudud=?').all(filter):db.prepare('SELECT education_level,specialty,institution,status FROM medical_graduates').all();
  if(mrows.length){medicalEducation={total:mrows.length,otm:mrows.filter(x=>normalizeEducationLevel(x.education_level)==='OTM').length,technical:mrows.filter(x=>normalizeEducationLevel(x.education_level)==='Texnikum').length};medicalSpecialties=topCounts(mrows,'specialty',5)}
 }
 return {hudud:filter||'Buxoro viloyati',total:a.total,higher:a.higher,nonHigher:a.nonHigher,working:a.working,unemployed:a.unemployed,examined:a.examined,healthy:a.healthy,sick:a.sick,education:a.education,gender:a.gender,employmentBreakdown:a.employmentBreakdown,healthPathways:a.healthPathways,medicalEducation,medicalSpecialties,diagnoses:[...diag.entries()].map(([name,count])=>({name,count})).sort((x,y)=>y.count-x.count||x.name.localeCompare(y.name))};
}
module.exports={buildDashboardSummary};

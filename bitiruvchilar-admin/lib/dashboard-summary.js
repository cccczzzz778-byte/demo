'use strict';
const {canonicalHudud}=require('./graduate-utils');
const {aggregateGraduateRows}=require('./graduate-model');
function buildDashboardSummary(db,hudud=''){
 const filter=hudud?canonicalHudud(hudud):'';
 const rows=filter?db.prepare('SELECT hudud,education_level,bitirgan_turi,employment_status,holat,medical_exam_date,health_status,diagnosis,diagnosis_category,medical_education,medical_education_level FROM excel_graduates WHERE hudud=?').all(filter):db.prepare('SELECT hudud,education_level,bitirgan_turi,employment_status,holat,medical_exam_date,health_status,diagnosis,diagnosis_category,medical_education,medical_education_level FROM excel_graduates').all();
 const a=aggregateGraduateRows(rows);
 const diag=new Map();for(const r of rows){const name=String(r.diagnosis_category||r.diagnosis||'').trim();if(name)diag.set(name,(diag.get(name)||0)+1)}
 return {hudud:filter||'Buxoro viloyati',total:a.total,higher:a.higher,nonHigher:a.nonHigher,working:a.working,unemployed:a.unemployed,examined:a.examined,healthy:a.healthy,sick:a.sick,medicalEducation:a.medicalEducation,diagnoses:[...diag.entries()].map(([name,count])=>({name,count})).sort((x,y)=>y.count-x.count||x.name.localeCompare(y.name))};
}
module.exports={buildDashboardSummary};

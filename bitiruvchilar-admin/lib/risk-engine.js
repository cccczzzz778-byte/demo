'use strict';
const {canonicalHudud,norm}=require('./graduate-utils');

const DEFAULT_RISK_CONFIG=Object.freeze({
  staleDays:30,
  requiredFields:['fio','hudud','pinfl','education_level','op_oshp','employment_status']
});

function nowIso(options){
  const d=new Date(options?.now||Date.now());
  return Number.isNaN(d.getTime())?new Date(0).toISOString():d.toISOString();
}

function safeId(value){
  if(value===null||value===undefined||value==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?n:String(value).slice(0,80);
}

function makeRisk(row,ruleId,severity,reason,evidence,computedAt){
  return{ruleId,severity,entityType:'graduate',entityId:safeId(row?.id),hudud:canonicalHudud(row?.hudud||''),reason,evidence,computedAt};
}

function evaluateGraduateRisk(input,options={}){
  const row=input&&typeof input==='object'?input:{};
  const config={...DEFAULT_RISK_CONFIG,...(options.config||{})};
  const computedAt=nowIso(options);
  const risks=[];
  const missing=config.requiredFields.filter(k=>String(row[k]??'').trim()==='');
  if(missing.length)risks.push(makeRisk(row,'profile_incomplete','warning','Majburiy profil maydonlari to‘liq emas.',{missing},computedAt));
  const employment=norm(row.employment_status);
  if(/ishsiz|ишсиз/.test(employment))risks.push(makeRisk(row,'unemployed','warning','Bitiruvchi ishsiz holatda qayd etilgan.',{employmentStatus:'unemployed'},computedAt));
  if(String(row.medical_exam_date??'').trim()==='')risks.push(makeRisk(row,'medical_exam_missing','warning','Tibbiy ko‘rik sanasi qayd etilmagan.',{examined:false},computedAt));
  if(row.updated_at){
    const updated=new Date(row.updated_at),now=new Date(computedAt);
    if(!Number.isNaN(updated.getTime())){
      const days=Math.floor((now-updated)/86400000);
      if(days>config.staleDays)risks.push(makeRisk(row,'stale_record','info','Ma’lumot belgilangan yangilanish muddatidan eski.',{ageDays:days,thresholdDays:config.staleDays},computedAt));
    }
  }
  return risks;
}

function summarizeRisks(rows,options={}){
  const records=[];
  for(const row of Array.isArray(rows)?rows:[])records.push(...evaluateGraduateRisk(row,options));
  const out={total:records.length,info:0,warning:0,critical:0,byRule:{},records};
  for(const r of records){
    if(Object.prototype.hasOwnProperty.call(out,r.severity))out[r.severity]++;
    out.byRule[r.ruleId]=(out.byRule[r.ruleId]||0)+1;
  }
  return out;
}

module.exports={DEFAULT_RISK_CONFIG,evaluateGraduateRisk,summarizeRisks};

'use strict';
const {canonicalHudud,isHigherEducation,statusFlags}=require('./graduate-utils');
const risk=require('./risk-engine');
const quality=require('./data-quality-service');

function safeNow(options){
  const d=new Date(options?.now||Date.now());
  return Number.isNaN(d.getTime())?new Date(0).toISOString():d.toISOString();
}

function scopedRows(db,scope){
  if(!scope||scope.role==='none')return[];
  const where=[],args=[];
  if(!scope.all){
    if(!scope.hudud)return[];
    where.push('hudud=?');args.push(canonicalHudud(scope.hudud));
    if(scope.role==='op_oshp'){
      if(!scope.institution)return[];
      where.push('op_oshp=?');args.push(String(scope.institution));
    }
  }
  try{
    const cols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));
    const optional=cols.has('updated_at')?',updated_at':'';
    const sql=`SELECT id,fio,pinfl,hudud,op_oshp,education_level,employment_status,medical_exam_date${optional} FROM excel_graduates${where.length?' WHERE '+where.join(' AND '):''}`;
    return db.prepare(sql).all(...args);
  }catch{return[]}
}

function metricsFor(rows){
  const out={total:0,higher:0,nonHigher:0,working:0,unemployed:0,examined:0};
  for(const row of Array.isArray(rows)?rows:[]){
    out.total++;
    if(isHigherEducation(row?.education_level))out.higher++;else out.nonHigher++;
    const flags=statusFlags(row?.employment_status);
    if(flags.working)out.working++;
    if(flags.unemployed)out.unemployed++;
    if(String(row?.medical_exam_date??'').trim())out.examined++;
  }
  return out;
}

function territorySummaries(rows){
  const groups=new Map();
  for(const row of rows){
    const hudud=canonicalHudud(row?.hudud||'');
    if(!hudud)continue;
    const bucket=groups.get(hudud)||[];
    bucket.push(row);groups.set(hudud,bucket);
  }
  return[...groups.entries()].sort(([a],[b])=>a.localeCompare(b,'uz')).map(([hudud,items])=>({hudud,metrics:metricsFor(items)}));
}

function buildCommandCenter(db,scope,options={}){
  const rows=scopedRows(db,scope);
  const summarize=options.summarizeRisks||risk.summarizeRisks;
  const inspect=options.inspectDataQuality||quality.inspectDataQuality;
  let risks,dataQuality;
  try{risks=summarize(rows,{now:options.now,config:options.riskConfig})}catch{risks={unavailable:true}}
  try{dataQuality=inspect(rows)}catch{dataQuality={unavailable:true}}
  return{
    scope:{role:scope?.role||'none',all:Boolean(scope?.all),hudud:scope?.hudud||'',institution:scope?.institution||'',readOnly:Boolean(scope?.readOnly)},
    metrics:metricsFor(rows),
    risks,
    dataQuality,
    territories:territorySummaries(rows),
    generatedAt:safeNow(options)
  };
}

function buildTerritoryDrilldown(db,scope,hudud,options={}){
  const requested=canonicalHudud(hudud||'');
  if(!requested)return buildCommandCenter(db,{role:scope?.role||'none',all:false,hudud:'',institution:scope?.institution||'',readOnly:Boolean(scope?.readOnly)},options);
  if(!scope?.all&&canonicalHudud(scope?.hudud||'')!==requested){
    return buildCommandCenter(db,{role:scope?.role||'none',all:false,hudud:'__denied__',institution:scope?.institution||'',readOnly:Boolean(scope?.readOnly)},options);
  }
  return buildCommandCenter(db,{...scope,all:false,hudud:requested},options);
}

module.exports={buildCommandCenter,buildTerritoryDrilldown};

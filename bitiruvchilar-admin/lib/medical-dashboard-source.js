'use strict';
const DATA=require('./medical-dashboard-source.json');
const {canonicalHudud}=require('./graduate-utils');
const {loadMedicalRows,summarizeMedicalRows}=require('./medical-list-source');
function clone(v){return JSON.parse(JSON.stringify(v))}
function keyOf(v){const raw=String(v||'').trim();return raw?canonicalHudud(raw):''}
function applyLiveStatus(base,hudud){
  const rows=loadMedicalRows();
  if(!rows.length)return base;
  const s=summarizeMedicalRows(hudud,rows);
  if(!s.total)return base;
  base.otmStatus={
    ...(base.otmStatus||{}),
    unemployed:s.status.unemployed,
    employed:s.status.employed,
    residency:s.status.residency,
    residencyApplied:s.residencyApplied,
    other:s.status.other
  };
  base.techStatus={...(base.techStatus||{}),inProcess:s.status.inProcess};
  base.statusSummary={...s.status};
  base.residency={studying:s.status.residency,applied:s.residencyApplied};
  return base;
}
function getMedicalDashboard(hudud=''){
 const key=keyOf(hudud),raw=key?(DATA.regions[key]||null):DATA.global;
 if(!raw)return {source:DATA.source,sourceTitle:DATA.sourceTitle,hudud:key,total:0,otm:0,technical:0,notFound:true};
 const base={source:DATA.source,sourceTitle:DATA.sourceTitle,hudud:key||'Buxoro viloyati',...clone(raw)};
 return applyLiveStatus(base,key);
}
function medicalRegions(){return Object.entries(DATA.regions).map(([hudud,v])=>({hudud,total:v.total,otm:v.otm,technical:v.technical}))}
module.exports={getMedicalDashboard,medicalRegions,DATA,keyOf};

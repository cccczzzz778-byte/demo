'use strict';
function normalizeDashboardMode(value){return String(value||'').toLowerCase()==='medical'?'medical':'general'}
function regionForDashboard(region,summary,mode='general'){
  const medical=normalizeDashboardMode(mode)==='medical';
  if(medical){const m=summary.medicalEducation||{};return {key:region.key,name:region.name,turi:region.turi,jami:Number(m.total)||0,oliy:Number(m.otm)||0,texnikum:Number(m.technical)||0,ishda:0,ishsiz:0,medicalMode:true}}
  return {key:region.key,name:region.name,turi:region.turi,jami:Number(summary.total)||0,oliy:Number(summary.higher)||0,texnikum:Number(summary.nonHigher)||0,ishda:Number(summary.working)||0,ishsiz:Number(summary.unemployed)||0,medicalMode:false};
}
module.exports={normalizeDashboardMode,regionForDashboard};

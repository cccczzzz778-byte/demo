'use strict';
const crypto=require('node:crypto');
const {canonicalHudud,norm}=require('./graduate-utils');

const emptyCounts=()=>({missingPinfl:0,duplicatePinfl:0,missingEducation:0,missingEmployment:0,missingHudud:0,missingOpOshp:0,contradictoryEmployment:0});
const idOf=row=>row?.id===undefined||row?.id===null?null:(Number.isFinite(Number(row.id))?Number(row.id):String(row.id).slice(0,80));
const issue=(type,severity,row,reason)=>({type,severity,entityId:idOf(row),hudud:canonicalHudud(row?.hudud||''),reason});
const hashKey=value=>crypto.createHash('sha256').update(String(value)).digest('hex').slice(0,16);

function findDuplicatePinflGroups(rows){
  const groups=new Map();
  for(const row of Array.isArray(rows)?rows:[]){
    const value=String(row?.pinfl??'').trim();
    if(!value)continue;
    const ids=groups.get(value)||[];
    ids.push(idOf(row));
    groups.set(value,ids);
  }
  return[...groups.entries()].filter(([,ids])=>ids.length>1).map(([value,ids])=>({pinflHashKey:hashKey(value),count:ids.length,entityIds:ids}));
}

function inspectDataQuality(rows){
  const source=Array.isArray(rows)?rows:[];
  const counts=emptyCounts();
  const issues=[];
  const duplicateGroups=findDuplicatePinflGroups(source);
  counts.duplicatePinfl=duplicateGroups.length;
  const duplicateIds=new Set(duplicateGroups.flatMap(g=>g.entityIds.map(String)));
  for(const row of source){
    const pinfl=String(row?.pinfl??'').trim();
    const education=norm(row?.education_level);
    const employment=norm(row?.employment_status);
    const hudud=String(row?.hudud??'').trim();
    const op=String(row?.op_oshp??'').trim();
    if(!pinfl){counts.missingPinfl++;issues.push(issue('missing_pinfl','warning',row,'JSHSHIR kiritilmagan.'))}
    if(duplicateIds.has(String(idOf(row))))issues.push(issue('duplicate_pinfl','critical',row,'Bir xil JSHSHIR boshqa yozuvda ham uchraydi.'));
    if(!education||education==='unknown'||education==='aniqlanmagan'){counts.missingEducation++;issues.push(issue('missing_education','warning',row,'Ta’lim darajasi aniqlanmagan.'))}
    if(!employment||employment==='unknown'||employment==='aniqlanmagan'){counts.missingEmployment++;issues.push(issue('missing_employment','warning',row,'Bandlik holati aniqlanmagan.'))}
    if(!hudud){counts.missingHudud++;issues.push(issue('missing_hudud','critical',row,'Hudud kiritilmagan.'))}
    if(!op){counts.missingOpOshp++;issues.push(issue('missing_op_oshp','info',row,'OP/OShP biriktirilmagan.'))}
    const hasUnemployed=/ishsiz|ишсиз/.test(employment),hasWorking=/(^| )band($| )|ishlaydi|ишлайди/.test(employment);
    if(hasUnemployed&&hasWorking){counts.contradictoryEmployment++;issues.push(issue('contradictory_employment','critical',row,'Bandlik holatida qarama-qarshi qiymatlar bor.'))}
  }
  return{total:source.length,issueCount:issues.length,counts,issues};
}

module.exports={inspectDataQuality,findDuplicatePinflGroups};

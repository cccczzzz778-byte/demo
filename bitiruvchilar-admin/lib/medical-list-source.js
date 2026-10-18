'use strict';
const zlib=require('node:zlib');
const {canonicalHudud,norm}=require('./graduate-utils');
let cachedVersion='',cachedRows=[];
function classifyMedicalRow(row={}){
  const detail=norm(row.detail||row.note||row.workplace||'');
  const source=norm(row.source_status||row.status||'');
  const hasOrdinatura=/ordinat|ординат/.test(detail);
  const studying=hasOrdinatura&&/(ўқияпти|укияпти|o qiyapti|ординатурачиси|ordinaturachisi|ординатурага кирган|ordinaturaga kirgan|ординатурага қабул|ordinaturaga qabul)/.test(detail);
  const applied=hasOrdinatura&&!studying&&/(хужжат|ҳужжат|hujjat).*(топшир|topshir)/.test(detail);
  let status='Boshqa';
  if(studying)status='Ordinaturada o‘qiydi';
  else if(/(^| )band($| )|банд/.test(source))status='Band';
  else if(/jarayon|жараён/.test(source))status='Jarayonda';
  else if(/ishsiz|ишсиз/.test(source))status='Ishsiz';
  return {...row,status,residency_studying:studying,residency_applied:applied};
}
function loadMedicalRows(force=false){
  const version=String(process.env.MEDICAL_LIST_VERSION||'').trim();
  if(!force&&version&&version===cachedVersion)return cachedRows;
  const parts=[];for(let i=0;i<100;i++){const v=process.env[`MEDICAL_LIST_${String(i).padStart(2,'0')}`];if(v)parts.push(v)}
  if(!version||!parts.length){cachedVersion=version;cachedRows=[];return cachedRows}
  const payload=JSON.parse(zlib.inflateSync(Buffer.from(parts.join(''),'base64')).toString('utf8'));
  const rows=Array.isArray(payload.rows)?payload.rows:[];
  cachedRows=rows.map(r=>classifyMedicalRow({
    fio:String(r.fio||'').trim(),hudud:canonicalHudud(r.hudud||''),level:String(r.level||'').trim(),
    institution:String(r.institution||'').trim(),specialty:String(r.specialty||'').trim(),
    source_status:String(r.source_status||'').trim(),detail:String(r.detail||'').trim()
  }));
  cachedVersion=version;
  return cachedRows;
}
function summarizeMedicalRows(hudud='',rows=loadMedicalRows()){
  const key=hudud?canonicalHudud(hudud):'';
  const xs=key?rows.filter(r=>canonicalHudud(r.hudud)===key):rows;
  const out={total:xs.length,otm:0,technical:0,status:{unemployed:0,employed:0,residency:0,inProcess:0,other:0},residencyApplied:0};
  for(const r of xs){
    if(norm(r.level)==='otm')out.otm++;else if(/texnikum|техникум/.test(norm(r.level)))out.technical++;
    if(r.status==='Ishsiz')out.status.unemployed++;else if(r.status==='Band')out.status.employed++;else if(r.status==='Ordinaturada o‘qiydi')out.status.residency++;else if(r.status==='Jarayonda')out.status.inProcess++;else out.status.other++;
    if(r.residency_applied)out.residencyApplied++;
  }
  return out;
}
function publicMedicalList(hudud='',rows=loadMedicalRows()){
  const key=hudud?canonicalHudud(hudud):'';
  return (key?rows.filter(r=>canonicalHudud(r.hudud)===key):rows).map(r=>({
    fio:r.fio,hudud:canonicalHudud(r.hudud),level:r.level,institution:r.institution,specialty:r.specialty,status:r.status,
    residencyStudying:!!r.residency_studying,residencyApplied:!!r.residency_applied
  }));
}
module.exports={classifyMedicalRow,loadMedicalRows,summarizeMedicalRows,publicMedicalList};

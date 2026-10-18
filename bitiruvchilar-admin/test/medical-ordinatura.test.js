'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const {classifyMedicalRow,loadMedicalRows,summarizeMedicalRows}=require('../lib/medical-list-source');
const {getMedicalDashboard}=require('../lib/medical-dashboard-source');

test('medical dashboard accepts short map district names',()=>{
  assert.equal(getMedicalDashboard('Jondor').total,19);
  assert.equal(getMedicalDashboard('Olot').total,10);
  assert.equal(getMedicalDashboard("Qorako'l").total,23);
});

test('only graduates currently studying in ordinatura are excluded from unemployed',()=>{
  assert.equal(classifyMedicalRow({source_status:'ishsiz',detail:'BuxDTI klinik ordinaturaga kirgan'}).status,'Ordinaturada o‘qiydi');
  assert.equal(classifyMedicalRow({source_status:'ishsiz',detail:'BuxDTI klinik ordinaturaga hujjat topshirgan'}).status,'Ishsiz');
  assert.equal(classifyMedicalRow({source_status:'Band',detail:'Universitetning Ordinaturachisi'}).status,'Ordinaturada o‘qiydi');
});

test('medical list payload summarizes residency without exposing pinfl/phone fields',()=>{
  const payload={rows:[
    {fio:'A',hudud:'Jondor tumani',level:'OTM',institution:'OTM',specialty:'Davolash ishi',source_status:'ishsiz',detail:'klinik ordinaturaga kirgan'},
    {fio:'B',hudud:'Jondor tumani',level:'OTM',institution:'OTM',specialty:'Pediatriya',source_status:'ishsiz',detail:'klinik ordinaturaga hujjat topshirgan'},
    {fio:'C',hudud:'Jondor tumani',level:'Texnikum',institution:'Texnikum',specialty:'Hamshiralik',source_status:'Jarayonda',detail:''}
  ]};
  const prev={v:process.env.MEDICAL_LIST_VERSION,p:process.env.MEDICAL_LIST_00};
  process.env.MEDICAL_LIST_VERSION='test-v1';
  process.env.MEDICAL_LIST_00=zlib.deflateSync(Buffer.from(JSON.stringify(payload))).toString('base64');
  const rows=loadMedicalRows(true);
  const s=summarizeMedicalRows('Jondor',rows);
  assert.deepEqual(s.status,{unemployed:1,employed:0,residency:1,inProcess:1,other:0});
  assert.equal(s.residencyApplied,1);
  assert.equal(rows.some(r=>'pinfl' in r||'phone' in r||'telefon' in r),false);
  if(prev.v===undefined)delete process.env.MEDICAL_LIST_VERSION;else process.env.MEDICAL_LIST_VERSION=prev.v;
  if(prev.p===undefined)delete process.env.MEDICAL_LIST_00;else process.env.MEDICAL_LIST_00=prev.p;
});

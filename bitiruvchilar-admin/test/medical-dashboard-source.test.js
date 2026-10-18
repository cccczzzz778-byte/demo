'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {getMedicalDashboard,medicalRegions}=require('../lib/medical-dashboard-source');

function withoutLiveMedicalList(fn){
 const keys=Object.keys(process.env).filter(k=>k==='MEDICAL_LIST_VERSION'||/^MEDICAL_LIST_\d{2}$/.test(k));
 const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 for(const key of keys)delete process.env[key];
 try{return fn()}finally{for(const [key,value] of Object.entries(previous))process.env[key]=value}
}

test('medical dashboard source keeps 555 workbook control totals with ordinatura separated',()=>withoutLiveMedicalList(()=>{
 const g=getMedicalDashboard('');
 assert.deepEqual([g.total,g.otm,g.technical],[283,210,73]);
 assert.deepEqual([g.bukharaRegionOtm,g.bdti,g.otherRegionOtm,g.bukharaOtherOtm],[183,168,27,15]);
 assert.deepEqual(g.otmGender,{female:128,male:82,unknown:0});
 assert.deepEqual(g.otmStatus,{unemployed:204,employed:3,other:0,residency:3,residencyApplied:3});
 assert.equal(g.techStatus.inProcess,73);
 assert.deepEqual(g.otmSpecialties[0],{name:'Davolash ishi',count:61});
 assert.deepEqual(g.techSpecialties[0],{name:'Ҳамширалик иши',count:44});
}));

test('medical dashboard region totals match workbook and ordinatura rule',()=>withoutLiveMedicalList(()=>{
 const r=getMedicalDashboard('Romitan tumani');
 assert.deepEqual([r.total,r.otm,r.technical,r.bdti],[21,16,5,16]);
 assert.deepEqual(r.otmStatus,{unemployed:15,employed:0,other:0,residency:1,residencyApplied:3});
 const o=getMedicalDashboard('Olot tumani');
 assert.deepEqual(o.otmStatus,{unemployed:0,employed:3,other:0,residency:1,residencyApplied:0});
 const xs=medicalRegions();
 assert.equal(xs.length,13);
 assert.equal(xs.reduce((a,x)=>a+x.total,0),283);
 assert.equal(xs.reduce((a,x)=>a+x.otm,0),210);
 assert.equal(xs.reduce((a,x)=>a+x.technical,0),73);
}));

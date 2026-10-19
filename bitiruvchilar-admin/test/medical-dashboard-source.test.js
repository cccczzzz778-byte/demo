'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const {getMedicalDashboard,medicalRegions}=require('../lib/medical-dashboard-source');
const {loadMedicalRows}=require('../lib/medical-list-source');

function buildLiveStatusFixture(){
 const rows=[];
 const add=(count,hudud,level,status,detail='')=>{for(let i=0;i<count;i++)rows.push([`${hudud}-${level}-${status}-${rows.length+1}`,hudud,level,'Test','Test',status,detail])};
 // Romitan: 16 OTM = 15 unemployed + 1 residency; 5 technical in process.
 add(3,'Romitan tumani','OTM','Ishsiz','klinik ordinaturaga hujjat topshirgan');
 add(12,'Romitan tumani','OTM','Ishsiz','');
 add(1,'Romitan tumani','OTM','Ishsiz','klinik ordinaturaga kirgan');
 add(5,'Romitan tumani','Texnikum','Jarayonda','');
 // Olot: 4 OTM = 3 employed + 1 residency; 6 technical in process.
 add(3,'Olot tumani','OTM','Band','');
 add(1,'Olot tumani','OTM','Ishsiz','klinik ordinaturaga kirgan');
 add(6,'Olot tumani','Texnikum','Jarayonda','');
 // Remaining rows complete the agreed live global controls: OTM 210, technical 73.
 add(189,'Buxoro shahri','OTM','Ishsiz','');
 add(1,'Buxoro shahri','OTM','Ishsiz','klinik ordinaturaga kirgan');
 add(62,'Buxoro shahri','Texnikum','Jarayonda','');
 return rows;
}

function withDeterministicLiveMedicalList(fn){
 const keys=['MEDICAL_LIST_VERSION',...Array.from({length:100},(_,i)=>`MEDICAL_LIST_${String(i).padStart(2,'0')}`)];
 const previous=new Map(keys.map(k=>[k,process.env[k]]));
 for(const key of keys)delete process.env[key];
 process.env.MEDICAL_LIST_VERSION='test-workbook-ordinatura-v1';
 process.env.MEDICAL_LIST_00=zlib.deflateSync(Buffer.from(JSON.stringify({r:buildLiveStatusFixture()}))).toString('base64');
 loadMedicalRows(true);
 try{return fn()}finally{
  for(const key of keys){const value=previous.get(key);if(value===undefined)delete process.env[key];else process.env[key]=value}
  loadMedicalRows(true);
 }
}

test('medical dashboard source keeps 555 workbook control totals with ordinatura separated',()=>withDeterministicLiveMedicalList(()=>{
 const g=getMedicalDashboard('');
 assert.deepEqual([g.total,g.otm,g.technical],[283,210,73]);
 assert.deepEqual([g.bukharaRegionOtm,g.bdti,g.otherRegionOtm,g.bukharaOtherOtm],[183,168,27,15]);
 assert.deepEqual(g.otmGender,{female:128,male:82,unknown:0});
 assert.deepEqual(g.otmStatus,{unemployed:204,employed:3,other:0,residency:3,residencyApplied:3});
 assert.equal(g.techStatus.inProcess,73);
 assert.deepEqual(g.otmSpecialties[0],{name:'Davolash ishi',count:61});
 assert.deepEqual(g.techSpecialties[0],{name:'Ҳамширалик иши',count:44});
}));

test('medical dashboard region totals match workbook and ordinatura rule',()=>withDeterministicLiveMedicalList(()=>{
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

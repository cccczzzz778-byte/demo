'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {resolveScope}=require('../lib/access-scope');
const {buildCommandCenter,buildTerritoryDrilldown}=require('../lib/command-center-service');

function fixture(){
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE excel_graduates(
    id INTEGER PRIMARY KEY, fio TEXT, pinfl TEXT, hudud TEXT, op_oshp TEXT,
    education_level TEXT, employment_status TEXT, medical_exam_date TEXT,
    telefon TEXT, diagnosis TEXT, updated_at TEXT
  )`);
  const ins=db.prepare('INSERT INTO excel_graduates VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  ins.run(1,'A','11111111111111','Ромитан тумани','1-OP','OTM','Band','2026-10-01','PHONE_A','DIAG_A','2026-10-17');
  ins.run(2,'B','22222222222222','Ромитан тумани','2-OP','Texnikum','Ishsiz','','PHONE_B','DIAG_B','2026-10-01');
  ins.run(3,'C','33333333333333','Бухоро шаҳар','3-OP','OTM','Band','2026-10-10','PHONE_C','DIAG_C','2026-10-17');
  return db;
}

test('leadership sees aggregate territories without personal rows',()=>{
  const db=fixture();
  const out=buildCommandCenter(db,resolveScope({role:'leadership'}),{now:'2026-10-18T00:00:00.000Z'});
  assert.equal(out.metrics.total,3);
  assert.equal(out.territories.length,2);
  const text=JSON.stringify(out);
  for(const forbidden of ['11111111111111','PHONE_A','DIAG_A','password','session','secret'])assert.equal(text.toLowerCase().includes(forbidden.toLowerCase()),false);
  db.close();
});

test('territory and institution scopes cannot broaden',()=>{
  const db=fixture();
  const t=buildCommandCenter(db,resolveScope({role:'ttb_shtb',hudud:'Romitan'}));
  assert.equal(t.metrics.total,2);
  assert.deepEqual(t.territories.map(x=>x.hudud),['Ромитан тумани']);
  const i=buildCommandCenter(db,resolveScope({role:'op_oshp',hudud:'Romitan',institution:'1-OP'}));
  assert.equal(i.metrics.total,1);
  const denied=buildTerritoryDrilldown(db,resolveScope({role:'ttb_shtb',hudud:'Romitan'}),'Buxoro shahri');
  assert.equal(denied.metrics.total,0);
  db.close();
});

test('empty scope returns zeros and malformed rows do not crash',()=>{
  const db=fixture();
  const none=buildCommandCenter(db,{role:'op_oshp',all:false,hudud:'Ромитан тумани',institution:'missing',readOnly:false});
  assert.equal(none.metrics.total,0);
  assert.deepEqual(none.territories,[]);
  db.prepare("INSERT INTO excel_graduates(id,fio,pinfl,hudud,op_oshp,education_level,employment_status,medical_exam_date,telefon,diagnosis,updated_at) VALUES(4,'','','','','','','','','','')").run();
  assert.doesNotThrow(()=>buildCommandCenter(db,resolveScope({role:'leadership'})));
  db.close();
});

test('derived failures degrade to unavailable while base metrics remain',()=>{
  const db=fixture();
  const out=buildCommandCenter(db,resolveScope({role:'leadership'}),{
    summarizeRisks(){throw new Error('risk down')},
    inspectDataQuality(){throw new Error('quality down')}
  });
  assert.equal(out.metrics.total,3);
  assert.deepEqual(out.risks,{unavailable:true});
  assert.deepEqual(out.dataQuality,{unavailable:true});
  db.close();
});

test('works with production schema that has no updated_at column',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE excel_graduates(id INTEGER PRIMARY KEY,fio TEXT,pinfl TEXT,hudud TEXT,op_oshp TEXT,education_level TEXT,employment_status TEXT,medical_exam_date TEXT)`);
  db.prepare('INSERT INTO excel_graduates VALUES(?,?,?,?,?,?,?,?)').run(1,'A','44444444444444','Ромитан тумани','1-OP','OTM','Band','2026-10-01');
  const out=buildCommandCenter(db,resolveScope({role:'leadership'}));
  assert.equal(out.metrics.total,1);
  db.close();
});

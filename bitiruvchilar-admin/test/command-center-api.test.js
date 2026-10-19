'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {handleCommandCenterRequest}=require('../lib/command-center-api');

function dbFixture(){
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE excel_graduates(id INTEGER PRIMARY KEY,fio TEXT,pinfl TEXT,hudud TEXT,op_oshp TEXT,education_level TEXT,employment_status TEXT,medical_exam_date TEXT,updated_at TEXT)`);
  const q=db.prepare('INSERT INTO excel_graduates VALUES(?,?,?,?,?,?,?,?,?)');
  q.run(1,'A','11111111111111','Ромитан тумани','1-OP','OTM','Band','2026-10-01','2026-10-17');
  q.run(2,'B','22222222222222','Бухоро шаҳар','2-OP','OTM','Ishsiz','','2026-10-01');
  return db;
}

test('unauthenticated and unknown roles are rejected',()=>{
  const db=dbFixture();
  assert.equal(handleCommandCenterRequest({db,user:null,path:'/api/command-center',query:{}}).status,401);
  assert.equal(handleCommandCenterRequest({db,user:{role:'mystery'},path:'/api/command-center',query:{}}).status,403);
  db.close();
});

test('leadership gets read-only aggregate and no sensitive rows',()=>{
  const db=dbFixture();
  const r=handleCommandCenterRequest({db,user:{role:'leadership'},path:'/api/command-center',query:{}});
  assert.equal(r.status,200);
  assert.equal(r.body.scope.readOnly,true);
  assert.equal(r.body.metrics.total,2);
  assert.equal(JSON.stringify(r.body).includes('11111111111111'),false);
  db.close();
});

test('territory and institution users cannot broaden through query',()=>{
  const db=dbFixture();
  const t=handleCommandCenterRequest({db,user:{role:'operator',hudud:'Romitan'},path:'/api/command-center/territory',query:{hudud:'Buxoro shahri'}});
  assert.equal(t.status,200);
  assert.equal(t.body.metrics.total,0);
  const i=handleCommandCenterRequest({db,user:{role:'op_oshp',hudud:'Romitan',institution:'1-OP'},path:'/api/command-center',query:{op_oshp:'2-OP'}});
  assert.equal(i.body.metrics.total,1);
  db.close();
});

test('malformed territory never falls back to all-region',()=>{
  const db=dbFixture();
  const r=handleCommandCenterRequest({db,user:{role:'operator',hudud:'Romitan'},path:'/api/command-center/territory',query:{hudud:''}});
  assert.equal(r.status,200);
  assert.equal(r.body.metrics.total,0);
  db.close();
});

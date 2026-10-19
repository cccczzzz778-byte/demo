'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.join(__dirname,'..');

test('admin graduate table exposes an explicit edit action and full editor validation',()=>{
  const html=fs.readFileSync(path.join(root,'public','excel-panel.html'),'utf8');
  const enhance=fs.readFileSync(path.join(root,'public','ui-latin.js'),'utf8');
  assert.match(enhance,/Tahrirlash/);
  assert.match(enhance,/data-edit-id/);
  assert.match(enhance,/validateAdminGraduateForm/);
  assert.match(enhance,/14 ta raqam/);
  for(const id of ['e-fio','e-pinfl','e-telefon','e-birth','e-hudud','e-mahalla','e-address','e-edu','e-inst','e-spec','e-emp','e-work','e-pos','e-orderdate','e-orderno','e-health','e-examdate','e-diagnosis','e-rec','e-amb','e-inp','e-oper','e-wd','e-wr','e-wrep','e-note']) assert.ok(html.includes(`id="${id}"`),`missing ${id}`);
});

test('admin patch rejects malformed PINFL and non-binary pathway values',()=>{
  const {migrateGraduateDb}=require('../lib/graduate-db');
  const {patchGraduate}=require('../lib/graduate-service');
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE excel_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',tugilgan_sana TEXT NOT NULL DEFAULT '',yil TEXT NOT NULL DEFAULT '',yosh TEXT NOT NULL DEFAULT '',jins TEXT NOT NULL DEFAULT '',bitirgan_turi TEXT NOT NULL DEFAULT '',telefon TEXT NOT NULL DEFAULT '',band_qilish_rejasi TEXT NOT NULL DEFAULT '',izoh TEXT NOT NULL DEFAULT '',medical_institution TEXT NOT NULL DEFAULT '',medical_exam_date TEXT NOT NULL DEFAULT '',diagnosis TEXT NOT NULL DEFAULT '',recommendation TEXT NOT NULL DEFAULT '',ambulatory INTEGER NOT NULL DEFAULT 0,inpatient INTEGER NOT NULL DEFAULT 0,operative INTEGER NOT NULL DEFAULT 0,wellness_district INTEGER NOT NULL DEFAULT 0,wellness_region INTEGER NOT NULL DEFAULT 0,wellness_republic INTEGER NOT NULL DEFAULT 0)");
  migrateGraduateDb(db);
  const id=Number(db.prepare("INSERT INTO excel_graduates(fio) VALUES('Test')").run().lastInsertRowid);
  assert.throws(()=>patchGraduate(db,id,{pinfl:'123'},'admin'),/14 ta raqam/);
  assert.throws(()=>patchGraduate(db,id,{ambulatory:2},'admin'),/0 yoki 1/);
  db.close();
});

test('main import persists D-control instead of the misclassified deceased status',()=>{
  const {migrateGraduateDb}=require('../lib/graduate-db');
  const {mergeMainGraduates}=require('../lib/import-graduates');
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE excel_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',tugilgan_sana TEXT NOT NULL DEFAULT '',yil TEXT NOT NULL DEFAULT '',yosh TEXT NOT NULL DEFAULT '',jins TEXT NOT NULL DEFAULT '',bitirgan_turi TEXT NOT NULL DEFAULT '',telefon TEXT NOT NULL DEFAULT '',band_qilish_rejasi TEXT NOT NULL DEFAULT '',izoh TEXT NOT NULL DEFAULT '',medical_institution TEXT NOT NULL DEFAULT '',medical_exam_date TEXT NOT NULL DEFAULT '',diagnosis TEXT NOT NULL DEFAULT '',recommendation TEXT NOT NULL DEFAULT '',ambulatory INTEGER NOT NULL DEFAULT 0,inpatient INTEGER NOT NULL DEFAULT 0,operative INTEGER NOT NULL DEFAULT 0,wellness_district INTEGER NOT NULL DEFAULT 0,wellness_region INTEGER NOT NULL DEFAULT 0,wellness_republic INTEGER NOT NULL DEFAULT 0)");
  migrateGraduateDb(db);
  mergeMainGraduates(db,[{fio:'Test Bitiruvchi',hudud:'Romitan',employment_status:'Vafot etgan',holat:'Vafot etgan'}]);
  const row=db.prepare('SELECT employment_status,holat FROM excel_graduates').get();
  assert.equal(row.employment_status,'D nazoratda turgan');
  assert.equal(row.holat,'D nazoratda turgan');
  db.close();
});

test('one-time correction changes exactly 14 misclassified deceased rows and audits each row',()=>{
  const {correctDControlMisclassification}=require('../lib/status-corrections');
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE excel_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,employment_status TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '');
    CREATE TABLE graduate_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,graduate_id INTEGER NOT NULL,actor TEXT NOT NULL DEFAULT '',action TEXT NOT NULL DEFAULT 'update',old_json TEXT NOT NULL DEFAULT '{}',new_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')));`);
  const ins=db.prepare('INSERT INTO excel_graduates(fio,employment_status,holat) VALUES(?,?,?)');
  for(let i=1;i<=14;i++)ins.run(`Bitiruvchi ${i}`,'Vafot etgan','Vafot etgan');
  const result=correctDControlMisclassification(db);
  assert.equal(result.applied,true);
  assert.equal(result.count,14);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM excel_graduates WHERE employment_status='D nazoratda turgan' AND holat='D nazoratda turgan'").get().n,14);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM graduate_audit WHERE action='status-correction'").get().n,14);
  assert.equal(correctDControlMisclassification(db).applied,false);
  db.close();
});

test('correction refuses to mutate when the misclassified count is not exactly 14',()=>{
  const {correctDControlMisclassification}=require('../lib/status-corrections');
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE excel_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,employment_status TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '');
    CREATE TABLE graduate_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,graduate_id INTEGER NOT NULL,actor TEXT NOT NULL DEFAULT '',action TEXT NOT NULL DEFAULT 'update',old_json TEXT NOT NULL DEFAULT '{}',new_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')));`);
  const ins=db.prepare('INSERT INTO excel_graduates(fio,employment_status,holat) VALUES(?,?,?)');
  for(let i=1;i<=13;i++)ins.run(`Bitiruvchi ${i}`,'Vafot etgan','Vafot etgan');
  const result=correctDControlMisclassification(db);
  assert.equal(result.applied,false);
  assert.equal(result.count,13);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM excel_graduates WHERE employment_status='Vafot etgan'").get().n,13);
  db.close();
});

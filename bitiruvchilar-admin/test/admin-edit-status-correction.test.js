'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.join(__dirname,'..');

test('admin graduate table exposes an explicit edit action and full editor validation',()=>{
  const html=fs.readFileSync(path.join(root,'public','excel-panel.html'),'utf8');
  const js=fs.readFileSync(path.join(root,'public','excel-panel.js'),'utf8');
  assert.match(html,/Tahrirlash/);
  assert.match(js,/data-edit-id/);
  assert.match(js,/validateForm/);
  assert.match(js,/14 ta raqam/);
  for(const id of ['e-fio','e-pinfl','e-telefon','e-birth','e-hudud','e-mahalla','e-address','e-edu','e-inst','e-spec','e-emp','e-work','e-pos','e-orderdate','e-orderno','e-health','e-examdate','e-diagnosis','e-rec','e-amb','e-inp','e-oper','e-wd','e-wr','e-wrep','e-note']) assert.ok(html.includes(`id="${id}"`),`missing ${id}`);
});

test('main Excel parser maps source D-control column to D nazoratda turgan',()=>{
  const js=fs.readFileSync(path.join(root,'public','excel-panel.js'),'utf8');
  assert.match(js,/if\(num\(r\[36\]\)\)return\{employment_status:'D nazoratda turgan',holat:'D nazoratda turgan'\}/);
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

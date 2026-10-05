const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const importer=fs.readFileSync(path.join(root,'lib','staff-import.js'),'utf8');
const reports=fs.readFileSync(path.join(root,'public','reports.js'),'utf8');
const importUi=fs.readFileSync(path.join(root,'public','import.js'),'utf8');

test('database migration stores employment as asosiy or orindosh',()=>{
  assert.match(server,/employment TEXT DEFAULT 'asosiy'/);
  assert.match(server,/ALTER TABLE staff ALTER COLUMN employment SET DEFAULT 'asosiy'/);
  assert.match(server,/employment='asosiy'/);
  assert.match(server,/employment='orindosh'/);
});

test('Excel template and export support ru language query',()=>{
  assert.match(server,/req\.query\.lang/);
  assert.match(server,/Район/);
  assert.match(server,/Ставка \(совместитель, основной\)/);
  assert.match(server,/Совместитель/);
  assert.match(server,/Основной/);
});

test('Russian Excel headers can be imported',()=>{
  assert.match(importer,/Ф\.И\.О\. сотрудника/);
  assert.match(importer,/Должность/);
  assert.match(importer,/Специальность/);
  assert.match(importer,/Ставка \(совместитель, основной\)/);
  assert.match(importer,/Номер телефона/);
  assert.match(importer,/Примечание/);
});

test('frontend sends selected language for Excel downloads',()=>{
  assert.match(reports,/lang=/);
  assert.match(reports,/DMED\.state\.lang/);
  assert.match(importUi,/template\.xlsx\?lang=/);
});

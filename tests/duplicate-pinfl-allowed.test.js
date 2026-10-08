const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('PINFL uniqueness is not enforced in database or staff APIs',()=>{
  const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
  assert.match(server,/pinfl VARCHAR\(14\) NOT NULL/i);
  assert.doesNotMatch(server,/pinfl VARCHAR\(14\) UNIQUE NOT NULL/i);
  assert.match(server,/DROP CONSTRAINT IF EXISTS staff_pinfl_key/i);
  assert.doesNotMatch(server,/SELECT pinfl FROM staff WHERE pinfl = ANY/i);
  assert.doesNotMatch(server,/ON CONFLICT\(pinfl\) DO NOTHING/i);
});

test('Excel import accepts repeated PINFL rows',()=>{
  const importer=fs.readFileSync(path.join(root,'lib','staff-import.js'),'utf8');
  assert.doesNotMatch(importer,/seen\.has\(pinfl\)/i);
  assert.doesNotMatch(importer,/PINFL fayl ichida takrorlangan/i);
  assert.doesNotMatch(importer,/seen\.add\(pinfl\)/i);
});

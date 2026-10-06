const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('institution integrity migration protects staff and keeps denormalized metadata in sync',()=>{
  const {INSTITUTION_INTEGRITY_SQL}=require('../lib/institution-integrity');
  assert.match(INSTITUTION_INTEGRITY_SQL,/BEFORE DELETE ON institutions/i);
  assert.match(INSTITUTION_INTEGRITY_SQL,/EXISTS\s*\(SELECT 1 FROM staff WHERE institution_id=OLD\.id\)/i);
  assert.match(INSTITUTION_INTEGRITY_SQL,/UPDATE staff\s+SET district=NEW\.district,\s*institution=NEW\.name,\s*type=NEW\.type/i);
  assert.doesNotMatch(INSTITUTION_INTEGRITY_SQL,/users|password|password_hash/i);
});

test('startup installs integrity migration before optional test-account seeding',()=>{
  const source=fs.readFileSync(path.join(root,'seed-test.js'),'utf8');
  assert.match(source,/institution-integrity/);
  assert.match(source,/await pool\.query\(INSTITUTION_INTEGRITY_SQL\)/);
  assert.ok(source.indexOf('await pool.query(INSTITUTION_INTEGRITY_SQL)') < source.indexOf('if(!username||!password)'));
});

test('startup never overwrites existing credentials or institution data',()=>{
  const source=fs.readFileSync(path.join(root,'seed-test.js'),'utf8');
  assert.doesNotMatch(source,/ON CONFLICT\(username\) DO UPDATE/i);
  assert.doesNotMatch(source,/password_hash\s*=\s*EXCLUDED\.password_hash/i);
  assert.doesNotMatch(source,/ON CONFLICT\(name\) DO UPDATE SET district/i);
});

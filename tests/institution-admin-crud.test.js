const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');

test('institution delete is a soft delete and never removes linked staff or accounts',()=>{
  assert.match(server,/ALTER TABLE institutions ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE/i);
  assert.match(server,/UPDATE institutions SET archived=TRUE WHERE id=\$1 AND archived=FALSE RETURNING id/i);
  assert.doesNotMatch(server,/DELETE FROM institutions WHERE id=\$1/);
});

test('admin institution list and dashboard ignore archived institutions',()=>{
  assert.match(server,/SELECT \* FROM institutions WHERE archived=FALSE ORDER BY district,name/i);
  assert.match(server,/COUNT\(\*\) FILTER\(WHERE archived=FALSE\)::int total/i);
  assert.match(server,/COUNT\(\*\) FILTER\(WHERE archived=FALSE AND status='done'\)::int done/i);
});

test('adding an archived institution reactivates the same record',()=>{
  assert.match(server,/ON CONFLICT\(name\) DO UPDATE SET[\s\S]*archived=FALSE[\s\S]*WHERE institutions\.archived=TRUE[\s\S]*RETURNING \*/i);
});

test('editing only targets active institutions',()=>{
  assert.match(server,/WHERE id=\$7 AND archived=FALSE RETURNING \*/i);
});

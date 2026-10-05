const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','public');
function read(name){return fs.readFileSync(path.join(root,name),'utf8');}

test('admin institution drilldown has visible scope and clear control',()=>{
  const html=read('index.html');
  const inst=read('institutions.js');
  const staff=read('staff.js');
  assert.match(html,/id=["']staffScopeBar["']/);
  assert.match(html,/id=["']staffScopeName["']/);
  assert.match(inst,/data-institution-id/);
  assert.match(html,/Barcha xodimlar/);
  assert.match(staff,/selectInstitutionScope/);
  assert.match(staff,/clearInstitutionScope/);
});

test('scoped Excel export carries selected institution id',()=>{
  const reports=read('reports.js');
  assert.match(reports,/institutionId=/);
  assert.match(reports,/selectedInstitutionId/);
});

test('Excel import UI exposes preview counts and row errors',()=>{
  const imp=read('import.js');
  assert.match(imp,/importTotal/);
  assert.match(imp,/importValid/);
  assert.match(imp,/importErrors/);
  assert.match(imp,/\/api\/import\/preview/);
  assert.match(imp,/\/api\/import\/staff/);
});

test('staff table has an empty state hook',()=>{
  const html=read('index.html');
  assert.match(html,/id=["']staffEmpty["']/);
});

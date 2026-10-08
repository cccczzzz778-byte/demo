const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('server exposes authenticated bulk staff delete endpoint with role scoping',()=>{
  const source=fs.readFileSync(path.join(root,'server.js'),'utf8');
  assert.match(source,/app\.post\('\/api\/staff\/bulk-delete',auth,asyncHandler/i);
  assert.match(source,/DELETE FROM staff WHERE id = ANY\(\$1::int\[\]\)/i);
  assert.match(source,/AND institution_id=\$2/i);
});

test('staff table supports visible-row selection and bulk delete action',()=>{
  const html=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
  const source=fs.readFileSync(path.join(root,'public','staff.js'),'utf8');
  assert.match(html,/id="selectAllStaff"/i);
  assert.match(html,/id="bulkDeleteStaffBtn"/i);
  assert.match(source,/data-staff-select/i);
  assert.match(source,/\/api\/staff\/bulk-delete/i);
  assert.match(source,/scopedStaff\(\)/i);
});

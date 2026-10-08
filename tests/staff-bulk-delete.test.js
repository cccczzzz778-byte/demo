const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('existing staff delete API keeps institution users scoped to their own records',()=>{
  const source=fs.readFileSync(path.join(root,'server.js'),'utf8');
  assert.match(source,/app\.delete\('\/api\/staff\/:id',auth,asyncHandler/i);
  assert.match(source,/DELETE FROM staff WHERE id=\$1 AND institution_id=\$2/i);
});

test('staff table supports visible-row selection and multi-delete action',()=>{
  const html=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
  const source=fs.readFileSync(path.join(root,'public','staff.js'),'utf8');
  assert.match(html,/id="selectAllStaff"/i);
  assert.match(html,/id="bulkDeleteStaffBtn"/i);
  assert.match(source,/data-staff-select/i);
  assert.match(source,/selectedIds/i);
  assert.match(source,/Promise\.all/i);
  assert.match(source,/method:'DELETE'/i);
  assert.match(source,/scopedStaff\(\)/i);
});

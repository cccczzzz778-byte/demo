const test=require('node:test');
const assert=require('node:assert/strict');
const {staffExportScope}=require('../lib/staff-scope');

test('admin can scope staff export to a selected institution',()=>{
  assert.equal(staffExportScope({role:'admin'},'7'),7);
});

test('admin without a valid institution gets all institutions',()=>{
  assert.equal(staffExportScope({role:'admin'},''),null);
  assert.equal(staffExportScope({role:'admin'},'abc'),null);
});

test('institution account is always scoped to its own institution',()=>{
  assert.equal(staffExportScope({role:'institution',institutionId:3},'9'),3);
});

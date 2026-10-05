const test=require('node:test');
const assert=require('node:assert/strict');
const {
  normalizeEmploymentType,
  validateStaffInput,
  validateInstitutionInput,
  validateAccountInput
}=require('../lib/validation');

test('normalizes employment type to asosiy or orindosh',()=>{
  assert.equal(normalizeEmploymentType('asosiy'),'asosiy');
  assert.equal(normalizeEmploymentType('Асосий'),'asosiy');
  assert.equal(normalizeEmploymentType("o'rindosh"),'orindosh');
  assert.equal(normalizeEmploymentType('ўриндош'),'orindosh');
});

test('rejects numeric employment values',()=>{
  const r=validateStaffInput({institutionId:1,fullName:'Test Xodim',pinfl:'1'.repeat(14),position:'Shifokor',employment:'0,5'},{requireInstitution:true});
  assert.equal(r.ok,false);
  assert.equal(r.error,'invalid_employment');
  assert.equal(r.field,'employment');
});

test('accepts asosiy employment value',()=>{
  const r=validateStaffInput({institutionId:1,fullName:'Test Xodim',pinfl:'1'.repeat(14),position:'Shifokor',employment:'asosiy'},{requireInstitution:true});
  assert.equal(r.ok,true);
  assert.equal(r.value.employment,'asosiy');
});

test('rejects invalid PINFL length',()=>{
  const r=validateStaffInput({institutionId:1,fullName:'Test Xodim',pinfl:'123',position:'Shifokor',employment:'asosiy'},{requireInstitution:true});
  assert.equal(r.ok,false);
  assert.equal(r.error,'invalid_pinfl');
  assert.equal(r.field,'pinfl');
});

test('requires staff full name and position',()=>{
  let r=validateStaffInput({institutionId:1,pinfl:'1'.repeat(14),position:'Shifokor',employment:'asosiy'},{requireInstitution:true});
  assert.equal(r.error,'required_full_name');
  assert.equal(r.field,'fullName');
  r=validateStaffInput({institutionId:1,fullName:'Test',pinfl:'1'.repeat(14),employment:'asosiy'},{requireInstitution:true});
  assert.equal(r.error,'required_position');
  assert.equal(r.field,'position');
});

test('requires institution name and district',()=>{
  let r=validateInstitutionInput({district:'',name:'Klinika',type:'birlamchi'});
  assert.equal(r.error,'required_district');
  assert.equal(r.field,'district');
  r=validateInstitutionInput({district:'Buxoro',name:'',type:'birlamchi'});
  assert.equal(r.error,'required_name');
  assert.equal(r.field,'name');
});

test('rejects malformed phone when provided',()=>{
  const r=validateStaffInput({institutionId:1,fullName:'Test',pinfl:'1'.repeat(14),position:'Shifokor',employment:'asosiy',phone:'abc'},{requireInstitution:true});
  assert.equal(r.ok,false);
  assert.equal(r.error,'invalid_phone');
  assert.equal(r.field,'phone');
});

test('rejects weak account credentials',()=>{
  const r=validateAccountInput({username:'test',password:'123'});
  assert.equal(r.ok,false);
  assert.equal(r.error,'weak_credentials');
  assert.equal(r.field,'password');
});

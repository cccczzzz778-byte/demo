const test=require('node:test');
const assert=require('node:assert/strict');
const {
  normalizeEmploymentRate,
  validateStaffInput,
  validateInstitutionInput,
  validateAccountInput
}=require('../lib/validation');

test('normalizes comma decimal employment rate',()=>{
  assert.equal(normalizeEmploymentRate('0,5'),'0.5');
  assert.equal(normalizeEmploymentRate('1'),'1');
  assert.equal(normalizeEmploymentRate('0.25'),'0.25');
});

test('rejects invalid employment value with field code',()=>{
  const r=validateStaffInput({institutionId:1,fullName:'Test Xodim',pinfl:'1'.repeat(14),position:'Shifokor',employment:'asosiy'},{requireInstitution:true});
  assert.equal(r.ok,false);
  assert.equal(r.error,'invalid_employment');
  assert.equal(r.field,'employment');
});

test('rejects invalid PINFL length',()=>{
  const r=validateStaffInput({institutionId:1,fullName:'Test Xodim',pinfl:'123',position:'Shifokor',employment:'1'},{requireInstitution:true});
  assert.equal(r.ok,false);
  assert.equal(r.error,'invalid_pinfl');
  assert.equal(r.field,'pinfl');
});

test('requires staff full name and position',()=>{
  let r=validateStaffInput({institutionId:1,pinfl:'1'.repeat(14),position:'Shifokor',employment:'1'},{requireInstitution:true});
  assert.equal(r.error,'required_full_name');
  assert.equal(r.field,'fullName');
  r=validateStaffInput({institutionId:1,fullName:'Test',pinfl:'1'.repeat(14),employment:'1'},{requireInstitution:true});
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
  const r=validateStaffInput({institutionId:1,fullName:'Test',pinfl:'1'.repeat(14),position:'Shifokor',employment:'1',phone:'abc'},{requireInstitution:true});
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

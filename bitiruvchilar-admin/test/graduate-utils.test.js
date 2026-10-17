'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {canonicalHudud,statusFlags,isHigherEducation}=require('../lib/graduate-utils');

test('canonicalHudud normalizes latin and cyrillic district names',()=>{
  assert.equal(canonicalHudud('Buxoro shahri'),'Бухоро шаҳар');
  assert.equal(canonicalHudud("G'ijduvon"),'Ғиждувон тумани');
  assert.equal(canonicalHudud('Ромитан тумани'),'Ромитан тумани');
});

test('statusFlags separates unemployed deceased and working',()=>{
  assert.deepEqual(statusFlags('Ishsiz'),{unemployed:true,deceased:false,working:false});
  assert.deepEqual(statusFlags('Vafot etgan'),{unemployed:false,deceased:true,working:false});
  assert.deepEqual(statusFlags('Davlat korxonasida ishlaydi'),{unemployed:false,deceased:false,working:true});
  assert.deepEqual(statusFlags('Band'),{unemployed:false,deceased:false,working:true});
  assert.deepEqual(statusFlags('Migratsiyada'),{unemployed:false,deceased:false,working:false});
});

test('isHigherEducation recognizes OTM and higher education values',()=>{
  assert.equal(isHigherEducation('Oliy ta’lim'),true);
  assert.equal(isHigherEducation('ОТМ'),true);
  assert.equal(isHigherEducation('Texnikum'),false);
});

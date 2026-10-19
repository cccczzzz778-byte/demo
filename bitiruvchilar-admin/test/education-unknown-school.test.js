'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {aggregateGraduateRows}=require('../lib/graduate-model');
const {sourceSummary}=require('../lib/source-aggregates');

test('unknown education is counted under Maktab in live aggregates',()=>{
  const a=aggregateGraduateRows([{hudud:'Жондор тумани',education_level:'',bitirgan_turi:'',employment_status:''}]);
  assert.equal(a.education.school,1);
  assert.equal(a.education.unknown,0);
  assert.equal(a.nonHigher,1);
});

test('source dashboard folds Aniqlanmagan into Maktab',()=>{
  const global=sourceSummary();
  assert.equal(global.education.school,3694);
  assert.equal(global.education.unknown,0);
  const jondor=sourceSummary('Жондор тумани');
  assert.equal(jondor.education.school,288);
  assert.equal(jondor.education.unknown,0);
});

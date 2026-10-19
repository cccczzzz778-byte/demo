'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {inspectDataQuality,findDuplicatePinflGroups}=require('../lib/data-quality-service');

test('detects missing and duplicate quality issues without exposing raw sensitive data',()=>{
  const rows=[
    {id:1,fio:'A',pinfl:'11111111111111',hudud:'Romitan',education_level:'OTM',employment_status:'Band',op_oshp:'1-OP',telefon:'PHONE_A',diagnosis:'DIAG_A'},
    {id:2,fio:'B',pinfl:'11111111111111',hudud:'Romitan',education_level:'unknown',employment_status:'unknown',op_oshp:'',telefon:'PHONE_B',diagnosis:'DIAG_B'},
    {id:3,fio:'C',pinfl:'',hudud:'',education_level:'',employment_status:'Ishsiz Band',op_oshp:''}
  ];
  const result=inspectDataQuality(rows);
  assert.equal(result.total,3);
  assert.ok(result.issueCount>0);
  assert.ok(result.counts.missingPinfl>=1);
  assert.ok(result.counts.duplicatePinfl>=1);
  assert.ok(result.counts.missingEducation>=1);
  assert.ok(result.counts.missingEmployment>=1);
  assert.ok(result.counts.missingHudud>=1);
  assert.ok(result.counts.missingOpOshp>=1);
  assert.ok(result.counts.contradictoryEmployment>=1);
  const text=JSON.stringify(result);
  assert.equal(text.includes('11111111111111'),false);
  assert.equal(text.includes('PHONE_A'),false);
  assert.equal(text.includes('DIAG_A'),false);
});

test('duplicate groups return hash keys, counts and ids only',()=>{
  const groups=findDuplicatePinflGroups([{id:1,pinfl:'123'},{id:2,pinfl:'123'},{id:3,pinfl:''}]);
  assert.equal(groups.length,1);
  assert.equal(groups[0].count,2);
  assert.deepEqual(groups[0].entityIds,[1,2]);
  assert.equal(Object.prototype.hasOwnProperty.call(groups[0],'pinfl'),false);
  assert.match(groups[0].pinflHashKey,/^[a-f0-9]{16}$/);
});

test('empty rows return zero summary',()=>{
  assert.deepEqual(inspectDataQuality([]),{total:0,issueCount:0,counts:{missingPinfl:0,duplicatePinfl:0,missingEducation:0,missingEmployment:0,missingHudud:0,missingOpOshp:0,contradictoryEmployment:0},issues:[]});
});

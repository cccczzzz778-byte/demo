'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeEducationLevel,deriveHealthStatus,aggregateGraduateRows}=require('../lib/graduate-model');

test('normalizes OTM variants and preserves other education levels',()=>{
  assert.equal(normalizeEducationLevel('OTM'),'OTM');
  assert.equal(normalizeEducationLevel('ОТМ'),'OTM');
  assert.equal(normalizeEducationLevel('Oliy ta’lim'),'OTM');
  assert.equal(normalizeEducationLevel('Texnikum'),'Texnikum');
  assert.equal(normalizeEducationLevel('Litsey'),'Litsey');
  assert.equal(normalizeEducationLevel('Maktab'),'Maktab');
  assert.equal(normalizeEducationLevel(''),'unknown');
});

test('derives health only from explicit health or diagnosis',()=>{
  assert.equal(deriveHealthStatus({health_status:'Sog‘lom',diagnosis:''}),'Sog‘lom');
  assert.equal(deriveHealthStatus({health_status:'Kasal',diagnosis:'Anemiya'}),'Kasal');
  assert.equal(deriveHealthStatus({health_status:'Aniqlanmagan',diagnosis:'Homilador'}),'Aniqlanmagan');
  assert.equal(deriveHealthStatus({health_status:'',diagnosis:"Sog'lom"}),'Sog‘lom');
  assert.equal(deriveHealthStatus({health_status:'',diagnosis:'Соғлом'}),'Sog‘lom');
  assert.equal(deriveHealthStatus({health_status:'',diagnosis:'Anemiya'}),'Kasal');
  assert.equal(deriveHealthStatus({health_status:'',diagnosis:''}),'Aniqlanmagan');
});

test('medical education is a subset and does not increase total',()=>{
  const rows=[
    {hudud:'Ромитан тумани',education_level:'OTM',employment_status:'Ishlaydi',health_status:'Sog‘lom',medical_education:true,medical_education_level:'OTM'},
    {hudud:'Ромитан тумани',education_level:'Texnikum',employment_status:'Ishsiz',diagnosis:'Anemiya',medical_education:true,medical_education_level:'Texnikum'},
    {hudud:'Ромитан тумани',education_level:'Maktab',employment_status:'',health_status:''}
  ];
  const a=aggregateGraduateRows(rows);
  assert.equal(a.total,3);
  assert.equal(a.higher,1);
  assert.equal(a.nonHigher,2);
  assert.equal(a.working,1);
  assert.equal(a.unemployed,1);
  assert.equal(a.healthy,1);
  assert.equal(a.sick,1);
  assert.deepEqual(a.medicalEducation,{total:2,otm:1,technical:1});
});

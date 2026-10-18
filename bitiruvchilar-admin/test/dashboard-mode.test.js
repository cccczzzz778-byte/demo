'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeDashboardMode,regionForDashboard}=require('../lib/dashboard-mode');

test('normal mode keeps general graduate counts',()=>{
  const summary={total:467,higher:132,nonHigher:335,working:267,unemployed:199,medicalEducation:{total:10,otm:4,technical:6}};
  assert.equal(normalizeDashboardMode('anything'),'general');
  assert.deepEqual(regionForDashboard({key:'Olot',name:'Olot tumani',turi:'tuman'},summary,'general'),{
    key:'Olot',name:'Olot tumani',turi:'tuman',jami:467,oliy:132,texnikum:335,ishda:267,ishsiz:199,medicalMode:false
  });
});

test('medical mode makes map counts medical-only',()=>{
  const summary={total:467,higher:132,nonHigher:335,working:267,unemployed:199,medicalEducation:{total:10,otm:4,technical:6}};
  assert.equal(normalizeDashboardMode('medical'),'medical');
  assert.deepEqual(regionForDashboard({key:'Olot',name:'Olot tumani',turi:'tuman'},summary,'medical'),{
    key:'Olot',name:'Olot tumani',turi:'tuman',jami:10,oliy:4,texnikum:6,ishda:0,ishsiz:0,medicalMode:true
  });
});

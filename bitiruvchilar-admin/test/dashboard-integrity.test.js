'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {sourceSummary}=require('../lib/source-aggregates');

test('public health summary includes newly supplied district medical exams',()=>{
  const g=sourceSummary('');
  assert.equal(g.total,9823);
  assert.equal(g.examined,8363);
  assert.equal(g.healthy,8066);
  assert.equal(g.sick,236);
  assert.equal(g.healthOther,61);
  assert.equal(g.total-g.examined,1460);

  const expected={
    'Buxoro shahri':{examined:1361,healthy:1317,sick:37,other:7},
    'Buxoro tumani':{examined:957,healthy:907,sick:50,other:0},
    'Olot':{examined:466,healthy:405,sick:48,other:13},
    'Shofirkon':{examined:814,healthy:813,sick:0,other:1},
    "G'ijduvon":{examined:1624,healthy:1623,sick:1,other:0},
    'Jondor':{examined:906,healthy:895,sick:0,other:11},
    'Kogon shahri':{examined:274,healthy:244,sick:13,other:17},
    'Peshku':{examined:485,healthy:474,sick:11,other:0},
    'Romitan':{examined:604,healthy:601,sick:3,other:0},
    "Qorako'l":{examined:872,healthy:787,sick:73,other:12}
  };
  for(const [hudud,want] of Object.entries(expected)){
    const s=sourceSummary(hudud);
    assert.deepEqual({examined:s.examined,healthy:s.healthy,sick:s.sick,other:s.healthOther},want,hudud);
  }
});

test('map hover fixer is scoped to tooltip and cannot resize the map container',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../public/map-hover-fix.js'),'utf8');
  assert.match(js,/querySelectorAll\(['"]#map \.tip['"]\)/);
  assert.doesNotMatch(js,/querySelectorAll\(['"]div['"]\)/);
});

test('live database readiness uses the expanded unique-person medical exam control total',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../lib/dashboard-summary.js'),'utf8');
  assert.match(js,/e===8363/);
  assert.doesNotMatch(js,/e===3141|e===3148/);
});

test('health dashboard explicitly shows other medical statuses',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../public/dashboard-summary.js'),'utf8');
  assert.match(js,/Boshqa holat/);
  assert.match(js,/healthOther/);
});

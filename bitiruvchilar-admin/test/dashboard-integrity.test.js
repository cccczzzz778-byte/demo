'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {sourceSummary}=require('../lib/source-aggregates');

test('public health summary counts unique examined graduates',()=>{
  const g=sourceSummary('');
  assert.equal(g.total,9823);
  assert.equal(g.examined,3141);
  assert.equal(g.healthy,3001);
  assert.equal(g.sick,100);
  assert.equal(g.healthOther,40);
  assert.equal(g.total-g.examined,6682);

  const j=sourceSummary('Jondor');
  assert.deepEqual({examined:j.examined,healthy:j.healthy,sick:j.sick,other:j.healthOther},{examined:906,healthy:895,sick:0,other:11});
  const p=sourceSummary('Peshku');
  assert.deepEqual({examined:p.examined,healthy:p.healthy,sick:p.sick,other:p.healthOther},{examined:485,healthy:474,sick:11,other:0});
  const q=sourceSummary("Qorako'l");
  assert.deepEqual({examined:q.examined,healthy:q.healthy,sick:q.sick,other:q.healthOther},{examined:872,healthy:787,sick:73,other:12});
});

test('map hover fixer is scoped to tooltip and cannot resize the map container',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../public/map-hover-fix.js'),'utf8');
  assert.match(js,/querySelectorAll\(['"]#map \\.tip['"]\)/);
  assert.doesNotMatch(js,/querySelectorAll\(['"]div['"]\)/);
});

test('live database readiness uses the unique-person medical exam control total',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../lib/dashboard-summary.js'),'utf8');
  assert.match(js,/e===3141/);
  assert.doesNotMatch(js,/e===3148/);
});

test('health dashboard explicitly shows other medical statuses',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../public/dashboard-summary.js'),'utf8');
  assert.match(js,/Boshqa holat/);
  assert.match(js,/healthOther/);
});

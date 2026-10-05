const test=require('node:test');
const assert=require('node:assert/strict');
const {calcUnifiedKpi,summarizeKpi,signSession,verifySession,safeText}=require('../core');

test('calcUnifiedKpi returns full 100 points at maximum inputs',()=>{
  const r=calcUnifiedKpi({ratings:[5,5],appealsTotal:4,appealsResolved:4,authorityScore:40});
  assert.equal(r.qrScore,30);
  assert.equal(r.appealScore,30);
  assert.equal(r.authorityScore,40);
  assert.equal(r.total,100);
});

test('summarizeKpi groups evaluation records per institution without inventing a percent',()=>{
  const r=summarizeKpi({institutions:[{id:'a',name:'A'},{id:'b',name:'B'}],evaluations:[{institutionId:'a',score:2},{institutionId:'a',score:1}]});
  assert.equal(r.institutionsTotal,2);
  assert.equal(r.evaluatedInstitutions,1);
  assert.equal(r.evaluationRecords,2);
  assert.equal(r.scoreSum,3);
  assert.deepEqual(r.rows[0],{id:'a',name:'A',district:'',type:'',score:3,evaluations:2});
});

test('session token verifies and tampering is rejected',()=>{
  const now=1700000000000;
  const t=signSession('admin','secret',now,60_000);
  assert.equal(verifySession(t,'secret',now+1000)?.username,'admin');
  assert.equal(verifySession(t+'x','secret',now+1000),null);
  assert.equal(verifySession(t,'secret',now+61_000),null);
});

test('safeText normalizes control characters and length',()=>{
  assert.equal(safeText('  salom\u0000 dunyo  ',20),'salom dunyo');
  assert.equal(safeText('abcdef',3),'abc');
});

test('extractOnaStats only returns verified aggregate fields from a supplied aggregate payload',()=>{
  const {extractOnaStats}=require('../core');
  const r=extractOnaStats({registered:120,totals:{pregnant:77,delivered:31},districts:[{name:'Buxoro',registered:12,active:8,deliveries:3}]});
  assert.deepEqual(r.cards,{registered:120,active:77,births:31});
  assert.deepEqual(r.districts,[{name:'Buxoro',registered:12,active:8,births:3}]);
});

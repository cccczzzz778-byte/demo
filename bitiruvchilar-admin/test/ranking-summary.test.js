'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {buildRankingSummary}=require('../lib/ranking-summary');

test('hududlar reytingi 9823 va kengaytirilgan tibbiy ko‘rik manbalariga mos',()=>{
  const r=buildRankingSummary();
  assert.equal(r.hududlar.length,13);
  assert.deepEqual(r.winners.employment,{name:'Romitan tumani',value:'76.0%'});
  assert.deepEqual(r.winners.unemployed,{name:"G‘ijduvon tumani",value:'722'});
  assert.deepEqual(r.winners.higher,{name:'Buxoro shahri',value:'37.0%'});
  assert.deepEqual(r.winners.exam,{name:'Buxoro tumani',value:'100.0%'});
  assert.deepEqual(r.winners.sick,{name:"Qorako‘l tumani",value:'73'});
});

test('ko‘rik qamrovi yangi va oldingi hududlar bo‘yicha unique shaxslar bilan hisoblanadi',()=>{
  const r=buildRankingSummary();
  const byName=Object.fromEntries(r.hududlar.map(x=>[x.name,x]));
  assert.equal(byName['Buxoro shahri'].examined,1361);
  assert.equal(byName['Buxoro tumani'].examined,957);
  assert.equal(byName['Olot tumani'].examined,466);
  assert.equal(byName['Shofirkon tumani'].examined,814);
  assert.equal(byName['G‘ijduvon tumani'].examined,1624);
  assert.equal(byName['Kogon shahri'].examined,274);
  assert.equal(byName['Jondor tumani'].examined,906);
  assert.equal(byName['Peshku tumani'].examined,485);
  assert.equal(byName["Qorako‘l tumani"].examined,872);
  assert.equal(byName['Romitan tumani'].examined,604);
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateGraduateRisk,summarizeRisks,DEFAULT_RISK_CONFIG}=require('../lib/risk-engine');
const fixed={now:'2026-10-18T00:00:00.000Z'};

test('unemployed and missing exam produce separate warning risks',()=>{
  const risks=evaluateGraduateRisk({id:1,fio:'A B',hudud:'Romitan',pinfl:'11111111111111',education_level:'OTM',op_oshp:'1-OP',employment_status:'Ishsiz',medical_exam_date:''},fixed);
  assert.equal(risks.some(r=>r.ruleId==='unemployed'),true);
  assert.equal(risks.some(r=>r.ruleId==='medical_exam_missing'),true);
  assert.equal(risks.filter(r=>['unemployed','medical_exam_missing'].includes(r.ruleId)).every(r=>r.severity==='warning'),true);
});

test('missing required profile fields produces profile_incomplete',()=>{
  const risks=evaluateGraduateRisk({id:2,employment_status:'Band'},fixed);
  const item=risks.find(r=>r.ruleId==='profile_incomplete');
  assert.ok(item);
  assert.equal(item.severity,'warning');
  assert.ok(Array.isArray(item.evidence.missing));
});

test('missing pinfl does not fabricate duplicate risk',()=>{
  const risks=evaluateGraduateRisk({id:3,fio:'Test',hudud:'Olot',pinfl:'',education_level:'OTM',op_oshp:'2-OP',employment_status:'Band',medical_exam_date:'2026-01-01'},fixed);
  assert.equal(risks.some(r=>/duplicate/i.test(r.ruleId)),false);
});

test('fixed now produces deterministic safe output',()=>{
  const row={id:4,fio:'X',hudud:'Buxoro shahri',pinfl:'22222222222222',education_level:'OTM',op_oshp:'3-OP',employment_status:'Ishsiz',medical_exam_date:'',telefon:'PHONE_SENTINEL',diagnosis:'DIAGNOSIS_SENTINEL',session:'SESSION_SENTINEL'};
  const a=evaluateGraduateRisk(row,fixed);
  const b=evaluateGraduateRisk(row,fixed);
  assert.deepEqual(a,b);
  const text=JSON.stringify(a);
  assert.equal(text.includes('PHONE_SENTINEL'),false);
  assert.equal(text.includes('DIAGNOSIS_SENTINEL'),false);
  assert.equal(text.includes('SESSION_SENTINEL'),false);
});

test('partial malformed input never throws',()=>{
  assert.doesNotThrow(()=>evaluateGraduateRisk(null,fixed));
  assert.doesNotThrow(()=>evaluateGraduateRisk({id:'x',hudud:null},fixed));
});

test('summary counts severities and rules',()=>{
  const summary=summarizeRisks([{id:1,fio:'A',hudud:'Romitan',pinfl:'',education_level:'',op_oshp:'',employment_status:'Ishsiz',medical_exam_date:''}],fixed);
  assert.ok(summary.total>=1);
  assert.equal(summary.total,summary.info+summary.warning+summary.critical);
  assert.equal(typeof summary.byRule,'object');
  assert.ok(Array.isArray(summary.records));
  assert.equal(typeof DEFAULT_RISK_CONFIG,'object');
});

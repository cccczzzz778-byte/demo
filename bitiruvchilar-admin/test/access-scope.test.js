'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeRole,resolveScope,applyScopeToFilters,canWrite}=require('../lib/access-scope');

test('admin has all-scope write access',()=>{
  assert.equal(normalizeRole({role:'admin'}),'admin');
  assert.deepEqual(resolveScope({role:'admin'}),{role:'admin',all:true,hudud:'',institution:'',readOnly:false});
  assert.equal(canWrite(resolveScope({role:'admin'})),true);
});

test('leadership has all-scope read-only access',()=>{
  assert.deepEqual(resolveScope({role:'leadership'}),{role:'leadership',all:true,hudud:'',institution:'',readOnly:true});
  assert.equal(canWrite(resolveScope({role:'leadership'})),false);
});

test('legacy operator becomes canonical territory-scoped ttb_shtb',()=>{
  assert.deepEqual(resolveScope({role:'operator',hudud:'Buxoro shahri'}),{role:'ttb_shtb',all:false,hudud:'Бухоро шаҳар',institution:'',readOnly:false});
});

test('op_oshp without institution remains least privilege',()=>{
  const scope=resolveScope({role:'op_oshp',hudud:'Romitan'});
  assert.deepEqual(scope,{role:'op_oshp',all:false,hudud:'Ромитан тумани',institution:'',readOnly:false});
  assert.deepEqual(applyScopeToFilters(scope,{hudud:'Buxoro shahri',op_oshp:'Other'}),{hudud:'Ромитан тумани',op_oshp:'__none__'});
  assert.equal(canWrite(scope),false);
});

test('territory role without hudud cannot write',()=>{
  assert.equal(canWrite(resolveScope({role:'ttb_shtb'})),false);
});

test('unknown role defaults to none and read-only',()=>{
  assert.deepEqual(resolveScope({role:'mystery',hudud:'Buxoro shahri'}),{role:'none',all:false,hudud:'',institution:'',readOnly:true});
  assert.equal(canWrite(resolveScope({role:'mystery'})),false);
});

test('territory scope overwrites caller supplied hudud',()=>{
  const scope=resolveScope({role:'ttb_shtb',hudud:'Gijduvon'});
  assert.deepEqual(applyScopeToFilters(scope,{hudud:'Romitan',q:'x'}),{hudud:'Ғиждувон тумани',q:'x'});
});

test('institution scope overwrites caller supplied op_oshp',()=>{
  const scope=resolveScope({role:'op_oshp',hudud:'Buxoro shahri',institution:'12-OP'});
  assert.deepEqual(applyScopeToFilters(scope,{op_oshp:'99-OP'}),{hudud:'Бухоро шаҳар',op_oshp:'12-OP'});
});

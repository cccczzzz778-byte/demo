'use strict';
const {canonicalHudud}=require('./graduate-utils');

const ROLE_ALIASES=new Map([
  ['admin','admin'],
  ['leadership','leadership'],
  ['ttb_shtb','ttb_shtb'],
  ['op_oshp','op_oshp'],
  ['operator','ttb_shtb']
]);

function normalizeRole(user){
  const raw=String(user?.role??'').trim().toLowerCase();
  return ROLE_ALIASES.get(raw)||'none';
}

function resolveScope(user){
  const role=normalizeRole(user);
  if(role==='admin')return{role,all:true,hudud:'',institution:'',readOnly:false};
  if(role==='leadership')return{role,all:true,hudud:'',institution:'',readOnly:true};
  if(role==='ttb_shtb')return{role,all:false,hudud:canonicalHudud(user?.hudud||''),institution:'',readOnly:false};
  if(role==='op_oshp')return{role,all:false,hudud:canonicalHudud(user?.hudud||''),institution:String(user?.institution||user?.op_oshp||'').trim(),readOnly:false};
  return{role:'none',all:false,hudud:'',institution:'',readOnly:true};
}

function applyScopeToFilters(scope,filters={}){
  const out={...filters};
  if(!scope||scope.role==='none')return{...out,hudud:'__none__',op_oshp:'__none__'};
  if(scope.all)return out;
  if(scope.hudud)out.hudud=scope.hudud;
  else out.hudud='__none__';
  if(scope.role==='op_oshp')out.op_oshp=scope.institution||'__none__';
  return out;
}

function canWrite(scope){return Boolean(scope&&!scope.readOnly&&scope.role!=='none')}

module.exports={normalizeRole,resolveScope,applyScopeToFilters,canWrite};

'use strict';
const {resolveScope}=require('./access-scope');
const {buildCommandCenter,buildTerritoryDrilldown}=require('./command-center-service');

function handleCommandCenterRequest({db,user,path,query={},options={}}){
  if(!user)return{status:401,body:{error:'Login talab qilinadi.'}};
  const scope=resolveScope(user);
  if(scope.role==='none')return{status:403,body:{error:'Ruxsat mavjud emas.'}};
  if(path==='/api/command-center')return{status:200,body:buildCommandCenter(db,scope,options)};
  if(path==='/api/command-center/territory')return{status:200,body:buildTerritoryDrilldown(db,scope,String(query.hudud??''),options)};
  return{status:404,body:{error:'Topilmadi'}};
}

module.exports={handleCommandCenterRequest};

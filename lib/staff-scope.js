function positiveInt(value){
  const n=Number(value);
  return Number.isInteger(n)&&n>0?n:null;
}

function staffExportScope(user,requestedInstitutionId){
  if(user&&user.role==='institution') return positiveInt(user.institutionId);
  if(user&&user.role==='admin') return positiveInt(requestedInstitutionId);
  return null;
}

module.exports={staffExportScope};

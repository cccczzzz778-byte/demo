function clean(value){return String(value??'').trim();}
function fail(error,field){return {ok:false,error,field};}
function positiveInt(value){const n=Number(value);return Number.isInteger(n)&&n>0?n:null;}
function bounded(value,max){const v=clean(value);return v.length<=max?v:null;}

function normalizeEmploymentType(value){
  const raw=clean(value).toLowerCase().replace(/[’ʻ`ʼ]/g,"'").replace(/\s+/g,' ');
  if(['asosiy','асосий'].includes(raw)) return 'asosiy';
  if(["o'rindosh",'orindosh','ўриндош','уриндош'].includes(raw)) return 'orindosh';
  return null;
}

function normalizePhone(value){
  const phone=clean(value);
  if(!phone) return '';
  if(phone.length>32||!/^[+()\d\s.-]{5,32}$/.test(phone)) return null;
  return phone;
}

function validateStaffInput(input={},options={}){
  const requireInstitution=Boolean(options.requireInstitution);
  const institutionId=positiveInt(input.institutionId);
  if(requireInstitution&&!institutionId) return fail('required_institution','institutionId');

  const fullName=bounded(input.fullName,160);
  if(fullName===null) return fail('too_long_full_name','fullName');
  if(!fullName) return fail('required_full_name','fullName');

  const pinfl=clean(input.pinfl);
  if(!/^\d{14}$/.test(pinfl)) return fail('invalid_pinfl','pinfl');

  const position=bounded(input.position,120);
  if(position===null) return fail('too_long_position','position');
  if(!position) return fail('required_position','position');

  const specialty=bounded(input.specialty,120);
  if(specialty===null) return fail('too_long_specialty','specialty');

  const employment=normalizeEmploymentType(input.employment);
  if(!employment) return fail('invalid_employment','employment');

  const phone=normalizePhone(input.phone);
  if(phone===null) return fail('invalid_phone','phone');

  const note=bounded(input.note,500);
  if(note===null) return fail('too_long_note','note');

  return {ok:true,value:{institutionId,fullName,pinfl,position,specialty,employment,phone,note}};
}

function validateInstitutionInput(input={}){
  const district=bounded(input.district,100);
  if(district===null) return fail('too_long_district','district');
  if(!district) return fail('required_district','district');

  const name=bounded(input.name,200);
  if(name===null) return fail('too_long_name','name');
  if(!name) return fail('required_name','name');

  const type=bounded(input.type,80);
  if(type===null) return fail('too_long_type','type');
  if(!type) return fail('required_type','type');

  const status=['pending','done'].includes(clean(input.status))?clean(input.status):'pending';
  const phone=normalizePhone(input.phone);
  if(phone===null) return fail('invalid_phone','phone');

  const note=bounded(input.note,500);
  if(note===null) return fail('too_long_note','note');

  return {ok:true,value:{district,name,type,status,phone,note}};
}

function validateAccountInput(input={}){
  const username=clean(input.username);
  if(!username) return fail('required_username','username');
  if(username.length<2||username.length>80||/\s/.test(username)) return fail('invalid_username','username');

  const password=String(input.password??'');
  if(password.length<8) return fail('weak_credentials','password');
  if(password.length>128) return fail('password_too_long','password');

  return {ok:true,value:{username,password}};
}

module.exports={normalizeEmploymentType,validateStaffInput,validateInstitutionInput,validateAccountInput,normalizePhone};

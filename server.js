const express=require('express');
const path=require('path');
const cookieParser=require('cookie-parser');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const XLSX=require('xlsx');
const helmet=require('helmet');
const {rateLimit}=require('express-rate-limit');
const {Pool}=require('pg');
const {TEMPLATE_HEADERS,normalizeStaffRows}=require('./lib/staff-import');
const {staffExportScope}=require('./lib/staff-scope');
const {validateStaffInput,validateInstitutionInput,validateAccountInput}=require('./lib/validation');
const {resolveJwtSecret,LOGIN_RATE_LIMIT}=require('./lib/security');

const app=express();
const PORT=process.env.PORT||3000;
const SECRET=resolveJwtSecret(process.env);
const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false
});

app.set('trust proxy',1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy:{directives:{
    defaultSrc:["'self'"],
    scriptSrc:["'self'"],
    styleSrc:["'self'"],
    imgSrc:["'self'",'data:'],
    connectSrc:["'self'"],
    objectSrc:["'none'"],
    baseUri:["'self'"],
    frameAncestors:["'none'"]
  }}
}));
app.use(express.json({limit:'15mb'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public'),{index:'index.html',maxAge:process.env.NODE_ENV==='production'?'5m':0}));

const loginLimiter=rateLimit({
  windowMs:LOGIN_RATE_LIMIT.windowMs,
  limit:LOGIN_RATE_LIMIT.limit,
  standardHeaders:'draft-7',
  legacyHeaders:false,
  message:{error:'too_many_login_attempts'}
});

const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const cookieOptions={
  httpOnly:true,
  secure:process.env.NODE_ENV==='production',
  sameSite:'lax',
  maxAge:12*60*60*1000,
  path:'/'
};
function positiveInt(value){const n=Number(value);return Number.isInteger(n)&&n>0?n:null;}
function validationError(res,result){return res.status(400).json({error:result.error,field:result.field});}
function auth(req,res,next){
  try{
    const token=req.cookies.dmed_token;
    if(!token)return res.status(401).json({error:'unauthorized'});
    req.user=jwt.verify(token,SECRET);
    return next();
  }catch{return res.status(401).json({error:'unauthorized'});}
}
function admin(req,res,next){if(req.user.role!=='admin')return res.status(403).json({error:'forbidden'});return next();}
function institution(req,res,next){if(req.user.role!=='institution')return res.status(403).json({error:'forbidden'});return next();}
async function getInstitution(id){const q=await pool.query('SELECT * FROM institutions WHERE id=$1',[id]);return q.rows[0]||null;}

async function init(){
  await pool.query(`
    CREATE TABLE IF NOT EXISTS institutions(
      id SERIAL PRIMARY KEY,
      district TEXT NOT NULL,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'birlamchi',
      status TEXT NOT NULL DEFAULT 'pending',
      phone TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','institution')),
      institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS staff(
      id SERIAL PRIMARY KEY,
      institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      district TEXT NOT NULL,
      institution TEXT NOT NULL,
      type TEXT NOT NULL,
      full_name TEXT NOT NULL,
      pinfl VARCHAR(14) UNIQUE NOT NULL,
      position TEXT NOT NULL,
      specialty TEXT DEFAULT '',
      employment TEXT DEFAULT '1',
      phone TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE staff ALTER COLUMN employment SET DEFAULT '1';
    UPDATE staff SET employment='1' WHERE lower(coalesce(employment,'')) IN ('','asosiy');
    UPDATE staff SET employment='0.5' WHERE lower(coalesce(employment,''))='orindosh';
  `);
  if(process.env.ADMIN_USERNAME&&process.env.ADMIN_PASSWORD){
    const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD,12);
    await pool.query(
      `INSERT INTO users(username,password_hash,role)
       VALUES($1,$2,'admin')
       ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='admin',institution_id=NULL`,
      [process.env.ADMIN_USERNAME.trim(),hash]
    );
  }
}

function workbookRowsFromPayload(body){
  const raw=String(body?.data||'').replace(/^data:.*?;base64,/,'');
  if(!raw)throw new Error('excel_invalid');
  const buf=Buffer.from(raw,'base64');
  if(!buf.length||buf.length>10*1024*1024)throw new Error('excel_invalid');
  let wb;
  try{wb=XLSX.read(buf,{type:'buffer'});}catch{throw new Error('excel_invalid');}
  const name=wb.SheetNames[0];
  if(!name)throw new Error('excel_invalid');
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:'',raw:false});
  if(rows.length>5000)throw new Error('too_many_rows');
  return rows;
}
function importValidationMessage(code){
  const map={
    required_full_name:'F.I.O. kiritilmagan',
    invalid_pinfl:'PINFL 14 ta raqam bo‘lishi kerak',
    required_position:'Lavozim kiritilmagan',
    invalid_employment:'Stavka son ko‘rinishida bo‘lishi kerak',
    invalid_phone:'Telefon raqami noto‘g‘ri',
    too_long_full_name:'F.I.O. juda uzun',
    too_long_position:'Lavozim juda uzun',
    too_long_specialty:'Mutaxassislik juda uzun',
    too_long_note:'Izoh juda uzun'
  };
  return map[code]||'Ma’lumot formati noto‘g‘ri';
}
async function validateImportRows(rows){
  const parsed=normalizeStaffRows(rows);
  const valid=[];
  const errors=[...parsed.errors];
  for(const row of parsed.valid){
    const checked=validateStaffInput({
      institutionId:1,
      fullName:row.fullName,
      pinfl:row.pinfl,
      position:row.position,
      specialty:row.specialty,
      employment:row.employment,
      phone:row.phone,
      note:row.note
    },{requireInstitution:true});
    if(!checked.ok){
      errors.push({...row,message:importValidationMessage(checked.error)});
      continue;
    }
    valid.push({...row,...checked.value});
  }
  if(!valid.length)return {valid,errors};
  const pinfls=valid.map(x=>x.pinfl);
  const existing=new Set((await pool.query('SELECT pinfl FROM staff WHERE pinfl = ANY($1::text[])',[pinfls])).rows.map(x=>x.pinfl));
  return {
    valid:valid.filter(row=>{
      if(existing.has(row.pinfl)){
        errors.push({...row,message:'PINFL bazada avval mavjud'});
        return false;
      }
      return true;
    }),
    errors
  };
}
function exportRows(rows){
  return rows.map((x,i)=>({
    '№':i+1,
    'Туман':x.district,
    'Муассаса номи':x.institution,
    'Типи':x.type,
    'Ходимнинг Ф.И.О.':x.full_name,
    'ПИНФЛ':x.pinfl,
    'Лавозими':x.position,
    'Мутахассислиги':x.specialty,
    'Ставкаси':x.employment,
    'Телефон рақами':x.phone,
    'Изоҳ':x.note
  }));
}

app.get('/api/health',asyncHandler(async(_req,res)=>{
  await pool.query('SELECT 1');
  res.json({ok:true});
}));

app.post('/api/login',loginLimiter,asyncHandler(async(req,res)=>{
  const username=String(req.body?.username||'').trim();
  const password=String(req.body?.password||'');
  if(!username||!password)return res.status(400).json({error:'credentials_required'});
  const q=await pool.query('SELECT id,username,password_hash,role,institution_id FROM users WHERE username=$1',[username]);
  const user=q.rows[0];
  if(!user||!await bcrypt.compare(password,user.password_hash))return res.status(401).json({error:'invalid_credentials'});
  const token=jwt.sign({id:user.id,role:user.role,institutionId:user.institution_id,username:user.username},SECRET,{expiresIn:'12h'});
  res.cookie('dmed_token',token,cookieOptions).json({role:user.role,username:user.username});
}));
app.post('/api/logout',(_req,res)=>{
  res.clearCookie('dmed_token',{httpOnly:true,secure:cookieOptions.secure,sameSite:'lax',path:'/'}).json({ok:true});
});
app.get('/api/me',auth,(req,res)=>res.json(req.user));

app.get('/api/dashboard',auth,asyncHandler(async(req,res)=>{
  if(req.user.role==='admin'){
    const [staffCount,instCount]=await Promise.all([
      pool.query('SELECT COUNT(*)::int count FROM staff'),
      pool.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='done')::int done FROM institutions`)
    ]);
    return res.json({staff:staffCount.rows[0].count,institutions:instCount.rows[0].total,done:instCount.rows[0].done});
  }
  const [staffCount,inst]=await Promise.all([
    pool.query('SELECT COUNT(*)::int count FROM staff WHERE institution_id=$1',[req.user.institutionId]),
    pool.query(`SELECT CASE WHEN status='done' THEN 1 ELSE 0 END::int done FROM institutions WHERE id=$1`,[req.user.institutionId])
  ]);
  res.json({staff:staffCount.rows[0].count,institutions:1,done:inst.rows[0]?.done||0});
}));

app.get('/api/institutions',auth,asyncHandler(async(req,res)=>{
  if(req.user.role==='admin')return res.json((await pool.query('SELECT * FROM institutions ORDER BY district,name')).rows);
  res.json((await pool.query('SELECT * FROM institutions WHERE id=$1',[req.user.institutionId])).rows);
}));
app.post('/api/institutions',auth,admin,asyncHandler(async(req,res)=>{
  const checked=validateInstitutionInput({...req.body,status:req.body?.status||'pending',type:req.body?.type||'birlamchi'});
  if(!checked.ok)return validationError(res,checked);
  const v=checked.value;
  try{
    const r=await pool.query(
      'INSERT INTO institutions(district,name,type,status,phone,note) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [v.district,v.name,v.type,v.status,v.phone,v.note]
    );
    res.status(201).json(r.rows[0]);
  }catch(e){
    if(e.code==='23505')return res.status(409).json({error:'duplicate_institution',field:'name'});
    throw e;
  }
}));
app.put('/api/institutions/:id',auth,admin,asyncHandler(async(req,res)=>{
  const id=positiveInt(req.params.id);
  if(!id)return res.status(400).json({error:'invalid_id'});
  const checked=validateInstitutionInput({...req.body,type:req.body?.type||'birlamchi'});
  if(!checked.ok)return validationError(res,checked);
  const v=checked.value;
  try{
    const r=await pool.query(
      'UPDATE institutions SET district=$1,name=$2,type=$3,status=$4,phone=$5,note=$6 WHERE id=$7 RETURNING *',
      [v.district,v.name,v.type,v.status,v.phone,v.note,id]
    );
    if(!r.rowCount)return res.status(404).json({error:'not_found'});
    res.json(r.rows[0]);
  }catch(e){
    if(e.code==='23505')return res.status(409).json({error:'duplicate_institution',field:'name'});
    throw e;
  }
}));
app.delete('/api/institutions/:id',auth,admin,asyncHandler(async(req,res)=>{
  const id=positiveInt(req.params.id);
  if(!id)return res.status(400).json({error:'invalid_id'});
  const r=await pool.query('DELETE FROM institutions WHERE id=$1',[id]);
  if(!r.rowCount)return res.status(404).json({error:'not_found'});
  res.json({ok:true});
}));
app.post('/api/institutions/:id/account',auth,admin,asyncHandler(async(req,res)=>{
  const institutionId=positiveInt(req.params.id);
  if(!institutionId)return res.status(400).json({error:'invalid_id'});
  if(!await getInstitution(institutionId))return res.status(404).json({error:'institution_not_found'});
  const checked=validateAccountInput(req.body);
  if(!checked.ok)return validationError(res,checked);
  const {username,password}=checked.value;
  const existing=(await pool.query('SELECT role,institution_id FROM users WHERE username=$1',[username])).rows[0];
  if(existing&&(existing.role!=='institution'||Number(existing.institution_id)!==institutionId)){
    return res.status(409).json({error:'username_taken',field:'username'});
  }
  const hash=await bcrypt.hash(password,12);
  await pool.query(
    `INSERT INTO users(username,password_hash,role,institution_id)
     VALUES($1,$2,'institution',$3)
     ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='institution',institution_id=EXCLUDED.institution_id`,
    [username,hash,institutionId]
  );
  res.json({ok:true,username});
}));

app.get('/api/staff',auth,asyncHandler(async(req,res)=>{
  if(req.user.role==='institution'){
    return res.json((await pool.query('SELECT * FROM staff WHERE institution_id=$1 ORDER BY created_at DESC',[req.user.institutionId])).rows);
  }
  const scope=positiveInt(req.query.institutionId);
  if(scope)return res.json((await pool.query('SELECT * FROM staff WHERE institution_id=$1 ORDER BY created_at DESC',[scope])).rows);
  res.json((await pool.query('SELECT * FROM staff ORDER BY created_at DESC')).rows);
}));
app.post('/api/staff',auth,asyncHandler(async(req,res)=>{
  const institutionId=req.user.role==='admin'?positiveInt(req.body?.institutionId):positiveInt(req.user.institutionId);
  const checked=validateStaffInput({...req.body,institutionId},{requireInstitution:true});
  if(!checked.ok)return validationError(res,checked);
  const v=checked.value;
  const ins=await getInstitution(v.institutionId);
  if(!ins)return res.status(404).json({error:'institution_not_found',field:'institutionId'});
  try{
    const r=await pool.query(
      `INSERT INTO staff(institution_id,district,institution,type,full_name,pinfl,position,specialty,employment,phone,note)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [ins.id,ins.district,ins.name,ins.type,v.fullName,v.pinfl,v.position,v.specialty,v.employment,v.phone,v.note]
    );
    res.status(201).json(r.rows[0]);
  }catch(e){
    if(e.code==='23505')return res.status(409).json({error:'duplicate_pinfl',field:'pinfl'});
    throw e;
  }
}));
app.put('/api/staff/:id',auth,asyncHandler(async(req,res)=>{
  const id=positiveInt(req.params.id);
  if(!id)return res.status(400).json({error:'invalid_id'});
  const institutionId=req.user.role==='admin'?positiveInt(req.body?.institutionId):positiveInt(req.user.institutionId);
  const checked=validateStaffInput({...req.body,institutionId},{requireInstitution:true});
  if(!checked.ok)return validationError(res,checked);
  const v=checked.value;
  const ins=await getInstitution(v.institutionId);
  if(!ins)return res.status(404).json({error:'institution_not_found',field:'institutionId'});
  const params=[ins.id,ins.district,ins.name,ins.type,v.fullName,v.pinfl,v.position,v.specialty,v.employment,v.phone,v.note,new Date(),id];
  let sql=`UPDATE staff SET institution_id=$1,district=$2,institution=$3,type=$4,full_name=$5,pinfl=$6,position=$7,specialty=$8,employment=$9,phone=$10,note=$11,updated_at=$12 WHERE id=$13`;
  if(req.user.role==='institution'){
    sql+=' AND institution_id=$14';
    params.push(req.user.institutionId);
  }
  sql+=' RETURNING *';
  try{
    const r=await pool.query(sql,params);
    if(!r.rowCount)return res.status(404).json({error:'not_found'});
    res.json(r.rows[0]);
  }catch(e){
    if(e.code==='23505')return res.status(409).json({error:'duplicate_pinfl',field:'pinfl'});
    throw e;
  }
}));
app.delete('/api/staff/:id',auth,asyncHandler(async(req,res)=>{
  const id=positiveInt(req.params.id);
  if(!id)return res.status(400).json({error:'invalid_id'});
  const r=req.user.role==='admin'
    ?await pool.query('DELETE FROM staff WHERE id=$1',[id])
    :await pool.query('DELETE FROM staff WHERE id=$1 AND institution_id=$2',[id,req.user.institutionId]);
  if(!r.rowCount)return res.status(404).json({error:'not_found'});
  res.json({ok:true});
}));
app.post('/api/submit',auth,institution,asyncHandler(async(req,res)=>{
  await pool.query(`UPDATE institutions SET status='done' WHERE id=$1`,[req.user.institutionId]);
  res.json({ok:true});
}));

app.get('/api/import/template.xlsx',auth,institution,(_req,res)=>{
  const ws=XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  ws['!cols']=[{wch:6},{wch:20},{wch:34},{wch:16},{wch:30},{wch:18},{wch:24},{wch:24},{wch:18},{wch:20},{wch:30}];
  const help=XLSX.utils.aoa_to_sheet([
    ['Yo‘riqnoma'],
    ['PINFL','14 ta raqam bo‘lishi shart.'],
    ['F.I.O.','Majburiy maydon.'],
    ['Lavozimi','Majburiy maydon.'],
    ['Stavka','Son ko‘rinishida yozing: 1, 0,5, 0,25. Nuqta bilan 0.5 ham qabul qilinadi.'],
    ['Tuman / Muassasa / Tip','Kabinetga biriktirilgan ma’lumot avtomatik qo‘llanadi.'],
    ['Maksimal qator','5000 ta xodim.']
  ]);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Xodimlar');
  XLSX.utils.book_append_sheet(wb,help,'Yo‘riqnoma');
  const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Disposition','attachment; filename="tibbiyot_xodimlari_shablon.xlsx"');
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(out);
});
app.post('/api/import/preview',auth,institution,asyncHandler(async(req,res)=>{
  try{
    const rows=workbookRowsFromPayload(req.body);
    const checked=await validateImportRows(rows);
    res.json({
      total:checked.valid.length+checked.errors.length,
      validCount:checked.valid.length,
      errorCount:checked.errors.length,
      preview:checked.valid.slice(0,20),
      errors:checked.errors.slice(0,200)
    });
  }catch(e){
    if(['too_many_rows','excel_invalid'].includes(e.message))return res.status(400).json({error:e.message});
    throw e;
  }
}));
app.post('/api/import/staff',auth,institution,asyncHandler(async(req,res)=>{
  let rows;
  try{rows=workbookRowsFromPayload(req.body);}catch(e){
    if(['too_many_rows','excel_invalid'].includes(e.message))return res.status(400).json({error:e.message});
    throw e;
  }
  const checked=await validateImportRows(rows);
  const ins=await getInstitution(req.user.institutionId);
  if(!ins)return res.status(404).json({error:'institution_not_found'});
  const client=await pool.connect();
  let inserted=0;
  const errors=[...checked.errors];
  try{
    await client.query('BEGIN');
    for(const x of checked.valid){
      const r=await client.query(
        `INSERT INTO staff(institution_id,district,institution,type,full_name,pinfl,position,specialty,employment,phone,note)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT(pinfl) DO NOTHING RETURNING id`,
        [ins.id,ins.district,ins.name,ins.type,x.fullName,x.pinfl,x.position,x.specialty,x.employment,x.phone,x.note]
      );
      if(r.rowCount)inserted++;
      else errors.push({...x,message:'PINFL bazada avval mavjud'});
    }
    await client.query('COMMIT');
    res.json({inserted,errorCount:errors.length,errors:errors.slice(0,200)});
  }catch(e){
    await client.query('ROLLBACK');
    throw e;
  }finally{client.release();}
}));
app.get('/api/export/staff.xlsx',auth,asyncHandler(async(req,res)=>{
  const scope=staffExportScope(req.user,req.query.institutionId);
  let rows;
  if(scope){
    rows=(await pool.query(
      'SELECT district,institution,type,full_name,pinfl,position,specialty,employment,phone,note FROM staff WHERE institution_id=$1 ORDER BY district,institution,full_name',
      [scope]
    )).rows;
  }else{
    rows=(await pool.query(
      'SELECT district,institution,type,full_name,pinfl,position,specialty,employment,phone,note FROM staff ORDER BY district,institution,full_name'
    )).rows;
  }
  const ws=XLSX.utils.json_to_sheet(exportRows(rows),{header:TEMPLATE_HEADERS});
  ws['!cols']=[{wch:6},{wch:20},{wch:34},{wch:16},{wch:30},{wch:18},{wch:24},{wch:24},{wch:18},{wch:20},{wch:30}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Xodimlar');
  const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Disposition','attachment; filename="tibbiyot_xodimlari.xlsx"');
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(out);
}));

app.use('/api',(req,res)=>res.status(404).json({error:'not_found'}));
app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.use((err,req,res,_next)=>{
  console.error('UNHANDLED_ERROR',req.method,req.path,err?.message||err);
  if(res.headersSent)return;
  res.status(500).json({error:'internal_error'});
});

init()
  .then(()=>app.listen(PORT,'0.0.0.0',()=>console.log('DMED production',PORT)))
  .catch(err=>{console.error('STARTUP_ERROR',err?.message||err);process.exit(1);});

const express=require('express');
const path=require('path');
const fs=require('fs');
const cookie=require('cookie-parser');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const XLSX=require('xlsx');
const {Pool}=require('pg');
const {TEMPLATE_HEADERS,normalizeStaffRows}=require('./lib/staff-import');

const app=express();
const PORT=process.env.PORT||3000;
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false});
const SECRET=process.env.JWT_SECRET||'change-this-secret';

app.use(express.json({limit:'15mb'}));
app.use(cookie());
app.use(express.static(path.join(__dirname,'public'),{index:false}));

const importUiScript=`
<script>
let staffImportPayload=null;
function fileAsBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=reject;r.readAsDataURL(file)})}
function openStaffImport(){
  modalBox.innerHTML='<h2>Excel orqali xodimlarni yuklash</h2><p><b>Talab qilinadigan ustunlar:</b><br>№, Tuman, Muassasa nomi, Tipi, Xodimning F.I.O., PINFL, Lavozimi, Mutaxassisligi, Stavkasi (o‘rindosh, asosiy), Telefon raqami, Izoh.</p><p style="color:#687572">Tuman, muassasa nomi va tipi kabinetga biriktirilgan ma’lumotdan olinadi. PINFL 14 ta raqam bo‘lishi shart.</p><p><a class="outline" style="display:inline-block;text-decoration:none" href="/api/import/template.xlsx">⬇ Excel shablonni yuklab olish</a></p><div class="field"><label>Excel fayl (.xlsx yoki .xls)</label><input id="staffImportFile" type="file" accept=".xlsx,.xls"></div><div id="importMsg" class="msg"></div><div id="importSummary"></div><div class="right"><button class="outline" onclick="closeM()">Bekor</button><button class="outline" onclick="previewStaffImport()">Tekshirish</button><button id="confirmImportBtn" class="primary hidden" onclick="confirmStaffImport()">Bazaga yuklash</button></div>';
  modal.classList.remove('hidden');
}
async function previewStaffImport(){
  const file=document.getElementById('staffImportFile').files[0];
  if(!file){importMsg.textContent='Excel faylni tanlang';return}
  if(file.size>10*1024*1024){importMsg.textContent='Fayl hajmi 10 MB dan oshmasligi kerak';return}
  try{
    importMsg.textContent='';importSummary.innerHTML='Tekshirilmoqda...';
    staffImportPayload={filename:file.name,data:await fileAsBase64(file)};
    const r=await req('/api/import/preview',{method:'POST',body:JSON.stringify(staffImportPayload)});
    const errs=(r.errors||[]).slice(0,50).map(e=>'<li>'+esc(e.row+'-qator: '+e.message+(e.fullName?' — '+e.fullName:''))+'</li>').join('');
    importSummary.innerHTML='<div class="stats" style="margin-top:12px"><div class="stat"><b>'+r.total+'</b><small>O‘qilgan qator</small></div><div class="stat"><b>'+r.validCount+'</b><small>Yuklashga tayyor</small></div><div class="stat"><b>'+r.errorCount+'</b><small>Xatolar</small></div></div>'+(errs?'<div style="max-height:220px;overflow:auto"><b>Xato qatorlar:</b><ol>'+errs+'</ol></div>':'<p class="done">Barcha qatorlar tekshiruvdan o‘tdi.</p>');
    confirmImportBtn.classList.toggle('hidden',r.validCount===0);
  }catch(e){importSummary.innerHTML='';importMsg.textContent=e.message==='excel_invalid'?'Excel fayl formati yoki ustunlarini tekshiring':e.message}
}
async function confirmStaffImport(){
  if(!staffImportPayload)return;
  try{
    confirmImportBtn.disabled=true;importMsg.textContent='Bazaga yuklanmoqda...';
    const r=await req('/api/import/staff',{method:'POST',body:JSON.stringify(staffImportPayload)});
    const errs=(r.errors||[]).slice(0,50).map(e=>'<li>'+esc(e.row+'-qator: '+e.message)+'</li>').join('');
    importMsg.textContent='';importSummary.innerHTML='<p class="done"><b>'+r.inserted+'</b> ta xodim bazaga yuklandi.</p>'+(r.errorCount?'<p><b>'+r.errorCount+'</b> ta qator yuklanmadi.</p><ol>'+errs+'</ol>':'');
    confirmImportBtn.classList.add('hidden');await refresh();
  }catch(e){importMsg.textContent=e.message}finally{confirmImportBtn.disabled=false}
}
</script>`;

app.get('/',(_,res)=>{
  const f=path.join(__dirname,'public','index.html');
  let h=fs.readFileSync(f,'utf8');
  h=h.replace("function showLogin(){login.classList.remove('hidden');app.classList.add('hidden')}","function showLogin(){document.getElementById('login').classList.remove('hidden');document.getElementById('app').classList.add('hidden')}");
  h=h.replace("async function boot(){me=await req('/api/me');login.classList.add('hidden');app.classList.remove('hidden');","async function boot(){me=await req('/api/me');document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');");
  h=h.replace('<button class="outline" onclick="downloadExcel()">⬇ Excel</button> <button class="primary" onclick="openStaff()"', '<button class="outline" onclick="downloadExcel()">⬇ Excel</button> <button id="importStaffBtn" class="outline" onclick="openStaffImport()">⬆ Excel yuklash</button> <button class="primary" onclick="openStaff()"');
  h=h.replace("submitPanel.classList.toggle('hidden',me.role!=='institution');await refresh()","submitPanel.classList.toggle('hidden',me.role!=='institution');document.getElementById('importStaffBtn')?.classList.toggle('hidden',me.role!=='institution');await refresh()");
  h=h.replace('</body>',importUiScript+'</body>');
  res.type('html').send(h);
});

async function init(){
  await pool.query(`CREATE TABLE IF NOT EXISTS institutions(id SERIAL PRIMARY KEY,district TEXT NOT NULL,name TEXT NOT NULL UNIQUE,type TEXT NOT NULL DEFAULT 'birlamchi',status TEXT NOT NULL DEFAULT 'pending',phone TEXT DEFAULT '',note TEXT DEFAULT '',created_at TIMESTAMPTZ DEFAULT NOW());CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,username TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','institution')),institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,created_at TIMESTAMPTZ DEFAULT NOW());CREATE TABLE IF NOT EXISTS staff(id SERIAL PRIMARY KEY,institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,district TEXT NOT NULL,institution TEXT NOT NULL,type TEXT NOT NULL,full_name TEXT NOT NULL,pinfl VARCHAR(14) UNIQUE NOT NULL,position TEXT NOT NULL,specialty TEXT DEFAULT '',employment TEXT DEFAULT 'asosiy',phone TEXT DEFAULT '',note TEXT DEFAULT '',created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());`);
  if(process.env.ADMIN_USERNAME&&process.env.ADMIN_PASSWORD){
    const h=await bcrypt.hash(process.env.ADMIN_PASSWORD,12);
    await pool.query(`INSERT INTO users(username,password_hash,role) VALUES($1,$2,'admin') ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash`,[process.env.ADMIN_USERNAME,h]);
  }
}
function auth(req,res,next){try{const token=req.cookies.dmed_token;if(!token)return res.status(401).json({error:'unauthorized'});req.user=jwt.verify(token,SECRET);next()}catch{return res.status(401).json({error:'unauthorized'})}}
function admin(req,res,next){if(req.user.role!=='admin')return res.status(403).json({error:'forbidden'});next()}
function institution(req,res,next){if(req.user.role!=='institution')return res.status(403).json({error:'forbidden'});next()}
function workbookRowsFromPayload(body){
  const raw=String(body?.data||'').replace(/^data:.*?;base64,/,'');
  if(!raw)throw new Error('excel_invalid');
  const buf=Buffer.from(raw,'base64');
  if(!buf.length||buf.length>10*1024*1024)throw new Error('excel_invalid');
  let wb;
  try{wb=XLSX.read(buf,{type:'buffer'})}catch{throw new Error('excel_invalid')}
  const name=wb.SheetNames[0];if(!name)throw new Error('excel_invalid');
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:'',raw:false});
  if(rows.length>5000)throw new Error('too_many_rows');
  return rows;
}
async function validateImportRows(rows){
  const parsed=normalizeStaffRows(rows);
  if(!parsed.valid.length)return parsed;
  const pinfls=parsed.valid.map(x=>x.pinfl);
  const existing=new Set((await pool.query('SELECT pinfl FROM staff WHERE pinfl = ANY($1::text[])',[pinfls])).rows.map(x=>x.pinfl));
  const valid=[],errors=[...parsed.errors];
  for(const row of parsed.valid){
    if(existing.has(row.pinfl))errors.push({row:row.row,rowNumber:row.rowNumber,fullName:row.fullName,pinfl:row.pinfl,message:'PINFL bazada avval mavjud'});
    else valid.push(row);
  }
  return {valid,errors};
}
function exportRows(rows){return rows.map((x,i)=>({
  '№':i+1,'Туман':x.district,'Муассаса номи':x.institution,'Типи':x.type,'Ходимнинг Ф.И.О.':x.full_name,
  'ПИНФЛ':x.pinfl,'Лавозими':x.position,'Мутахассислиги':x.specialty,'Ставкаси (ўриндош, асосий)':x.employment,
  'Телефон рақами':x.phone,'Изоҳ':x.note
}))}

app.get('/api/health',async(_,res)=>{try{await pool.query('SELECT 1');res.json({ok:true})}catch{res.status(503).json({ok:false})}});
app.post('/api/login',async(req,res)=>{const {username,password}=req.body||{};const q=await pool.query('SELECT * FROM users WHERE username=$1',[String(username||'')]);const u=q.rows[0];if(!u||!await bcrypt.compare(String(password||''),u.password_hash))return res.status(401).json({error:'invalid_credentials'});const token=jwt.sign({id:u.id,role:u.role,institutionId:u.institution_id,username:u.username},SECRET,{expiresIn:'12h'});res.cookie('dmed_token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:43200000}).json({role:u.role,username:u.username})});
app.post('/api/logout',(_,res)=>res.clearCookie('dmed_token').json({ok:true}));
app.get('/api/me',auth,(req,res)=>res.json(req.user));
app.get('/api/dashboard',auth,async(req,res)=>{const scope=req.user.role==='admin'?[]:[req.user.institutionId];const sw=scope.length?' WHERE institution_id=$1':'';const [s,i]=await Promise.all([pool.query('SELECT COUNT(*)::int count FROM staff'+sw,scope),req.user.role==='admin'?pool.query(`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='done')::int done FROM institutions`):pool.query(`SELECT 1::int total,CASE WHEN status='done' THEN 1 ELSE 0 END::int done FROM institutions WHERE id=$1`,scope)]);res.json({staff:s.rows[0].count,institutions:i.rows[0]?.total||0,done:i.rows[0]?.done||0})});
app.get('/api/institutions',auth,async(req,res)=>{if(req.user.role==='admin')return res.json((await pool.query('SELECT * FROM institutions ORDER BY district,name')).rows);res.json((await pool.query('SELECT * FROM institutions WHERE id=$1',[req.user.institutionId])).rows)});
app.post('/api/institutions',auth,admin,async(req,res)=>{const b=req.body||{};if(!b.district||!b.name)return res.status(400).json({error:'required'});try{const r=await pool.query('INSERT INTO institutions(district,name,type,status,phone,note) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[b.district,b.name,b.type||'birlamchi',b.status||'pending',b.phone||'',b.note||'']);res.status(201).json(r.rows[0])}catch{res.status(409).json({error:'duplicate'})}});
app.put('/api/institutions/:id',auth,admin,async(req,res)=>{const b=req.body||{};const r=await pool.query('UPDATE institutions SET district=$1,name=$2,type=$3,status=$4,phone=$5,note=$6 WHERE id=$7 RETURNING *',[b.district,b.name,b.type,b.status,b.phone||'',b.note||'',req.params.id]);if(!r.rowCount)return res.status(404).json({error:'not_found'});res.json(r.rows[0])});
app.delete('/api/institutions/:id',auth,admin,async(req,res)=>{await pool.query('DELETE FROM institutions WHERE id=$1',[req.params.id]);res.json({ok:true})});
app.post('/api/institutions/:id/account',auth,admin,async(req,res)=>{const {username,password}=req.body||{};if(!username||String(password||'').length<8)return res.status(400).json({error:'weak_credentials'});const h=await bcrypt.hash(password,12);try{await pool.query(`INSERT INTO users(username,password_hash,role,institution_id) VALUES($1,$2,'institution',$3) ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,institution_id=EXCLUDED.institution_id`,[username,h,req.params.id]);res.json({ok:true})}catch{res.status(400).json({error:'account_failed'})}});
app.get('/api/staff',auth,async(req,res)=>{const r=req.user.role==='admin'?await pool.query('SELECT * FROM staff ORDER BY created_at DESC'):await pool.query('SELECT * FROM staff WHERE institution_id=$1 ORDER BY created_at DESC',[req.user.institutionId]);res.json(r.rows)});
app.post('/api/staff',auth,async(req,res)=>{const b=req.body||{};const iid=req.user.role==='admin'?Number(b.institutionId):req.user.institutionId;if(!iid||!b.fullName||!b.position||!/^\d{14}$/.test(String(b.pinfl||'')))return res.status(400).json({error:'invalid'});const iq=await pool.query('SELECT * FROM institutions WHERE id=$1',[iid]);const ins=iq.rows[0];if(!ins)return res.status(404).json({error:'institution_not_found'});try{const r=await pool.query('INSERT INTO staff(institution_id,district,institution,type,full_name,pinfl,position,specialty,employment,phone,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',[iid,ins.district,ins.name,ins.type,b.fullName,b.pinfl,b.position,b.specialty||'',b.employment||'asosiy',b.phone||'',b.note||'']);res.status(201).json(r.rows[0])}catch{res.status(409).json({error:'duplicate_pinfl'})}});
app.put('/api/staff/:id',auth,async(req,res)=>{const b=req.body||{};const where=req.user.role==='admin'?'id=$9':'id=$9 AND institution_id=$10',args=[b.fullName,b.pinfl,b.position,b.specialty||'',b.employment||'asosiy',b.phone||'',b.note||'',new Date(),req.params.id];if(req.user.role!=='admin')args.push(req.user.institutionId);if(!b.fullName||!b.position||!/^\d{14}$/.test(String(b.pinfl||'')))return res.status(400).json({error:'invalid'});try{const r=await pool.query(`UPDATE staff SET full_name=$1,pinfl=$2,position=$3,specialty=$4,employment=$5,phone=$6,note=$7,updated_at=$8 WHERE ${where} RETURNING *`,args);if(!r.rowCount)return res.status(404).json({error:'not_found'});res.json(r.rows[0])}catch{res.status(409).json({error:'duplicate_pinfl'})}});
app.delete('/api/staff/:id',auth,async(req,res)=>{const r=req.user.role==='admin'?await pool.query('DELETE FROM staff WHERE id=$1',[req.params.id]):await pool.query('DELETE FROM staff WHERE id=$1 AND institution_id=$2',[req.params.id,req.user.institutionId]);if(!r.rowCount)return res.status(404).json({error:'not_found'});res.json({ok:true})});
app.post('/api/submit',auth,institution,async(req,res)=>{await pool.query(`UPDATE institutions SET status='done' WHERE id=$1`,[req.user.institutionId]);res.json({ok:true})});

app.get('/api/import/template.xlsx',auth,institution,(req,res)=>{
  const ws=XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  ws['!cols']=[{wch:6},{wch:20},{wch:34},{wch:16},{wch:30},{wch:18},{wch:24},{wch:24},{wch:28},{wch:20},{wch:30}];
  const help=XLSX.utils.aoa_to_sheet([
    ['Yo‘riqnoma'],
    ['PINFL','14 ta raqam bo‘lishi shart.'],
    ['F.I.O.','Majburiy maydon.'],
    ['Lavozimi','Majburiy maydon.'],
    ['Tuman / Muassasa / Tip','Kabinetga biriktirilgan ma’lumot avtomatik qo‘llanadi.'],
    ['Maksimal qator','5000 ta xodim.']
  ]);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Xodimlar');XLSX.utils.book_append_sheet(wb,help,'Yo‘riqnoma');
  const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Disposition','attachment; filename="tibbiyot_xodimlari_shablon.xlsx"');
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(out);
});
app.post('/api/import/preview',auth,institution,async(req,res)=>{
  try{
    const rows=workbookRowsFromPayload(req.body);const checked=await validateImportRows(rows);
    res.json({total:checked.valid.length+checked.errors.length,validCount:checked.valid.length,errorCount:checked.errors.length,preview:checked.valid.slice(0,20),errors:checked.errors.slice(0,200)});
  }catch(e){res.status(400).json({error:e.message==='too_many_rows'?'too_many_rows':'excel_invalid'})}
});
app.post('/api/import/staff',auth,institution,async(req,res)=>{
  let rows;try{rows=workbookRowsFromPayload(req.body)}catch(e){return res.status(400).json({error:e.message==='too_many_rows'?'too_many_rows':'excel_invalid'})}
  const checked=await validateImportRows(rows);
  const iq=await pool.query('SELECT * FROM institutions WHERE id=$1',[req.user.institutionId]);const ins=iq.rows[0];if(!ins)return res.status(404).json({error:'institution_not_found'});
  const client=await pool.connect();let inserted=0;const errors=[...checked.errors];
  try{
    await client.query('BEGIN');
    for(const x of checked.valid){
      const r=await client.query(`INSERT INTO staff(institution_id,district,institution,type,full_name,pinfl,position,specialty,employment,phone,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(pinfl) DO NOTHING RETURNING id`,[ins.id,ins.district,ins.name,ins.type,x.fullName,x.pinfl,x.position,x.specialty,x.employment,x.phone,x.note]);
      if(r.rowCount)inserted++;else errors.push({row:x.row,rowNumber:x.rowNumber,fullName:x.fullName,pinfl:x.pinfl,message:'PINFL bazada avval mavjud'});
    }
    await client.query('COMMIT');res.json({inserted,errorCount:errors.length,errors:errors.slice(0,200)});
  }catch{await client.query('ROLLBACK');res.status(500).json({error:'import_failed'})}finally{client.release()}
});
app.get('/api/export/staff.xlsx',auth,async(req,res)=>{
  const rows=req.user.role==='admin'?(await pool.query('SELECT district,institution,type,full_name,pinfl,position,specialty,employment,phone,note FROM staff ORDER BY district,institution,full_name')).rows:(await pool.query('SELECT district,institution,type,full_name,pinfl,position,specialty,employment,phone,note FROM staff WHERE institution_id=$1 ORDER BY full_name',[req.user.institutionId])).rows;
  const ws=XLSX.utils.json_to_sheet(exportRows(rows),{header:TEMPLATE_HEADERS});ws['!cols']=[{wch:6},{wch:20},{wch:34},{wch:16},{wch:30},{wch:18},{wch:24},{wch:24},{wch:28},{wch:20},{wch:30}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Xodimlar');const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Disposition','attachment; filename="tibbiyot_xodimlari.xlsx"');res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(out);
});

app.get('*',(_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
init().then(()=>app.listen(PORT,'0.0.0.0',()=>console.log('DMED production',PORT))).catch(e=>{console.error(e);process.exit(1)});

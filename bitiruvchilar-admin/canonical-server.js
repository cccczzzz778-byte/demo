'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {spawn}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const {canonicalHudud}=require('./lib/graduate-utils');
const {migrateGraduateDb}=require('./lib/graduate-db');
const {getGraduate,listGraduates,patchGraduate,deleteGraduate}=require('./lib/graduate-service');
const {previewMerge,mergeMainGraduates,mergeMedicalExams,mergeMedicalEducation,mergeHigherEducationExtra}=require('./lib/import-graduates');
const {buildDashboardSummary}=require('./lib/dashboard-summary');
const {normalizeEducationLevel,normalizeEmploymentStatus,deriveHealthStatus}=require('./lib/graduate-model');
const PORT=Number(process.env.PORT)||3000,UPSTREAM_PORT=3101;
const DB_PATH=process.env.DB_PATH||path.join(__dirname,'data.sqlite');
const clean=(v,n=500)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const bit=v=>v===true||v===1||String(v).trim()==='1'?1:0;
const DISTRICTS=[
 {key:'Buxoro shahri',name:'Buxoro shahri',turi:'shahar',db:'Бухоро шаҳар'},{key:'Kogon shahri',name:'Kogon shahri',turi:'shahar',db:'Когон шаҳар'},
 {key:'Olot',name:'Olot tumani',turi:'tuman',db:'Олот тумани'},{key:'Buxoro tumani',name:'Buxoro tumani',turi:'tuman',db:'Бухоро тумани'},
 {key:'Vobkent',name:'Vobkent tumani',turi:'tuman',db:'Вобкент тумани'},{key:"G'ijduvon",name:'Gʻijduvon tumani',turi:'tuman',db:'Ғиждувон тумани'},
 {key:'Jondor',name:'Jondor tumani',turi:'tuman',db:'Жондор тумани'},{key:'Kogon tumani',name:'Kogon tumani',turi:'tuman',db:'Когон тумани'},
 {key:"Qorako'l",name:'Qorakoʻl tumani',turi:'tuman',db:'Қоракўл тумани'},{key:'Qorovulbozor',name:'Qorovulbozor tumani',turi:'tuman',db:'Қоровулбозор тумани'},
 {key:'Peshku',name:'Peshku tumani',turi:'tuman',db:'Пешку тумани'},{key:'Romitan',name:'Romitan tumani',turi:'tuman',db:'Ромитан тумани'},
 {key:'Shofirkon',name:'Shofirkon tumani',turi:'tuman',db:'Шофиркон тумани'}
];
const db=new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;CREATE TABLE IF NOT EXISTS excel_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',imported_at TEXT NOT NULL DEFAULT (datetime('now')));`);
const legacyCols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));
for(const [name,type] of [['tugilgan_sana','TEXT'],['yil','TEXT'],['yosh','TEXT'],['jins','TEXT'],['bitirgan_turi','TEXT'],['telefon','TEXT'],['band_qilish_rejasi','TEXT'],['izoh','TEXT'],['medical_institution','TEXT'],['medical_exam_date','TEXT'],['diagnosis','TEXT'],['recommendation','TEXT'],['ambulatory','INTEGER'],['inpatient','INTEGER'],['operative','INTEGER'],['wellness_district','INTEGER'],['wellness_region','INTEGER'],['wellness_republic','INTEGER']])if(!legacyCols.has(name))db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${name} ${type} NOT NULL DEFAULT ${type==='INTEGER'?'0':"''"}`);
migrateGraduateDb(db);
const backfillRows=db.prepare("SELECT id,bitirgan_turi,holat,health_status,diagnosis,education_level,employment_status FROM excel_graduates WHERE education_level='' OR employment_status='' OR health_status=''").all();
const backfillStmt=db.prepare('UPDATE excel_graduates SET education_level=?,employment_status=?,health_status=? WHERE id=?');
for(const r of backfillRows){backfillStmt.run(r.education_level||normalizeEducationLevel(r.bitirgan_turi),r.employment_status||normalizeEmploymentStatus(r.holat),r.health_status||deriveHealthStatus(r),r.id)}
const partsDir=path.join(__dirname,'dashboard_gz');
const encoded=[0,1,2].map(i=>fs.readFileSync(path.join(partsDir,`part${i}.b64`),'utf8').trim()).join('');
let dashboardTemplate=zlib.gunzipSync(Buffer.from(encoded,'base64')).toString('utf8');
const bodyClose=dashboardTemplate.toLowerCase().lastIndexOf('</body>');
if(bodyClose<0)throw new Error('3D dashboard body topilmadi');
dashboardTemplate=dashboardTemplate.slice(0,bodyClose)+'<script src="/dashboard-metrics.js"></script><script src="/dashboard-summary.js"></script>'+dashboardTemplate.slice(bodyClose);
const panelBuf=fs.readFileSync(path.join(__dirname,'public','excel-panel.html'));
const staticFiles=new Map([['/dashboard-metrics.js','dashboard-metrics.js'],['/dashboard-summary.js','dashboard-summary.js'],['/excel-panel.js','excel-panel.js']]);
let stopping=false;const child=spawn(process.execPath,['--no-warnings','server.js'],{cwd:__dirname,env:{...process.env,PORT:String(UPSTREAM_PORT)},stdio:'inherit'});
function json(res,status,obj){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':b.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(b)}
function html(res,buf){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':buf.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN'});res.end(buf)}
function readBody(req,max=50*1024*1024){return new Promise((resolve,reject)=>{let n=0,ch=[];req.on('data',d=>{n+=d.length;if(n>max){reject(new Error('too_large'));req.destroy();return}ch.push(d)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(ch).toString('utf8')))}catch{reject(new Error('bad_json'))}});req.on('error',reject)})}
function checkAuth(req){return new Promise(resolve=>{const r=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:'/api/me',headers:{cookie:req.headers.cookie||''}},x=>{let b='';x.on('data',d=>b+=d);x.on('end',()=>{try{resolve(x.statusCode===200?JSON.parse(b).user:null)}catch{resolve(null)}})});r.on('error',()=>resolve(null));r.end()})}
async function adminOnly(req,res){const me=await checkAuth(req);if(!me){json(res,401,{error:'Login talab qilinadi.'});return null}if(me.role!=='admin'){json(res,403,{error:'Faqat administrator uchun.'});return null}return me}
function actor(me){return clean(me?.login||me?.username||me?.name||me?.role||'admin',100)}
function dashboardBuffer(){const regions=DISTRICTS.map(d=>{const s=buildDashboardSummary(db,d.db);return {key:d.key,name:d.name,turi:d.turi,jami:s.total,oliy:s.higher,texnikum:s.nonHigher,ishda:s.working,ishsiz:s.unemployed,oz_hududida:0,bosh_shtat:0}});const dm=dashboardTemplate.match(/<script type="application\/json" id="dash-data">([\s\S]*?)<\/script>/);if(!dm)return Buffer.from(dashboardTemplate);try{const old=JSON.parse(dm[1]);old.data=regions;old.meta={rasmiy:true,manba:'Bitiruvchilar yagona bazasi',yangilangan:new Intl.DateTimeFormat('uz-UZ',{timeZone:'Asia/Tashkent'}).format(new Date())};return Buffer.from(dashboardTemplate.replace(dm[0],`<script type="application/json" id="dash-data">${JSON.stringify(old).replace(/</g,'\\u003c')}</script>`))}catch{return Buffer.from(dashboardTemplate)}}
function importControl(source,rows){const warnings=[];if(source==='main'){const otm=rows.filter(r=>normalizeEducationLevel(r.education_level||r.bitirgan_turi)==='OTM').length;if(rows.length!==9823)warnings.push(`Jami ${rows.length}; nazorat soni 9823.`);if(otm!==3184)warnings.push(`OTM ${otm}; nazorat soni 3184.`)}if(source==='medical-education'){const otm=rows.filter(r=>normalizeEducationLevel(r.medical_education_level||r.education_level)==='OTM').length,tech=rows.filter(r=>normalizeEducationLevel(r.medical_education_level||r.education_level)==='Texnikum').length;if(rows.length!==283)warnings.push(`Tibbiyot jami ${rows.length}; nazorat soni 283.`);if(otm!==210)warnings.push(`Tibbiyot OTM ${otm}; nazorat soni 210.`);if(tech!==73)warnings.push(`Tibbiyot texnikum ${tech}; nazorat soni 73.`)}return warnings}
function doMerge(source,rows){if(source==='main')return mergeMainGraduates(db,rows);if(source==='medical-exams')return mergeMedicalExams(db,rows);if(source==='medical-education')return mergeMedicalEducation(db,rows);if(source==='higher-extra')return mergeHigherEducationExtra(db,rows);throw new Error('Import turi noto‘g‘ri.')}
function proxy(req,res,pathOverride){const pr=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:pathOverride||req.url,method:req.method,headers:{...req.headers}},up=>{res.writeHead(up.statusCode||502,up.headers);up.pipe(res)});pr.on('error',()=>json(res,502,{error:'Backend vaqtincha tayyor emas.'}));req.pipe(pr)}
const server=http.createServer(async(req,res)=>{let u;try{u=new URL(req.url,'http://localhost')}catch{return json(res,400,{error:'Noto‘g‘ri URL'})}const p=u.pathname;
 if(req.method==='GET'&&(p==='/'||p==='/dashboard'||p==='/dashboard.html'))return html(res,dashboardBuffer());
 if(req.method==='GET'&&p==='/panel')return html(res,panelBuf);
 if(req.method==='GET'&&staticFiles.has(p)){const f=path.join(__dirname,'public',staticFiles.get(p));if(!fs.existsSync(f))return json(res,404,{error:'Topilmadi'});const b=fs.readFileSync(f);res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Content-Length':b.length,'Cache-Control':'no-store'});return res.end(b)}
 if(req.method==='GET'&&p==='/health')return json(res,200,{ok:true});
 if(req.method==='GET'&&p==='/api/public/dashboard-summary')return json(res,200,buildDashboardSummary(db,clean(u.searchParams.get('hudud'),120)));
 if(req.method==='GET'&&p==='/api/public/excel-summary'){const s=buildDashboardSummary(db);return json(res,200,{total:s.total,metrics:s,hududlar:DISTRICTS.map(d=>({key:d.key,name:d.name,...buildDashboardSummary(db,d.db)})),imported:s.total>0})}
 if(req.method==='GET'&&p==='/api/graduates'){const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});const filters=Object.fromEntries(u.searchParams.entries());if(me.role==='operator'&&me.hudud)filters.hudud=me.hudud;return json(res,200,listGraduates(db,filters))}
 const gm=p.match(/^\/api\/graduates\/(\d+)$/);
 if(req.method==='GET'&&gm){const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});const row=getGraduate(db,Number(gm[1]));if(!row)return json(res,404,{error:'Bitiruvchi topilmadi.'});return json(res,200,{record:row})}
 if(req.method==='PATCH'&&gm){const me=await adminOnly(req,res);if(!me)return;let b;try{b=await readBody(req,2*1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri ma’lumot.'})}try{if(!patchGraduate(db,Number(gm[1]),b,actor(me)))return json(res,404,{error:'Bitiruvchi topilmadi.'});return json(res,200,{ok:true,record:getGraduate(db,Number(gm[1]))})}catch(e){return json(res,400,{error:e.message})}}
 if(req.method==='DELETE'&&gm){const me=await adminOnly(req,res);if(!me)return;let b={};try{b=await readBody(req,1024*1024)}catch{}if(clean(b.confirm,20)!=='OCHIR')return json(res,400,{error:'O‘chirish uchun OCHIR tasdig‘i kerak.'});return json(res,deleteGraduate(db,Number(gm[1]),actor(me))?200:404,{ok:true})}
 if(req.method==='POST'&&p==='/api/graduates'){const me=await adminOnly(req,res);if(!me)return;let b;try{b=await readBody(req,2*1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri ma’lumot.'})}if(clean(b.fio,180).length<3)return json(res,400,{error:'F.I.O. talab qilinadi.'});const r=db.prepare(`INSERT INTO excel_graduates(fio,hudud,mahalla,pinfl,telefon,jins,tugilgan_sana,yosh,address,education_level,medical_education,medical_education_level,education_institution,specialty,employment_status,workplace,position,health_status,diagnosis,diagnosis_category,op_oshp) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(clean(b.fio,180),canonicalHudud(clean(b.hudud,120)),clean(b.mahalla,180),String(b.pinfl||'').replace(/\D/g,''),clean(b.telefon,60),clean(b.jins,30),clean(b.tugilgan_sana,30),clean(b.yosh,10),clean(b.address,300),clean(b.education_level,30),bit(b.medical_education),clean(b.medical_education_level,30),clean(b.education_institution,250),clean(b.specialty,180),clean(b.employment_status,80),clean(b.workplace,250),clean(b.position,180),clean(b.health_status,40),clean(b.diagnosis,300),clean(b.diagnosis_category,180),clean(b.op_oshp,220));return json(res,200,{ok:true,id:Number(r.lastInsertRowid)})}
 if(req.method==='POST'&&p==='/api/import/preview'){if(!await adminOnly(req,res))return;let b;try{b=await readBody(req)}catch{return json(res,400,{error:'Import ma’lumoti noto‘g‘ri.'})}const source=clean(b.source,40),rows=Array.isArray(b.rows)?b.rows:[];const preview=previewMerge(db,rows,{allowNew:source==='main'});return json(res,200,{source,rows:rows.length,preview,warnings:importControl(source,rows)})}
 if(req.method==='POST'&&p==='/api/import/commit'){if(!await adminOnly(req,res))return;let b;try{b=await readBody(req)}catch{return json(res,400,{error:'Import ma’lumoti noto‘g‘ri.'})}const source=clean(b.source,40),rows=Array.isArray(b.rows)?b.rows:[];try{return json(res,200,{source,result:doMerge(source,rows),warnings:importControl(source,rows)})}catch(e){console.error(e);return json(res,500,{error:'Import saqlanmadi.'})}}
 if(req.method==='GET'&&p==='/api/audit'){if(!await adminOnly(req,res))return;const rows=db.prepare('SELECT id,graduate_id,actor,action,created_at FROM graduate_audit ORDER BY id DESC LIMIT 200').all();return json(res,200,{records:rows})}
 if(req.method==='POST'&&p==='/api/admin/clear'){if(!await adminOnly(req,res))return;let b;try{b=await readBody(req,1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri so‘rov.'})}if(clean(b.confirm,20)!=='TOZALA')return json(res,400,{error:'TOZALA tasdig‘i kerak.'});const target=clean(b.target,40);if(target==='medical')db.exec("UPDATE excel_graduates SET medical_education=0,medical_education_level='',education_institution='',specialty=''");else if(target==='health')db.exec("UPDATE excel_graduates SET health_status='',diagnosis='',diagnosis_category='',medical_institution='',medical_exam_date='',recommendation='',ambulatory=0,inpatient=0,operative=0,wellness_district=0,wellness_region=0,wellness_republic=0");else if(target==='all')db.exec('DELETE FROM excel_graduates');else return json(res,400,{error:'Tozalash turi noto‘g‘ri.'});return json(res,200,{ok:true,target})}
 return proxy(req,res,p==='/admin-settings'?'/panel':undefined);
});
server.listen(PORT,()=>console.log(`Bitiruvchilar canonical gateway: http://localhost:${PORT}`));
child.on('exit',(c,s)=>{if(!stopping){console.error(`Auth backend to‘xtadi code=${c} signal=${s||''}`);process.exit(c||1)}});
function shutdown(sig){if(stopping)return;stopping=true;server.close(()=>{try{db.close()}catch{}if(!child.killed)child.kill(sig)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));

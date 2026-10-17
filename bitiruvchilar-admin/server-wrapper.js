'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {spawn}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const {canonicalHudud}=require('./normalize-hudud');
const {statusFlags,isHigherEducation}=require('./lib/graduate-utils');

const PORT=Number(process.env.PORT)||3000;
const UPSTREAM_PORT=3101;
const PROD=process.env.NODE_ENV==='production';
const DB_PATH=process.env.DB_PATH||path.join(__dirname,'data.sqlite');

const EXCEL_SUMMARY=[
 {key:'Buxoro shahri',name:'Buxoro shahri',turi:'shahar',jami:1455,oliy:539,texnikum:916,ishda:840,ishsiz:612,mapped:0,db:'Бухоро шаҳар'},
 {key:'Kogon shahri',name:'Kogon shahri',turi:'shahar',jami:278,oliy:86,texnikum:192,ishda:159,ishsiz:119,mapped:0,db:'Когон шаҳар'},
 {key:'Olot',name:'Olot tumani',turi:'tuman',jami:467,oliy:132,texnikum:335,ishda:267,ishsiz:199,mapped:0,db:'Олот тумани'},
 {key:'Buxoro tumani',name:'Buxoro tumani',turi:'tuman',jami:957,oliy:301,texnikum:656,ishda:337,ishsiz:618,mapped:0,db:'Бухоро тумани'},
 {key:'Vobkent',name:'Vobkent tumani',turi:'tuman',jami:657,oliy:201,texnikum:456,ishda:366,ishsiz:291,mapped:0,db:'Вобкент тумани'},
 {key:"G'ijduvon",name:'Gʻijduvon tumani',turi:'tuman',jami:1626,oliy:500,texnikum:1126,ishda:899,ishsiz:722,mapped:0,db:'Ғиждувон тумани'},
 {key:'Jondor',name:'Jondor tumani',turi:'tuman',jami:911,oliy:307,texnikum:604,ishda:615,ishsiz:295,mapped:0,db:'Жондор тумани'},
 {key:'Kogon tumani',name:'Kogon tumani',turi:'tuman',jami:516,oliy:151,texnikum:365,ishda:303,ishsiz:213,mapped:0,db:'Когон тумани'},
 {key:"Qorako'l",name:'Qorakoʻl tumani',turi:'tuman',jami:874,oliy:260,texnikum:614,ishda:538,ishsiz:336,mapped:0,db:'Қоракўл тумани'},
 {key:'Qorovulbozor',name:'Qorovulbozor tumani',turi:'tuman',jami:131,oliy:38,texnikum:93,ishda:67,ishsiz:63,mapped:0,db:'Қоровулбозор тумани'},
 {key:'Peshku',name:'Peshku tumani',turi:'tuman',jami:486,oliy:178,texnikum:308,ishda:317,ishsiz:168,mapped:0,db:'Пешку тумани'},
 {key:'Romitan',name:'Romitan tumani',turi:'tuman',jami:651,oliy:209,texnikum:442,ishda:495,ishsiz:155,mapped:0,db:'Ромитан тумани'},
 {key:'Shofirkon',name:'Shofirkon tumani',turi:'tuman',jami:814,oliy:282,texnikum:532,ishda:471,ishsiz:340,mapped:0,db:'Шофиркон тумани'}
];
const HUDUD_KEY_TO_NAME={'buxoro-shahri':'Бухоро шаҳар','kogon-shahri':'Когон шаҳар','olot':'Олот тумани','buxoro-tumani':'Бухоро тумани','vobkent':'Вобкент тумани','gijduvon':'Ғиждувон тумани','jondor':'Жондор тумани','kogon-tumani':'Когон тумани','qorakol':'Қоракўл тумани','qorovulbozor':'Қоровулбозор тумани','peshku':'Пешку тумани','romitan':'Ромитан тумани','shofirkon':'Шофиркон тумани'};

const partsDir=path.join(__dirname,'dashboard_gz');
const encoded=[0,1,2].map(i=>fs.readFileSync(path.join(partsDir,`part${i}.b64`),'utf8').trim()).join('');
let dashboardTemplate=zlib.gunzipSync(Buffer.from(encoded,'base64')).toString('utf8');
if(dashboardTemplate.length<80000)throw new Error('3D dashboard fayli tekshiruvdan o‘tmadi.');
const bodyCloseIndex=dashboardTemplate.toLowerCase().lastIndexOf('</body>');
if(bodyCloseIndex<0)throw new Error('Dashboard yakuniy body tegi topilmadi.');
dashboardTemplate=dashboardTemplate.slice(0,bodyCloseIndex)+'<script src="/excel-dashboard.js"></script><script src="/dashboard-metrics.js"></script>'+dashboardTemplate.slice(bodyCloseIndex);
const panelBuf=fs.readFileSync(path.join(__dirname,'public','excel-panel.html'));

const db=new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS excel_graduates(
 id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_excel_hudud ON excel_graduates(hudud);
CREATE INDEX IF NOT EXISTS idx_excel_op ON excel_graduates(op_oshp);
CREATE INDEX IF NOT EXISTS idx_excel_fio ON excel_graduates(fio);
CREATE INDEX IF NOT EXISTS idx_excel_holat ON excel_graduates(holat);
CREATE TABLE IF NOT EXISTS medical_graduates(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',
 education_level TEXT NOT NULL DEFAULT '',institution TEXT NOT NULL DEFAULT '',specialty TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT '',workplace TEXT NOT NULL DEFAULT '',position TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_medgrad_fio ON medical_graduates(fio);
CREATE INDEX IF NOT EXISTS idx_medgrad_hudud ON medical_graduates(hudud);`);

const cols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));
for(const [name,type] of [
 ['tugilgan_sana','TEXT'],['yil','TEXT'],['yosh','TEXT'],['jins','TEXT'],['bitirgan_turi','TEXT'],['telefon','TEXT'],['band_qilish_rejasi','TEXT'],['izoh','TEXT'],
 ['medical_institution','TEXT'],['medical_exam_date','TEXT'],['diagnosis','TEXT'],['recommendation','TEXT'],
 ['ambulatory','INTEGER'],['inpatient','INTEGER'],['operative','INTEGER'],['wellness_district','INTEGER'],['wellness_region','INTEGER'],['wellness_republic','INTEGER']
]){if(!cols.has(name))db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${name} ${type} NOT NULL DEFAULT ${type==='INTEGER'?'0':"''"}`)}

const clean=(v,n=300)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const bit=v=>Number(v)===1||v===true||String(v).toLowerCase()==='true'?1:0;
function importRows(rows){
 const ins=db.prepare(`INSERT INTO excel_graduates(fio,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,band_qilish_rejasi,izoh) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
 db.exec('BEGIN IMMEDIATE');let ok=0,mapped=0;
 try{
  db.exec('DELETE FROM excel_graduates');
  for(const r of rows){
   const fio=clean(r.fio,180);if(fio.length<5)continue;const op=clean(r.op_oshp,220);
   ins.run(fio,canonicalHudud(clean(r.hudud,120)),clean(r.mahalla,180),clean(r.bitiruvchi_turi||r.toifa,140),clean(r.bandlik_holati||r.holat,180),op,clean(r.tugilgan_sana,30),clean(r.yil,10),clean(r.yosh,10),clean(r.jins,30),clean(r.bitirgan_turi,100),clean(r.telefon,60),clean(r.band_qilish_rejasi,180),clean(r.izoh,500));ok++;if(op)mapped++;
  }
  db.exec('COMMIT');return {ok,mapped};
 }catch(e){try{db.exec('ROLLBACK')}catch{}throw e}
}
function findOrCreateGraduate(body){
 const fio=clean(body.fio,180);if(fio.length<5)throw new Error('F.I.O. talab qilinadi.');const hud=canonicalHudud(clean(body.hudud,120));
 let r=db.prepare('SELECT id FROM excel_graduates WHERE lower(fio)=lower(?) AND hudud=? LIMIT 1').get(fio,hud);
 if(r)return Number(r.id);
 const x=db.prepare('INSERT INTO excel_graduates(fio,hudud,mahalla,bitirgan_turi,holat) VALUES(?,?,?,?,?)').run(fio,hud,clean(body.mahalla,180),clean(body.bitirgan_turi,100),clean(body.holat,180));
 return Number(x.lastInsertRowid);
}

let stopping=false;
const child=spawn(process.execPath,['--no-warnings','server.js'],{cwd:__dirname,env:{...process.env,PORT:String(UPSTREAM_PORT)},stdio:'inherit'});
function json(res,status,obj){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':String(b.length),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(b)}
function checkAuth(req){return new Promise(resolve=>{const p=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:'/api/me',method:'GET',headers:{cookie:req.headers.cookie||''}},r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{if(r.statusCode!==200)return resolve(null);try{resolve(JSON.parse(b).user||null)}catch{resolve(null)}})});p.on('error',()=>resolve(null));p.end()})}
function readBody(req,max=100*1024*1024){return new Promise((resolve,reject)=>{let n=0,ch=[];req.on('data',d=>{n+=d.length;if(n>max){reject(new Error('too_large'));req.destroy();return}ch.push(d)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(ch).toString('utf8')))}catch{reject(new Error('bad_json'))}});req.on('error',reject)})}

function aggregateGraduateRows(filterHudud=''){
 const rows=db.prepare('SELECT hudud,holat,bitirgan_turi,op_oshp,medical_exam_date FROM excel_graduates').all();
 const m={total:0,unemployed:0,examined:0,deceased:0,working:0,higher:0,nonHigher:0,mapped:0};
 for(const r of rows){const h=canonicalHudud(r.hudud);if(filterHudud&&h!==filterHudud)continue;m.total++;if(r.op_oshp)m.mapped++;if(clean(r.medical_exam_date,30))m.examined++;const f=statusFlags(r.holat);if(f.unemployed)m.unemployed++;if(f.deceased)m.deceased++;if(f.working)m.working++;if(isHigherEducation(r.bitirgan_turi))m.higher++;else m.nonHigher++;}
 return m;
}
function dynamicRegions(){
 const total=db.prepare('SELECT COUNT(*) n FROM excel_graduates').get().n||0;if(!total)return EXCEL_SUMMARY.map(x=>({...x,examined:0,deceased:0,working:x.ishda,higher:x.oliy,nonHigher:x.texnikum}));
 return EXCEL_SUMMARY.map(m=>{const a=aggregateGraduateRows(m.db);return {...m,jami:a.total,oliy:a.higher,texnikum:a.nonHigher,ishda:a.working,ishsiz:a.unemployed,mapped:a.mapped,examined:a.examined,deceased:a.deceased,working:a.working,higher:a.higher,nonHigher:a.nonHigher}});
}
function liveSummary(){
 const c=db.prepare("SELECT COUNT(*) n, SUM(op_oshp<>'') mapped, COUNT(DISTINCT CASE WHEN op_oshp<>'' THEN op_oshp END) facilities FROM excel_graduates").get();
 const imported=!!c.n,regions=dynamicRegions(),metrics=imported?aggregateGraduateRows():{total:regions.reduce((a,x)=>a+x.jami,0),unemployed:regions.reduce((a,x)=>a+x.ishsiz,0),examined:0,deceased:0,working:regions.reduce((a,x)=>a+x.ishda,0),higher:regions.reduce((a,x)=>a+x.oliy,0),nonHigher:regions.reduce((a,x)=>a+x.texnikum,0),mapped:0};
 return {total:imported?Number(c.n):metrics.total,mapped:imported?Number(c.mapped||0):0,facilities:imported?Number(c.facilities||0):0,hududlar:regions,metrics,imported};
}
function dashboardBuffer(){
 const summary=liveSummary(),dm=dashboardTemplate.match(/<script type="application\/json" id="dash-data">([\s\S]*?)<\/script>/);if(!dm)return Buffer.from(dashboardTemplate);
 try{const old=JSON.parse(dm[1]);old.data=summary.hududlar.map(x=>({key:x.key,name:x.name,turi:x.turi,jami:x.jami,oliy:x.oliy,texnikum:x.texnikum,ishda:x.ishda,oz_hududida:x.mapped,ishsiz:x.ishsiz,bosh_shtat:0,examined:x.examined,deceased:x.deceased,working:x.working,higher:x.higher,nonHigher:x.nonHigher}));old.meta={rasmiy:true,manba:summary.imported?'Admin panelga oxirgi import qilingan Excel':'Boshlang‘ich Excel statistikasi',yangilangan:new Intl.DateTimeFormat('uz-UZ',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())};return Buffer.from(dashboardTemplate.replace(dm[0],`<script type="application/json" id="dash-data">${JSON.stringify(old).replace(/</g,'\\u003c')}</script>`))}catch(e){console.error('Dashboard data inject xatosi',e);return Buffer.from(dashboardTemplate)}
}
function baseHeaders(csp){const h={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Content-Security-Policy':csp};if(PROD)h['Strict-Transport-Security']='max-age=31536000; includeSubDomains';return h}
function serveDashboard(res){const buf=dashboardBuffer(),csp=["default-src 'self'","base-uri 'none'","object-src 'none'","frame-ancestors 'self'","style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src https://fonts.gstatic.com","script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net","connect-src 'self'","img-src 'self' data:"].join('; ');res.writeHead(200,{...baseHeaders(csp),'Content-Type':'text/html; charset=utf-8','Content-Length':String(buf.length)});res.end(buf)}
function servePanel(res){const csp=["default-src 'self'","base-uri 'none'","object-src 'none'","frame-ancestors 'none'","style-src 'self' 'unsafe-inline'","script-src 'self' https://cdn.jsdelivr.net","connect-src 'self'","img-src 'self' data:"].join('; ');res.writeHead(200,{...baseHeaders(csp),'Content-Type':'text/html; charset=utf-8','Content-Length':String(panelBuf.length)});res.end(panelBuf)}
function scopedWhere(me){if(me.role==='operator'&&me.hudud){const n=HUDUD_KEY_TO_NAME[me.hudud];if(n)return {sql:'hudud=?',args:[n]}}return {sql:'',args:[]}}
async function adminOnly(req,res){const me=await checkAuth(req);if(!me){json(res,401,{error:'Login talab qilinadi.'});return null}if(me.role!=='admin'){json(res,403,{error:'Faqat administrator uchun.'});return null}return me}

const server=http.createServer(async(req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost')}catch{u=new URL('http://localhost/')};const p=u.pathname;
 if(req.method==='GET'&&(p==='/'||p==='/dashboard'||p==='/dashboard.html'))return serveDashboard(res);
 if(req.method==='GET'&&p==='/panel')return servePanel(res);
 if(req.method==='GET'&&p==='/api/public/excel-summary')return json(res,200,liveSummary());
 if(req.method==='GET'&&p==='/api/excel/options'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});const sc=scopedWhere(me),w=sc.sql?' WHERE '+sc.sql:'';
  const hududlar=db.prepare('SELECT DISTINCT hudud v FROM excel_graduates'+w+' ORDER BY v').all(...sc.args).map(x=>x.v),ops=db.prepare("SELECT DISTINCT op_oshp v FROM excel_graduates"+w+(w?' AND ':' WHERE ')+"op_oshp<>'' ORDER BY v").all(...sc.args).map(x=>x.v),holatlar=db.prepare("SELECT DISTINCT holat v FROM excel_graduates"+w+(w?' AND ':' WHERE ')+"holat<>'' ORDER BY v").all(...sc.args).map(x=>x.v);return json(res,200,{hududlar,ops,holatlar});
 }
 if(req.method==='GET'&&p==='/api/excel/graduates'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});let where=[],args=[];const sc=scopedWhere(me);if(sc.sql){where.push(sc.sql);args.push(...sc.args)}const q=clean(u.searchParams.get('q'),100),hud=clean(u.searchParams.get('hudud'),120),op=clean(u.searchParams.get('op'),220),holat=clean(u.searchParams.get('holat'),180);if(hud){where.push('hudud=?');args.push(hud)}if(op==='__unmapped')where.push("op_oshp=''");else if(op){where.push('op_oshp=?');args.push(op)}if(holat){where.push('holat=?');args.push(holat)}if(q){where.push('(fio LIKE ? OR mahalla LIKE ? OR op_oshp LIKE ? OR telefon LIKE ?)');args.push('%'+q+'%','%'+q+'%','%'+q+'%','%'+q+'%')}const w=where.length?' WHERE '+where.join(' AND '):'';const total=db.prepare('SELECT COUNT(*) n FROM excel_graduates'+w).get(...args).n,limit=Math.max(20,Math.min(500,Number(u.searchParams.get('limit'))||200)),offset=Math.max(0,Number(u.searchParams.get('offset'))||0);const rows=db.prepare('SELECT id,fio,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,band_qilish_rejasi,izoh,medical_institution,medical_exam_date,diagnosis,recommendation,ambulatory,inpatient,operative,wellness_district,wellness_region,wellness_republic FROM excel_graduates'+w+' ORDER BY hudud,fio LIMIT ? OFFSET ?').all(...args,limit,offset);return json(res,200,{total,limit,offset,records:rows});
 }
 if(req.method==='POST'&&p==='/api/excel/import'){
  if(!await adminOnly(req,res))return;let body;try{body=await readBody(req)}catch(e){return json(res,e.message==='too_large'?413:400,{error:'Import maʼlumoti noto‘g‘ri yoki juda katta.'})}const rows=Array.isArray(body?.rows)?body.rows:[];if(!rows.length)return json(res,400,{error:'Import qatorlari topilmadi.'});try{const result=importRows(rows);return json(res,200,{...result,unmapped:result.ok-result.mapped})}catch(e){console.error(e);return json(res,500,{error:'Import saqlanmadi.'})}
 }
 if(req.method==='POST'&&p==='/api/excel/graduates'){
  if(!await adminOnly(req,res))return;let b;try{b=await readBody(req,2*1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri maʼlumot.'})}const fio=clean(b.fio,180);if(fio.length<5)return json(res,400,{error:'F.I.O. talab qilinadi.'});const r=db.prepare('INSERT INTO excel_graduates(fio,hudud,mahalla,bitirgan_turi,yosh,holat,op_oshp,telefon) VALUES(?,?,?,?,?,?,?,?)').run(fio,canonicalHudud(clean(b.hudud,120)),clean(b.mahalla,180),clean(b.bitirgan_turi,100),clean(b.yosh,10),clean(b.holat,180),clean(b.op_oshp,220),clean(b.telefon,60));return json(res,200,{ok:true,id:Number(r.lastInsertRowid)});
 }
 const opMatch=p.match(/^\/api\/excel\/graduates\/(\d+)\/op$/);
 if(req.method==='PATCH'&&opMatch){if(!await adminOnly(req,res))return;let body;try{body=await readBody(req,1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri so‘rov.'})}const op=clean(body?.op_oshp,220),id=Number(opMatch[1]),r=db.prepare('UPDATE excel_graduates SET op_oshp=? WHERE id=?').run(op,id);if(!r.changes)return json(res,404,{error:'Bitiruvchi topilmadi.'});return json(res,200,{ok:true,id,op_oshp:op});}
 if(req.method==='POST'&&p==='/api/medical/exam'){
  if(!await adminOnly(req,res))return;let b;try{b=await readBody(req,2*1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri maʼlumot.'})}let id=Number(b.graduate_id)||0;try{if(!id)id=findOrCreateGraduate(b)}catch(e){return json(res,400,{error:e.message})}const r=db.prepare(`UPDATE excel_graduates SET medical_institution=?,medical_exam_date=?,diagnosis=?,recommendation=?,ambulatory=?,inpatient=?,operative=?,wellness_district=?,wellness_region=?,wellness_republic=? WHERE id=?`).run(clean(b.medical_institution,180),clean(b.medical_exam_date,30),clean(b.diagnosis,300),clean(b.recommendation,500),bit(b.ambulatory),bit(b.inpatient),bit(b.operative),bit(b.wellness_district),bit(b.wellness_region),bit(b.wellness_republic),id);if(!r.changes)return json(res,404,{error:'Bitiruvchi topilmadi.'});return json(res,200,{ok:true,id});
 }
 if(req.method==='POST'&&p==='/api/medical/exams/import'){
  if(!await adminOnly(req,res))return;let b;try{b=await readBody(req,50*1024*1024)}catch{return json(res,400,{error:'Import maʼlumoti noto‘g‘ri.'})}const rows=Array.isArray(b.rows)?b.rows:[];let ok=0;db.exec('BEGIN IMMEDIATE');try{for(const x of rows){let id=Number(x.graduate_id)||0;if(!id)id=findOrCreateGraduate(x);db.prepare(`UPDATE excel_graduates SET medical_institution=?,medical_exam_date=?,diagnosis=?,recommendation=?,ambulatory=?,inpatient=?,operative=?,wellness_district=?,wellness_region=?,wellness_republic=? WHERE id=?`).run(clean(x.medical_institution,180),clean(x.medical_exam_date,30),clean(x.diagnosis,300),clean(x.recommendation,500),bit(x.ambulatory),bit(x.inpatient),bit(x.operative),bit(x.wellness_district),bit(x.wellness_region),bit(x.wellness_republic),id);ok++}db.exec('COMMIT');return json(res,200,{ok})}catch(e){try{db.exec('ROLLBACK')}catch{};console.error(e);return json(res,500,{error:'Ko‘rik importi saqlanmadi.'})}
 }
 if(req.method==='GET'&&p==='/api/medical/exams'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});const q=clean(u.searchParams.get('q'),100),limit=Math.max(20,Math.min(500,Number(u.searchParams.get('limit'))||100));let w=" WHERE medical_exam_date<>''" ,args=[];if(q){w+=' AND (fio LIKE ? OR hudud LIKE ? OR medical_institution LIKE ? OR diagnosis LIKE ?)';args.push('%'+q+'%','%'+q+'%','%'+q+'%','%'+q+'%')}const rows=db.prepare('SELECT id,fio,hudud,mahalla,medical_institution,medical_exam_date,diagnosis,recommendation,ambulatory,inpatient,operative,wellness_district,wellness_region,wellness_republic FROM excel_graduates'+w+' ORDER BY medical_exam_date DESC,fio LIMIT ?').all(...args,limit);return json(res,200,{records:rows});
 }
 if(req.method==='POST'&&p==='/api/medical-graduates'){
  if(!await adminOnly(req,res))return;let b;try{b=await readBody(req,2*1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri maʼlumot.'})}const fio=clean(b.fio,180);if(fio.length<5)return json(res,400,{error:'F.I.O. talab qilinadi.'});const r=db.prepare(`INSERT INTO medical_graduates(fio,hudud,mahalla,address,education_level,institution,specialty,status,workplace,position,phone,note) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(fio,canonicalHudud(clean(b.hudud,120)),clean(b.mahalla,180),clean(b.address,300),clean(b.education_level,80),clean(b.institution,250),clean(b.specialty,180),clean(b.status,180),clean(b.workplace,250),clean(b.position,180),clean(b.phone,60),clean(b.note,500));return json(res,200,{ok:true,id:Number(r.lastInsertRowid)});
 }
 if(req.method==='GET'&&p==='/api/medical-graduates'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});const q=clean(u.searchParams.get('q'),100),limit=Math.max(20,Math.min(500,Number(u.searchParams.get('limit'))||100));let w='',args=[];if(q){w=' WHERE fio LIKE ? OR hudud LIKE ? OR institution LIKE ? OR specialty LIKE ?';args=['%'+q+'%','%'+q+'%','%'+q+'%','%'+q+'%']}const rows=db.prepare('SELECT * FROM medical_graduates'+w+' ORDER BY id DESC LIMIT ?').all(...args,limit);return json(res,200,{records:rows});
 }
 if(req.method==='POST'&&p==='/api/admin/clear'){
  if(!await adminOnly(req,res))return;let b;try{b=await readBody(req,1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri so‘rov.'})}if(clean(b.confirm,20)!=='TOZALA')return json(res,400,{error:'Tasdiqlash uchun TOZALA yozing.'});const t=clean(b.target,40);if(t==='medical_checks')db.exec("UPDATE excel_graduates SET medical_institution='',medical_exam_date='',diagnosis='',recommendation='',ambulatory=0,inpatient=0,operative=0,wellness_district=0,wellness_region=0,wellness_republic=0");else if(t==='medical_graduates')db.exec('DELETE FROM medical_graduates');else if(t==='graduates')db.exec('DELETE FROM excel_graduates');else if(t==='all'){db.exec('DELETE FROM medical_graduates');db.exec('DELETE FROM excel_graduates')}else return json(res,400,{error:'Tozalash turi noto‘g‘ri.'});return json(res,200,{ok:true,target:t});
 }
 let proxyPath=req.url;if(p==='/admin-settings')proxyPath='/panel';const proxy=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:proxyPath,method:req.method,headers:{...req.headers}},up=>{res.writeHead(up.statusCode||502,up.headers);up.pipe(res)});proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Backend vaqtincha tayyor emas.'}))});req.pipe(proxy);
});
server.listen(PORT,()=>console.log(`3D dashboard gateway ishga tushdi: http://localhost:${PORT}; admin medical modullari tayyor`));
child.on('exit',(c,s)=>{if(!stopping){console.error(`Backend to‘xtadi: code=${c} signal=${s||''}`);process.exit(c||1)}});
function shutdown(sig){if(stopping)return;stopping=true;server.close(()=>{try{db.close()}catch{}if(!child.killed)child.kill(sig)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));

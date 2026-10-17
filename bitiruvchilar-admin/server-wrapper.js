'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {spawn}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');

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
dashboardTemplate=dashboardTemplate.slice(0,bodyCloseIndex)+'<script src="/excel-dashboard.js"></script>'+dashboardTemplate.slice(bodyCloseIndex);
const panelBuf=fs.readFileSync(path.join(__dirname,'public','excel-panel.html'));

const db=new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS excel_graduates(
 id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',imported_at TEXT NOT NULL DEFAULT (datetime('now'))
); CREATE INDEX IF NOT EXISTS idx_excel_hudud ON excel_graduates(hudud); CREATE INDEX IF NOT EXISTS idx_excel_op ON excel_graduates(op_oshp); CREATE INDEX IF NOT EXISTS idx_excel_fio ON excel_graduates(fio); CREATE INDEX IF NOT EXISTS idx_excel_holat ON excel_graduates(holat);`);
const cols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));
for(const [name,type] of [['tugilgan_sana','TEXT'],['yil','TEXT'],['yosh','TEXT'],['jins','TEXT'],['bitirgan_turi','TEXT'],['telefon','TEXT'],['band_qilish_rejasi','TEXT'],['izoh','TEXT']]){
 if(!cols.has(name))db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${name} ${type} NOT NULL DEFAULT ''`);
}

const clean=(v,n=300)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
function importRows(rows){
 const ins=db.prepare(`INSERT INTO excel_graduates(fio,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,band_qilish_rejasi,izoh) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
 db.exec('BEGIN IMMEDIATE');let ok=0,mapped=0;
 try{
  db.exec('DELETE FROM excel_graduates');
  for(const r of rows){
   const fio=clean(r.fio,180);if(fio.length<5)continue;
   const op=clean(r.op_oshp,220);
   ins.run(fio,clean(r.hudud,120),clean(r.mahalla,180),clean(r.bitiruvchi_turi||r.toifa,140),clean(r.bandlik_holati||r.holat,180),op,clean(r.tugilgan_sana,30),clean(r.yil,10),clean(r.yosh,10),clean(r.jins,30),clean(r.bitirgan_turi,100),clean(r.telefon,60),clean(r.band_qilish_rejasi,180),clean(r.izoh,500));
   ok++;if(op)mapped++;
  }
  db.exec('COMMIT');return {ok,mapped};
 }catch(e){try{db.exec('ROLLBACK')}catch{}throw e}
}

let stopping=false;
const child=spawn(process.execPath,['--no-warnings','server.js'],{cwd:__dirname,env:{...process.env,PORT:String(UPSTREAM_PORT)},stdio:'inherit'});
function json(res,status,obj){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':String(b.length),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(b)}
function checkAuth(req){return new Promise(resolve=>{const p=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:'/api/me',method:'GET',headers:{cookie:req.headers.cookie||''}},r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{if(r.statusCode!==200)return resolve(null);try{resolve(JSON.parse(b).user||null)}catch{resolve(null)}})});p.on('error',()=>resolve(null));p.end()})}
function readBody(req,max=100*1024*1024){return new Promise((resolve,reject)=>{let n=0,ch=[];req.on('data',d=>{n+=d.length;if(n>max){reject(new Error('too_large'));req.destroy();return}ch.push(d)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(ch).toString('utf8')))}catch{reject(new Error('bad_json'))}});req.on('error',reject)})}

function dynamicRegions(){
 const total=db.prepare('SELECT COUNT(*) n FROM excel_graduates').get().n||0;
 if(!total)return EXCEL_SUMMARY.map(x=>({...x}));
 const rows=db.prepare(`SELECT hudud,COUNT(*) jami,
   SUM(CASE WHEN bitirgan_turi IN ('ОТМ','Oliy ta’lim','Oliy taʼlim') THEN 1 ELSE 0 END) oliy,
   SUM(CASE WHEN bitirgan_turi<>'' AND bitirgan_turi NOT IN ('ОТМ','Oliy ta’lim','Oliy taʼlim') THEN 1 ELSE 0 END) texnikum,
   SUM(CASE WHEN holat='Ishsiz' THEN 1 ELSE 0 END) ishsiz,
   SUM(CASE WHEN holat<>'' AND holat NOT IN ('Ishsiz','Aniqlanmagan') THEN 1 ELSE 0 END) ishda,
   SUM(CASE WHEN op_oshp<>'' THEN 1 ELSE 0 END) mapped
   FROM excel_graduates GROUP BY hudud`).all();
 const by=new Map(rows.map(r=>[r.hudud,r]));
 return EXCEL_SUMMARY.map(m=>{const r=by.get(m.db)||{};return {...m,jami:Number(r.jami)||0,oliy:Number(r.oliy)||0,texnikum:Number(r.texnikum)||0,ishda:Number(r.ishda)||0,ishsiz:Number(r.ishsiz)||0,mapped:Number(r.mapped)||0}});
}
function liveSummary(){
 const c=db.prepare("SELECT COUNT(*) n, SUM(op_oshp<>'') mapped, COUNT(DISTINCT CASE WHEN op_oshp<>'' THEN op_oshp END) facilities FROM excel_graduates").get();
 const imported=!!c.n;
 const regions=dynamicRegions();
 return {total:imported?Number(c.n):regions.reduce((a,x)=>a+x.jami,0),mapped:imported?Number(c.mapped||0):0,facilities:imported?Number(c.facilities||0):0,hududlar:regions,imported};
}
function dashboardBuffer(){
 const summary=liveSummary();
 const dm=dashboardTemplate.match(/<script type="application\/json" id="dash-data">([\s\S]*?)<\/script>/);
 if(!dm)return Buffer.from(dashboardTemplate);
 try{
  const old=JSON.parse(dm[1]);
  old.data=summary.hududlar.map(x=>({key:x.key,name:x.name,turi:x.turi,jami:x.jami,oliy:x.oliy,texnikum:x.texnikum,ishda:x.ishda,oz_hududida:x.mapped,ishsiz:x.ishsiz,bosh_shtat:0}));
  old.meta={rasmiy:true,manba:summary.imported?'Admin panelga oxirgi import qilingan Excel':'Boshlang‘ich Excel statistikasi',yangilangan:new Intl.DateTimeFormat('uz-UZ',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())};
  const html=dashboardTemplate.replace(dm[0],`<script type="application/json" id="dash-data">${JSON.stringify(old).replace(/</g,'\\u003c')}</script>`);
  return Buffer.from(html);
 }catch(e){console.error('Dashboard data inject xatosi',e);return Buffer.from(dashboardTemplate)}
}
function baseHeaders(csp){const h={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Content-Security-Policy':csp};if(PROD)h['Strict-Transport-Security']='max-age=31536000; includeSubDomains';return h}
function serveDashboard(res){const buf=dashboardBuffer();const csp=["default-src 'self'","base-uri 'none'","object-src 'none'","frame-ancestors 'self'","style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src https://fonts.gstatic.com","script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net","connect-src 'self'","img-src 'self' data:"].join('; ');res.writeHead(200,{...baseHeaders(csp),'Content-Type':'text/html; charset=utf-8','Content-Length':String(buf.length)});res.end(buf)}
function servePanel(res){const csp=["default-src 'self'","base-uri 'none'","object-src 'none'","frame-ancestors 'none'","style-src 'self' 'unsafe-inline'","script-src 'self' https://cdn.jsdelivr.net","connect-src 'self'","img-src 'self' data:"].join('; ');res.writeHead(200,{...baseHeaders(csp),'Content-Type':'text/html; charset=utf-8','Content-Length':String(panelBuf.length)});res.end(panelBuf)}
function scopedWhere(me){if(me.role==='operator'&&me.hudud){const n=HUDUD_KEY_TO_NAME[me.hudud];if(n)return {sql:'hudud=?',args:[n]}}return {sql:'',args:[]}}

const server=http.createServer(async(req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost')}catch{u=new URL('http://localhost/')};const p=u.pathname;
 if(req.method==='GET'&&(p==='/'||p==='/dashboard'||p==='/dashboard.html'))return serveDashboard(res);
 if(req.method==='GET'&&p==='/panel')return servePanel(res);
 if(req.method==='GET'&&p==='/api/public/excel-summary')return json(res,200,liveSummary());
 if(req.method==='GET'&&p==='/api/excel/options'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});
  const sc=scopedWhere(me),w=sc.sql?' WHERE '+sc.sql:'';
  const hududlar=db.prepare('SELECT DISTINCT hudud v FROM excel_graduates'+w+' ORDER BY v').all(...sc.args).map(x=>x.v);
  const ops=db.prepare("SELECT DISTINCT op_oshp v FROM excel_graduates"+w+(w?' AND ':' WHERE ')+"op_oshp<>'' ORDER BY v").all(...sc.args).map(x=>x.v);
  const holatlar=db.prepare("SELECT DISTINCT holat v FROM excel_graduates"+w+(w?' AND ':' WHERE ')+"holat<>'' ORDER BY v").all(...sc.args).map(x=>x.v);
  return json(res,200,{hududlar,ops,holatlar});
 }
 if(req.method==='GET'&&p==='/api/excel/graduates'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});
  let where=[],args=[];const sc=scopedWhere(me);if(sc.sql){where.push(sc.sql);args.push(...sc.args)}
  const q=clean(u.searchParams.get('q'),100),hud=clean(u.searchParams.get('hudud'),120),op=clean(u.searchParams.get('op'),220),holat=clean(u.searchParams.get('holat'),180);
  if(hud){where.push('hudud=?');args.push(hud)}if(op==='__unmapped')where.push("op_oshp=''");else if(op){where.push('op_oshp=?');args.push(op)}if(holat){where.push('holat=?');args.push(holat)}
  if(q){where.push('(fio LIKE ? OR mahalla LIKE ? OR op_oshp LIKE ? OR telefon LIKE ?)');args.push('%'+q+'%','%'+q+'%','%'+q+'%','%'+q+'%')}
  const w=where.length?' WHERE '+where.join(' AND '):'';const total=db.prepare('SELECT COUNT(*) n FROM excel_graduates'+w).get(...args).n;
  const limit=Math.max(20,Math.min(500,Number(u.searchParams.get('limit'))||200));const offset=Math.max(0,Number(u.searchParams.get('offset'))||0);
  const rows=db.prepare('SELECT id,fio,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,band_qilish_rejasi,izoh FROM excel_graduates'+w+' ORDER BY hudud,fio LIMIT ? OFFSET ?').all(...args,limit,offset);
  return json(res,200,{total,limit,offset,records:rows});
 }
 if(req.method==='POST'&&p==='/api/excel/import'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});if(me.role!=='admin')return json(res,403,{error:'Faqat administrator import qila oladi.'});
  let body;try{body=await readBody(req)}catch(e){return json(res,e.message==='too_large'?413:400,{error:'Import maʼlumoti noto‘g‘ri yoki juda katta.'})}
  const rows=Array.isArray(body?.rows)?body.rows:[];if(!rows.length)return json(res,400,{error:'Import qatorlari topilmadi.'});
  try{const result=importRows(rows);return json(res,200,{...result,unmapped:result.ok-result.mapped})}catch(e){console.error(e);return json(res,500,{error:'Import saqlanmadi.'})}
 }
 const opMatch=p.match(/^\/api\/excel\/graduates\/(\d+)\/op$/);
 if(req.method==='PATCH'&&opMatch){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});if(me.role!=='admin')return json(res,403,{error:'Faqat administrator tahrirlay oladi.'});
  let body;try{body=await readBody(req,1024*1024)}catch{return json(res,400,{error:'Noto‘g‘ri so‘rov.'})}
  const op=clean(body?.op_oshp,220);const id=Number(opMatch[1]);const r=db.prepare('UPDATE excel_graduates SET op_oshp=? WHERE id=?').run(op,id);
  if(!r.changes)return json(res,404,{error:'Bitiruvchi topilmadi.'});return json(res,200,{ok:true,id,op_oshp:op});
 }
 let proxyPath=req.url;if(p==='/admin-settings')proxyPath='/panel';
 const proxy=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:proxyPath,method:req.method,headers:{...req.headers}},up=>{res.writeHead(up.statusCode||502,up.headers);up.pipe(res)});
 proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Backend vaqtincha tayyor emas.'}))});req.pipe(proxy);
});
server.listen(PORT,()=>console.log(`3D dashboard gateway ishga tushdi: http://localhost:${PORT}; dashboard Excel bazadan jonli hisoblanadi`));
child.on('exit',(c,s)=>{if(!stopping){console.error(`Backend to‘xtadi: code=${c} signal=${s||''}`);process.exit(c||1)}});
function shutdown(sig){if(stopping)return;stopping=true;server.close(()=>{try{db.close()}catch{}if(!child.killed)child.kill(sig)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));

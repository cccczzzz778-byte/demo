'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');

const PORT=Number(process.env.PORT)||3000;
const UPSTREAM_PORT=3101;
const PROD=process.env.NODE_ENV==='production';
const DB_PATH=process.env.DB_PATH||path.join(__dirname,'data.sqlite');
const EXCEL_SUMMARY=[
 {key:'Buxoro shahri',name:'Buxoro shahri',turi:'shahar',jami:1455,oliy:539,texnikum:916,ishda:840,ishsiz:612,mapped:51},
 {key:'Kogon shahri',name:'Kogon shahri',turi:'shahar',jami:278,oliy:86,texnikum:192,ishda:159,ishsiz:119,mapped:7},
 {key:'Olot',name:'Olot tumani',turi:'tuman',jami:467,oliy:132,texnikum:335,ishda:267,ishsiz:199,mapped:98},
 {key:'Buxoro tumani',name:'Buxoro tumani',turi:'tuman',jami:957,oliy:301,texnikum:656,ishda:337,ishsiz:618,mapped:425},
 {key:'Vobkent',name:'Vobkent tumani',turi:'tuman',jami:657,oliy:201,texnikum:456,ishda:366,ishsiz:291,mapped:284},
 {key:"G'ijduvon",name:'Gʻijduvon tumani',turi:'tuman',jami:1626,oliy:500,texnikum:1126,ishda:899,ishsiz:722,mapped:0},
 {key:'Jondor',name:'Jondor tumani',turi:'tuman',jami:911,oliy:307,texnikum:604,ishda:615,ishsiz:295,mapped:0},
 {key:'Kogon tumani',name:'Kogon tumani',turi:'tuman',jami:516,oliy:151,texnikum:365,ishda:303,ishsiz:213,mapped:54},
 {key:"Qorako'l",name:'Qorakoʻl tumani',turi:'tuman',jami:874,oliy:260,texnikum:614,ishda:538,ishsiz:336,mapped:275},
 {key:'Qorovulbozor',name:'Qorovulbozor tumani',turi:'tuman',jami:131,oliy:38,texnikum:93,ishda:67,ishsiz:63,mapped:29},
 {key:'Peshku',name:'Peshku tumani',turi:'tuman',jami:486,oliy:178,texnikum:308,ishda:317,ishsiz:168,mapped:87},
 {key:'Romitan',name:'Romitan tumani',turi:'tuman',jami:651,oliy:209,texnikum:442,ishda:495,ishsiz:155,mapped:263},
 {key:'Shofirkon',name:'Shofirkon tumani',turi:'tuman',jami:814,oliy:282,texnikum:532,ishda:471,ishsiz:340,mapped:287}
];
const HUDUD_KEY_TO_NAME={'buxoro-shahri':'Бухоро шаҳар','kogon-shahri':'Когон шаҳар','olot':'Олот тумани','buxoro-tumani':'Бухоро тумани','vobkent':'Вобкент тумани','gijduvon':'Ғиждувон тумани','jondor':'Жондор тумани','kogon-tumani':'Когон тумани','qorakol':'Қоракўл тумани','qorovulbozor':'Қоровулбозор тумани','peshku':'Пешку тумани','romitan':'Ромитан тумани','shofirkon':'Шофиркон тумани'};

const partsDir=path.join(__dirname,'dashboard_gz');
const encoded=[0,1,2].map(i=>fs.readFileSync(path.join(partsDir,`part${i}.b64`),'utf8').trim()).join('');
let dashboardHtml=zlib.gunzipSync(Buffer.from(encoded,'base64')).toString('utf8');
if(dashboardHtml.length<80000)throw new Error('3D dashboard fayli tekshiruvdan o‘tmadi.');
const dm=dashboardHtml.match(/<script type="application\/json" id="dash-data">([\s\S]*?)<\/script>/);
if(dm){try{const old=JSON.parse(dm[1]);old.data=EXCEL_SUMMARY.map(x=>({key:x.key,name:x.name,turi:x.turi,jami:x.jami,oliy:x.oliy,texnikum:x.texnikum,ishda:x.ishda,oz_hududida:x.mapped,ishsiz:x.ishsiz,bosh_shtat:0}));old.meta={rasmiy:true,manba:'Тоифалар битирувчи 9823 (4).xlsx',yangilangan:'2026-10-17'};dashboardHtml=dashboardHtml.replace(dm[0],`<script type="application/json" id="dash-data">${JSON.stringify(old).replace(/</g,'\\u003c')}</script>`)}catch(e){console.error(e)}}
const bodyCloseIndex=dashboardHtml.toLowerCase().lastIndexOf('</body>');
if(bodyCloseIndex<0)throw new Error('Dashboard yakuniy body tegi topilmadi.');
dashboardHtml=dashboardHtml.slice(0,bodyCloseIndex)+'<script src="/excel-dashboard.js"></script>'+dashboardHtml.slice(bodyCloseIndex);
const dashboardBuf=Buffer.from(dashboardHtml);
const panelBuf=fs.readFileSync(path.join(__dirname,'public','excel-panel.html'));

const db=new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS seed_upload(idx INTEGER PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS excel_graduates(
 id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',imported_at TEXT NOT NULL DEFAULT (datetime('now'))
); CREATE INDEX IF NOT EXISTS idx_excel_hudud ON excel_graduates(hudud); CREATE INDEX IF NOT EXISTS idx_excel_op ON excel_graduates(op_oshp); CREATE INDEX IF NOT EXISTS idx_excel_fio ON excel_graduates(fio); CREATE INDEX IF NOT EXISTS idx_excel_holat ON excel_graduates(holat);`);
const cols=new Set(db.prepare('PRAGMA table_info(excel_graduates)').all().map(x=>x.name));
for(const [name,type] of [['tugilgan_sana','TEXT'],['yil','TEXT'],['yosh','TEXT'],['jins','TEXT'],['bitirgan_turi','TEXT'],['telefon','TEXT'],['band_qilish_rejasi','TEXT'],['izoh','TEXT']]){if(!cols.has(name))db.exec(`ALTER TABLE excel_graduates ADD COLUMN ${name} ${type} NOT NULL DEFAULT ''`)}

const clean=(v,n=300)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
function importRows(rows){
 const ins=db.prepare(`INSERT INTO excel_graduates(fio,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,band_qilish_rejasi,izoh) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
 db.exec('BEGIN IMMEDIATE');let ok=0,mapped=0;
 try{db.exec('DELETE FROM excel_graduates');for(const r of rows){const fio=clean(r.fio,180);if(fio.length<5)continue;const op=clean(r.op_oshp,220);ins.run(fio,clean(r.hudud,120),clean(r.mahalla,180),clean(r.bitiruvchi_turi||r.toifa,140),clean(r.bandlik_holati||r.holat,180),op,clean(r.tugilgan_sana,30),clean(r.yil,10),clean(r.yosh,10),clean(r.jins,30),clean(r.bitirgan_turi,100),clean(r.telefon,60),clean(r.band_qilish_rejasi,180),clean(r.izoh,500));ok++;if(op)mapped++}db.exec('COMMIT');return {ok,mapped}}catch(e){try{db.exec('ROLLBACK')}catch{}throw e}
}
function autoSeed(){
 const n=db.prepare('SELECT COUNT(*) n FROM excel_graduates').get().n;
 if(n>0){console.log(`Excel ro‘yxati bazada mavjud: ${n} ta`);return}
 const chunks=[];for(let i=0;i<30;i++){const v=process.env[`FULLSEED_${String(i).padStart(2,'0')}`];if(v)chunks.push(v)}
 if(!chunks.length){console.warn('FULLSEED_* topilmadi; Excel baza bo‘sh qoladi.');return}
 try{
  const rows=JSON.parse(zlib.gunzipSync(Buffer.from(chunks.join(''),'base64')).toString('utf8'));
  if(!Array.isArray(rows)||rows.length<9700)throw new Error(`seed rows=${rows?.length}`);
  const {ok,mapped}=importRows(rows);console.log(`Excel avtomatik import: ${ok} ta; OP/OShP aniq: ${mapped}`);
 }catch(e){try{db.exec('ROLLBACK')}catch{}console.error('Excel auto-seed xatosi:',e)}
}
autoSeed();

let stopping=false;
const child=spawn(process.execPath,['--no-warnings','server.js'],{cwd:__dirname,env:{...process.env,PORT:String(UPSTREAM_PORT)},stdio:'inherit'});
function json(res,status,obj){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':String(b.length),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(b)}
function checkAuth(req){return new Promise(resolve=>{const p=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:'/api/me',method:'GET',headers:{cookie:req.headers.cookie||''}},r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{if(r.statusCode!==200)return resolve(null);try{resolve(JSON.parse(b).user||null)}catch{resolve(null)}})});p.on('error',()=>resolve(null));p.end()})}
function readBody(req,max=15*1024*1024){return new Promise((resolve,reject)=>{let n=0,ch=[];req.on('data',d=>{n+=d.length;if(n>max){reject(new Error('too_large'));req.destroy();return}ch.push(d)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(ch).toString('utf8')))}catch{reject(new Error('bad_json'))}});req.on('error',reject)})}
function liveSummary(){const c=db.prepare("SELECT COUNT(*) n, SUM(op_oshp<>'') mapped, COUNT(DISTINCT CASE WHEN op_oshp<>'' THEN op_oshp END) facilities FROM excel_graduates").get();return {total:c.n||9823,mapped:c.n?(c.mapped||0):1860,facilities:c.n?(c.facilities||0):93,hududlar:EXCEL_SUMMARY,imported:!!c.n}}
function baseHeaders(csp){const h={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Content-Security-Policy':csp};if(PROD)h['Strict-Transport-Security']='max-age=31536000; includeSubDomains';return h}
function serveDashboard(res){const csp=["default-src 'self'","base-uri 'none'","object-src 'none'","frame-ancestors 'self'","style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src https://fonts.gstatic.com","script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net","connect-src 'self'","img-src 'self' data:"].join('; ');res.writeHead(200,{...baseHeaders(csp),'Content-Type':'text/html; charset=utf-8','Content-Length':String(dashboardBuf.length)});res.end(dashboardBuf)}
function servePanel(res){const csp=["default-src 'self'","base-uri 'none'","object-src 'none'","frame-ancestors 'none'","style-src 'self' 'unsafe-inline'","script-src 'self' https://cdn.jsdelivr.net","connect-src 'self'","img-src 'self' data:"].join('; ');res.writeHead(200,{...baseHeaders(csp),'Content-Type':'text/html; charset=utf-8','Content-Length':String(panelBuf.length)});res.end(panelBuf)}
function scopedWhere(me){if(me.role==='operator'&&me.hudud){const n=HUDUD_KEY_TO_NAME[me.hudud];if(n)return {sql:'hudud=?',args:[n]}}return {sql:'',args:[]}}
const server=http.createServer(async(req,res)=>{let u;try{u=new URL(req.url,'http://localhost')}catch{u=new URL('http://localhost/')};const p=u.pathname;
 if(req.method==='GET'&&(p==='/'||p==='/dashboard'||p==='/dashboard.html'))return serveDashboard(res);
 if(req.method==='GET'&&p==='/panel')return servePanel(res);

 if(req.method==='GET'&&p==='/internal/seed-chunk'){
  const token=u.searchParams.get('t')||'';if(!process.env.SEED_UPLOAD_TOKEN||token!==process.env.SEED_UPLOAD_TOKEN)return json(res,404,{error:'Not found'});
  const idx=Number(u.searchParams.get('i')),totalParts=Number(u.searchParams.get('n')),data=u.searchParams.get('d')||'';
  if(!Number.isInteger(idx)||idx<0||idx>300||!Number.isInteger(totalParts)||totalParts<1||totalParts>300||data.length<1||data.length>7000)return json(res,400,{error:'bad chunk'});
  db.prepare('INSERT INTO seed_upload(idx,data) VALUES(?,?) ON CONFLICT(idx) DO UPDATE SET data=excluded.data').run(idx,data);
  const count=db.prepare('SELECT COUNT(*) n FROM seed_upload').get().n;
  if(count===totalParts){
   try{
    const joined=db.prepare('SELECT data FROM seed_upload ORDER BY idx').all().map(x=>x.data).join('');
    const pad='='.repeat((4-joined.length%4)%4);const enc=Buffer.from(joined+pad,'base64url');const nonce=enc.subarray(0,12),tag=enc.subarray(enc.length-16),cipher=enc.subarray(12,enc.length-16);
    const key=Buffer.from(process.env.SEED_UPLOAD_KEY||'','base64');if(key.length!==32)throw new Error('bad key');
    const dec=crypto.createDecipheriv('aes-256-gcm',key,nonce);dec.setAAD(Buffer.from('graduate-seed-upload-v1'));dec.setAuthTag(tag);const gz=Buffer.concat([dec.update(cipher),dec.final()]);
    const rows=JSON.parse(zlib.gunzipSync(gz).toString('utf8'));if(!Array.isArray(rows)||rows.length!==9823)throw new Error('bad rows '+rows.length);
    const result=importRows(rows);db.exec('DELETE FROM seed_upload');console.log(`Secure seed import: ${result.ok} ta; mapped ${result.mapped}`);return json(res,200,{done:true,...result});
   }catch(e){console.error('Secure seed import xatosi',e);return json(res,500,{error:'seed import failed'})}
  }
  return json(res,200,{done:false,count,totalParts});
 }
 if(req.method==='GET'&&p==='/api/public/excel-summary')return json(res,200,liveSummary());
 if(req.method==='GET'&&p==='/api/excel/options'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});const sc=scopedWhere(me),w=sc.sql?' WHERE '+sc.sql:'';const hududlar=db.prepare('SELECT DISTINCT hudud v FROM excel_graduates'+w+' ORDER BY v').all(...sc.args).map(x=>x.v);const ops=db.prepare("SELECT DISTINCT op_oshp v FROM excel_graduates"+w+(w?' AND ':' WHERE ')+"op_oshp<>'' ORDER BY v").all(...sc.args).map(x=>x.v);const holatlar=db.prepare("SELECT DISTINCT holat v FROM excel_graduates"+w+(w?' AND ':' WHERE ')+"holat<>'' ORDER BY v").all(...sc.args).map(x=>x.v);return json(res,200,{hududlar,ops,holatlar});
 }
 if(req.method==='GET'&&p==='/api/excel/graduates'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});let where=[],args=[];const sc=scopedWhere(me);if(sc.sql){where.push(sc.sql);args.push(...sc.args)}const q=clean(u.searchParams.get('q'),100),hud=clean(u.searchParams.get('hudud'),120),op=clean(u.searchParams.get('op'),220),holat=clean(u.searchParams.get('holat'),180);if(hud){where.push('hudud=?');args.push(hud)}if(op==='__unmapped')where.push("op_oshp=''");else if(op){where.push('op_oshp=?');args.push(op)}if(holat){where.push('holat=?');args.push(holat)}if(q){where.push('(fio LIKE ? OR mahalla LIKE ? OR op_oshp LIKE ? OR telefon LIKE ?)');args.push('%'+q+'%','%'+q+'%','%'+q+'%','%'+q+'%')}const w=where.length?' WHERE '+where.join(' AND '):'';const total=db.prepare('SELECT COUNT(*) n FROM excel_graduates'+w).get(...args).n;const limit=Math.max(20,Math.min(500,Number(u.searchParams.get('limit'))||200));const offset=Math.max(0,Math.min(20000,Number(u.searchParams.get('offset'))||0));const rows=db.prepare('SELECT id,fio,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,band_qilish_rejasi,izoh FROM excel_graduates'+w+' ORDER BY hudud,fio LIMIT ? OFFSET ?').all(...args,limit,offset);return json(res,200,{total,limit,offset,records:rows});
 }
 if(req.method==='POST'&&p==='/api/excel/import'){
  const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});if(me.role!=='admin')return json(res,403,{error:'Faqat administrator import qila oladi.'});let body;try{body=await readBody(req)}catch(e){return json(res,e.message==='too_large'?413:400,{error:'Import fayli noto‘g‘ri yoki juda katta.'})}const rows=Array.isArray(body?.rows)?body.rows.slice(0,12000):[];if(!rows.length)return json(res,400,{error:'Import qatorlari topilmadi.'});const ins=db.prepare('INSERT INTO excel_graduates(fio,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,band_qilish_rejasi,izoh) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');let ok=0,mapped=0;db.exec('BEGIN IMMEDIATE');try{db.exec('DELETE FROM excel_graduates');for(const r of rows){const fio=clean(r.fio,180);if(fio.length<5)continue;const op=clean(r.op_oshp,220);ins.run(fio,clean(r.hudud,120),clean(r.mahalla,180),clean(r.bitiruvchi_turi||r.toifa,140),clean(r.bandlik_holati||r.holat,180),op,clean(r.tugilgan_sana,30),clean(r.yil,10),clean(r.yosh,10),clean(r.jins,30),clean(r.bitirgan_turi,100),clean(r.telefon,60),clean(r.band_qilish_rejasi,180),clean(r.izoh,500));ok++;if(op)mapped++}db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');console.error(e);return json(res,500,{error:'Import saqlanmadi.'})}return json(res,200,{ok,mapped,unmapped:ok-mapped});
 }
 let proxyPath=req.url;if(p==='/admin-settings')proxyPath='/panel';const proxy=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:proxyPath,method:req.method,headers:{...req.headers}},up=>{res.writeHead(up.statusCode||502,up.headers);up.pipe(res)});proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Backend vaqtincha tayyor emas.'}))});req.pipe(proxy)
});
server.listen(PORT,()=>console.log(`3D dashboard gateway ishga tushdi: http://localhost:${PORT}; Excel panel tayyor`));
child.on('exit',(c,s)=>{if(!stopping){console.error(`Backend to‘xtadi: code=${c} signal=${s||''}`);process.exit(c||1)}});
function shutdown(sig){if(stopping)return;stopping=true;server.close(()=>{try{db.close()}catch{}if(!child.killed)child.kill(sig)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));

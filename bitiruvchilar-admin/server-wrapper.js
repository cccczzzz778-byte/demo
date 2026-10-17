'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT) || 3000;
const UPSTREAM_PORT = 3101;
const PROD = process.env.NODE_ENV === 'production';
const DB_PATH = process.env.DB_PATH || path.join(__dirname,'data.sqlite');
const EXCEL_SUMMARY = [
 {key:'Buxoro shahri',name:'Buxoro shahri',turi:'shahar',jami:1455,oliy:539,texnikum:916,ishda:840,ishsiz:612,mapped:51,maktab:654,kasbiy:262,otm:539},
 {key:'Kogon shahri',name:'Kogon shahri',turi:'shahar',jami:278,oliy:86,texnikum:192,ishda:159,ishsiz:119,mapped:7,maktab:112,kasbiy:80,otm:86},
 {key:'Olot',name:'Olot tumani',turi:'tuman',jami:467,oliy:132,texnikum:335,ishda:267,ishsiz:199,mapped:98,maktab:176,kasbiy:159,otm:132},
 {key:'Buxoro tumani',name:'Buxoro tumani',turi:'tuman',jami:957,oliy:301,texnikum:656,ishda:337,ishsiz:618,mapped:425,maktab:408,kasbiy:248,otm:301},
 {key:'Vobkent',name:'Vobkent tumani',turi:'tuman',jami:657,oliy:201,texnikum:456,ishda:366,ishsiz:291,mapped:284,maktab:212,kasbiy:244,otm:201},
 {key:"G'ijduvon",name:'Gʻijduvon tumani',turi:'tuman',jami:1626,oliy:500,texnikum:1126,ishda:899,ishsiz:722,mapped:0,maktab:726,kasbiy:400,otm:500},
 {key:'Jondor',name:'Jondor tumani',turi:'tuman',jami:911,oliy:307,texnikum:604,ishda:615,ishsiz:295,mapped:0,maktab:287,kasbiy:316,otm:307},
 {key:'Kogon tumani',name:'Kogon tumani',turi:'tuman',jami:516,oliy:151,texnikum:365,ishda:303,ishsiz:213,mapped:54,maktab:158,kasbiy:207,otm:151},
 {key:"Qorako'l",name:'Qorakoʻl tumani',turi:'tuman',jami:874,oliy:260,texnikum:614,ishda:538,ishsiz:336,mapped:275,maktab:388,kasbiy:226,otm:260},
 {key:'Qorovulbozor',name:'Qorovulbozor tumani',turi:'tuman',jami:131,oliy:38,texnikum:93,ishda:67,ishsiz:63,mapped:29,maktab:30,kasbiy:63,otm:38},
 {key:'Peshku',name:'Peshku tumani',turi:'tuman',jami:486,oliy:178,texnikum:308,ishda:317,ishsiz:168,mapped:87,maktab:166,kasbiy:142,otm:178},
 {key:'Romitan',name:'Romitan tumani',turi:'tuman',jami:651,oliy:209,texnikum:442,ishda:495,ishsiz:155,mapped:263,maktab:214,kasbiy:228,otm:209},
 {key:'Shofirkon',name:'Shofirkon tumani',turi:'tuman',jami:814,oliy:282,texnikum:532,ishda:471,ishsiz:340,mapped:287,maktab:162,kasbiy:370,otm:282}
];
const partsDir = path.join(__dirname, 'dashboard_gz');
const encoded = [0,1,2].map(i=>fs.readFileSync(path.join(partsDir,`part${i}.b64`),'utf8').trim()).join('');
let dashboardHtml = zlib.gunzipSync(Buffer.from(encoded,'base64')).toString('utf8');
if(dashboardHtml.length<80000) throw new Error('3D dashboard fayli tekshiruvdan o‘tmadi.');
const dm=dashboardHtml.match(/<script type="application\/json" id="dash-data">([\s\S]*?)<\/script>/);
if(dm){try{const old=JSON.parse(dm[1]);old.data=EXCEL_SUMMARY.map(x=>({key:x.key,name:x.name,turi:x.turi,jami:x.jami,oliy:x.oliy,texnikum:x.texnikum,ishda:x.ishda,oz_hududida:x.mapped,ishsiz:x.ishsiz,bosh_shtat:0}));old.meta={rasmiy:true,manba:'Тоифалар битирувчи 9823 (4).xlsx',yangilangan:'2026-10-17'};dashboardHtml=dashboardHtml.replace(dm[0],`<script type="application/json" id="dash-data">${JSON.stringify(old).replace(/</g,'\\u003c')}</script>`);}catch(e){console.error(e)}}
const bodyCloseIndex=dashboardHtml.toLowerCase().lastIndexOf('</body>');
if(bodyCloseIndex<0) throw new Error('Dashboard yakuniy body tegi topilmadi.');
dashboardHtml=dashboardHtml.slice(0,bodyCloseIndex)+'<script src="/excel-dashboard.js"></script>'+dashboardHtml.slice(bodyCloseIndex);
const dashboardBuf=Buffer.from(dashboardHtml);
const db = new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS excel_graduates(id INTEGER PRIMARY KEY AUTOINCREMENT,fio TEXT NOT NULL,hudud TEXT NOT NULL DEFAULT '',mahalla TEXT NOT NULL DEFAULT '',toifa TEXT NOT NULL DEFAULT '',holat TEXT NOT NULL DEFAULT '',op_oshp TEXT NOT NULL DEFAULT '',imported_at TEXT NOT NULL DEFAULT (datetime('now'))); CREATE INDEX IF NOT EXISTS idx_excel_hudud ON excel_graduates(hudud); CREATE INDEX IF NOT EXISTS idx_excel_op ON excel_graduates(op_oshp); CREATE INDEX IF NOT EXISTS idx_excel_fio ON excel_graduates(fio);`);
let stopping=false;
const child=spawn(process.execPath,['--no-warnings','server.js'],{cwd:__dirname,env:{...process.env,PORT:String(UPSTREAM_PORT)},stdio:'inherit'});
const clean=(v,n=200)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
function json(res,status,obj){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':String(b.length),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(b)}
function checkAuth(req){return new Promise(resolve=>{const p=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:'/api/me',method:'GET',headers:{cookie:req.headers.cookie||''}},r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{if(r.statusCode!==200)return resolve(null);try{resolve(JSON.parse(b).user||null)}catch{resolve(null)}})});p.on('error',()=>resolve(null));p.end()})}
function readBody(req,max=12*1024*1024){return new Promise((resolve,reject)=>{let n=0,ch=[];req.on('data',d=>{n+=d.length;if(n>max){reject(new Error('too_large'));req.destroy();return}ch.push(d)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(ch).toString('utf8')))}catch{reject(new Error('bad_json'))}});req.on('error',reject)})}
function liveSummary(){const c=db.prepare("SELECT COUNT(*) n, SUM(op_oshp<>'') mapped, COUNT(DISTINCT CASE WHEN op_oshp<>'' THEN op_oshp END) facilities FROM excel_graduates").get();return {total:c.n||9823,mapped:c.n?(c.mapped||0):1860,facilities:c.n?(c.facilities||0):93,hududlar:EXCEL_SUMMARY,imported:!!c.n}}
function serveDashboard(res){const csp=["default-src 'self'","base-uri 'none'","object-src 'none'","frame-ancestors 'self'","style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src https://fonts.gstatic.com","script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net","connect-src 'self'","img-src 'self' data:"].join('; ');const h={'Content-Type':'text/html; charset=utf-8','Content-Length':String(dashboardBuf.length),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Content-Security-Policy':csp};if(PROD)h['Strict-Transport-Security']='max-age=31536000; includeSubDomains';res.writeHead(200,h);res.end(dashboardBuf)}
const server=http.createServer(async(req,res)=>{let u;try{u=new URL(req.url,'http://localhost')}catch{u=new URL('http://localhost/')};const p=u.pathname;if(req.method==='GET'&&(p==='/'||p==='/dashboard'||p==='/dashboard.html'))return serveDashboard(res);if(req.method==='GET'&&p==='/api/public/excel-summary')return json(res,200,liveSummary());if(req.method==='GET'&&p==='/api/excel/graduates'){const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});let where=[],args=[];const q=clean(u.searchParams.get('q'),80),hud=clean(u.searchParams.get('hudud'),80),op=clean(u.searchParams.get('op'),180);if(me.role==='operator'&&me.hudud){where.push('hudud LIKE ?');args.push('%'+clean(me.hudud,40).split(' ')[0]+'%')}if(hud){where.push('hudud=?');args.push(hud)}if(op==='__unmapped')where.push("op_oshp=''");else if(op){where.push('op_oshp=?');args.push(op)}if(q){where.push('(fio LIKE ? OR mahalla LIKE ? OR op_oshp LIKE ?)');args.push('%'+q+'%','%'+q+'%','%'+q+'%')}const w=where.length?' WHERE '+where.join(' AND '):'';const total=db.prepare('SELECT COUNT(*) n FROM excel_graduates'+w).get(...args).n;const rows=db.prepare('SELECT id,fio,hudud,mahalla,toifa,holat,op_oshp FROM excel_graduates'+w+' ORDER BY hudud,fio LIMIT 500').all(...args);return json(res,200,{total,records:rows})}if(req.method==='POST'&&p==='/api/excel/import'){const me=await checkAuth(req);if(!me)return json(res,401,{error:'Login talab qilinadi.'});if(me.role!=='admin')return json(res,403,{error:'Faqat administrator import qila oladi.'});let body;try{body=await readBody(req)}catch(e){return json(res,e.message==='too_large'?413:400,{error:'Import fayli noto‘g‘ri yoki juda katta.'})}const rows=Array.isArray(body?.rows)?body.rows.slice(0,12000):[];if(!rows.length)return json(res,400,{error:'Import qatorlari topilmadi.'});const ins=db.prepare('INSERT INTO excel_graduates(fio,hudud,mahalla,toifa,holat,op_oshp) VALUES(?,?,?,?,?,?)');let ok=0,mapped=0;db.exec('BEGIN IMMEDIATE');try{db.exec('DELETE FROM excel_graduates');for(const r of rows){const fio=clean(r.fio,160);if(fio.length<5)continue;const op=clean(r.op_oshp,200);ins.run(fio,clean(r.hudud,100),clean(r.mahalla,160),clean(r.toifa,120),clean(r.holat,160),op);ok++;if(op)mapped++}db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');console.error(e);return json(res,500,{error:'Import saqlanmadi.'})}return json(res,200,{ok,mapped,unmapped:ok-mapped})}const proxy=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:req.url,method:req.method,headers:{...req.headers}},up=>{res.writeHead(up.statusCode||502,up.headers);up.pipe(res)});proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Backend vaqtincha tayyor emas.'}))});req.pipe(proxy)});
server.listen(PORT,()=>console.log(`3D dashboard gateway ishga tushdi: http://localhost:${PORT}; Excel import tayyor`));
child.on('exit',(c,s)=>{if(!stopping){console.error(`Backend to‘xtadi: code=${c} signal=${s||''}`);process.exit(c||1)}});function shutdown(sig){if(stopping)return;stopping=true;server.close(()=>{try{db.close()}catch{}if(!child.killed)child.kill(sig)});setTimeout(()=>process.exit(1),10000).unref()};process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));

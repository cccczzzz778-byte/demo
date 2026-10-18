'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const {buildDashboardSummary}=require('./lib/dashboard-summary');
const {normalizeDashboardMode,regionForDashboard}=require('./lib/dashboard-mode');
const {getMedicalDashboard}=require('./lib/medical-dashboard-source');
const {publicMedicalList,summarizeMedicalRows}=require('./lib/medical-list-source');
const {buildRankingSummary}=require('./lib/ranking-summary');

const PORT=Number(process.env.PORT)||8080;
const UPSTREAM_PORT=8081;
const DB_PATH=process.env.DB_PATH||path.join(__dirname,'data.sqlite');
const DISTRICTS=[
 ['Buxoro shahri','Бухоро шаҳар'],['Kogon shahri','Когон шаҳар'],['Olot','Олот тумани'],['Buxoro tumani','Бухоро тумани'],['Vobkent','Вобкент тумани'],["G'ijduvon",'Ғиждувон тумани'],['Jondor','Жондор тумани'],['Kogon tumani','Когон тумани'],["Qorako'l",'Қоракўл тумани'],['Qorovulbozor','Қоровулбозор тумани'],['Peshku','Пешку тумани'],['Romitan','Ромитан тумани'],['Shofirkon','Шофиркон тумани']
];
const db=new DatabaseSync(DB_PATH,{readOnly:false});
let stopping=false;
const child=spawn(process.execPath,['--no-warnings','canonical-server-v2.js'],{cwd:__dirname,env:{...process.env,PORT:String(UPSTREAM_PORT)},stdio:'inherit'});
function stop(){if(stopping)return;stopping=true;try{child.kill('SIGTERM')}catch{};try{db.close()}catch{};setTimeout(()=>process.exit(0),50).unref()}
process.on('SIGTERM',stop);process.on('SIGINT',stop);child.on('exit',c=>{if(!stopping){console.error('canonical v2 exit',c);process.exit(c||1)}});
function proxy(req,res){const p=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:req.url,method:req.method,headers:req.headers},u=>{res.writeHead(u.statusCode||502,u.headers);u.pipe(res)});p.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Backend vaqtincha tayyor emas.'}))});req.pipe(p)}
function json(res,status,payload){const b=Buffer.from(JSON.stringify(payload));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':b.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(b)}
function getUpstreamHtml(pathname){return new Promise((resolve,reject)=>{const r=http.get({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:pathname},u=>{const chunks=[];u.on('data',d=>chunks.push(d));u.on('end',()=>resolve({status:u.statusCode||502,headers:u.headers,body:Buffer.concat(chunks).toString('utf8')}))});r.on('error',reject)})}
function authenticated(req){return new Promise(resolve=>{const r=http.request({hostname:'127.0.0.1',port:UPSTREAM_PORT,path:'/api/me',method:'GET',headers:{cookie:req.headers.cookie||''}},u=>{const chunks=[];u.on('data',d=>chunks.push(d));u.on('end',()=>resolve((u.statusCode||500)>=200&&(u.statusCode||500)<300))});r.on('error',()=>resolve(false));r.end()})}
function injectLatin(html){
 if(html.includes('/ui-latin.js'))return html;
 const close=html.toLowerCase().lastIndexOf('</body>');
 return close>=0?html.slice(0,close)+'<script src="/ui-latin.js"></script>'+html.slice(close):html+'<script src="/ui-latin.js"></script>';
}
function sendHtml(res,up,html){
 const body=Buffer.from(html);const headers={...up.headers,'content-type':'text/html; charset=utf-8','content-length':String(body.length),'cache-control':'no-store'};delete headers['content-encoding'];delete headers['transfer-encoding'];res.writeHead(up.status,headers);res.end(body);
}
function rewriteDashboard(html,mode){
 const normalized=normalizeDashboardMode(mode);
 const re=/<script type="application\/json" id="dash-data">([\s\S]*?)<\/script>/;
 const m=html.match(re);
 let out=html;
 if(m){try{
  const x=JSON.parse(m[1]);
  x.data=DISTRICTS.map(([key,h])=>{
   if(normalized==='medical'){
    const md=getMedicalDashboard(h);
    return regionForDashboard({key,name:key,turi:key.includes('shahri')?'shahar':'tuman'},{medicalEducation:{total:md.total,otm:md.otm,technical:md.technical}},'medical');
   }
   return regionForDashboard({key,name:key,turi:key.includes('shahri')?'shahar':'tuman'},buildDashboardSummary(db,h),'general');
  });
  x.meta={...(x.meta||{}),dashboardMode:normalized,manba:normalized==='medical'?'555(2).xlsx — tibbiyot bitiruvchilari':'Bitiruvchilar yagona bazasi'};
  out=out.replace(m[0],`<script type="application/json" id="dash-data">${JSON.stringify(x).replace(/</g,'\\u003c')}</script>`)
 }catch(e){console.error('dashboard mode rewrite',e)}}
 const close=out.toLowerCase().lastIndexOf('</body>');if(close>=0)out=out.slice(0,close)+'<script src="/medical-mode.js"></script><script src="/medical-enhance.js"></script><script src="/ranking-fix.js"></script><script src="/map-hover-fix.js"></script>'+out.slice(close);return injectLatin(out);
}
const server=http.createServer(async(req,res)=>{let u;try{u=new URL(req.url,'http://local')}catch{return res.end('Bad URL')}const p=u.pathname;
 if(req.method==='GET'&&['/medical-mode.js','/medical-enhance.js','/ranking-fix.js','/map-hover-fix.js','/ui-latin.js'].includes(p)){const f=path.join(__dirname,'public',p.slice(1));const b=fs.readFileSync(f);res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Content-Length':b.length,'Cache-Control':'no-store'});return res.end(b)}
 if(req.method==='GET'&&p==='/api/public/medical-dashboard')return json(res,200,getMedicalDashboard(u.searchParams.get('hudud')||''));
 if(req.method==='GET'&&p==='/api/public/rankings')return json(res,200,buildRankingSummary());
 if(req.method==='GET'&&p==='/api/private/medical-list'){
   if(!(await authenticated(req)))return json(res,401,{error:'Bitiruvchilar ro‘yxatini ko‘rish uchun tizimga kirish kerak.'});
   const hudud=u.searchParams.get('hudud')||'';const rows=publicMedicalList(hudud);const summary=summarizeMedicalRows(hudud);
   return json(res,200,{hudud,total:rows.length,summary,rows});
 }
 if(req.method==='GET'&&(p==='/'||p==='/dashboard'||p==='/dashboard.html')){try{const up=await getUpstreamHtml(p+u.search);return sendHtml(res,up,rewriteDashboard(up.body,u.searchParams.get('mode')))}catch(e){res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Dashboard backend tayyor emas.')}}
 if(req.method==='GET'&&(p==='/panel'||p==='/login')){try{const up=await getUpstreamHtml(p+u.search);return sendHtml(res,up,injectLatin(up.body))}catch(e){res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Sahifa vaqtincha tayyor emas.')}}
 return proxy(req,res)
});
server.listen(PORT,'0.0.0.0',()=>console.log('Medical dashboard gateway:',PORT));

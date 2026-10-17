'use strict';
const http=require('node:http');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const path=require('node:path');
const DB_PATH=process.env.DB_PATH||path.join(__dirname,'data.sqlite');
const PORT=Number(process.env.PORT)||3000;
const VERSION='2026-10-17-v3';
const EXPECTED_HASH='6b7ced3c7682ce99f97c2bad7acb2f5f77941efb4dcfca06ec3a019ebf51ae20';
const db=new DatabaseSync(DB_PATH);db.exec("CREATE TABLE IF NOT EXISTS app_meta(k TEXT PRIMARY KEY,v TEXT NOT NULL DEFAULT '')");
const done=db.prepare('SELECT v FROM app_meta WHERE k=?').get('full_seed_version');if(done&&done.v===VERSION){db.close();process.exit(0)}
const clean=(v,n=500)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const key=(fio,hud)=>clean(fio,180).toUpperCase().replace(/[^A-ZА-Я0-9]/g,'')+'|'+clean(hud,120).toUpperCase().replace(/[^A-ZА-Я0-9]/g,'');
function apply(payload){
 if(!payload||payload.version!==VERSION||!Array.isArray(payload.graduates)||payload.graduates.length!==9823)throw new Error('9823 yozuv tekshiruvi o‘tmadi');
 const higher=payload.graduates.filter(x=>x.bitirgan_turi==='Oliy ta’lim').length;if(higher!==3184)throw new Error('OTM soni 3184 emas');
 const rom=payload.graduates.filter(x=>String(x.hudud).includes('Ромитан'));if(rom.length!==651||rom.filter(x=>x.bitirgan_turi==='Oliy ta’lim').length!==209)throw new Error('Romitan tekshiruvi o‘tmadi');
 const oldOps=new Map();try{for(const r of db.prepare("SELECT fio,hudud,op_oshp FROM excel_graduates WHERE op_oshp<>''").all())oldOps.set(key(r.fio,r.hudud),r.op_oshp)}catch{}
 const ins=db.prepare(`INSERT INTO excel_graduates(fio,hudud,mahalla,toifa,holat,op_oshp,tugilgan_sana,yil,yosh,jins,bitirgan_turi,telefon,band_qilish_rejasi,izoh,medical_institution,medical_exam_date,diagnosis,recommendation,ambulatory,inpatient,operative,wellness_district,wellness_region,wellness_republic) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
 const mi=db.prepare(`INSERT INTO medical_graduates(fio,hudud,mahalla,address,education_level,institution,specialty,status,workplace,position,phone,note) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
 db.exec('BEGIN IMMEDIATE');try{
  db.exec('DELETE FROM medical_graduates; DELETE FROM excel_graduates');
  for(const g of payload.graduates){const op=oldOps.get(key(g.fio,g.hudud))||clean(g.op_oshp,220);ins.run(clean(g.fio,180),clean(g.hudud,120),clean(g.mahalla,180),clean(g.toifa,140),clean(g.holat,180),op,clean(g.tugilgan_sana,30),clean(g.yil,10),clean(g.yosh,10),clean(g.jins,30),clean(g.bitirgan_turi,100),clean(g.telefon,60),clean(g.band_qilish_rejasi,180),clean(g.izoh,500),clean(g.medical_institution,180),clean(g.medical_exam_date,30),clean(g.diagnosis,300),clean(g.recommendation,500),g.ambulatory?1:0,g.inpatient?1:0,g.operative?1:0,g.wellness_district?1:0,g.wellness_region?1:0,g.wellness_republic?1:0)}
  for(const m of (payload.medical_graduates||[]))mi.run(clean(m.fio,180),clean(m.hudud,120),clean(m.mahalla,180),clean(m.address,300),clean(m.education_level,80),clean(m.institution,250),clean(m.specialty,180),clean(m.status,180),clean(m.workplace,250),clean(m.position,180),clean(m.phone,60),clean(m.note,700));
  db.prepare('INSERT OR REPLACE INTO app_meta(k,v) VALUES(?,?)').run('full_seed_version',VERSION);db.exec('COMMIT');
 }catch(e){try{db.exec('ROLLBACK')}catch{}throw e}
 return {graduates:payload.graduates.length,higher,romitan:rom.length,romitanHigher:209,medical:(payload.medical_graduates||[]).length};
}
let server=http.createServer((req,res)=>{
 if(req.url==='/health'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('bootstrap-ready')}
 if(req.method!=='POST'||req.url!=='/internal/bootstrap-v3'){res.writeHead(404);return res.end()}
 const tok=String(req.headers['x-bootstrap-token']||'');const got=crypto.createHash('sha256').update(tok).digest('hex');if(tok.length<20||got!==EXPECTED_HASH){res.writeHead(404);return res.end()}
 let n=0,ch=[];req.on('data',d=>{n+=d.length;if(n>2*1024*1024){req.destroy();return}ch.push(d)});req.on('end',()=>{try{const payload=JSON.parse(zlib.gunzipSync(Buffer.concat(ch)).toString('utf8'));const out=apply(payload);const body=Buffer.from(JSON.stringify({ok:true,...out}));res.writeHead(200,{'Content-Type':'application/json','Content-Length':body.length});res.end(body);setTimeout(()=>server.close(()=>{db.close();process.exit(0)}),300)}catch(e){console.error(e);res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}))}})
});server.listen(PORT,()=>console.log('Full seed v3 bootstrap ready'));

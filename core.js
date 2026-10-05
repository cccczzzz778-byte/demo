const crypto=require('crypto');
function n(v,d=0){const x=Number(v);return Number.isFinite(x)?x:d}
function clamp(v,min,max){return Math.max(min,Math.min(max,n(v)))}
function safeText(v,max=1000){return String(v??'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function calcUnifiedKpi({ratings=[],appealsTotal=0,appealsResolved=0,authorityScore=0}={}){
 const nums=ratings.map(Number).filter(x=>Number.isFinite(x)&&x>=1&&x<=5);
 const avg=nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0;
 const qrScore=+(avg/5*30).toFixed(1);
 const totalA=Math.max(0,n(appealsTotal)); const resolved=Math.max(0,Math.min(totalA,n(appealsResolved)));
 const appealScore=+(totalA?resolved/totalA*30:0).toFixed(1);
 const authority=+clamp(authorityScore,0,40).toFixed(1);
 return {qrAvg:+avg.toFixed(2),qrScore,appealScore,authorityScore:authority,total:+(qrScore+appealScore+authority).toFixed(1)};
}
function summarizeKpi(data={}){
 const institutions=Array.isArray(data.institutions)?data.institutions:[];
 const evaluations=Array.isArray(data.evaluations)?data.evaluations:[];
 const map=new Map();
 for(const e of evaluations){const id=String(e?.institutionId??''); if(!id)continue; const x=map.get(id)||{score:0,evaluations:0}; x.score+=n(e?.score); x.evaluations++; map.set(id,x)}
 const rows=institutions.map(i=>{const id=String(i?.id??''); const x=map.get(id)||{score:0,evaluations:0}; return {id,name:safeText(i?.name,300),district:safeText(i?.district,200),type:safeText(i?.type,200),score:+x.score.toFixed(1),evaluations:x.evaluations}}).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 return {institutionsTotal:institutions.length,evaluatedInstitutions:[...map.keys()].filter(id=>institutions.some(i=>String(i.id)===id)).length,evaluationRecords:evaluations.length,scoreSum:+evaluations.reduce((s,e)=>s+n(e?.score),0).toFixed(1),period:data.period??null,selectedMonth:data.selectedMonth??null,currentMonth:data.currentMonth??null,rows};
}
function numOrNull(v){const x=Number(v);return Number.isFinite(x)?x:null}
function extractOnaStats(payload={}){
 const root=payload&&typeof payload==='object'?(payload.data&&typeof payload.data==='object'?payload.data:payload):{};
 const totals=root.totals&&typeof root.totals==='object'?root.totals:{};
 const deliveries=root.deliveries&&typeof root.deliveries==='object'?root.deliveries:{};
 const registered=numOrNull(root.registered??root.totalRegistered??root.registrationsTotal??totals.registered);
 const active=numOrNull(root.active??root.activePregnancies??root.pregnant??totals.active??totals.pregnant);
 const births=numOrNull(root.births??root.deliveriesTotal??deliveries.all_time??deliveries.total??totals.delivered);
 const rows=Array.isArray(root.districts)?root.districts:(Array.isArray(root.regions)?root.regions:[]);
 const districts=rows.map(x=>({
   name:safeText(x?.name??x?.name_uz??x?.district??x?.region,200),
   registered:numOrNull(x?.registered??x?.totalRegistered),
   active:numOrNull(x?.active??x?.pregnant),
   births:numOrNull(x?.births??x?.deliveries??x?.delivered)
 })).filter(x=>x.name);
 return {cards:{registered,active,births},districts};
}
function b64url(input){return Buffer.from(input).toString('base64url')}
function signSession(username,secret,now=Date.now(),ttl=8*60*60*1000){const payload={u:String(username),iat:now,exp:now+ttl}; const body=b64url(JSON.stringify(payload)); const sig=crypto.createHmac('sha256',String(secret)).update(body).digest('base64url'); return `${body}.${sig}`}
function verifySession(token,secret,now=Date.now()){
 try{const [body,sig]=String(token||'').split('.'); if(!body||!sig)return null; const expected=crypto.createHmac('sha256',String(secret)).update(body).digest('base64url'); const a=Buffer.from(sig),b=Buffer.from(expected); if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null; const p=JSON.parse(Buffer.from(body,'base64url').toString('utf8')); if(!p?.u||!p?.exp||now>Number(p.exp))return null; return {username:String(p.u),issuedAt:Number(p.iat)||0,expiresAt:Number(p.exp)};}catch{return null}
}
module.exports={safeText,calcUnifiedKpi,summarizeKpi,extractOnaStats,signSession,verifySession};

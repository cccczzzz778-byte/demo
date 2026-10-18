'use strict';
(()=>{
  const fmt=v=>new Intl.NumberFormat('uz-UZ').format(Number(v)||0);
  const pct=(v,t)=>Number(t)>0?((Number(v)||0)*100/Number(t)).toFixed(1)+'%':'0.0%';
  const norm=s=>String(s||'').toLowerCase().replace(/[‘’ʻʼ`´]/g,"'").replace(/\s+/g,' ').trim();
  let rows=[];
  try{
    const node=document.getElementById('dash-data');
    const parsed=node?JSON.parse(node.textContent||'{}'):{};
    rows=Array.isArray(parsed.data)?parsed.data:[];
  }catch{}

  function visible(el){
    const r=el.getBoundingClientRect();
    if(r.width<40||r.height<20)return false;
    const s=getComputedStyle(el);
    return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0;
  }
  function depth(el){let n=0;while(el&&el.parentElement){n++;el=el.parentElement}return n}
  function rowForText(text){
    const t=norm(text);
    return rows.find(r=>{
      const names=[r.name,r.key].filter(Boolean).map(norm);
      return names.some(x=>x&&t.includes(x));
    })||null;
  }
  function line(label,value,muted=''){
    return `<div style="display:flex;justify-content:space-between;gap:16px;align-items:center;margin-top:5px;font-size:12px;line-height:1.25"><span style="color:#9bb3bd;white-space:nowrap">${label}</span><b style="color:#e8f7f8;font-variant-numeric:tabular-nums;white-space:nowrap">${value}${muted?` <small style=\"font-size:10px;color:#7fded2;font-weight:700\">${muted}</small>`:''}</b></div>`;
  }
  function render(el,r){
    const total=Number(r.jami)||0;
    const medical=Boolean(r.medicalMode);
    const title=String(r.name||r.key||'Hudud');
    let body='';
    if(medical){
      const otm=Number(r.oliy)||0,tech=Number(r.texnikum)||0;
      body=line('Tibbiyot bitiruvchilari',fmt(total))+
           line('OTM',fmt(otm),pct(otm,total))+
           line('Texnikum',fmt(tech),pct(tech,total));
    }else{
      const working=Number(r.ishda)||0,unemployed=Number(r.ishsiz)||0,higher=Number(r.oliy)||0;
      body=line('Bitiruvchilar',fmt(total))+
           line('Ishga joylashgan',fmt(working),pct(working,total))+
           line('Ishsiz',fmt(unemployed),pct(unemployed,total))+
           line('OTM bitiruvchilari',fmt(higher),pct(higher,total));
    }
    el.innerHTML=`<div data-map-hover-fixed="1" style="min-width:175px;padding:1px 0"><div style="font-size:13px;font-weight:800;color:#f1fbfc;margin-bottom:7px">${title}</div>${body}</div>`;
  }
  function patch(){
    const candidates=[...document.querySelectorAll('div')].filter(el=>{
      if(!visible(el))return false;
      const t=el.textContent||'';
      if(t.length>650)return false;
      const legacy=/Bitiruvchilar/i.test(t)&&(/Ishga joylashgan/i.test(t)||/O['’ʻʼ`]z hududida/i.test(t)||/Bo['’ʻʼ`]sh shtat/i.test(t)||/NaN/i.test(t));
      const medical=/Tibbiyot bitiruvchilari/i.test(t)&&/NaN/i.test(t);
      return legacy||medical;
    });
    if(!candidates.length)return;
    candidates.sort((a,b)=>depth(b)-depth(a)||(a.textContent||'').length-(b.textContent||'').length);
    const el=candidates[0];
    const r=rowForText(el.textContent||'');
    if(r)render(el,r);
  }
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patch()})};
  const start=()=>{
    patch();
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});
    document.addEventListener('mousemove',schedule,{passive:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

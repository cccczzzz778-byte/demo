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
  function rowForText(text){
    const t=norm(text);
    return rows.find(r=>{
      const names=[r.name,r.key].filter(Boolean).map(norm);
      return names.some(x=>x&&t.includes(x));
    })||null;
  }
  function line(label,value,muted=''){
    return `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;height:18px;font-size:11px;line-height:18px"><span style="color:#9bb3bd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</span><b style="color:#e8f7f8;font-variant-numeric:tabular-nums;white-space:nowrap">${value}${muted?` <small style=\"font-size:9px;color:#7fded2;font-weight:700\">${muted}</small>`:''}</b></div>`;
  }
  function compactBox(el){
    el.style.setProperty('height','auto','important');
    el.style.setProperty('min-height','0','important');
    el.style.setProperty('max-height','118px','important');
    el.style.setProperty('width','210px','important');
    el.style.setProperty('min-width','210px','important');
    el.style.setProperty('max-width','210px','important');
    el.style.setProperty('overflow','hidden','important');
    el.style.setProperty('padding','9px 11px','important');
    el.style.setProperty('box-sizing','border-box','important');
  }
  function render(el,r){
    const total=Number(r.jami)||0;
    const medical=Boolean(r.medicalMode);
    const title=String(r.name||r.key||'Hudud');
    let body='';
    if(medical){
      const otm=Number(r.oliy)||0,tech=Number(r.texnikum)||0;
      body=line('Tibbiyot jami',fmt(total))+
           line('OTM',fmt(otm),pct(otm,total))+
           line('Texnikum',fmt(tech),pct(tech,total));
    }else{
      const working=Number(r.ishda)||0,unemployed=Number(r.ishsiz)||0,higher=Number(r.oliy)||0;
      body=line('Bitiruvchilar',fmt(total))+
           line('Ishga joylashgan',fmt(working),pct(working,total))+
           line('Ishsiz',fmt(unemployed),pct(unemployed,total))+
           line('OTM',fmt(higher),pct(higher,total));
    }
    compactBox(el);
    el.dataset.hoverDistrict=String(r.key||r.name||'');
    el.innerHTML=`<div data-map-hover-fixed="1" style="width:100%;height:auto;min-height:0;max-height:100px;overflow:hidden"><div style="font-size:12px;line-height:16px;font-weight:800;color:#f1fbfc;margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>${body}</div>`;
  }
  function patch(){
    const candidates=[...document.querySelectorAll('#map .tip')].filter(visible);
    for(const el of candidates){
      const r=rowForText(el.textContent||'');
      if(!r)continue;
      const fixed=el.querySelector('[data-map-hover-fixed="1"]');
      const key=String(r.key||r.name||'');
      if(fixed&&el.dataset.hoverDistrict===key)return;
      render(el,r);
      return;
    }
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

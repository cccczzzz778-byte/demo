'use strict';
(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>new Intl.NumberFormat('uz-UZ').format(Number(n)||0);
 const pct=(n,t)=>t>0?(Number(n||0)*100/Number(t)).toFixed(1)+'%':'0.0%';
 const style=document.createElement('style');
 style.id='dual-stat-panels-style';
 style.textContent=`
  .dual-stat{position:fixed;z-index:55;width:300px;max-height:calc(100vh - 32px);overflow:auto;background:#071922ed;border:1px solid #1f5267;border-radius:14px;color:#e8f5f7;box-shadow:0 16px 50px #0008;font:13px system-ui,-apple-system,Segoe UI,sans-serif;backdrop-filter:blur(11px);scrollbar-width:thin;scrollbar-color:#23566b transparent}
  #province-stats{left:14px;top:14px}
  #area-stats{right:14px;top:64px}
  .dual-stat .h{padding:12px 13px;border-bottom:1px solid #173d4c;display:flex;justify-content:space-between;gap:10px;align-items:center;background:#071922f5;position:sticky;top:0;z-index:2}
  .dual-stat h2{font-size:14px;margin:0;font-weight:800;letter-spacing:.1px}
  .dual-stat .sub{font-size:10.5px;color:#84a4b0;margin-top:2px}
  .dual-stat .section{padding:10px 11px 0}
  .dual-stat .section-title{font-size:10px;color:#789da9;text-transform:uppercase;letter-spacing:.9px;font-weight:800;margin:0 0 7px}
  .dual-stat .grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  .dual-stat .c{background:#0a222d;border:1px solid #163d4d;border-radius:9px;padding:8px;min-width:0}
  .dual-stat .c span{display:block;color:#91b0bb;font-size:10px;line-height:1.2}
  .dual-stat .c b{display:block;font-size:19px;line-height:1.1;margin-top:4px;color:#42e1d0;font-variant-numeric:tabular-nums}
  .dual-stat .c em{display:block;color:#75a4b2;font-size:9.5px;font-style:normal;margin-top:3px}
  .dual-stat .wide{grid-column:1/-1}
  .dual-stat .med{margin:10px 11px 0;border:1px solid #23566b;border-radius:9px;padding:9px;background:#091d27}
  .dual-stat .med .big{font-size:22px;font-weight:800;margin:3px 0;color:#f2fbfd}
  .dual-stat .med b{color:#42e1d0}
  .dual-stat .dx{padding:10px 11px 12px}
  .dual-stat .dx h3{font-size:11px;margin:0 0 6px;color:#d9eef2}
  .dual-stat .dxrow{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #123442;font-size:10.5px}
  .dual-stat .dxrow span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dual-stat button{background:#0b2733;border:1px solid #285b70;color:#cde6ec;border-radius:7px;padding:4px 8px;cursor:pointer;min-width:28px}
  .dual-stat .empty{font-size:10.5px;color:#84a4b0;padding:2px 0 8px}
  @media(max-width:1050px){.dual-stat{width:270px}.dual-stat .c b{font-size:17px}}
  @media(max-width:760px){#province-stats{left:8px;top:58px;width:calc(50vw - 12px);max-height:40vh}#area-stats{right:8px;top:58px;width:calc(50vw - 12px);max-height:40vh}.dual-stat .grid{grid-template-columns:1fr}.dual-stat .wide{grid-column:auto}.dual-stat .med,.dual-stat .dx{display:none}.dual-stat h2{font-size:12px}.dual-stat .sub{font-size:9px}.dual-stat .c{padding:6px}.dual-stat .c b{font-size:15px}}
 `;
 document.head.append(style);
 function shell(id,title,sub){const el=document.createElement('section');el.id=id;el.className='dual-stat';el.innerHTML=`<div class="h"><div><h2>${esc(title)}</h2><div class="sub area-name">${esc(sub)}</div></div><button class="toggle">−</button></div><div class="panel-body"><div class="section"><div class="section-title">Asosiy ko‘rsatkichlar</div><div class="grid stats-grid"></div></div><div class="med"></div><div class="dx"><h3>Kasalliklar statistikasi</h3><div class="dx-list"></div></div></div>`;document.body.append(el);const b=el.querySelector('.panel-body');el.querySelector('.toggle').onclick=e=>{b.hidden=!b.hidden;e.currentTarget.textContent=b.hidden?'+':'−'};return el}
 const province=shell('province-stats','Buxoro viloyati','Umumiy statistika');
 const area=shell('area-stats','Tanlangan hudud','Viloyat bo‘yicha sog‘liq holati');
 function metric(label,value,total,extra=''){return `<div class="c"><span>${esc(label)}</span><b>${fmt(value)}</b>${total!==undefined?`<em>${pct(value,total)}</em>`:extra?`<em>${esc(extra)}</em>`:''}</div>`}
 function medHtml(m={}){return `<div style="font-size:10px;color:#91b0bb">Tibbiyot sohasida o‘qiganlar</div><div class="big">${fmt(m.total)}</div><div style="font-size:11px">OTM: <b>${fmt(m.otm)}</b> &nbsp; · &nbsp; Texnikum: <b>${fmt(m.technical)}</b></div>`}
 function diagnosesHtml(dx=[]){return dx.length?dx.slice(0,5).map(x=>`<div class="dxrow"><span title="${esc(x.name)}">${esc(x.name)}</span><b>${fmt(x.count)}</b></div>`).join(''):'<div class="empty">Kasallik ma’lumoti mavjud emas.</div>'}
 function renderProvince(s){const total=Number(s.total)||0;province.querySelector('.area-name').textContent='Umumiy statistika';province.querySelector('.stats-grid').innerHTML=[metric('Jami bitiruvchi',s.total),metric('Oliy ma’lumotli',s.higher,total),metric('Oliy ma’lumotli emas',s.nonHigher,total),metric('Ishlaydi',s.working,total),metric('Ishsiz',s.unemployed,total)].join('');province.querySelector('.med').innerHTML=medHtml(s.medicalEducation);province.querySelector('.dx').style.display='none'}
 function renderArea(s,selected){const total=Number(s.total)||0,unexamined=Math.max(0,total-(Number(s.examined)||0));area.querySelector('h2').textContent=selected?(s.hudud||selected):'Sog‘liq statistikasi';area.querySelector('.area-name').textContent=selected?'Tanlangan hudud':'Buxoro viloyati';area.querySelector('.stats-grid').innerHTML=[metric('Jami',s.total),metric('Oliy ma’lumotli',s.higher,total),metric('Ishlaydi',s.working,total),metric('Ishsiz',s.unemployed,total),metric('Ko‘rikdan o‘tgan',s.examined,total),metric('Ko‘rikdan o‘tmagan',unexamined,total),metric('Sog‘lom',s.healthy,s.examined||0),metric('Kasal',s.sick,s.examined||0)].join('');area.querySelector('.med').innerHTML=medHtml(s.medicalEducation);area.querySelector('.dx-list').innerHTML=diagnosesHtml(s.diagnoses||[])}
 async function fetchSummary(hudud=''){const q=hudud?('?hudud='+encodeURIComponent(hudud)):'';const r=await fetch('/api/public/dashboard-summary'+q,{cache:'no-store'});const s=await r.json();if(!r.ok)throw new Error(s.error||'Xatolik');return s}
 async function loadProvince(){try{renderProvince(await fetchSummary(''))}catch(e){province.querySelector('.stats-grid').innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
 async function loadArea(selected=''){try{renderArea(await fetchSummary(selected),selected)}catch(e){area.querySelector('.stats-grid').innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
 function titleArea(){const t=document.getElementById('left-title')?.textContent?.trim()||'';if(!t||/viloyat/i.test(t))return '';return t}
 let last='__';function refreshArea(){const a=titleArea();if(a!==last){last=a;loadArea(a)}}
 function init(){loadProvince();loadArea('');const t=document.getElementById('left-title');if(t)new MutationObserver(refreshArea).observe(t,{subtree:true,childList:true,characterData:true});else{const obs=new MutationObserver(()=>{const x=document.getElementById('left-title');if(x){obs.disconnect();new MutationObserver(refreshArea).observe(x,{subtree:true,childList:true,characterData:true});refreshArea()}});obs.observe(document.body,{subtree:true,childList:true})}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

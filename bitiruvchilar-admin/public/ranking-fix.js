'use strict';
(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const card=(label,item)=>`<div class="rank"><span>${esc(label)}</span><b title="${esc(item?.name||'—')}">${esc(item?.name||'—')}</b><em>${esc(item?.value||'0')}</em></div>`;
  let payload=null;
  function paint(){
    if(!payload)return;
    let bar=document.getElementById('region-rankbar');
    if(!bar){bar=document.createElement('section');bar.id='region-rankbar';bar.className='rankbar';document.body.append(bar)}
    const w=payload.winners||{};
    bar.dataset.rankingSource='verified';
    bar.innerHTML=`<div class="title">Hududlar reytingi</div><div class="rankgrid">${card('Eng yuqori bandlik',w.employment)}${card('Eng ko‘p ishsiz',w.unemployed)}${card('Eng yuqori OTM ulushi',w.higher)}${card('Eng yuqori ko‘rik qamrovi',w.exam)}${card('Eng ko‘p kasal',w.sick)}</div><div class="clickhint">Hududni batafsil ko‘rish uchun 3D xaritadagi tuman/shaharni bosing</div>`;
  }
  async function init(){
    try{
      const r=await fetch('/api/public/rankings',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Reyting ma’lumoti yuklanmadi');
      payload=j;
      paint();setTimeout(paint,300);setTimeout(paint,1000);setTimeout(paint,2000);
    }catch(e){console.error('Hududlar reytingi:',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

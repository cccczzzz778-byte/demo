export const RESIDENTIAL_DPM_LAYOUT_MARKER = 'BUXORO_SSB_RESIDENTIAL_DPM_LAYOUT_V2';

export function patchResidentialAndDpmLayout(input: string): string {
  if (!input || input.includes(RESIDENTIAL_DPM_LAYOUT_MARKER)) return input;
  let html = input;

  // Every OP/OShP/TTB/MP(KTMP)/SHTB gets exactly 10 clearly visible residential models.
  html = html.replace(
    'const HOUSE_COUNTS_3D={TTB:10,SHTB:10,OP:5,OShP:4},MAX_HOUSE_INSTANCES=900',
    'const HOUSE_COUNTS_3D={TTB:10,SHTB:10,MP:10,KTMP:10,OP:10,OShP:10},MAX_HOUSE_INSTANCES=2600'
  );
  html = html.replace(
    'const HOUSE_COUNTS_3D={TTB:10,SHTB:10,KTMP:10,OP:10,OShP:10},MAX_HOUSE_INSTANCES=2600',
    'const HOUSE_COUNTS_3D={TTB:10,SHTB:10,MP:10,KTMP:10,OP:10,OShP:10},MAX_HOUSE_INSTANCES=2600'
  );
  html = html.replace(
    'for(let ring=0;ring<4&&pts.length<wanted;ring++)for(let a=0;a<28&&pts.length<wanted;a++){',
    'for(let ring=0;ring<12&&pts.length<wanted;ring++)for(let a=0;a<36&&pts.length<wanted;a++){'
  );
  html = html.replace(
    'const ang=base*6.283+a*6.283/28+ring*.17,off=(p.I.type==="TTB"||p.I.type==="SHTB"?1.35:.72)+ring*.34,q=[p.d[4]+Math.cos(ang)*off,p.d[5]+Math.sin(ang)*off];',
    'const ang=base*6.283+a*6.283/36+ring*.17,off=(p.I.type==="TTB"||p.I.type==="SHTB"?1.0:(p.I.type==="MP"||p.I.type==="KTMP")?.85:.62)+ring*.18,q=[p.d[4]+Math.cos(ang)*off,p.d[5]+Math.sin(ang)*off];'
  );
  html = html.replace(
    'const ang=base*6.283+a*6.283/28+ring*.17,off=(p.I.type==="TTB"||p.I.type==="SHTB"?1.35:p.I.type==="KTMP"?1.05:.82)+ring*.34,q=[p.d[4]+Math.cos(ang)*off,p.d[5]+Math.sin(ang)*off];',
    'const ang=base*6.283+a*6.283/36+ring*.17,off=(p.I.type==="TTB"||p.I.type==="SHTB"?1.0:(p.I.type==="MP"||p.I.type==="KTMP")?.85:.62)+ring*.18,q=[p.d[4]+Math.cos(ang)*off,p.d[5]+Math.sin(ang)*off];'
  );
  html = html.replace(
    'm4.makeScale(.45,.58,.45).setPosition(w[0],p.y+.04,w[1]);bodies.setMatrixAt(i,m4);m4.makeScale(.51,.28,.51).setPosition(w[0],p.y+.62,w[1]);roofs.setMatrixAt(i,m4)',
    'm4.makeScale(.72,.78,.72).setPosition(w[0],p.y+.04,w[1]);bodies.setMatrixAt(i,m4);m4.makeScale(.80,.38,.80).setPosition(w[0],p.y+.82,w[1]);roofs.setMatrixAt(i,m4)'
  );
  html = html.replace(
    'const center=(p.I.type==="TTB"||p.I.type==="SHTB")?p.I.name:null;',
    'const center=(p.I.type==="TTB"||p.I.type==="SHTB"||p.I.type==="MP"||p.I.type==="KTMP")?p.I.name:null;'
  );
  html = html.replace(
    'const center=(p.I.type==="TTB"||p.I.type==="SHTB"||p.I.type==="KTMP")?p.I.name:null;',
    'const center=(p.I.type==="TTB"||p.I.type==="SHTB"||p.I.type==="MP"||p.I.type==="KTMP")?p.I.name:null;'
  );

  const nonce = html.match(/nonce=["']([^"']+)["']/)?.[1] || '';
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  const css = `<style${nonceAttr} id="buxoro-residential-dpm-layout-style">
/* ${RESIDENTIAL_DPM_LAYOUT_MARKER} */
#dpmCityMapPanel{background:linear-gradient(180deg,#061a31 0%,#081f39 52%,#06172b 100%)!important}
.dpm-city-head{height:auto!important;min-height:68px!important;padding:14px 20px!important;box-sizing:border-box!important;background:rgba(5,24,45,.96)!important;backdrop-filter:blur(10px)}
.dpm-city-title{font-size:22px!important}.dpm-city-sub{font-size:11px!important}
#dpmCityStage{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) 340px!important;gap:14px!important;padding:14px 18px 18px!important;min-height:0!important;overflow:hidden!important}
.dpm-city-mapbox{position:relative!important;inset:auto!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;border-radius:14px!important;background:linear-gradient(145deg,rgba(13,54,89,.8),rgba(5,27,54,.98))!important}
#dpmCitySvg{width:100%!important;height:100%!important;position:absolute!important;inset:0!important}
.dpm-city-pin-label{display:none!important}
.dpm-pin .halo{fill:rgba(69,214,174,.1)!important;stroke-width:1.5!important}.dpm-pin .pin{stroke-width:2.5!important}
#dpmVisualPins{position:absolute;inset:5% 5% 9%;z-index:4;pointer-events:none}
.dpm-vpin{position:absolute;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;border:2px solid #61efc3;background:#082d49;box-shadow:0 0 0 7px rgba(70,226,182,.11),0 4px 14px rgba(0,0,0,.4);pointer-events:auto;cursor:pointer;display:grid;place-items:center;color:#61efc3;font-weight:1000;font-size:17px;transition:.16s ease}
.dpm-vpin:hover,.dpm-vpin.active{border-color:#ffd76a;color:#ffd76a;box-shadow:0 0 0 9px rgba(255,215,106,.13),0 5px 18px rgba(0,0,0,.45);transform:translate(-50%,-50%) scale(1.12)}
.dpm-vpin-label{position:absolute;left:50%;top:36px;transform:translateX(-50%);min-width:110px;max-width:155px;padding:4px 6px;border:1px solid rgba(119,211,237,.36);border-radius:6px;background:rgba(3,23,43,.9);color:#effbff;font-size:9px;font-weight:800;line-height:1.15;text-align:center;white-space:normal;opacity:0;pointer-events:none;transition:.14s}
.dpm-vpin:hover .dpm-vpin-label,.dpm-vpin.active .dpm-vpin-label{opacity:1}
#dpmCityDetails{left:28px!important;bottom:30px!important;max-width:min(480px,calc(100% - 390px))!important;border-radius:12px!important;background:rgba(4,22,42,.93)!important;z-index:8!important}
#dpmCardRail{min-width:0;min-height:0;display:flex;flex-direction:column;border:1px solid rgba(113,222,248,.22);border-radius:14px;background:rgba(5,27,51,.86);overflow:hidden;box-shadow:0 16px 36px rgba(0,0,0,.22)}
.dpm-card-rail-head{padding:12px 13px;border-bottom:1px solid rgba(113,222,248,.16);background:rgba(9,42,72,.82)}
.dpm-card-rail-head strong{display:block;font-size:13px;color:#f2fbff}.dpm-card-rail-head span{display:block;margin-top:3px;font-size:10px;color:#8fb9cc}
#dpmCardList{padding:9px;overflow:auto;display:grid;gap:7px;align-content:start;scrollbar-width:thin}
.dpm-list-card{appearance:none;width:100%;text-align:left;border:1px solid rgba(119,207,232,.16);border-radius:10px;background:rgba(8,38,65,.72);padding:9px 10px;color:#ecf9ff;cursor:pointer;transition:transform .14s ease,border-color .14s ease,background .14s ease;box-shadow:none}
.dpm-list-card:hover{transform:translateY(-1px);border-color:rgba(91,229,193,.52);background:rgba(10,49,79,.92)}
.dpm-list-card.active{border-color:#5be5c1;background:rgba(15,73,89,.8);box-shadow:inset 3px 0 0 #5be5c1}
.dpm-list-card-name{display:block;font-size:12px;line-height:1.3;font-weight:800}.dpm-list-card-meta{display:block;margin-top:4px;font-size:9px;color:#8fb9cc;text-transform:uppercase;letter-spacing:.05em}
.dpm-city-credit{display:none!important}
@media(max-width:900px){#dpmCityStage{grid-template-columns:1fr!important;grid-template-rows:minmax(360px,1fr) 190px!important}.dpm-city-mapbox{grid-row:1}.dpm-card-rail{grid-row:2}#dpmCityDetails{left:22px!important;right:22px!important;bottom:218px!important;max-width:none!important}#dpmCardList{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.dpm-city-head{padding:10px 12px!important}.dpm-city-title{font-size:18px!important}#dpmCityStage{padding:8px!important;gap:8px!important;grid-template-rows:minmax(300px,1fr) 180px!important}#dpmCityDetails{left:14px!important;right:14px!important;bottom:202px!important;padding:8px 10px!important}#dpmCardList{grid-template-columns:1fr}.dpm-city-count{padding:6px 9px!important}.dpm-vpin{width:24px;height:24px;font-size:14px}.dpm-vpin-label{display:none}}
</style><meta name="buxoro-residential-dpm-layout" content="${RESIDENTIAL_DPM_LAYOUT_MARKER}">`;
  html = html.includes('</head>') ? html.replace('</head>', css + '</head>') : html;

  const runtime = `
/* ${RESIDENTIAL_DPM_LAYOUT_MARKER} */
function ensureDpmCardRail(){
 const stage=document.getElementById('dpmCityStage');if(!stage)return null;let rail=document.getElementById('dpmCardRail');if(rail)return rail;
 rail=document.createElement('aside');rail.id='dpmCardRail';rail.className='dpm-card-rail';rail.setAttribute('aria-label','DPM muassasalari');
 const head=document.createElement('div');head.className='dpm-card-rail-head';const strong=document.createElement('strong');strong.textContent='DPM muassasalari';const sub=document.createElement('span');sub.textContent='Muassasani tanlash uchun kartani bosing';head.append(strong,sub);
 const list=document.createElement('div');list.id='dpmCardList';rail.append(head,list);stage.appendChild(rail);return rail;
}
function syncDpmCardSelection(name){document.querySelectorAll('.dpm-list-card,.dpm-vpin').forEach(card=>card.classList.toggle('active',card.dataset.name===name))}
function setDpmDetails(I){const box=document.getElementById('dpmCityDetails');if(!box||!I)return;box.innerHTML='<div class="dpm-city-details-title"></div><div class="dpm-city-details-meta">DPM · Buxoro shahri</div>';box.querySelector('.dpm-city-details-title').textContent=I.name||'DPM';syncDpmCardSelection(I.name||'')}
function renderDpmVisualPins(selectedName=''){
 const mapbox=document.querySelector('.dpm-city-mapbox');if(!mapbox)return;let layer=document.getElementById('dpmVisualPins');if(!layer){layer=document.createElement('div');layer.id='dpmVisualPins';mapbox.appendChild(layer)}layer.textContent='';
 const dpms=typeof INS!=='undefined'?INS.filter(isDpmCityInstitution):[];const cols=6,rows=Math.max(1,Math.ceil(dpms.length/cols));
 dpms.forEach((I,i)=>{const row=Math.floor(i/cols),col=i%cols;const stagger=row%2?4:0;const x=10+col*(80/Math.max(1,cols-1))+stagger;const y=13+row*(72/Math.max(1,rows-1));const pin=document.createElement('button');pin.type='button';pin.className='dpm-vpin'+(I.name===selectedName?' active':'');pin.dataset.name=I.name||'';pin.style.left=Math.min(94,x)+'%';pin.style.top=Math.min(90,y)+'%';pin.textContent='+';const lab=document.createElement('span');lab.className='dpm-vpin-label';lab.textContent=I.name||'DPM';pin.appendChild(lab);pin.addEventListener('click',()=>setDpmDetails(I));layer.appendChild(pin)});
}
function renderDpmCards(selectedName=''){
 const rail=ensureDpmCardRail(),list=document.getElementById('dpmCardList');if(!rail||!list)return;const dpms=typeof INS!=='undefined'?INS.filter(isDpmCityInstitution):[];list.textContent='';
 dpms.forEach(I=>{const card=document.createElement('button');card.type='button';card.className='dpm-list-card'+(I.name===selectedName?' active':'');card.dataset.name=I.name||'';const name=document.createElement('span');name.className='dpm-list-card-name';name.textContent=I.name||'DPM';const meta=document.createElement('span');meta.className='dpm-list-card-meta';meta.textContent='DPM · Buxoro shahri';card.append(name,meta);card.addEventListener('click',()=>{setDpmDetails(I);card.scrollIntoView({block:'nearest',behavior:'smooth'})});list.appendChild(card)});renderDpmVisualPins(selectedName);
}
if(typeof renderDpmCityMap==='function'){
 const __renderDpmCityMapClean=renderDpmCityMap;
 renderDpmCityMap=function(selectedName=''){__renderDpmCityMapClean(selectedName);renderDpmCards(selectedName);};
}
if(typeof showDpmCityMap==='function'){
 const __showDpmCityMapClean=showDpmCityMap;
 showDpmCityMap=function(show){const r=__showDpmCityMapClean(show);if(show)requestAnimationFrame(()=>renderDpmCards(new URLSearchParams(location.search).get('focusName')||''));return r;};
}
`;
  const pos = html.lastIndexOf('</script>');
  if (pos >= 0) html = html.slice(0, pos) + runtime + html.slice(pos);
  return html;
}

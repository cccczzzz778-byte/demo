export const RESIDENTIAL_DPM_LAYOUT_MARKER = 'BUXORO_SSB_RESIDENTIAL_DPM_LAYOUT_V3';

export function patchResidentialAndDpmLayout(input: string): string {
  if (!input || input.includes(RESIDENTIAL_DPM_LAYOUT_MARKER)) return input;
  let html = input;

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
    'm4.makeScale(.52,.56,.52).setPosition(w[0],p.y+.04,w[1]);bodies.setMatrixAt(i,m4);m4.makeScale(.58,.30,.58).setPosition(w[0],p.y+.60,w[1]);roofs.setMatrixAt(i,m4)'
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
#dpmCityMapPanel{background:#06182c!important}
.dpm-city-head{height:auto!important;min-height:66px!important;padding:12px 18px!important;box-sizing:border-box!important;background:#071c34!important}
#dpmCityStage{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) 340px!important;gap:12px!important;padding:12px 16px 16px!important;min-height:0!important;overflow:hidden!important}
.dpm-city-mapbox{position:relative!important;inset:auto!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;border-radius:14px!important;overflow:hidden!important;background:#08213c!important;border:1px solid rgba(112,218,255,.22)!important}
#dpmCitySvg{display:none!important}
#dpmSchematic{position:absolute;inset:4%;overflow:hidden}
#dpmSchematic::before{content:"";position:absolute;inset:6% 7% 7%;clip-path:polygon(15% 11%,83% 9%,94% 31%,90% 66%,74% 89%,28% 91%,10% 68%,6% 35%);background:linear-gradient(145deg,#123e67,#0a2a4b);border:1px solid rgba(123,224,250,.5);box-shadow:inset 0 0 60px rgba(0,0,0,.18),0 0 25px rgba(60,196,235,.08)}
#dpmSchematic::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(113,211,240,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(113,211,240,.08) 1px,transparent 1px);background-size:42px 42px;pointer-events:none}
#dpmPinLayer{position:absolute;inset:10% 11% 12%;z-index:3}
.dpm-map-pin{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;border:2px solid #63efc5;background:#082a45;color:#63efc5;font-weight:900;display:grid;place-items:center;cursor:pointer;box-shadow:0 0 0 5px rgba(99,239,197,.10),0 4px 12px rgba(0,0,0,.35);font-size:14px;padding:0}
.dpm-map-pin:hover,.dpm-map-pin.active{border-color:#ffd468;color:#ffd468;box-shadow:0 0 0 7px rgba(255,212,104,.12),0 5px 16px rgba(0,0,0,.42);z-index:5}
.dpm-map-label{position:absolute;left:50%;top:28px;transform:translateX(-50%);display:none;min-width:100px;max-width:150px;padding:4px 6px;border-radius:6px;border:1px solid rgba(116,215,241,.35);background:rgba(3,23,43,.95);color:#eefaff;font-size:9px;line-height:1.15;pointer-events:none}
.dpm-map-pin:hover .dpm-map-label,.dpm-map-pin.active .dpm-map-label{display:block}
#dpmCityDetails{left:30px!important;bottom:28px!important;max-width:min(520px,calc(100% - 390px))!important;z-index:6!important}
#dpmCardRail{min-width:0;min-height:0;display:flex;flex-direction:column;border:1px solid rgba(113,222,248,.20);border-radius:14px;background:#071d35;overflow:hidden}
.dpm-card-rail-head{padding:11px 12px;border-bottom:1px solid rgba(113,222,248,.14);background:#0a2947}.dpm-card-rail-head strong{display:block;font-size:13px}.dpm-card-rail-head span{display:block;margin-top:3px;font-size:10px;color:#92b9ca}
#dpmCardList{padding:8px;overflow:auto;display:grid;gap:6px;align-content:start}
.dpm-list-card{width:100%;text-align:left;border:1px solid rgba(119,207,232,.16);border-radius:9px;background:#082640;padding:8px 9px;color:#eef9ff;cursor:pointer}.dpm-list-card:hover{border-color:rgba(91,229,193,.52)}.dpm-list-card.active{border-color:#5be5c1;background:#0b3c4a;box-shadow:inset 3px 0 0 #5be5c1}
.dpm-list-card-name{display:block;font-size:11px;line-height:1.25;font-weight:800}.dpm-list-card-meta{display:block;margin-top:3px;font-size:8px;color:#8fb9cc;text-transform:uppercase}
.dpm-city-credit{display:none!important}
@media(max-width:900px){#dpmCityStage{grid-template-columns:1fr!important;grid-template-rows:minmax(360px,1fr) 190px!important}#dpmCardRail{grid-row:2}#dpmCityDetails{left:20px!important;right:20px!important;bottom:215px!important;max-width:none!important}}
</style><meta name="buxoro-residential-dpm-layout" content="${RESIDENTIAL_DPM_LAYOUT_MARKER}">`;
  html = html.includes('</head>') ? html.replace('</head>', css + '</head>') : html;

  const runtime = `
/* ${RESIDENTIAL_DPM_LAYOUT_MARKER} */
function ensureDpmUi(){
 const stage=document.getElementById('dpmCityStage'),mapbox=document.querySelector('.dpm-city-mapbox');if(!stage||!mapbox)return null;
 let schematic=document.getElementById('dpmSchematic');if(!schematic){schematic=document.createElement('div');schematic.id='dpmSchematic';const pins=document.createElement('div');pins.id='dpmPinLayer';schematic.appendChild(pins);mapbox.appendChild(schematic)}
 let rail=document.getElementById('dpmCardRail');if(!rail){rail=document.createElement('aside');rail.id='dpmCardRail';const head=document.createElement('div');head.className='dpm-card-rail-head';head.innerHTML='<strong>DPM muassasalari</strong><span>Muassasani tanlash uchun kartani bosing</span>';const list=document.createElement('div');list.id='dpmCardList';rail.append(head,list);stage.appendChild(rail)}
 return {schematic,rail};
}
function dpmList(){return typeof INS!=='undefined'?INS.filter(I=>I&&(I.type==='V'||I.type==='DPM')):[]}
function syncDpmSelection(name){document.querySelectorAll('.dpm-list-card,.dpm-map-pin').forEach(x=>x.classList.toggle('active',x.dataset.name===name))}
function setDpmDetails(I){if(!I)return;const box=document.getElementById('dpmCityDetails');if(box){box.innerHTML='<div class="dpm-city-details-title"></div><div class="dpm-city-details-meta">DPM · Buxoro shahri</div>';box.querySelector('.dpm-city-details-title').textContent=I.name||'DPM'}syncDpmSelection(I.name||'')}
function dpmPoint(index,total){const cols=6,rows=Math.max(1,Math.ceil(total/cols)),r=Math.floor(index/cols),c=index%cols;let x=14+c*(72/Math.max(1,cols-1));let y=16+r*(68/Math.max(1,rows-1));if(r%2)x+=3;return [Math.min(88,Math.max(12,x)),Math.min(84,Math.max(14,y))]}
function renderCleanDpm(selectedName=''){
 ensureDpmUi();const dpms=dpmList(),pins=document.getElementById('dpmPinLayer'),list=document.getElementById('dpmCardList'),count=document.getElementById('dpmCityCount');if(count)count.textContent=String(dpms.length);if(!pins||!list)return;pins.textContent='';list.textContent='';
 dpms.forEach((I,i)=>{const [x,y]=dpmPoint(i,dpms.length);const pin=document.createElement('button');pin.type='button';pin.className='dpm-map-pin'+(I.name===selectedName?' active':'');pin.dataset.name=I.name||'';pin.style.left=x+'%';pin.style.top=y+'%';pin.textContent='+';const lab=document.createElement('span');lab.className='dpm-map-label';lab.textContent=I.name||'DPM';pin.appendChild(lab);pin.onclick=()=>setDpmDetails(I);pins.appendChild(pin);
 const card=document.createElement('button');card.type='button';card.className='dpm-list-card'+(I.name===selectedName?' active':'');card.dataset.name=I.name||'';const nm=document.createElement('span');nm.className='dpm-list-card-name';nm.textContent=I.name||'DPM';const mt=document.createElement('span');mt.className='dpm-list-card-meta';mt.textContent='DPM · Buxoro shahri';card.append(nm,mt);card.onclick=()=>{setDpmDetails(I);card.scrollIntoView({block:'nearest'})};list.appendChild(card)});
 if(selectedName){const f=dpms.find(I=>I.name===selectedName);if(f)setDpmDetails(f)}
}
if(typeof renderDpmCityMap==='function'){const __baseRenderDpm=renderDpmCityMap;renderDpmCityMap=function(selectedName=''){try{__baseRenderDpm(selectedName)}catch{};renderCleanDpm(selectedName)}}
if(typeof showDpmCityMap==='function'){const __baseShowDpm=showDpmCityMap;showDpmCityMap=function(show){const r=__baseShowDpm(show);if(show)setTimeout(()=>renderCleanDpm(new URLSearchParams(location.search).get('focusName')||''),0);return r}}
setTimeout(()=>{try{if(new URLSearchParams(location.search).get('mapMode')==='dpm')renderCleanDpm(new URLSearchParams(location.search).get('focusName')||'')}catch{}},180);
`;
  const pos = html.lastIndexOf('</script>');
  if (pos >= 0) html = html.slice(0, pos) + runtime + html.slice(pos);
  return html;
}

export const MAP_MODES_MARKER='BUXORO_SSB_MAP_MODES_TV_V1';

export function patchMapModesTv(input:string):string{
  if(!input||input.includes(MAP_MODES_MARKER))return input;

  // Do not build or animate the old medical-data flow at all. Removing it only
  // after render still costs geometry/material creation and causes visible lag.
  let html=input
    .replaceAll('buildHierarchicalFlows();','/* medical data flow disabled */')
    .replaceAll('animateHierarchicalFlows(T);','/* medical data flow disabled */');

  // A non-HTML snippet is still useful for regression testing the flow removal.
  if(!html.includes('</script>'))return html;

  const nonce=html.match(/nonce=["']([^"']+)["']/)?.[1]||'';
  const nonceAttr=nonce?` nonce="${nonce}"`:'';
  const css=`<style${nonceAttr} id="buxoro-map-modes-style">
#mapModeToolbar{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:10050;display:flex;gap:7px;align-items:center;padding:7px 8px;border:1px solid rgba(91,205,244,.36);border-radius:12px;background:rgba(3,18,40,.9);backdrop-filter:blur(9px);box-shadow:0 8px 28px rgba(0,0,0,.28)}
#mapModeToolbar button{border:1px solid rgba(117,207,238,.35);background:#0a3156;color:#eafaff;border-radius:8px;padding:8px 11px;font:700 12px system-ui;cursor:pointer;white-space:nowrap}#mapModeToolbar button:hover,#mapModeToolbar button.active{background:#176a91;border-color:#7ee0ff}.map-mode-wrap{position:relative}.map-mode-menu{display:none;position:absolute;top:42px;left:0;width:285px;padding:7px;background:rgba(4,24,49,.97);border:1px solid rgba(104,205,237,.38);border-radius:10px;box-shadow:0 12px 34px rgba(0,0,0,.4)}.map-mode-menu.open{display:grid;gap:6px}.map-mode-menu button{text-align:left;width:100%}.map-mode-badge{font:800 11px system-ui;color:#a9dff1;padding:0 5px}
body.tv-mode #mapModeToolbar{top:8px}body.tv-mode .map-mode-menu{display:none!important}@media(max-width:720px){#mapModeToolbar{left:8px;right:8px;transform:none;justify-content:space-between}#mapModeToolbar button{padding:7px 8px;font-size:11px}.map-mode-badge{display:none}.map-mode-menu{left:0;width:min(310px,86vw)}}
</style><meta name="buxoro-map-modes" content="${MAP_MODES_MARKER}">`;
  if(html.includes('</head>'))html=html.replace('</head>',css+'</head>');

  const toolbar=`<div id="mapModeToolbar" data-map-modes="${MAP_MODES_MARKER}"><div class="map-mode-wrap"><button id="mapModeMenuBtn" type="button">☰ Menyu</button><div id="mapModeMenu" class="map-mode-menu"><button id="mapModeMain" type="button">TTB / SHTB / OP / OShP xaritasi</button><button id="mapModeDpm" type="button">DPM xaritasi</button></div></div><span id="mapModeLabel" class="map-mode-badge">ASOSIY XARITA</span><button id="mapModeTv" type="button">▣ TV rejim</button></div>`;
  if(html.includes('<body>'))html=html.replace('<body>','<body>'+toolbar);
  else if(html.includes('<body '))html=html.replace(/<body([^>]*)>/,m=>m+toolbar);

  const runtime=`
/* ${MAP_MODES_MARKER} */
const MAIN_TYPES=new Set(['TTB','SHTB','OP','OShP']);
function isDpmInstitution(I){return !!I&&(I.type==='V'||I.type==='DPM')}
function mapModeVisuals(I){return [I&&I.mesh,...((I&&I.fx)||[]),I&&I.ic].filter(Boolean)}
function setInstitutionMapVisibility(I,show){mapModeVisuals(I).forEach(o=>{try{o.visible=show}catch{}})}
function restoreDpmPositions(){
 if(typeof INS==='undefined')return;
 INS.filter(isDpmInstitution).forEach(I=>{const original=I.__mapModeOriginalPos;if(!original||!I.pos)return;const dx=original.x-I.pos.x,dz=original.z-I.pos.z;mapModeVisuals(I).forEach(o=>{if(o&&o.position){o.position.x+=dx;o.position.z+=dz}});if(I.pos.copy)I.pos.copy(original);else{I.pos.x=original.x;I.pos.y=original.y;I.pos.z=original.z}})
}
function repositionDpmAcrossBukhara(){
 if(typeof INS==='undefined'||typeof DATA==='undefined'||typeof W!=='function')return;
 const city=DATA.find(d=>d&&d.n==='Buxoro shahri');if(!city||!city.c)return;const cw=W(city.c[0],city.c[1]),golden=2.399963229728653;
 INS.filter(isDpmInstitution).forEach((I,i)=>{if(!I.pos)return;if(!I.__mapModeOriginalPos)I.__mapModeOriginalPos=I.pos.clone?I.pos.clone():{x:I.pos.x,y:I.pos.y,z:I.pos.z};const angle=i*golden,radius=8+Math.sqrt(i+1)*5.2,nx=cw[0]+Math.cos(angle)*radius,nz=cw[1]+Math.sin(angle)*radius,dx=nx-I.pos.x,dz=nz-I.pos.z;mapModeVisuals(I).forEach(o=>{if(o&&o.position){o.position.x+=dx;o.position.z+=dz}});I.pos.x=nx;I.pos.z=nz})
}
function tuneMapDistrictSurface(mode){
 if(typeof MT==='undefined')return;Object.entries(MT).forEach(([name,materials])=>{(materials||[]).forEach(m=>{if(!m)return;if(mode==='dpm'){m.transparent=true;m.opacity=name==='Buxoro shahri'?.94:.045}else{m.transparent=false;m.opacity=1}m.needsUpdate=true})})
}
function setMapMode(mode,updateUrl=true){
 if(mode!=='dpm')mode='main';
 if(typeof removeMedicalDataFlow==='function')removeMedicalDataFlow();
 if(typeof INS!=='undefined'){
  if(mode==='dpm')repositionDpmAcrossBukhara();else restoreDpmPositions();
  INS.forEach(I=>{const show=mode==='main'?MAIN_TYPES.has(I.type):isDpmInstitution(I);setInstitutionMapVisibility(I,show)});
 }
 if(typeof medicalCenterObjects!=='undefined')medicalCenterObjects.forEach(o=>{o.visible=mode==='main'});
 if(typeof neighbourhoodObjects!=='undefined')neighbourhoodObjects.forEach(o=>{o.visible=mode==='main'});
 tuneMapDistrictSurface(mode);
 const mainBtn=document.getElementById('mapModeMain'),dpmBtn=document.getElementById('mapModeDpm'),label=document.getElementById('mapModeLabel');if(mainBtn)mainBtn.classList.toggle('active',mode==='main');if(dpmBtn)dpmBtn.classList.toggle('active',mode==='dpm');if(label)label.textContent=mode==='main'?'TTB · SHTB · OP · OShP':'DPM · BUXORO SHAHRI';
 const menu=document.getElementById('mapModeMenu');if(menu)menu.classList.remove('open');
 if(mode==='dpm'){
  const city=typeof DATA!=='undefined'?DATA.find(d=>d&&d.n==='Buxoro shahri'):null;if(city&&city.c&&typeof W==='function'){const w=W(city.c[0],city.c[1]);if(typeof tgG!=='undefined'&&tgG&&tgG.set)tgG.set(w[0],0,w[1]);if(typeof tg!=='undefined'&&tg&&tg.set)tg.set(w[0],0,w[1])}if(typeof rdG!=='undefined')rdG=72;if(typeof phG!=='undefined')phG=.82;if(typeof fly!=='undefined')fly=true;
 }else{if(typeof tgG!=='undefined'&&tgG&&tgG.set)tgG.set(0,0,0);if(typeof rdG!=='undefined')rdG=270;if(typeof phG!=='undefined')phG=1;if(typeof fly!=='undefined')fly=true}
 if(updateUrl){try{const u=new URL(location.href);u.searchParams.set('mapMode',mode);history.replaceState(null,'',u)}catch{}}
 window.__buxoroMapMode=mode;
}
async function toggleTvMode(){
 try{if(!document.fullscreenElement){if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}else if(document.exitFullscreen)await document.exitFullscreen()}catch(e){console.warn('TV_MODE_FAILED',e&&e.message||e)}
}
function bindMapModeControls(){
 const menuBtn=document.getElementById('mapModeMenuBtn'),menu=document.getElementById('mapModeMenu'),mainBtn=document.getElementById('mapModeMain'),dpmBtn=document.getElementById('mapModeDpm'),tvBtn=document.getElementById('mapModeTv');
 if(menuBtn&&menu)menuBtn.addEventListener('click',()=>menu.classList.toggle('open'));if(mainBtn)mainBtn.addEventListener('click',()=>setMapMode('main'));if(dpmBtn)dpmBtn.addEventListener('click',()=>setMapMode('dpm'));if(tvBtn)tvBtn.addEventListener('click',toggleTvMode);
 document.addEventListener('fullscreenchange',()=>{document.body.classList.toggle('tv-mode',!!document.fullscreenElement);if(tvBtn)tvBtn.textContent=document.fullscreenElement?'✕ TV rejimdan chiqish':'▣ TV rejim'});
 document.addEventListener('click',e=>{if(menu&&menuBtn&&!menu.contains(e.target)&&e.target!==menuBtn)menu.classList.remove('open')});
}
function applyFocusedMapMode(){
 try{const focusName=new URLSearchParams(location.search).get('focusName');const requested=new URLSearchParams(location.search).get('mapMode');if(focusName&&typeof INS!=='undefined'){const target=INS.find(i=>i&&i.name===focusName);if(target){setMapMode(isDpmInstitution(target)?'dpm':'main',false);if(typeof focusFacilityFromQuery==='function')focusFacilityFromQuery();return}}setMapMode(requested==='dpm'?'dpm':'main',false)}catch(e){console.warn('MAP_MODE_INIT_FAILED',e&&e.message||e)}
}
bindMapModeControls();
setTimeout(()=>{if(typeof removeMedicalDataFlow==='function')removeMedicalDataFlow();applyFocusedMapMode()},110);
`;
  const pos=html.lastIndexOf('</script>');
  if(pos>=0)html=html.slice(0,pos)+runtime+html.slice(pos);
  return html;
}

export const TV_PRESENTATION_PATCH_MARKER='BUXORO_SSB_TV_PRESENTATION_V2';

const STYLE=`
<style nonce="__CSP_NONCE__">
body.dashboard-tv-mode #M,
body.dashboard-tv-mode #R,
body.dashboard-tv-mode .nt,
body.dashboard-tv-mode .chips{display:none!important}
body.dashboard-tv-mode header{top:14px}
body.dashboard-tv-mode header h1{font-size:clamp(24px,3vw,44px)}
body.dashboard-tv-mode .lg{left:18px;max-width:360px}
body.dashboard-tv-mode .btns{z-index:12;bottom:18px}
body.dashboard-tv-mode canvas{filter:saturate(1.08) contrast(1.03)}
body.dashboard-presentation-mode #M{box-shadow:0 0 30px rgba(39,216,255,.18),inset 0 0 26px rgba(39,216,255,.12)}
body.dashboard-presentation-mode #R{box-shadow:0 0 34px rgba(39,216,255,.2),inset 0 0 26px rgba(39,216,255,.12)}
body.dashboard-presentation-mode .btns{z-index:12;bottom:18px}
body.dashboard-presentation-mode header h1{font-size:clamp(22px,2.6vw,40px)}
body.dashboard-presentation-mode canvas{filter:saturate(1.1) contrast(1.04)}
.mode-btn-active{background:var(--ac)!important;color:#04122a!important;border-color:var(--ac)!important;box-shadow:0 0 14px rgba(255,200,61,.38)}
#presentationStatus{position:fixed;z-index:11;left:50%;top:76px;transform:translateX(-50%);padding:5px 12px;border:1px solid rgba(39,216,255,.45);background:rgba(2,10,32,.84);color:#cfeeff;font:600 12px var(--f);letter-spacing:.5px;backdrop-filter:blur(5px);display:none;max-width:42vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.dashboard-presentation-mode #presentationStatus,body.dashboard-tv-mode #presentationStatus{display:block}
@media(max-width:900px){body.dashboard-tv-mode .lg{display:none}#presentationStatus{top:52px;max-width:92vw}}
</style>`;

const CONTROLS=`<button id="tvModeBtn" type="button">▣ TV rejim</button><button id="presentationModeBtn" type="button">▶ Taqdimot</button><button id="normalModeBtn" type="button" hidden>↩ Oddiy rejim</button>`;

const SCRIPT=`
<script nonce="__CSP_NONCE__">
(()=>{
 const PRESENTATION_INTERVAL_MS=10000;
 const tvBtn=document.getElementById('tvModeBtn');
 const presentationBtn=document.getElementById('presentationModeBtn');
 const normalBtn=document.getElementById('normalModeBtn');
 const status=document.createElement('div');status.id='presentationStatus';status.setAttribute('aria-live','polite');document.body.appendChild(status);
 let presentationTimer=null,presentationIndex=0;
 const setActive=(btn,on)=>btn&&btn.classList.toggle('mode-btn-active',!!on);
 const requestFs=()=>{try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen){const p=document.documentElement.requestFullscreen();if(p&&p.catch)p.catch(()=>{})}}catch{}};
 const exitFs=()=>{try{if(document.fullscreenElement&&document.exitFullscreen){const p=document.exitFullscreen();if(p&&p.catch)p.catch(()=>{})}}catch{}};
 const stopPresentation=({restore=true}={})=>{
   if(presentationTimer){clearInterval(presentationTimer);presentationTimer=null}
   document.body.classList.remove('dashboard-presentation-mode');
   setActive(presentationBtn,false);
   status.textContent='';
   if(restore&&typeof home==='function')home();
 };
 const enterNormal=()=>{
   stopPresentation({restore:true});
   document.body.classList.remove('dashboard-tv-mode');
   setActive(tvBtn,false);
   if(normalBtn)normalBtn.hidden=true;
   exitFs();
 };
 const enterTv=()=>{
   stopPresentation({restore:false});
   document.body.classList.add('dashboard-tv-mode');
   setActive(tvBtn,true);
   if(normalBtn)normalBtn.hidden=false;
   status.textContent='TV REJIMI';
   requestFs();
 };
 const presentationStep=()=>{
   try{
     const cats=(typeof STAT!=='undefined'&&Array.isArray(STAT.cats))?STAT.cats.filter(c=>typeof catInds==='function'&&catInds(c.id).length):[];
     if(!cats.length)return;
     const c=cats[presentationIndex%cats.length];presentationIndex++;
     const inds=catInds(c.id);openCat=c.id;if(inds[0]&&typeof setInd==='function')setInd(inds[0].id);
     status.textContent='TAQDIMOT · '+(c.name||c.id)+' · 10 soniyada keyingi bo‘lim';
   }catch{}
 };
 const enterPresentation=()=>{
   document.body.classList.remove('dashboard-tv-mode');setActive(tvBtn,false);
   stopPresentation({restore:false});
   document.body.classList.add('dashboard-presentation-mode');setActive(presentationBtn,true);
   if(normalBtn)normalBtn.hidden=false;
   presentationIndex=0;
   presentationStep();presentationTimer=setInterval(presentationStep,PRESENTATION_INTERVAL_MS);requestFs();
 };
 tvBtn?.addEventListener('click',()=>document.body.classList.contains('dashboard-tv-mode')?enterNormal():enterTv());
 presentationBtn?.addEventListener('click',()=>document.body.classList.contains('dashboard-presentation-mode')?enterNormal():enterPresentation());
 normalBtn?.addEventListener('click',enterNormal);
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('dashboard-tv-mode')){document.body.classList.remove('dashboard-tv-mode');setActive(tvBtn,false);if(normalBtn)normalBtn.hidden=true;status.textContent=''}});
 addEventListener('keydown',e=>{if(e.key==='Escape'&&(document.body.classList.contains('dashboard-tv-mode')||document.body.classList.contains('dashboard-presentation-mode'))){enterNormal()}});
})();
</script>`;

export function patchTvPresentationModes(html:string):string{
  if(!html||html.includes(TV_PRESENTATION_PATCH_MARKER))return html;
  let out=html;
  out=out.replace('</head>',`${STYLE}</head>`);
  out=out.replace('<div id="tip"></div><div class="btns">','<div id="tip"></div><div class="btns">'+CONTROLS);
  out=out.replace('</body>',`<!-- ${TV_PRESENTATION_PATCH_MARKER} -->${SCRIPT}</body>`);
  return out;
}

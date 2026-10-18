const MARK='BUXORO_TV_PRESENTATION_MODE_V1';

export function patchTvPresentationMode(input:string,nonce:string){
  if(input.includes(MARK))return input;
  const css=`<style nonce="${nonce}" data-patch="${MARK}">
#viewModeControls{position:fixed;top:12px;right:14px;z-index:40;display:flex;gap:7px;align-items:center;padding:6px;border:1px solid rgba(39,216,255,.3);border-radius:10px;background:rgba(2,13,36,.82);backdrop-filter:blur(12px);box-shadow:0 8px 28px rgba(0,0,0,.3),inset 0 0 18px rgba(39,216,255,.08)}
#viewModeControls button{min-height:34px;border:1px solid rgba(39,216,255,.38);border-radius:7px;padding:0 12px;background:rgba(7,38,77,.9);color:#dff7ff;font:600 12px/1.1 var(--f,"Exo 2",sans-serif);letter-spacing:.25px;white-space:nowrap;cursor:pointer;transition:.18s ease}
#viewModeControls button:hover,#viewModeControls button.active{border-color:#27d8ff;background:rgba(15,86,145,.96);box-shadow:0 0 18px rgba(39,216,255,.25);transform:translateY(-1px)}
#viewModeControls button[data-mode="presentation"].active{border-color:#ffc83d;color:#ffe58b;box-shadow:0 0 18px rgba(255,200,61,.2)}
#presentationStatus{display:none;position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:39;min-width:260px;max-width:min(680px,70vw);padding:8px 16px;border:1px solid rgba(255,200,61,.5);border-radius:999px;background:rgba(2,13,36,.88);color:#fff3bf;text-align:center;font:600 12px/1.2 var(--f,"Exo 2",sans-serif);backdrop-filter:blur(10px);box-shadow:0 8px 26px rgba(0,0,0,.28)}
body.dashboard-tv-mode #M,body.dashboard-presentation-mode #M{display:none!important}
body.dashboard-tv-mode #R,body.dashboard-presentation-mode #R{right:16px!important;width:min(330px,24vw)!important;top:76px!important;bottom:58px!important;max-height:none!important}
body.dashboard-tv-mode header,body.dashboard-presentation-mode header{padding-right:min(350px,25vw)}
body.dashboard-tv-mode .chips,body.dashboard-presentation-mode .chips{left:16px!important;right:auto!important;max-width:min(690px,55vw)!important}
body.dashboard-tv-mode .lg,body.dashboard-presentation-mode .lg{left:14px!important;max-width:min(560px,48vw)!important}
body.dashboard-tv-mode .nt,body.dashboard-presentation-mode .nt{left:14px!important;right:auto!important}
body.dashboard-tv-mode .btns,body.dashboard-presentation-mode .btns{left:50%!important;transform:translateX(-50%)!important}
body.dashboard-presentation-mode #presentationStatus{display:block}
body.dashboard-presentation-mode #viewModeControls{opacity:.82}
@media(min-aspect-ratio:16/10){body.dashboard-tv-mode #R,body.dashboard-presentation-mode #R{width:min(360px,22vw)!important}body.dashboard-tv-mode header,body.dashboard-presentation-mode header{padding-right:min(380px,23vw)}}
@media(max-width:900px){#viewModeControls{top:6px;right:6px;gap:4px;padding:4px}#viewModeControls button{min-height:30px;padding:0 8px;font-size:10px}body.dashboard-tv-mode #R,body.dashboard-presentation-mode #R{width:min(300px,38vw)!important;right:8px!important;top:58px!important;bottom:48px!important}body.dashboard-tv-mode header,body.dashboard-presentation-mode header{padding-right:0}#presentationStatus{bottom:52px;max-width:82vw}}
</style>`;
  const controls=`<div id="viewModeControls" data-patch="${MARK}" aria-label="Ko'rish rejimlari"><button type="button" id="tvModeBtn" data-mode="tv">▣ TV rejim</button><button type="button" id="presentationModeBtn" data-mode="presentation">▶ Taqdimot</button><button type="button" id="normalModeBtn" data-mode="normal">⌂ Oddiy rejim</button></div><div id="presentationStatus" role="status" aria-live="polite">Taqdimot rejimi</div>`;
  const js=`<script nonce="${nonce}" data-patch="${MARK}">
(()=>{
const PRESENTATION_INTERVAL_MS=10000;
const PRESENTATION_CATEGORIES=['aholi','muassasa','kadr','onabola','kasal','yuqumli','ijtimoiy','skrining','tty','talim'];
let presentationTimer=null,presentationIndex=-1,currentMode='normal';
const body=document.body,tvBtn=document.getElementById('tvModeBtn'),presBtn=document.getElementById('presentationModeBtn'),normalBtn=document.getElementById('normalModeBtn'),status=document.getElementById('presentationStatus');
function syncButtons(){tvBtn?.classList.toggle('active',currentMode==='tv');presBtn?.classList.toggle('active',currentMode==='presentation');normalBtn?.classList.toggle('active',currentMode==='normal')}
function stopPresentation(){if(presentationTimer){clearInterval(presentationTimer);presentationTimer=null}}
function categoryName(id){const c=(typeof STAT!=='undefined'&&STAT.cats)?STAT.cats.find(x=>x.id===id):null;return c?.name||id}
function showPresentationCategory(){presentationIndex=(presentationIndex+1)%PRESENTATION_CATEGORIES.length;const id=PRESENTATION_CATEGORIES[presentationIndex];const button=document.querySelector('#M [data-c="'+id+'"]');if(button instanceof HTMLElement)button.click();if(status)status.textContent='Taqdimot · '+categoryName(id)+' · 10 soniya'}
function requestFull(){const el=document.documentElement;if(!document.fullscreenElement&&typeof el.requestFullscreen==='function')el.requestFullscreen().catch(()=>{})}
function setMode(mode){stopPresentation();body.classList.remove('dashboard-tv-mode','dashboard-presentation-mode');currentMode=mode;if(mode==='tv'){body.classList.add('dashboard-tv-mode');requestFull()}else if(mode==='presentation'){body.classList.add('dashboard-presentation-mode');requestFull();presentationIndex=-1;showPresentationCategory();presentationTimer=setInterval(showPresentationCategory,PRESENTATION_INTERVAL_MS)}else if(document.fullscreenElement&&typeof document.exitFullscreen==='function'){document.exitFullscreen().catch(()=>{})}syncButtons();setTimeout(()=>window.dispatchEvent(new Event('resize')),80)}
tvBtn?.addEventListener('click',()=>setMode('tv'));presBtn?.addEventListener('click',()=>setMode('presentation'));normalBtn?.addEventListener('click',()=>setMode('normal'));
addEventListener('keydown',e=>{if(e.key==='Escape'&&currentMode!=='normal')setMode('normal');if(e.key===' '&&currentMode==='presentation'){e.preventDefault();if(presentationTimer)stopPresentation();else presentationTimer=setInterval(showPresentationCategory,PRESENTATION_INTERVAL_MS)}});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&currentMode!=='normal')setMode('normal')});
syncButtons();
})();
</script>`;
  let html=input.replace('</head>',css+'</head>');
  html=html.replace('</body>',controls+js+'</body>');
  return html;
}

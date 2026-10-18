export const LEADERSHIP_VIEW_MODES_MARKER = 'BUXORO_LEADERSHIP_VIEW_MODES_V1';

export function patchLeadershipViewModes(input: string): string {
  if (!input || input.includes(LEADERSHIP_VIEW_MODES_MARKER)) return input;

  const styleAnchor = '</style>';
  const toolbarAnchor = '<div id="tip"></div><div class="btns">';
  const runtimeAnchor = 'home();fly=false;loop();';
  if (!input.includes(styleAnchor) || !input.includes(toolbarAnchor) || !input.includes(runtimeAnchor)) return input;

  const css = [
    '',
    '/* ' + LEADERSHIP_VIEW_MODES_MARKER + ' */',
    '.view-modes{position:fixed;right:14px;top:14px;z-index:12;display:flex;gap:8px;align-items:center}',
    '.view-modes button{appearance:none;border:1px solid rgba(39,216,255,.52);background:rgba(3,28,63,.92);color:#dff8ff;padding:7px 12px;border-radius:999px;font:700 11px "Exo 2",sans-serif;letter-spacing:.35px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22);backdrop-filter:blur(10px)}',
    '.view-modes button:hover,.view-modes button[aria-pressed="true"]{background:rgba(39,216,255,.18);border-color:#27d8ff;color:#fff}',
    'body.tv-mode #L,body.tv-mode #R{top:88px;max-height:calc(100vh - 116px);width:295px}',
    'body.tv-mode header h1{font-size:clamp(22px,2.15vw,32px)}',
    'body.presentation-mode #presentationMode{border-color:#ffc83d;color:#ffc83d;background:rgba(74,52,5,.78)}',
    '@media(max-width:1100px){.view-modes{top:auto;right:8px;bottom:8px}.view-modes button{padding:6px 9px;font-size:10px}}',
    ''
  ].join('\n');

  const toolbar = '<div class="view-modes" aria-label="Ko\'rish rejimlari">' +
    '<button id="tvMode" type="button" aria-pressed="false">▣ TV rejimi</button>' +
    '<button id="presentationMode" type="button" aria-pressed="false">▶ Taqdimot rejimi</button>' +
    '</div>';

  const runtime = [
    '',
    '/* ' + LEADERSHIP_VIEW_MODES_MARKER + ' */',
    'const tvBtn=document.getElementById("tvMode");',
    'const presentationBtn=document.getElementById("presentationMode");',
    'let presentationTimer=null;',
    'let presentationIndex=0;',
    'async function setTvMode(force){',
    '  const on=force===undefined?!document.body.classList.contains("tv-mode"):!!force;',
    '  document.body.classList.toggle("tv-mode",on);',
    '  tvBtn.setAttribute("aria-pressed",String(on));',
    '  tvBtn.textContent=on?"▣ TV rejimidan chiqish":"▣ TV rejimi";',
    '  try{',
    '    if(on&&!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();',
    '    if(!on&&document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();',
    '  }catch(e){}',
    '}',
    'function stopPresentation(goHome){',
    '  if(presentationTimer){clearInterval(presentationTimer);presentationTimer=null;}',
    '  document.body.classList.remove("presentation-mode");',
    '  presentationBtn.setAttribute("aria-pressed","false");',
    '  presentationBtn.textContent="▶ Taqdimot rejimi";',
    '  if(goHome)home();',
    '}',
    'function startPresentation(){',
    '  if(presentationTimer){stopPresentation(true);return;}',
    '  presentationIndex=0;',
    '  document.body.classList.add("presentation-mode");',
    '  presentationBtn.setAttribute("aria-pressed","true");',
    '  presentationBtn.textContent="■ Taqdimotni to\'xtatish";',
    '  const step=()=>{',
    '    if(!UL||!UL.length)return;',
    '    selectUnit(UL[presentationIndex%UL.length].key);',
    '    presentationIndex++;',
    '  };',
    '  step();',
    '  presentationTimer=setInterval(step,7000);',
    '}',
    'tvBtn.addEventListener("click",()=>setTvMode());',
    'presentationBtn.addEventListener("click",startPresentation);',
    'document.addEventListener("fullscreenchange",()=>{',
    '  if(!document.fullscreenElement&&document.body.classList.contains("tv-mode")){',
    '    document.body.classList.remove("tv-mode");',
    '    tvBtn.setAttribute("aria-pressed","false");',
    '    tvBtn.textContent="▣ TV rejimi";',
    '  }',
    '});',
    'cv.addEventListener("pointerdown",()=>{if(presentationTimer)stopPresentation(false);},{capture:true});',
    runtimeAnchor
  ].join('\n');

  let out = input.replace(styleAnchor, css + styleAnchor);
  out = out.replace(toolbarAnchor, '<div id="tip"></div>' + toolbar + '<div class="btns">');
  out = out.replace(runtimeAnchor, runtime);
  return out;
}

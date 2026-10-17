export const TV_ONLY_MARKER='BUXORO_SSB_TV_ONLY_V1';

export function patchTvOnly(input:string):string{
  if(!input||input.includes(TV_ONLY_MARKER)||!input.includes('</body>'))return input;
  const nonce=input.match(/nonce=["']([^"']+)["']/)?.[1]||'';
  const nonceAttr=nonce?` nonce="${nonce}"`:'';
  const style=`<style${nonceAttr} id="buxoro-tv-only-style">#buxoroTvOnly{position:fixed;top:12px;right:14px;z-index:12050;border:1px solid rgba(116,218,255,.5);background:rgba(4,28,58,.88);color:#eafbff;border-radius:9px;padding:8px 12px;font:700 12px system-ui;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 6px 22px rgba(0,0,0,.28)}#buxoroTvOnly:hover{background:rgba(13,72,111,.94)}body.buxoro-tv-fullscreen #buxoroTvOnly{top:8px;right:8px}@media(max-width:700px){#buxoroTvOnly{top:8px;right:8px;padding:7px 9px;font-size:11px}}</style><meta name="buxoro-tv-only" content="${TV_ONLY_MARKER}">`;
  const button=`<button id="buxoroTvOnly" type="button">▣ TV rejim</button>`;
  const script=`<script${nonceAttr}>/* ${TV_ONLY_MARKER} */(function(){const b=document.getElementById('buxoroTvOnly');if(!b)return;async function toggleTv(){try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen?.()}else{await document.exitFullscreen?.()}}catch(e){console.warn('TV_MODE_FAILED',e&&e.message||e)}}function sync(){const on=!!document.fullscreenElement;document.body.classList.toggle('buxoro-tv-fullscreen',on);b.textContent=on?'✕ TV rejimdan chiqish':'▣ TV rejim'}b.addEventListener('click',toggleTv);document.addEventListener('fullscreenchange',sync);sync()})();</script>`;
  let html=input;
  if(html.includes('</head>'))html=html.replace('</head>',style+'</head>');
  if(html.includes('<body>'))html=html.replace('<body>','<body>'+button);
  else html=html.replace(/<body([^>]*)>/,m=>m+button);
  return html.replace('</body>',script+'</body>');
}

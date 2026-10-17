'use strict';
(()=>{
  function applyMapOnly(){
    if(document.getElementById('map-only-clean-style')) return;
    const style=document.createElement('style');
    style.id='map-only-clean-style';
    style.textContent=`
      html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#02080d!important}
      body::after{display:none!important}
      .app{display:block!important;position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;min-height:0!important;padding:0!important;margin:0!important}
      header.top,.col.side.left,.col.side.right,.foot{display:none!important}
      .col.center{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;display:block!important;margin:0!important;padding:0!important}
      .map-wrap{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;margin:0!important}
      .map-hud{left:auto!important;right:14px!important;top:14px!important;justify-content:flex-end!important}
      .map-hud .t,.legend{display:none!important}
      .hud-btns{justify-content:flex-end!important}
      #admin,.admin{display:none!important}
    `;
    document.head.appendChild(style);
    const map=document.getElementById('map');
    if(map){
      map.style.width='100%';
      map.style.height='100%';
    }
    window.dispatchEvent(new Event('resize'));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyMapOnly,{once:true});
  else applyMapOnly();
  setTimeout(applyMapOnly,250);
})();

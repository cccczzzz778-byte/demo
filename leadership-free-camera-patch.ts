export const FREE_CAMERA_MARKER='BUXORO_SSB_FREE_CAMERA_V1';

export function patchFreeMapCamera(input:string):string{
  if(!input||input.includes(FREE_CAMERA_MARKER)||!input.includes('</script>'))return input;
  let html=input;

  // Map mode changes must never force the camera back to Buxoro city or (0,0,0).
  // The user keeps the exact target / zoom they chose while switching layers.
  html=html.replace(
    / if\(mode==='dpm'\)\{\n  const city=[\s\S]*?\n \}else\{[^\n]*\}\n if\(updateUrl\)/,
    " if(typeof auto!=='undefined')auto=false;\n if(typeof fly!=='undefined')fly=false;\n if(updateUrl)"
  );

  const runtime=`
/* ${FREE_CAMERA_MARKER} */
function freeStopAuto(){
 if(typeof auto!=='undefined')auto=false;
 if(typeof fly!=='undefined')fly=false;
}
function freeCameraTarget(){
 if(typeof tgG!=='undefined'&&tgG)return tgG;
 if(typeof tg!=='undefined'&&tg)return tg;
 return null;
}
function freeCameraObject(){
 if(typeof cam!=='undefined'&&cam)return cam;
 if(typeof camera!=='undefined'&&camera)return camera;
 return null;
}
function freeZoomBy(factor){
 freeStopAuto();
 if(typeof rdG!=='undefined'&&Number.isFinite(rdG))rdG=Math.max(12,Math.min(560,rdG*factor));
 if(typeof rd!=='undefined'&&Number.isFinite(rd)&&typeof rdG!=='undefined')rd=rdG;
}
function freePanBy(dx,dy){
 freeStopAuto();
 const target=freeCameraTarget();if(!target)return;
 const dist=typeof rdG!=='undefined'&&Number.isFinite(rdG)?rdG:140;
 const scale=Math.max(.025,Math.min(1.25,dist/520));
 const c=freeCameraObject();let rx=1,rz=0,fx=0,fz=1;
 if(c&&c.position){const vx=target.x-c.position.x,vz=target.z-c.position.z,len=Math.hypot(vx,vz)||1;fx=vx/len;fz=vz/len;rx=fz;rz=-fx}
 const sx=dx*scale,sy=dy*scale;
 target.x-=rx*sx;target.z-=rz*sx;target.x+=fx*sy;target.z+=fz*sy;
 if(typeof tg!=='undefined'&&tg&&tg!==target&&tg.copy)tg.copy(target);
 if(typeof tgG!=='undefined'&&tgG&&tgG!==target&&tgG.copy)tgG.copy(target);
}
function freePickTarget(ev,canvas){
 freeStopAuto();
 const c=freeCameraObject(),target=freeCameraTarget();
 if(!c||!target||typeof THREE==='undefined'||!THREE.Raycaster||!THREE.Vector2||!THREE.Plane||!THREE.Vector3)return;
 const r=canvas.getBoundingClientRect(),p=new THREE.Vector2(((ev.clientX-r.left)/r.width)*2-1,-((ev.clientY-r.top)/r.height)*2+1),ray=new THREE.Raycaster(),hit=new THREE.Vector3();
 ray.setFromCamera(p,c);const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);if(!ray.ray.intersectPlane(plane,hit))return;
 target.x=hit.x;target.z=hit.z;if(typeof target.y==='number')target.y=0;
 if(typeof tg!=='undefined'&&tg&&tg!==target&&tg.copy)tg.copy(target);if(typeof tgG!=='undefined'&&tgG&&tgG!==target&&tgG.copy)tgG.copy(target);
}
function freeCameraSnapshot(){
 const target=freeCameraTarget();return {x:target&&target.x,y:target&&target.y,z:target&&target.z,rdG:typeof rdG!=='undefined'?rdG:null,phG:typeof phG!=='undefined'?phG:null};
}
function freeCameraRestore(s){
 if(!s)return;const target=freeCameraTarget();if(target&&Number.isFinite(s.x)&&Number.isFinite(s.z)){target.x=s.x;target.z=s.z;if(Number.isFinite(s.y))target.y=s.y;if(typeof tg!=='undefined'&&tg&&tg!==target&&tg.copy)tg.copy(target);if(typeof tgG!=='undefined'&&tgG&&tgG!==target&&tgG.copy)tgG.copy(target)}
 if(s.rdG!=null&&typeof rdG!=='undefined')rdG=s.rdG;if(s.phG!=null&&typeof phG!=='undefined')phG=s.phG;freeStopAuto();
}
function preserveCameraAcrossMapModes(){
 if(typeof setMapMode!=='function'||setMapMode.__freeCameraWrapped)return;
 const original=setMapMode;const wrapped=function(mode,updateUrl=true){const snap=freeCameraSnapshot(),r=original(mode,updateUrl);freeCameraRestore(snap);return r};wrapped.__freeCameraWrapped=true;setMapMode=wrapped;
}
function bindFreeMapCamera(){
 const canvas=document.querySelector('canvas');if(!canvas||canvas.dataset.freeCameraBound==='1')return;canvas.dataset.freeCameraBound='1';canvas.style.touchAction='none';
 let panning=false,pid=null,lx=0,ly=0;
 canvas.addEventListener('pointerdown',e=>{if(e.button===1||e.button===2||(e.button===0&&e.shiftKey)){panning=true;pid=e.pointerId;lx=e.clientX;ly=e.clientY;freeStopAuto();try{canvas.setPointerCapture(e.pointerId)}catch{};e.preventDefault()}},true);
 canvas.addEventListener('pointermove',e=>{if(!panning||e.pointerId!==pid)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;freePanBy(dx,dy);e.preventDefault()},true);
 const end=e=>{if(panning&&e.pointerId===pid){panning=false;pid=null;try{canvas.releasePointerCapture(e.pointerId)}catch{}}};canvas.addEventListener('pointerup',end,true);canvas.addEventListener('pointercancel',end,true);
 canvas.addEventListener('wheel',e=>{freeZoomBy(e.deltaY>0?1.12:.89);e.preventDefault();e.stopImmediatePropagation()},{capture:true,passive:false});
 canvas.addEventListener('dblclick',e=>{freePickTarget(e,canvas);e.preventDefault();e.stopPropagation()},true);
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 const zin=document.getElementById('mapFreeZoomIn'),zout=document.getElementById('mapFreeZoomOut');if(zin)zin.addEventListener('click',()=>freeZoomBy(.82));if(zout)zout.addEventListener('click',()=>freeZoomBy(1.22));
}
function addFreeCameraButtons(){
 const bar=document.getElementById('mapModeToolbar');if(!bar||document.getElementById('mapFreeZoomIn'))return;const out=document.createElement('button');out.id='mapFreeZoomOut';out.type='button';out.textContent='−';out.title='Uzoqlashtirish';const inn=document.createElement('button');inn.id='mapFreeZoomIn';inn.type='button';inn.textContent='+';inn.title='Yaqinlashtirish';bar.insertBefore(out,bar.lastElementChild);bar.insertBefore(inn,bar.lastElementChild);
}
freeStopAuto();preserveCameraAcrossMapModes();addFreeCameraButtons();bindFreeMapCamera();setTimeout(()=>{preserveCameraAcrossMapModes();addFreeCameraButtons();bindFreeMapCamera();freeStopAuto()},160);
`;
  const pos=html.lastIndexOf('</script>');
  if(pos<0)return html;
  return html.slice(0,pos)+runtime+html.slice(pos);
}

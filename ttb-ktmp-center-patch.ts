export const TTB_KTMP_CENTER_MARKER='BUXORO_SSB_TTB_KTMP_CENTER_V1';

export function patchTtbKtmpCenter(input:string):string{
  if(!input||input.includes(TTB_KTMP_CENTER_MARKER))return input;
  if(!input.includes('</script>'))return input;

  let html=input
    .replaceAll('TTB / SHTB / OP / OShP xaritasi','TTB / KTMP / SHTB / OP / OShP xaritasi')
    .replaceAll('TTB · SHTB · OP · OShP','TTB · KTMP · SHTB · OP · OShP');

  const runtime=`
/* ${TTB_KTMP_CENTER_MARKER} */
if(typeof MAIN_TYPES!=='undefined'&&MAIN_TYPES&&typeof MAIN_TYPES.add==='function')MAIN_TYPES.add('MP');
function canonicalDistrictName(v){return String(v||'').replace(/[ʻʼ’‘]/g,"'").trim().toLowerCase()}
function moveInstitutionVisuals(I,dx,dz){
 if(!I)return;[I.mesh,...(I.fx||[]),I.ic].filter(Boolean).forEach(o=>{if(o&&o.position){o.position.x+=dx;o.position.z+=dz}})
}
function moveCenteredNeighbourhood(centerName,dx,dz){
 if(typeof neighbourhoodObjects==='undefined')return;neighbourhoodObjects.forEach(o=>{if(o&&o.userData&&o.userData.center===centerName&&o.position){o.position.x+=dx;o.position.z+=dz}})
}
function snapTtbBesideKtmp(){
 if(typeof INS==='undefined')return;
 INS.filter(I=>I&&I.type==='TTB'&&I.pos).forEach(I=>{
  const K=INS.find(K=>K&&K.type==='MP'&&K.pos&&canonicalDistrictName(K.dist)===canonicalDistrictName(I.dist));
  if(!K)return;
  if(!I.__ttbKtmpOriginalPos)I.__ttbKtmpOriginalPos=I.pos.clone?I.pos.clone():{x:I.pos.x,y:I.pos.y,z:I.pos.z};
  let h=0;for(const ch of String(I.dist||I.name||''))h=(h*31+ch.charCodeAt(0))>>>0;
  const a=(h%360)*Math.PI/180,r=6.5,nx=K.pos.x+Math.cos(a)*r,nz=K.pos.z+Math.sin(a)*r,dx=nx-I.pos.x,dz=nz-I.pos.z;
  moveInstitutionVisuals(I,dx,dz);moveCenteredNeighbourhood(I.name,dx,dz);I.pos.x=nx;I.pos.z=nz;
 });
}
snapTtbBesideKtmp();
setTimeout(()=>{snapTtbBesideKtmp();if(typeof window!=='undefined'&&window.__buxoroMapMode==='main'&&typeof setMapMode==='function')setMapMode('main',false)},140);
`;
  const pos=html.lastIndexOf('</script>');
  if(pos>=0)html=html.slice(0,pos)+runtime+html.slice(pos);
  return html;
}

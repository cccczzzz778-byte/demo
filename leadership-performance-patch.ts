export const PERF_MARKER='BUXORO_SSB_3D_PERF_V1';

export function patch3dPerformanceAndFacilityFocus(input:string):string{
  if(!input||input.includes(PERF_MARKER))return input;
  const runtime=`\n/* ${PERF_MARKER} */\nfunction removeMedicalDataFlow(){
 try{
  if(typeof flowObjects!=='undefined'){
   flowObjects.slice().forEach(o=>{try{if(o&&o.parent)o.parent.remove(o);else if(typeof sc!=='undefined'&&o)sc.remove(o)}catch{}});
   flowObjects.length=0;
  }
  if(typeof pulses!=='undefined'){
   pulses.slice().forEach(p=>{try{if(p&&p.parent)p.parent.remove(p);['sp','sprite','obj','line'].forEach(k=>{const o=p&&p[k];if(o&&o.parent)o.parent.remove(o)})}catch{}});
   pulses.length=0;
  }
  if(typeof sc!=='undefined'&&sc&&typeof sc.traverse==='function'){
   const gone=[];sc.traverse(o=>{const u=o&&o.userData||{};if(u.kind==='flow'||u.level==='facility-to-district'||u.level==='district-to-ssb')gone.push(o)});gone.forEach(o=>{try{if(o.parent)o.parent.remove(o)}catch{}});
  }
  if(typeof neighbourhoodObjects!=='undefined')neighbourhoodObjects.forEach(o=>{if(o&&o.isInstancedMesh&&typeof o.count==='number')o.count=Math.min(o.count,o.userData&&o.userData.center?4:2)});
 }catch(e){console.warn('3D_FLOW_REMOVE_FAILED',e&&e.message||e)}
}
function focusFacilityFromQuery(){
 try{
  const focusName=new URLSearchParams(location.search).get('focusName');
  if(!focusName||typeof INS==='undefined')return;
  const target=INS.find(i=>i&&i.name===focusName);if(!target)return;
  if(typeof auto!=='undefined')auto=false;
  if(typeof applyDistrictFocus==='function')applyDistrictFocus(target.dist);
  if(typeof selectInst==='function'){selectInst(target);return}
  INS.forEach(I=>{const show=I===target;[I&&I.mesh,...((I&&I.fx)||[]),I&&I.ic].forEach(o=>{if(o)o.visible=show})});
  if(target.pos){if(typeof tgG!=='undefined'&&tgG&&tgG.copy)tgG.copy(target.pos);if(typeof tg!=='undefined'&&tg&&tg.copy)tg.copy(target.pos)}
 }catch(e){console.warn('3D_FACILITY_FOCUS_FAILED',e&&e.message||e)}
}
removeMedicalDataFlow();
setTimeout(()=>{removeMedicalDataFlow();focusFacilityFromQuery()},60);
`;
  const pos=input.lastIndexOf('</script>');
  if(pos<0)return input;
  return input.slice(0,pos)+runtime+input.slice(pos);
}

export const INTEGRATED_DPM_MAIN_MAP_MARKER='BUXORO_SSB_INTEGRATED_DPM_MAIN_MAP_V1';

export function patchIntegratedDpmMainMap(input:string):string{
  if(!input||input.includes(INTEGRATED_DPM_MAIN_MAP_MARKER)||!input.includes('</script>'))return input;
  const runtime=`\n/* ${INTEGRATED_DPM_MAIN_MAP_MARKER} */\nfunction buildIntegratedDpmMedicalCenters(){
 if(typeof THREE==='undefined'||typeof INS==='undefined'||typeof sc==='undefined')return;
 const T=THREE;
 INS.filter(I=>I&&(I.type==='V'||I.type==='DPM')).forEach((I,idx)=>{
  if(I.__integratedDpmBuilt||!I.pos)return;
  I.__integratedDpmBuilt=true;
  const oldVisuals=[I.mesh,...(I.fx||[]),I.ic].filter(Boolean);oldVisuals.forEach(o=>{try{o.visible=false}catch{}});
  const baseY=Math.max(0,(I.pos.y||0)-.2),x=I.pos.x||0,z=I.pos.z||0;
  const bodyMat=new T.MeshLambertMaterial({color:0x7aa9c4,emissive:0x173b52});
  const accentMat=new T.MeshLambertMaterial({color:0xd7edf3,emissive:0x254854});
  const crossMat=new T.MeshLambertMaterial({color:0xf6fbff,emissive:0x3c5967});
  const parts=[];
  const add=(geo,mat,px,py,pz)=>{const o=new T.Mesh(geo,mat);o.position.set(px,py,pz);o.userData={inst:I,district:'Buxoro shahri',center:I.name,isDpm:true};o.castShadow=true;o.receiveShadow=true;sc.add(o);if(typeof meshes!=='undefined'&&Array.isArray(meshes))meshes.push(o);parts.push(o);return o};
  add(new T.BoxGeometry(5.8,.75,4.6),bodyMat.clone(),x,baseY+.38,z);
  const core=add(new T.BoxGeometry(4.5,3.8,3.4),bodyMat.clone(),x,baseY+2.65,z);
  add(new T.BoxGeometry(5.0,.35,3.9),accentMat.clone(),x,baseY+4.72,z);
  add(new T.BoxGeometry(1.8,.36,.25),crossMat.clone(),x,baseY+3.0,z+1.84);
  add(new T.BoxGeometry(.36,1.8,.25),crossMat.clone(),x,baseY+3.0,z+1.86);
  const statusColor=(typeof SC!=='undefined'&&I.st&&SC[I.st])?SC[I.st]:0xb58cff;
  const ring=new T.Mesh(new T.RingGeometry(3.2,3.65,42),new T.MeshBasicMaterial({color:statusColor,transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.set(x,baseY+.1,z);ring.userData={inst:I,district:'Buxoro shahri',center:I.name,isDpm:true,ph:(typeof R==='function'?R():Math.random())*2};sc.add(ring);if(typeof rings!=='undefined'&&Array.isArray(rings))rings.push(ring);parts.push(ring);
  const cv=document.createElement('canvas');cv.width=512;cv.height=128;const cx=cv.getContext('2d');
  if(cx){cx.fillStyle='rgba(5,27,53,.94)';cx.fillRect(0,18,512,92);cx.strokeStyle='#b9dce9';cx.lineWidth=4;cx.strokeRect(2,20,508,88);cx.fillStyle='#f4fbff';cx.font='700 28px sans-serif';cx.textAlign='center';cx.textBaseline='middle';let label=String(I.name||'DPM').replace(/Viloyat/gi,'').trim();if(label.length>31)label=label.slice(0,29)+'…';cx.fillText('DPM · '+label,256,64)}
  const spr=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,fog:false}));spr.scale.set(14,3.4,1);spr.position.set(x,baseY+7.0,z);spr.userData={inst:I,district:'Buxoro shahri',center:I.name,isDpm:true};sc.add(spr);parts.push(spr);
  I.mesh=core;I.fx=parts.filter(o=>o!==core);I.pos.set(x,baseY+5.1,z);
 });
}
setTimeout(()=>{try{buildIntegratedDpmMedicalCenters();const requested=new URLSearchParams(location.search).get('mapMode');if(typeof setMapMode==='function')setMapMode(requested==='dpm'?'dpm':'main',false)}catch(e){console.warn('INTEGRATED_DPM_BUILD_FAILED',e&&e.message||e)}},45);
`;
  const pos=input.lastIndexOf('</script>');
  return pos<0?input:input.slice(0,pos)+runtime+input.slice(pos);
}

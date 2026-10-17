export const DPM_PREMIUM_3D_MARKER='BUXORO_SSB_DPM_PREMIUM_3D_V1';

export function patchDpmPremium3d(input:string):string{
  if(!input||input.includes(DPM_PREMIUM_3D_MARKER)||!input.includes('</script>'))return input;
  const nonce=input.match(/nonce=["']([^"']+)["']/)?.[1]||'';
  const nonceAttr=nonce?` nonce="${nonce}"`:'';
  const css=`<style${nonceAttr} id="dpm-premium-3d-style">
/* ${DPM_PREMIUM_3D_MARKER} */
body.dpm-city-map-mode .dpm-city-mapbox{position:relative!important;background:radial-gradient(circle at 50% 35%,#123b61 0,#081d34 45%,#04111f 100%)!important;overflow:hidden!important}
body.dpm-city-map-mode #dpmCitySvg,body.dpm-city-map-mode #dpmVisualPins{display:none!important}
#dpm3dMount{position:absolute;inset:0;z-index:3;overflow:hidden}
#dpm3dMount canvas{display:block!important;visibility:visible!important;width:100%!important;height:100%!important}
#dpm3dOverlay{position:absolute;left:14px;top:14px;z-index:7;display:flex;gap:8px;pointer-events:none}
.dpm3d-chip{padding:7px 10px;border:1px solid rgba(119,225,249,.28);border-radius:9px;background:rgba(5,28,52,.78);backdrop-filter:blur(7px);color:#dff8ff;font-size:10px;font-weight:800;letter-spacing:.03em}
#dpm3dReset{position:absolute;right:14px;top:14px;z-index:8;border:1px solid rgba(119,225,249,.35);border-radius:9px;background:rgba(5,28,52,.82);color:#e8fbff;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer}
#dpm3dReset:hover{border-color:#ffd76a;color:#ffd76a}
@media(max-width:720px){#dpm3dOverlay{display:none}#dpm3dReset{top:8px;right:8px;padding:6px 8px;font-size:10px}}
</style><meta name="dpm-premium-3d" content="${DPM_PREMIUM_3D_MARKER}">`;
  let html=input.includes('</head>')?input.replace('</head>',css+'</head>'):input;
  const runtime=`
/* ${DPM_PREMIUM_3D_MARKER} */
const DPM3D={scene:null,camera:null,renderer:null,root:null,markers:[],markerByName:new Map(),selected:null,raf:0,drag:false,lastX:0,lastY:0,az:-0.65,el:0.82,dist:92,target:null,ray:null,mouse:null,bound:false};
function dpm3dDpms(){return typeof INS!=='undefined'?INS.filter(isDpmCityInstitution):[]}
function dpm3dNormalizePolygon(){
 try{const city=typeof DATA!=='undefined'?DATA.find(d=>d&&d.n==='Buxoro shahri'):null,ring=city&&city.r&&city.r[0];if(!ring||ring.length<3)return [[-42,22],[38,24],[50,10],[45,-26],[18,-39],[-30,-38],[-48,-20],[-51,8]];let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;ring.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1])});const dx=Math.max(1e-6,maxX-minX),dy=Math.max(1e-6,maxY-minY);return ring.map(p=>[((p[0]-minX)/dx-.5)*92,((p[1]-minY)/dy-.5)*66]);}catch{return [[-42,22],[38,24],[50,10],[45,-26],[18,-39],[-30,-38],[-48,-20],[-51,8]]}
}
function dpm3dPointInPoly(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/((b[1]-a[1])||1e-9)+a[0]))c=!c}return c}
function dpm3dLayout(n,poly){const pts=[];for(let z=-28;z<=28&&pts.length<n;z+=11){const row=Math.round((z+28)/11);for(let x=-40+(row%2?5.5:0);x<=40&&pts.length<n;x+=11){if(dpm3dPointInPoly([x,z],poly))pts.push([x,z])}}if(pts.length<n){for(let i=pts.length;i<n;i++){const a=i*2.3999632297,r=8+Math.sqrt(i+1)*7;pts.push([Math.cos(a)*r,Math.sin(a)*r*.72])}}return pts.slice(0,n)}
function dpm3dMakeMarker(I,pos){
 const T=THREE,g=new T.Group();g.userData={inst:I,name:I.name,kind:'dpm3d'};g.position.set(pos[0],3.2,pos[1]);
 const baseMat=new T.MeshStandardMaterial({color:0x0b3550,metalness:.35,roughness:.38,emissive:0x06283b,emissiveIntensity:.3});
 const glowMat=new T.MeshStandardMaterial({color:0x45e4bd,emissive:0x45e4bd,emissiveIntensity:.65,metalness:.15,roughness:.24});
 const whiteMat=new T.MeshStandardMaterial({color:0xf2fbff,emissive:0xa6f4ff,emissiveIntensity:.25,roughness:.3});
 const base=new T.Mesh(new T.CylinderGeometry(2.05,2.35,.7,28),baseMat);base.position.y=.35;base.castShadow=true;g.add(base);
 const tower=new T.Mesh(new T.BoxGeometry(2.7,6.4,2.7),glowMat);tower.position.y=3.7;tower.castShadow=true;g.add(tower);
 const cap=new T.Mesh(new T.BoxGeometry(3.2,.45,3.2),whiteMat);cap.position.y=6.95;g.add(cap);
 const h=new T.Mesh(new T.BoxGeometry(1.7,.36,.28),whiteMat),v=new T.Mesh(new T.BoxGeometry(.36,1.7,.28),whiteMat);h.position.set(0,4.25,1.5);v.position.set(0,4.25,1.5);g.add(h,v);
 const ring=new T.Mesh(new T.RingGeometry(2.7,3.25,40),new T.MeshBasicMaterial({color:0x45e4bd,transparent:true,opacity:.46,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;ring.userData.ring=true;g.add(ring);
 g.userData.tower=tower;g.userData.ringObj=ring;return g
}
function dpm3dSetSelected(name,fly=true){const S=DPM3D,sel=S.markerByName.get(name);if(!sel)return;S.selected=sel;S.markers.forEach(m=>{const active=m===sel,tw=m.userData.tower,rg=m.userData.ringObj;if(tw&&tw.material){tw.material.color.setHex(active?0xffd76a:0x45e4bd);tw.material.emissive.setHex(active?0xffb938:0x45e4bd);tw.material.emissiveIntensity=active?1:.65}if(rg&&rg.material){rg.material.color.setHex(active?0xffd76a:0x45e4bd);rg.material.opacity=active?.85:.46}m.scale.setScalar(active?1.14:1)});if(typeof setDpmDetails==='function')setDpmDetails(sel.userData.inst);if(typeof syncDpmCardSelection==='function')syncDpmCardSelection(name);if(fly&&S.target)S.target.copy(sel.position);}
function dpm3dBuild(){
 const box=document.querySelector('.dpm-city-mapbox');if(!box||typeof THREE==='undefined')return;let mount=document.getElementById('dpm3dMount');if(!mount){mount=document.createElement('div');mount.id='dpm3dMount';box.appendChild(mount)}else mount.innerHTML='';
 let ov=document.getElementById('dpm3dOverlay');if(!ov){ov=document.createElement('div');ov.id='dpm3dOverlay';ov.innerHTML='<div class="dpm3d-chip">3D DPM xaritasi</div><div class="dpm3d-chip">Sichqoncha: aylantirish · G‘ildirak: zoom</div>';box.appendChild(ov)}
 let reset=document.getElementById('dpm3dReset');if(!reset){reset=document.createElement('button');reset.id='dpm3dReset';reset.type='button';reset.textContent='Kamerani tiklash';box.appendChild(reset);reset.addEventListener('click',()=>{DPM3D.az=-.65;DPM3D.el=.82;DPM3D.dist=92;DPM3D.target.set(0,0,0)})}
 const T=THREE,S=DPM3D;S.scene=new T.Scene();S.scene.background=new T.Color(0x061526);S.camera=new T.PerspectiveCamera(42,1,.1,500);S.renderer=new T.WebGLRenderer({antialias:true,alpha:false});S.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));S.renderer.shadowMap.enabled=true;S.renderer.shadowMap.type=T.PCFSoftShadowMap;mount.appendChild(S.renderer.domElement);S.root=new T.Group();S.scene.add(S.root);S.ray=new T.Raycaster();S.mouse=new T.Vector2();S.target=new T.Vector3(0,0,0);
 S.scene.add(new T.HemisphereLight(0xbcefff,0x04101c,1.25));const dl=new T.DirectionalLight(0xdffaff,2.0);dl.position.set(-25,45,22);dl.castShadow=true;S.scene.add(dl);const pl=new T.PointLight(0x35e6c0,1.9,140);pl.position.set(0,26,0);S.scene.add(pl);
 const ground=new T.Mesh(new T.PlaneGeometry(170,130),new T.MeshStandardMaterial({color:0x071b2d,roughness:.92,metalness:.05}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;S.scene.add(ground);const grid=new T.GridHelper(150,40,0x2d7892,0x183f58);grid.position.y=.03;S.scene.add(grid);
 const poly=dpm3dNormalizePolygon(),shape=new T.Shape();shape.moveTo(poly[0][0],poly[0][1]);for(let i=1;i<poly.length;i++)shape.lineTo(poly[i][0],poly[i][1]);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:3.2,bevelEnabled:true,bevelSegments:2,bevelSize:.45,bevelThickness:.45});geo.rotateX(-Math.PI/2);const platform=new T.Mesh(geo,new T.MeshStandardMaterial({color:0x13466f,emissive:0x0b2943,emissiveIntensity:.35,metalness:.22,roughness:.38,transparent:true,opacity:.97}));platform.position.y=.15;platform.receiveShadow=true;platform.castShadow=true;S.root.add(platform);
 const edge=new T.LineSegments(new T.EdgesGeometry(geo,25),new T.LineBasicMaterial({color:0x58dbff,transparent:true,opacity:.68}));edge.position.copy(platform.position);S.root.add(edge);
 const dpms=dpm3dDpms(),layout=dpm3dLayout(dpms.length,poly);S.markers=[];S.markerByName.clear();dpms.forEach((I,i)=>{const m=dpm3dMakeMarker(I,layout[i]);S.root.add(m);S.markers.push(m);S.markerByName.set(I.name,m)});
 function resize(){const r=mount.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);S.camera.aspect=w/h;S.camera.updateProjectionMatrix();S.renderer.setSize(w,h,false)}resize();new ResizeObserver(resize).observe(mount);
 function cam(){S.el=Math.max(.28,Math.min(1.28,S.el));const ce=Math.cos(S.el),x=S.target.x+Math.cos(S.az)*ce*S.dist,y=10+Math.sin(S.el)*S.dist,z=S.target.z+Math.sin(S.az)*ce*S.dist;S.camera.position.set(x,y,z);S.camera.lookAt(S.target.x,3,S.target.z)}
 function pick(ev){const r=S.renderer.domElement.getBoundingClientRect();S.mouse.x=(ev.clientX-r.left)/r.width*2-1;S.mouse.y=-((ev.clientY-r.top)/r.height*2-1);S.ray.setFromCamera(S.mouse,S.camera);const hit=S.ray.intersectObjects(S.markers,true)[0];if(!hit)return;let o=hit.object;while(o&&!(o.userData&&o.userData.kind==='dpm3d'))o=o.parent;if(o)dpm3dSetSelected(o.userData.name,true)}
 const c=S.renderer.domElement;c.addEventListener('pointerdown',e=>{S.drag=true;S.lastX=e.clientX;S.lastY=e.clientY;c.setPointerCapture&&c.setPointerCapture(e.pointerId)});c.addEventListener('pointermove',e=>{if(!S.drag)return;const dx=e.clientX-S.lastX,dy=e.clientY-S.lastY;S.lastX=e.clientX;S.lastY=e.clientY;S.az-=dx*.006;S.el+=dy*.004});c.addEventListener('pointerup',e=>{S.drag=false;if(Math.abs(e.clientX-S.lastX)<3&&Math.abs(e.clientY-S.lastY)<3)pick(e)});c.addEventListener('wheel',e=>{e.preventDefault();S.dist=Math.max(34,Math.min(145,S.dist*(e.deltaY>0?1.08:.92)))},{passive:false});c.addEventListener('dblclick',pick);
 if(!S.bound){S.bound=true;document.addEventListener('click',e=>{const card=e.target&&e.target.closest&&e.target.closest('.dpm-list-card');if(card&&card.dataset.name)dpm3dSetSelected(card.dataset.name,true)})}
 const focus=new URLSearchParams(location.search).get('focusName');if(focus&&S.markerByName.has(focus))dpm3dSetSelected(focus,false);
 function loop(t){S.raf=requestAnimationFrame(loop);cam();S.markers.forEach((m,i)=>{const rg=m.userData.ringObj;if(rg){const k=1+Math.sin(t*.002+i)*.05;rg.scale.setScalar(k);rg.rotation.z=t*.00035}});S.renderer.render(S.scene,S.camera)}cancelAnimationFrame(S.raf);S.raf=requestAnimationFrame(loop)
}
function dpm3dEnsure(){if(!document.body.classList.contains('dpm-city-map-mode'))return;requestAnimationFrame(()=>dpm3dBuild())}
if(typeof showDpmCityMap==='function'){const __dpm3dShow=showDpmCityMap;showDpmCityMap=function(show){const r=__dpm3dShow(show);if(show)setTimeout(dpm3dEnsure,40);return r}}
setTimeout(()=>{if(new URLSearchParams(location.search).get('mapMode')==='dpm')dpm3dEnsure()},220);
`;
  const pos=html.lastIndexOf('</script>');
  if(pos<0)return html;
  return html.slice(0,pos)+runtime+html.slice(pos);
}

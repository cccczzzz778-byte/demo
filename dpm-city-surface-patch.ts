export const DPM_CITY_SURFACE_MARKER='BUXORO_SSB_DPM_CITY_SURFACE_V1';

export function patchDpmCitySurface(input:string):string{
  if(!input||input.includes(DPM_CITY_SURFACE_MARKER)||!input.includes('</script>'))return input;
  const runtime=`\n/* ${DPM_CITY_SURFACE_MARKER} */\nconst DPM_CITY_SURFACE={group:null,poly:[],points:[],active:false};
function dpmSurfacePointInPoly(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/((b[1]-a[1])||1e-9)+a[0]))c=!c}return c}
function dpmSurfacePolygon(){
 try{if(typeof DATA==='undefined'||typeof W!=='function')return null;const city=DATA.find(d=>d&&d.n==='Buxoro shahri'),ring=city&&city.r&&city.r[0];if(!ring||ring.length<3)return null;const pts=ring.map(q=>W(q[0],q[1])).map(w=>[w[0],w[1]]);let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;pts.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minZ=Math.min(minZ,p[1]);maxZ=Math.max(maxZ,p[1])});const cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,dx=Math.max(1,maxX-minX),dz=Math.max(1,maxZ-minZ),s=Math.min(112/dx,66/dz);return pts.map(p=>[(p[0]-cx)*s,(p[1]-cz)*s]);}catch{return null}
}
function ensureDpmCitySurface(){
 if(DPM_CITY_SURFACE.group||typeof THREE==='undefined'||typeof sc==='undefined')return;const T=THREE,poly=dpmSurfacePolygon()||[[-50,18],[-34,31],[18,34],[49,16],[54,-13],[30,-31],[-22,-33],[-50,-18]];DPM_CITY_SURFACE.poly=poly;
 const g=new T.Group();g.visible=false;g.userData={kind:'dpm-city-surface'};const shape=new T.Shape();shape.moveTo(poly[0][0],poly[0][1]);for(let i=1;i<poly.length;i++)shape.lineTo(poly[i][0],poly[i][1]);shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:3.6,bevelEnabled:true,bevelThickness:.5,bevelSize:.45,bevelSegments:2});geo.rotateX(-Math.PI/2);const landMat=new T.MeshLambertMaterial({color:0x1686cf,emissive:0x08385f,transparent:true,opacity:.98});const land=new T.Mesh(geo,landMat);land.position.y=-.15;land.castShadow=true;land.receiveShadow=true;g.add(land);
 const edge=new T.LineSegments(new T.EdgesGeometry(geo,28),new T.LineBasicMaterial({color:0x67efff,transparent:true,opacity:.95}));edge.position.copy(land.position);g.add(edge);
 const grid=new T.GridHelper(126,28,0x4ee9ff,0x20577c);grid.position.y=3.55;grid.material.transparent=true;grid.material.opacity=.22;g.add(grid);
 const halo=new T.Mesh(new T.RingGeometry(40,58,96),new T.MeshBasicMaterial({color:0x29c9ff,transparent:true,opacity:.08,side:T.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.1;g.add(halo);
 sc.add(g);DPM_CITY_SURFACE.group=g;
}
function dpmSurfaceLayout(n){const poly=DPM_CITY_SURFACE.poly||[],pts=[];for(let z=-25;z<=25&&pts.length<n;z+=10){const row=Math.round((z+25)/10);for(let x=-44+(row%2?5:0);x<=44&&pts.length<n;x+=10){if(!poly.length||dpmSurfacePointInPoly([x,z],poly))pts.push([x,z])}}if(pts.length<n){const golden=2.3999632297;for(let i=pts.length;i<n;i++){const a=i*golden,r=8+Math.sqrt(i+1)*5.8;pts.push([Math.cos(a)*r,Math.sin(a)*r*.72])}}return pts.slice(0,n)}
function positionDpmsOnCitySurface(){
 ensureDpmCitySurface();if(typeof INS==='undefined')return;const dpms=INS.filter(I=>I&&(I.type==='V'||I.type==='DPM'));const layout=dpmSurfaceLayout(dpms.length);DPM_CITY_SURFACE.points=layout;
 dpms.forEach((I,i)=>{if(!I.pos)return;const p=layout[i]||[0,0],dx=p[0]-I.pos.x,dz=p[1]-I.pos.z;const visuals=[I.mesh,...(I.fx||[]),I.ic].filter(Boolean);visuals.forEach(o=>{if(o&&o.position){o.position.x+=dx;o.position.z+=dz;o.visible=true}});I.pos.x=p[0];I.pos.z=p[1]});
}
function setDpmSurfaceMode(active){
 ensureDpmCitySurface();DPM_CITY_SURFACE.active=!!active;if(DPM_CITY_SURFACE.group)DPM_CITY_SURFACE.group.visible=!!active;
 if(typeof MT!=='undefined')Object.values(MT).forEach(ms=>(ms||[]).forEach(m=>{if(!m)return;m.transparent=!!active;m.opacity=active?.018:1;m.needsUpdate=true}));
 if(active){positionDpmsOnCitySurface();if(typeof tgG!=='undefined'&&tgG&&tgG.set)tgG.set(0,0,0);if(typeof rdG!=='undefined')rdG=118;if(typeof phG!=='undefined')phG=.72;if(typeof fly!=='undefined')fly=true}
}
if(typeof setMapMode==='function'){
 const __dpmSurfaceSetMapMode=setMapMode;
 setMapMode=function(mode,updateUrl=true){const r=__dpmSurfaceSetMapMode(mode,updateUrl);setTimeout(()=>setDpmSurfaceMode(mode==='dpm'),0);return r};
}
setTimeout(()=>{try{ensureDpmCitySurface();if(new URLSearchParams(location.search).get('mapMode')==='dpm')setDpmSurfaceMode(true)}catch(e){console.warn('DPM_CITY_SURFACE_FAILED',e&&e.message||e)}},90);
`;
  const pos=input.lastIndexOf('</script>');
  return pos<0?input:input.slice(0,pos)+runtime+input.slice(pos);
}

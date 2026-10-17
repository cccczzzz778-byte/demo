export const PATCH_MARKER = 'BUXORO_SSB_LEADERSHIP_3D_V2';

export const DISTRICT_PALETTE = {
  'Buxoro': 0x88B7E8,
  'Buxoro shahri': 0x8EDBE8,
  'Kogon': 0xB9A8E8,
  'Kogon shahri': 0xE7CC91,
  'Olot': 0x91D3C4,
  "Qorako'l": 0x9AAAE5,
  'Jondor': 0x95D2B8,
  'Peshku': 0xA4CDE7,
  'Vobkent': 0xD8D39A,
  "G'ijduvon": 0xD3A6D8,
  'Shofirkon': 0xE4B18F,
  'Romitan': 0xBCA9DF,
  'Qorovulbozor': 0xE3A0A8,
} as const;

export const HOUSE_COUNTS = { TTB: 10, SHTB: 10, OP: 5, OShP: 4 } as const;

function replaceFunctionBlock(input: string, startMarker: string, endMarker: string, replacement: string) {
  const start = input.indexOf(startMarker);
  const end = start >= 0 ? input.indexOf(endMarker, start) : -1;
  if (start < 0 || end < 0) return input;
  return input.slice(0, start) + replacement + input.slice(end);
}

export function patchLeadership3d(input: string): string {
  if (!input || input.includes(PATCH_MARKER)) return input;
  let html = input;

  const paletteLiteral = `const DISTRICT_COLORS={
"Buxoro":0x88b7e8,"Buxoro shahri":0x8edbe8,"Kogon":0xb9a8e8,"Kogon shahri":0xe7cc91,
"Olot":0x91d3c4,"Qorako'l":0x9aaae5,"Jondor":0x95d2b8,"Peshku":0xa4cde7,
"Vobkent":0xd8d39a,"G'ijduvon":0xd3a6d8,"Shofirkon":0xe4b18f,"Romitan":0xbca9df,"Qorovulbozor":0xe3a0a8};
const districtScore=n=>VAL[n]??(n==="Buxoro shahri"?VAL["Buxoro"]:n==="Kogon shahri"?VAL["Kogon"]:null);
function districtStatusColor(n){const v=districtScore(n);return v==null?0x27d8ff:v>=75?0x25e06a:v>=55?0xffc83d:0xff5b6e}
`;

  const css = `<style id="buxoro-district-ux-style">
.todaybx{margin:0 0 10px;padding:10px 11px;border:1px solid rgba(82,169,207,.38);background:linear-gradient(135deg,rgba(9,41,76,.94),rgba(5,24,49,.94));box-shadow:0 0 22px rgba(75,175,217,.08);border-radius:8px}.todayttl{display:flex;align-items:center;justify-content:space-between;color:#eef9ff;font-weight:800;font-size:14px;margin-bottom:8px}.todayttl b{color:#8edbe8;font-size:11px;letter-spacing:.08em}.todaygrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.todaystat{background:rgba(8,34,64,.78);border-left:2px solid #8edbe8;padding:7px 8px}.todaystat strong{display:block;color:#fff;font-size:17px;line-height:1.05}.todaystat span{display:block;color:#a9c7d9;font-size:10px;margin-top:3px}.todaynote{margin-top:7px;color:#e7cc91;font-size:10px;line-height:1.35}
</style><meta name="buxoro-leadership-3d" content="${PATCH_MARKER}">`;
  html = html.replace('</head>', css + '</head>');

  const colorAnchor = 'const c1=new THREE.Color(0x0b4a8f),c2=new THREE.Color(0x27d8ff),meshes=[],lbs=[],cities=[],dists=[],MT={},rings=[];';
  if (html.includes(colorAnchor)) html = html.replace(colorAnchor, paletteLiteral + colorAnchor);
  html = html.replace('const col=city?new THREE.Color(0x8aeeff):c1.clone().lerp(c2,(VAL[d.n]-35)/60);', 'const col=new THREE.Color(DISTRICT_COLORS[d.n]||0x88b7e8);');
  html = html.replace('ribbon(lp,h,city?5:3.2,city?0xffffff:0x27d8ff);', 'ribbon(lp,h,city?5:3.2,districtStatusColor(d.n));');

  const focusAndCity = `function applyDistrictFocus(n){
 Object.entries(MT).forEach(([k,mm])=>{const active=!n||k===n;mm.forEach(m=>{m.transparent=!!n;m.opacity=active?1:.18;if(m.emissive){if(n&&active)m.emissive.copy(m.color).multiplyScalar(.12);else m.emissive.setHex(0)}m.needsUpdate=true})});
 flowObjects.forEach(o=>{const active=!n||o.userData.district===n;o.visible=active;if(o.material&&'opacity'in o.material)o.material.opacity=active?.6:.06});
 neighbourhoodObjects.forEach(o=>{const active=!n||o.userData.district===n;o.visible=active});
 medicalCenterObjects.forEach(o=>{const active=!n||o.userData.district===n;o.visible=active});
}
function applyCenterFocus(I){
 if(!I)return;applyDistrictFocus(I.dist);
 medicalCenterObjects.forEach(o=>{if(o.userData.district===I.dist)o.visible=true});
 neighbourhoodObjects.forEach(o=>{o.visible=o.userData.district===I.dist&&(!o.userData.center||o.userData.center===I.name)});
 flowObjects.forEach(o=>{o.visible=o.userData.district===I.dist&&(!o.userData.center||o.userData.center===I.name||o.userData.level==='district-to-ssb')});
}
function resetMapFocus(){applyDistrictFocus(null);neighbourhoodObjects.forEach(o=>o.visible=true);medicalCenterObjects.forEach(o=>o.visible=true);flowObjects.forEach(o=>o.visible=true)}
function ensureCityVisibility(){
 ["Buxoro shahri","Kogon shahri"].forEach(n=>{
  (MT[n]||[]).forEach(m=>{m.transparent=false;m.opacity=1;m.depthTest=false;m.renderOrder=12;m.needsUpdate=true});
  const d=DATA.find(x=>x.n===n);if(!d||!d.c)return;const w=W(d.c[0],d.c[1]);lab(n,w[0],(parentH[n]||H[n]||2)+9,w[1]);const cityLabel=lbs[lbs.length-1];if(cityLabel&&cityLabel.d){cityLabel.d.style.zIndex="30";cityLabel.d.style.fontWeight="800";cityLabel.d.style.pointerEvents="none"}
 });
}
ensureCityVisibility();
`;
  if (html.includes('// buildings')) html = html.replace('// buildings', focusAndCity + '// buildings');

  const houseBuilder = `function buildNeighbourhoodHouses(){
 const HOUSE_COUNTS_3D={TTB:10,SHTB:10,OP:5,OShP:4},MAX_HOUSE_INSTANCES=900,byName=Object.fromEntries(DATA.map(d=>[d.n,d]));let total=0;
 const bodyGeo=new THREE.BoxGeometry(1,1,1);bodyGeo.translate(0,.5,0);const roofGeo=new THREE.ConeGeometry(.72,1,4);roofGeo.rotateY(Math.PI/4);roofGeo.translate(0,.5,0);
 const bmH=new THREE.MeshLambertMaterial({color:0x8ebdca,emissive:0x173a47,transparent:true,opacity:.9}),rmH=new THREE.MeshLambertMaterial({color:0xc7e4ea,emissive:0x233f49,transparent:true,opacity:.94});
 P.filter(p=>HOUSE_COUNTS_3D[p.I.type]).forEach(p=>{
  if(total>=MAX_HOUSE_INSTANCES||p.d[4]==null||p.d[5]==null)return;const scope=p.d[3]||p.d[2],area=byName[scope]||byName[p.d[2]],poly=area&&area.r&&area.r[0];if(!poly)return;
  const wanted=Math.min(HOUSE_COUNTS_3D[p.I.type],MAX_HOUSE_INSTANCES-total),base=hs(p.I.name)(),pts=[];
  for(let ring=0;ring<4&&pts.length<wanted;ring++)for(let a=0;a<28&&pts.length<wanted;a++){
   const ang=base*6.283+a*6.283/28+ring*.17,off=(p.I.type==="TTB"||p.I.type==="SHTB"?1.35:.72)+ring*.34,q=[p.d[4]+Math.cos(ang)*off,p.d[5]+Math.sin(ang)*off];
   if(!safePointInPolygon(q,poly,.14))continue;if(pts.some(v=>Math.hypot(v[0]-q[0],v[1]-q[1])<.28))continue;pts.push(q)
  }
  if(!pts.length)return;const bodies=new THREE.InstancedMesh(bodyGeo,bmH,pts.length),roofs=new THREE.InstancedMesh(roofGeo,rmH,pts.length),m4=new THREE.Matrix4();
  pts.forEach((q,i)=>{const w=W(q[0],q[1]);m4.makeScale(.45,.58,.45).setPosition(w[0],p.y+.04,w[1]);bodies.setMatrixAt(i,m4);m4.makeScale(.51,.28,.51).setPosition(w[0],p.y+.62,w[1]);roofs.setMatrixAt(i,m4)});
  const center=(p.I.type==="TTB"||p.I.type==="SHTB")?p.I.name:null;bodies.userData={district:p.I.dist,center,kind:"neighbourhood"};roofs.userData={district:p.I.dist,center,kind:"neighbourhood"};sc.add(bodies);sc.add(roofs);neighbourhoodObjects.push(bodies,roofs);total+=pts.length
 });
}
`;
  if (html.includes('function buildNeighbourhoodHouses(){')) {
    const start = html.indexOf('function buildNeighbourhoodHouses(){');
    const end = html.indexOf('buildSSBHeadquarters();', start);
    if (start >= 0 && end >= 0) html = html.slice(0,start) + houseBuilder + html.slice(end);
  } else if (html.includes('buildSSBHeadquarters();')) {
    html = html.replace('buildSSBHeadquarters();', houseBuilder + 'buildSSBHeadquarters();');
  }

  const centerBuilder = `const medicalCenterObjects=[],neighbourhoodObjects=[],flowObjects=[];
function buildDistrictMedicalCenters(){
 const bodyMat=new THREE.MeshLambertMaterial({color:0x7aa9c4,emissive:0x173b52}),accentMat=new THREE.MeshLambertMaterial({color:0xd7edf3,emissive:0x254854}),crossMat=new THREE.MeshLambertMaterial({color:0xf6fbff,emissive:0x3c5967});
 P.filter(p=>p.I.type==="TTB"||p.I.type==="SHTB").forEach(p=>{
  const I=p.I,x=p.x,y=p.y,z=p.z;if(I.mesh){I.mesh.visible=false;const mi=meshes.indexOf(I.mesh);if(mi>=0)meshes.splice(mi,1)}
  const parts=[];const add=(g,m,px,py,pz)=>{const o=new THREE.Mesh(g,m);o.position.set(px,py,pz);o.userData={inst:I,district:I.dist,center:I.name};sc.add(o);meshes.push(o);medicalCenterObjects.push(o);parts.push(o);return o};
  add(new THREE.BoxGeometry(5.8,.75,4.6),bodyMat,x,y+.38,z);const core=add(new THREE.BoxGeometry(4.5,3.8,3.4),bodyMat,x,y+2.65,z);add(new THREE.BoxGeometry(5.0,.35,3.9),accentMat,x,y+4.72,z);add(new THREE.BoxGeometry(1.8,.36,.25),crossMat,x,y+3.0,z+1.84);add(new THREE.BoxGeometry(.36,1.8,.25),crossMat,x,y+3.0,z+1.86);
  const rc=new THREE.Mesh(new THREE.RingGeometry(3.2,3.65,42),new THREE.MeshBasicMaterial({color:SC[I.st],transparent:true,opacity:.68,side:2,depthWrite:false}));rc.rotation.x=-Math.PI/2;rc.position.set(x,y+.1,z);rc.userData={inst:I,district:I.dist,center:I.name,ph:R()*2};sc.add(rc);rings.push(rc);medicalCenterObjects.push(rc);parts.push(rc);
  const cv=document.createElement("canvas");cv.width=512;cv.height=128;const cx=cv.getContext("2d");cx.fillStyle="rgba(5,27,53,.94)";cx.fillRect(0,18,512,92);cx.strokeStyle="#b9dce9";cx.lineWidth=4;cx.strokeRect(2,20,508,88);cx.fillStyle="#f4fbff";cx.font="700 34px sans-serif";cx.textAlign="center";cx.textBaseline="middle";cx.fillText(I.type+" · "+I.dist,256,64);const districtLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,fog:false}));districtLabel.scale.set(15,3.7,1);districtLabel.position.set(x,y+7.0,z);districtLabel.userData={district:I.dist,center:I.name};sc.add(districtLabel);medicalCenterObjects.push(districtLabel);parts.push(districtLabel);
  I.mesh=core;I.fx=[...(I.fx||[]),...parts.filter(o=>o!==core)];I.pos=new THREE.Vector3(x,y+5.1,z)
 });
}
`;
  if (!html.includes('function buildDistrictMedicalCenters')) {
    const anchor = html.includes('function buildNeighbourhoodHouses(){') ? 'function buildNeighbourhoodHouses(){' : 'buildSSBHeadquarters();';
    html = html.replace(anchor, centerBuilder + anchor);
  }
  html = html.replace('buildSSBHeadquarters();\nbuildNeighbourhoodHouses();', 'buildSSBHeadquarters();\nbuildDistrictMedicalCenters();\nbuildNeighbourhoodHouses();');

  const flowSection = `// hierarchical medical data flow: OP/OShP -> TTB/SHTB -> Buxoro SSB
let auto=true,fly=false,tgG=new THREE.Vector3(),rdG=270,phG=1;
const pulses=[],MAX_FLOW_EDGES=180;
const dotT=tex((x,w,h)=>{const q=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);q.addColorStop(0,"rgba(255,255,255,1)");q.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=q;x.fillRect(0,0,w,h)},64,64);
const AM={map:dotT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false};
function canonicalFlowDistrict(n){return String(n||"").replace(/[ʻʼ’‘]/g,"'").trim().toLowerCase()}
function resolveDistrictCenter(I){if(!I)return null;const d=canonicalFlowDistrict(I.dist);return INS.find(c=>(c.type==="TTB"||c.type==="SHTB")&&canonicalFlowDistrict(c.dist)===d)||null}
function addHierarchicalFlow(from,to,level,center){
 if(!from||!to||pulses.length>=MAX_FLOW_EDGES)return;const a=from.pos.clone().add(new THREE.Vector3(0,from.type==="OP"||from.type==="OShP"?5:8,0)),b=to.pos.clone().add(new THREE.Vector3(0,to.type==="V"?8:7,0)),mid=a.clone().lerp(b,.5);mid.y+=Math.min(28,a.distanceTo(b)*.22);const cu=new THREE.QuadraticBezierCurve3(a,mid,b),district=from.dist||to.dist||null;
 const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(cu.getPoints(30)),new THREE.LineBasicMaterial({color:level==="facility-to-district"?0x9fd9e4:0xe7cc91,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false}));line.userData={district,center,level};sc.add(line);flowObjects.push(line);
 const p=new THREE.Points(new THREE.BufferGeometry().setFromPoints([a]),new THREE.PointsMaterial({...AM,color:level==="facility-to-district"?0xd9f7ff:0xffedb4,size:5}));p.userData={district,center,level};sc.add(p);flowObjects.push(p);pulses.push({cu,p,o:R(),level,from,to})
}
function buildHierarchicalFlows(){
 const ssb=INS.find(i=>i.name==="Viloyat sog'liqni saqlash boshqarmasi");if(!ssb)return;
 INS.filter(I=>I.type==="OP"||I.type==="OShP").forEach(I=>{const center=resolveDistrictCenter(I);if(center)addHierarchicalFlow(I,center,"facility-to-district",center.name)});
 INS.filter(I=>I.type==="TTB"||I.type==="SHTB").forEach(I=>addHierarchicalFlow(I,ssb,"district-to-ssb",I.name));
}
function animateHierarchicalFlows(time){pulses.forEach(q=>q.p.geometry.setFromPoints([q.cu.getPoint((time*.22+q.o)%1)]))}
buildHierarchicalFlows();
const dpts=[];for(let i=0;i<220;i++)dpts.push(new THREE.Vector3((R()-.5)*420,4+R()*70,(R()-.5)*420));const dust=new THREE.Points(new THREE.BufferGeometry().setFromPoints(dpts),new THREE.PointsMaterial({...AM,color:0xbbeaf1,size:2.6,opacity:.42}));sc.add(dust);
`;
  html = replaceFunctionBlock(html, '// flow arcs from Buxoro SHTB to every TTB/SHTB + floating dust', '// orbit + hover', flowSection);
  html = html.replace('pulses.forEach(q=>{q.p.geometry.setFromPoints([q.cu.getPoint((T*.22+q.o)%1)])});dust.rotation.y+=.0002;', 'animateHierarchicalFlows(T);dust.rotation.y+=.0002;');

  const todayCode = `function todayBox(title,list){const province=list===INS,hudud=province?DATA.length:(list.length?1:0),scope=title||"Buxoro viloyati";return '<div class="todaybx"><div class="todayttl"><span>Bugungi holat</span><b>JONLI NAZORAT</b></div><div class="todaygrid"><div class="todaystat"><strong>'+list.length+'</strong><span>Muassasa · '+scope+'</span></div><div class="todaystat"><strong>'+hudud+'</strong><span>Hudud ko‘rinmoqda</span></div></div><div class="todaynote">Status ranglari pastel hudud rangidan alohida ko‘rsatiladi.</div></div>'}\n`;
  if (html.includes('function render(title,list,I){') && !html.includes('function todayBox(')) html = html.replace('function render(title,list,I){', todayCode + 'function render(title,list,I){');
  html = html.replace('Lp.innerHTML=l;Rp.innerHTML=r;', 'Lp.innerHTML=todayBox(title,list)+l;Rp.innerHTML=r;');

  html = html.replace('function home(){tgG.set(0,0,0);rdG=270;phG=1;fly=true;selLab.hide=true;render("Buxoro viloyati",INS)}', 'function home(){resetMapFocus();tgG.set(0,0,0);rdG=270;phG=1;fly=true;selLab.hide=true;render("Buxoro viloyati",INS)}');
  html = html.replace('function home(){applyDistrictFocus(null);tgG.set(0,0,0);rdG=270;phG=1;fly=true;selLab.hide=true;render("Buxoro viloyati",INS)}', 'function home(){resetMapFocus();tgG.set(0,0,0);rdG=270;phG=1;fly=true;selLab.hide=true;render("Buxoro viloyati",INS)}');
  html = html.replace('function selectDist(n){const t=INS.find(x=>(x.type==="TTB"||x.type==="SHTB")&&x.dist===n)||INS.find(x=>x.dist===n);if(!t)return;selLab.hide=true;tgG.set(t.pos.x,0,t.pos.z);rdG=110;phG=.9;fly=true;render(n.endsWith("shahri")?n:n+" tumani",INS.filter(x=>x.dist===n))}', 'function selectDist(n){const t=INS.find(x=>(x.type==="TTB"||x.type==="SHTB")&&x.dist===n)||INS.find(x=>x.dist===n);if(!t)return;applyDistrictFocus(n);selLab.hide=true;tgG.set(t.pos.x,0,t.pos.z);rdG=110;phG=.9;fly=true;render(n.endsWith("shahri")?n:n+" tumani",INS.filter(x=>x.dist===n))}');
  html = html.replace('function selectDist(n){const t=INS.find(x=>(x.type==="TTB"||x.type==="SHTB")&&x.dist===n)||INS.find(x=>x.dist===n);if(!t)return;applyDistrictFocus(n);selLab.hide=true;tgG.set(t.pos.x,0,t.pos.z);rdG=110;phG=.9;fly=true;render(n.endsWith("shahri")?n:n+" tumani",INS.filter(x=>x.dist===n))}', 'function selectDist(n){const t=INS.find(x=>(x.type==="TTB"||x.type==="SHTB")&&x.dist===n)||INS.find(x=>x.dist===n);if(!t)return;applyDistrictFocus(n);selLab.hide=true;tgG.set(t.pos.x,0,t.pos.z);rdG=110;phG=.9;fly=true;render(n.endsWith("shahri")?n:n+" tumani",INS.filter(x=>x.dist===n))}');
  html = html.replace('function selectInst(I){selLab.d.textContent=I.name;selLab.v.set(I.pos.x,I.pos.y+14,I.pos.z);selLab.hide=false;tgG.set(I.pos.x,0,I.pos.z);rdG=45;phG=.8;fly=true;render(I.name,[I],I)}', 'function selectInst(I){if(I.type==="TTB"||I.type==="SHTB")applyCenterFocus(I);else applyDistrictFocus(I.dist);selLab.d.textContent=I.name;selLab.v.set(I.pos.x,I.pos.y+14,I.pos.z);selLab.hide=false;tgG.set(I.pos.x,0,I.pos.z);rdG=45;phG=.8;fly=true;render(I.name,[I],I)}');
  html = html.replace('function selectInst(I){applyDistrictFocus(I.dist);selLab.d.textContent=I.name;selLab.v.set(I.pos.x,I.pos.y+14,I.pos.z);selLab.hide=false;tgG.set(I.pos.x,0,I.pos.z);rdG=45;phG=.8;fly=true;render(I.name,[I],I)}', 'function selectInst(I){if(I.type==="TTB"||I.type==="SHTB")applyCenterFocus(I);else applyDistrictFocus(I.dist);selLab.d.textContent=I.name;selLab.v.set(I.pos.x,I.pos.y+14,I.pos.z);selLab.hide=false;tgG.set(I.pos.x,0,I.pos.z);rdG=45;phG=.8;fly=true;render(I.name,[I],I)}');

  return html;
}

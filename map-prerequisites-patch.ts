export const MAP_HARDENING_MARKER='BUXORO_SSB_MAP_PREREQUISITES_V1';

export function patchMapPrerequisites(input:string):string{
  if(!input||input.includes(MAP_HARDENING_MARKER)||!input.includes('const IDATA=['))return input;
  let html=input.replace('</head>',`<meta name="buxoro-map-prerequisites" content="${MAP_HARDENING_MARKER}"></head>`);
  if(!html.includes('const ALLOWED_TYPES=')){
    html=html.replace('const IDATA=[','const ALLOWED_TYPES=new Set(["V","TTB","SHTB","MP","OP","OShP"]);\nconst IDATA=[');
    html=html.replace('];\nconst TY={V:','].filter(d=>ALLOWED_TYPES.has(d[1]));\nconst TY={V:');
  }
  html=html.replace("const TY={V:[\"DPM\",0xb48cff,0x3a1f7a,1.5,8,1,0],TTB:[\"TTB\",0xffc83d,0x8a5a00,1.5,9,1,1],SHTB:[\"SHTB\",0xff7a3d,0x7a2a00,1.5,11,1,1],MP:[\"MP\",0xff6fb5,0x6a1a40,1.1,6,1,0],OP:[\"OP\",0x35f0a0,0x0a6a40,.9,4,1,0],OShP:[\"OShP\",0x3fa8ff,0x0a3a7a,.8,3,0,0],SES:[\"SES\",0xffffff,0x555555,.7,3.5,0,0],X:[\"Boshqa\",0x9aa8ff,0x2a3a8a,1,5,1,0]};","const TY={V:[\"DPM\",0xb48cff,0x3a1f7a,1.15,3.6,1,0],TTB:[\"TTB\",0xffc83d,0x8a5a00,1.5,9,1,1],SHTB:[\"SHTB\",0xff7a3d,0x7a2a00,1.5,11,1,1],MP:[\"MP\",0xff6fb5,0x6a1a40,1.1,6,1,0],OP:[\"OP\",0x35f0a0,0x0a6a40,.9,4,1,0],OShP:[\"OShP\",0x3fa8ff,0x0a3a7a,.8,3,0,0]};");
  html=html.replace('});sc.add(ib);','});/* white city building layer removed */');
  html=html.replace('});sc.add(ib2);','});/* white district building layer removed */');
  html=html.replace('const ICS={V:5.8,TTB:5.2,SHTB:5.8,MP:4.4,OP:4.2,OShP:3.8,SES:3.6,X:3.8}','const ICS={V:4.0,TTB:5.2,SHTB:5.8,MP:4.4,OP:4.2,OShP:3.8}');
  html=html.replace('const q=new THREE.Mesh(gCone,mat);q.scale.set(t[3]*.9,2.6,t[3]*.9);q.position.set(x,y+t[4],z);sc.add(q);I.fx.push(q);top=t[4]+2.6','const q=new THREE.Mesh(gCone,mat);q.scale.set(t[3]*.82,1.1,t[3]*.82);q.position.set(x,y+t[4],z);sc.add(q);I.fx.push(q);top=t[4]+1.1');

  const placement='Object.values(gp).forEach(g=>{if(g.length>1)g.forEach((p,i)=>{const a=i*6.283/g.length;p.x+=Math.cos(a)*.8;p.z+=Math.sin(a)*.8})});\nP.forEach(p=>tower(p.I,p.x,p.y,p.z));';
  if(html.includes(placement)&&!html.includes('function safePointInPolygon(')){
    const helper=`Object.values(gp).forEach(g=>{if(g.length>1)g.forEach((p,i)=>{const a=i*6.283/g.length;p.x+=Math.cos(a)*.8;p.z+=Math.sin(a)*.8})});
function safePointInPolygon(p,r,m=.28){if(!inP(p,r))return false;for(let k=0;k<12;k++){const a=k*Math.PI*2/12;if(!inP([p[0]+Math.cos(a)*m,p[1]+Math.sin(a)*m],r))return false}return true}
function placeDPMInsideBuxoroCity(){
 const city=DATA.find(d=>d.n==="Buxoro shahri");if(!city||!city.r||!city.r[0])return;const poly=city.r[0],[x0,x1,y0,y1]=bbox(poly),spacing=.65,cand=[];
 for(let row=0,y=y0+.38;y<=y1-.38;y+=spacing,row++)for(let x=x0+.38+(row%2?spacing/2:0);x<=x1-.38;x+=spacing)if(safePointInPolygon([x,y],poly,.28))cand.push([x,y]);
 cand.sort((a,b)=>Math.hypot(a[0]-city.c[0],a[1]-city.c[1])-Math.hypot(b[0]-city.c[0],b[1]-city.c[1]));const dpms=P.filter(p=>p.I.type==="V"),ssb=dpms.find(p=>p.I.name==="Viloyat sog'liqni saqlash boshqarmasi"),used=[city.c.slice()];
 const setp=(p,q)=>{p.d[4]=q[0];p.d[5]=q[1];p.d[3]="Buxoro shahri";const w=W(q[0],q[1]);p.x=w[0];p.z=w[1];p.y=(parentH["Buxoro shahri"]||H["Buxoro"]||0)+.9};if(ssb)setp(ssb,city.c);
 let ci=0;dpms.filter(p=>p!==ssb).forEach(p=>{while(ci<cand.length&&used.some(u=>Math.hypot(cand[ci][0]-u[0],cand[ci][1]-u[1])<=.55))ci++;const q=cand[Math.min(ci,cand.length-1)]||city.c;setp(p,q);used.push(q);ci++})
}
placeDPMInsideBuxoroCity();
P.forEach(p=>tower(p.I,p.x,p.y,p.z));`;
    html=html.replace(placement,helper);
  }

  const towerMarker='P.forEach(p=>tower(p.I,p.x,p.y,p.z));\n// flow arcs from Buxoro SHTB to every TTB/SHTB + floating dust';
  if(html.includes(towerMarker)&&!html.includes('function buildSSBHeadquarters')){
    const ssb=`P.forEach(p=>tower(p.I,p.x,p.y,p.z));
function buildSSBHeadquarters(){
 const I=INS.find(i=>i.name==="Viloyat sog'liqni saqlash boshqarmasi");if(!I)return;const old=[I.mesh,...(I.fx||[]),I.ic];old.forEach(o=>{if(o){o.visible=false;sc.remove(o)}});const mi=meshes.indexOf(I.mesh);if(mi>=0)meshes.splice(mi,1);
 const p=P.find(q=>q.I===I),x=p?p.x:I.pos.x,y=p?p.y:0,z=p?p.z,blue=new THREE.MeshLambertMaterial({color:0x0a67c7,emissive:0x07366d}),white=new THREE.MeshLambertMaterial({color:0xe9f7ff,emissive:0x244a66}),gold=new THREE.MeshLambertMaterial({color:0xffc83d,emissive:0x6a4a00}),parts=[];
 const add=(geo,mat,px,py,pz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.userData={inst:I};sc.add(m);meshes.push(m);parts.push(m);return m};add(new THREE.BoxGeometry(6.2,1,5),blue,x,y+.5,z);const body=add(new THREE.BoxGeometry(4.8,4.1,3.8),blue,x,y+3,z);add(new THREE.BoxGeometry(5.2,.38,4.2),gold,x,y+5.22,z);add(new THREE.BoxGeometry(2,.42,.28),white,x,y+3.2,z+2.18);add(new THREE.BoxGeometry(.42,2,.28),white,x,y+3.2,z+2.2);
 const tc=document.createElement("canvas");tc.width=512;tc.height=128;const t=tc.getContext("2d");t.fillStyle="rgba(3,20,55,.92)";t.fillRect(0,20,512,88);t.strokeStyle="#8edbe8";t.lineWidth=4;t.strokeRect(2,22,508,84);t.fillStyle="#fff";t.font="700 42px sans-serif";t.textAlign="center";t.textBaseline="middle";t.fillText("BUXORO SSB",256,65);const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(tc),transparent:true,depthWrite:false,fog:false}));tag.scale.set(16,4,1);tag.position.set(x,y+7.2,z);sc.add(tag);parts.push(tag);I.mesh=body;I.fx=parts.filter(q=>q!==body);I.pos=new THREE.Vector3(x,y+5.3,z);I.thr=1e9
}
buildSSBHeadquarters();
// flow arcs from Buxoro SHTB to every TTB/SHTB + floating dust`;
    html=html.replace(towerMarker,ssb);
  }
  return html;
}

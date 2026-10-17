export const PROVINCE_MARKER_HARDENING_MARKER='BUXORO_SSB_PROVINCE_MARKER_HARDENING_V1';

export function patchProvinceMarkerHardening(input:string):string{
  if(!input||input.includes(PROVINCE_MARKER_HARDENING_MARKER)||!input.includes('</script>'))return input;
  const runtime=`
/* ${PROVINCE_MARKER_HARDENING_MARKER} */
function __hardDistrictKeepSet(){const s=new Set();try{if(typeof MT!=='undefined'&&MT)Object.values(MT).forEach(arr=>(arr||[]).forEach(o=>{if(!o)return;s.add(o);if(typeof o.traverse==='function')o.traverse(x=>s.add(x))}))}catch{}return s}
function __hardNearestInstitution(o){if(typeof INS==='undefined'||!Array.isArray(INS)||!INS.length||!o)return null;let x=0,z=0;try{if(typeof THREE!=='undefined'&&typeof o.getWorldPosition==='function'){const v=new THREE.Vector3();o.getWorldPosition(v);x=v.x;z=v.z}else if(o.position){x=o.position.x||0;z=o.position.z||0}else return null}catch{return null}let best=null,bd=Infinity;for(const I of INS){if(!I||!I.pos)continue;const d=Math.hypot((I.pos.x||0)-x,(I.pos.z||0)-z);if(d<bd){bd=d;best=I}}return bd<=5.5?best:null}
function __hardMarkerLike(o){if(!o)return false;const g=o.geometry&&o.geometry.type||'';return !!o.isSprite||g==='PlaneGeometry'||g==='BoxGeometry'||g==='CircleGeometry'||g==='RingGeometry'||g==='ConeGeometry'||g==='CylinderGeometry'}
function __hardEnforceProvinceMarkers(){try{if(typeof sc==='undefined'||!sc||typeof sc.traverse!=='function')return;const selected=typeof __districtDrillSelected!=='undefined'?__districtDrillSelected:null,keep=__hardDistrictKeepSet();sc.traverse(o=>{if(!o||keep.has(o)||o.isLight||o.isCamera)return;const ud=o.userData||(o.userData={});if(ud.kind==='approx-settlement'){o.visible=!!selected&&ud.district===selected;return}let I=ud.inst||ud.__hardInst||null;if(!I&&__hardMarkerLike(o))I=__hardNearestInstitution(o);if(I){ud.__hardInst=I;o.visible=!!selected&&I.dist===selected;return}if(!selected&&__hardMarkerLike(o)&&!ud.__hardPreserve)o.visible=false})}catch(e){console.warn('PROVINCE_MARKER_HARDENING',e&&e.message||e)}}
[0,30,80,180,400,900,1600].forEach(ms=>setTimeout(__hardEnforceProvinceMarkers,ms));
setInterval(__hardEnforceProvinceMarkers,140);
`;
  const pos=input.lastIndexOf('</script>');
  let html=input;
  if(pos>=0)html=input.slice(0,pos)+runtime+input.slice(pos);
  if(html.includes('</head>'))html=html.replace('</head>',`<meta name="buxoro-province-marker-hardening" content="${PROVINCE_MARKER_HARDENING_MARKER}"></head>`);
  return html;
}

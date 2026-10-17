export const DPM_TTB_STYLE_MARKER='BUXORO_SSB_DPM_TTB_STYLE_V1';

export function patchDpmTtbStyle(input:string):string{
  if(!input||input.includes(DPM_TTB_STYLE_MARKER)||!input.includes('</script>'))return input;
  const runtime=`\n/* ${DPM_TTB_STYLE_MARKER} */\nfunction dpm3dMakeMarker(I,pos){
 const T=THREE,g=new T.Group();g.userData={inst:I,name:I.name,kind:'dpm3d'};g.position.set(pos[0],3.2,pos[1]);
 const bodyMat=new T.MeshLambertMaterial({color:0x7aa9c4,emissive:0x173b52});
 const accentMat=new T.MeshLambertMaterial({color:0xd7edf3,emissive:0x254854});
 const crossMat=new T.MeshLambertMaterial({color:0xf6fbff,emissive:0x3c5967});
 const base=new T.Mesh(new T.BoxGeometry(5.8,.75,4.6),bodyMat.clone());base.position.set(0,.38,0);base.castShadow=true;base.receiveShadow=true;g.add(base);
 const core=new T.Mesh(new T.BoxGeometry(4.5,3.8,3.4),bodyMat.clone());core.position.set(0,2.65,0);core.castShadow=true;core.receiveShadow=true;g.add(core);
 const roof=new T.Mesh(new T.BoxGeometry(5.0,.35,3.9),accentMat.clone());roof.position.set(0,4.72,0);roof.castShadow=true;g.add(roof);
 const h=new T.Mesh(new T.BoxGeometry(1.8,.36,.25),crossMat.clone()),v=new T.Mesh(new T.BoxGeometry(.36,1.8,.25),crossMat.clone());h.position.set(0,3.0,1.84);v.position.set(0,3.0,1.86);g.add(h,v);
 const ring=new T.Mesh(new T.RingGeometry(3.2,3.65,42),new T.MeshBasicMaterial({color:0x45e4bd,transparent:true,opacity:.68,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.1;ring.userData.ring=true;g.add(ring);
 const signCv=document.createElement('canvas');signCv.width=512;signCv.height=128;const cx=signCv.getContext('2d');cx.fillStyle='rgba(5,27,53,.94)';cx.fillRect(0,18,512,92);cx.strokeStyle='#b9dce9';cx.lineWidth=4;cx.strokeRect(2,20,508,88);cx.fillStyle='#f4fbff';cx.font='700 28px sans-serif';cx.textAlign='center';cx.textBaseline='middle';let label=String(I.name||'DPM');if(label.length>30)label=label.slice(0,28)+'…';cx.fillText(label,256,64);const spr=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(signCv),transparent:true,depthWrite:false,fog:false}));spr.scale.set(14,3.4,1);spr.position.set(0,6.7,0);g.add(spr);
 g.userData.tower=core;g.userData.ringObj=ring;g.userData.bodyParts=[base,core,roof];return g
}
`;
  const pos=input.lastIndexOf('</script>');
  if(pos<0)return input;
  return input.slice(0,pos)+runtime+input.slice(pos);
}

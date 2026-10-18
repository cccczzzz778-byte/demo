export const LEADERSHIP_REFERENCE_LAYOUT_MARKER='BUXORO_REFERENCE_LAYOUT_V1';

export function patchLeadershipReferenceLayout(input:string):string{
  if(!input||input.includes(LEADERSHIP_REFERENCE_LAYOUT_MARKER)) return input;
  const styleAnchor='</style>';
  const runtimeAnchor='home();fly=false;loop();';
  if(!input.includes(styleAnchor)||!input.includes(runtimeAnchor)) return input;

  const css=`
/* ${LEADERSHIP_REFERENCE_LAYOUT_MARKER} */
body.district-mode.medical-command-center #L{left:16px!important;top:66px!important;width:404px!important;max-height:calc(100vh - 178px)!important;padding:10px 11px!important;border-radius:15px!important;overflow:auto!important;background:linear-gradient(165deg,rgba(4,26,61,.97),rgba(2,14,35,.96))!important;border:1px solid rgba(43,218,255,.58)!important;box-shadow:0 18px 58px rgba(0,0,0,.38),inset 0 0 36px rgba(39,216,255,.075)!important}
body.district-mode.medical-command-center #R{right:16px!important;top:66px!important;width:404px!important;max-height:calc(100vh - 178px)!important;padding:10px 11px!important;border-radius:15px!important;overflow:auto!important;background:linear-gradient(165deg,rgba(4,26,61,.97),rgba(2,14,35,.96))!important;border:1px solid rgba(43,218,255,.58)!important;box-shadow:0 18px 58px rgba(0,0,0,.38),inset 0 0 36px rgba(39,216,255,.075)!important}
body.district-mode.medical-command-center header{top:8px!important}body.district-mode.medical-command-center h1{font-size:clamp(24px,2.35vw,35px)!important;letter-spacing:2.4px!important}body.district-mode.medical-command-center #sub{font-size:11px!important;letter-spacing:2px!important}
body.district-mode.medical-command-center .dcc-panel{gap:5px!important}.ref-dcc-head{display:flex;align-items:center;gap:10px;padding:9px 10px;border:1px solid rgba(64,215,255,.24);border-radius:11px;background:linear-gradient(135deg,rgba(31,151,255,.15),rgba(22,65,137,.08))}.ref-dcc-head .ref-head-icon{width:42px;height:42px;border-radius:10px;display:grid;place-items:center;font-size:22px;background:linear-gradient(145deg,rgba(28,128,245,.38),rgba(31,83,188,.20));box-shadow:inset 0 0 18px rgba(60,195,255,.18)}.ref-dcc-head .dcc-kicker{font-size:8px!important}.ref-dcc-head strong{display:block;margin-top:2px;font-size:21px;color:#fff;text-shadow:0 0 12px rgba(39,216,255,.25)}
body.district-mode.medical-command-center .dcc-kpi{min-height:58px!important;padding:6px 8px!important;grid-template-columns:40px 1fr 92px!important;gap:8px!important;border-radius:10px!important}body.district-mode.medical-command-center .dcc-icon{width:40px!important;height:40px!important;font-size:20px!important}body.district-mode.medical-command-center .dcc-main b{font-size:9.5px!important}body.district-mode.medical-command-center .dcc-main strong{font-size:19px!important}body.district-mode.medical-command-center .dcc-main small{font-size:7px!important;margin-top:3px!important}body.district-mode.medical-command-center .dcc-side{min-width:90px}body.district-mode.medical-command-center .dcc-spark{width:58px!important;height:16px!important;margin-left:auto!important}body.district-mode.medical-command-center .dcc-side em{font-size:10px!important}body.district-mode.medical-command-center .dcc-side span{font-size:6.8px!important;margin-top:3px!important}
body.district-mode.medical-command-center .dcc-section{margin-bottom:6px!important;border-radius:11px!important}body.district-mode.medical-command-center .dcc-headrow{padding:8px 9px!important}body.district-mode.medical-command-center .dcc-headrow b{font-size:10px!important}body.district-mode.medical-command-center .dcc-headrow span{font-size:7px!important}body.district-mode.medical-command-center .dcc-change-grid{gap:6px!important;padding:7px!important}body.district-mode.medical-command-center .dcc-change{padding:7px!important}body.district-mode.medical-command-center .dcc-change label{font-size:7.5px!important}body.district-mode.medical-command-center .dcc-change strong{font-size:15px!important}body.district-mode.medical-command-center .dcc-rank{padding:5px 8px 8px!important}body.district-mode.medical-command-center .dcc-rrow{margin:4px 0!important;grid-template-columns:18px 1.15fr 1fr 52px!important}body.district-mode.medical-command-center .dcc-rname{font-size:7.6px!important}body.district-mode.medical-command-center .dcc-rval{font-size:7.8px!important}
body.district-mode.medical-command-center #dcc-bottom{left:16px!important;right:16px!important;bottom:9px!important;grid-template-columns:minmax(0,1fr) 330px!important;gap:9px!important}body.district-mode.medical-command-center .dcc-bottom-main,body.district-mode.medical-command-center .dcc-ai{border-radius:12px!important;background:linear-gradient(150deg,rgba(3,24,56,.96),rgba(2,14,34,.985))!important}body.district-mode.medical-command-center .dcc-bottom-title{padding:5px 8px 2px!important;font-size:8.5px!important}body.district-mode.medical-command-center .dcc-bottom-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;padding:4px 6px 6px!important}body.district-mode.medical-command-center .dcc-bcard{grid-template-columns:31px 1fr!important;gap:6px!important;padding:5px 6px!important;min-height:49px!important}body.district-mode.medical-command-center .dcc-bicon{height:31px!important;font-size:16px!important}body.district-mode.medical-command-center .dcc-bcard label{font-size:6.7px!important}body.district-mode.medical-command-center .dcc-bcard strong{font-size:13px!important}body.district-mode.medical-command-center .dcc-bcard small{font-size:6.4px!important}body.district-mode.medical-command-center .dcc-ai{padding:6px!important}body.district-mode.medical-command-center .dcc-ai-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;margin-top:5px!important}body.district-mode.medical-command-center .dcc-ai-card{padding:5px 4px!important}body.district-mode.medical-command-center .dcc-ai-card label{font-size:6.2px!important}body.district-mode.medical-command-center .dcc-ai-card strong{font-size:11.5px!important}body.district-mode.medical-command-center .dcc-ai-card small{font-size:6px!important}
body.district-mode.medical-command-center .lg{left:430px!important;bottom:103px!important;width:315px!important;max-width:315px!important;padding:9px 10px!important;gap:6px!important;border-radius:11px!important;background:linear-gradient(145deg,rgba(4,26,60,.98),rgba(2,14,35,.98))!important}body.district-mode.medical-command-center .lg .dleg-title{font-size:9.5px!important}body.district-mode.medical-command-center .lg .dleg-row{gap:5px!important}body.district-mode.medical-command-center .lg .dleg-chip{padding:3px 6px!important;font-size:7.5px!important}
body.district-mode.medical-command-center .btns{bottom:104px!important;z-index:32!important}body.district-mode.medical-command-center .btns button{padding:7px 14px!important;border-radius:10px!important}.district-mode.medical-command-center .nt{display:none!important}
body.district-mode.medical-command-center canvas{filter:saturate(1.06) contrast(1.02)}
@media(max-width:1500px){body.district-mode.medical-command-center #L,body.district-mode.medical-command-center #R{width:370px!important}.district-mode.medical-command-center .lg{left:394px!important}.district-mode.medical-command-center #dcc-bottom{grid-template-columns:minmax(0,1fr) 305px!important}}
@media(max-width:1180px){body.district-mode.medical-command-center #L,body.district-mode.medical-command-center #R{width:320px!important}.district-mode.medical-command-center .lg{display:none!important}.district-mode.medical-command-center #dcc-bottom{grid-template-columns:1fr!important}.district-mode.medical-command-center .dcc-ai{display:none!important}}
`;

  const runtime=String.raw`
/* ${LEADERSHIP_REFERENCE_LAYOUT_MARKER} */
const refRate=(v,p)=>p?Number(v)/Number(p)*10000:0;
const refKpi=(icon,title,value,sub,oldVal,newVal)=>dccKpi(icon,title,value,sub,oldVal,newVal);
const refDistrictLeft=(u,d,h)=>{
  const p25=Number(h.y2025.pop||d.pop25||0),p26=Number(d.pop26||0);
  const doc25=refRate(h.y2025.doc,p25),doc26=refRate(d.doc26,p26);
  const mid25=refRate(h.y2025.mid,p25),mid26=refRate(d.mid26,p26);
  const bed25=refRate(h.y2025.beds,p25),bed26=refRate(d.beds,p26);
  return '<div class="dcc-panel"><div class="ref-dcc-head"><div class="ref-head-icon">🏥</div><div><div class="dcc-kicker">HUDUD DASHBOARDI</div><strong>'+u.title+'</strong></div></div>'+
    refKpi('👥','Aholi',d.pop26,'Doimiy aholi, kishi',h.y2025.pop,d.pop26)+
    refKpi('🩺','Shifokorlar',d.doc26,'Jami shifokorlar soni',h.y2025.doc,d.doc26)+
    refKpi('👩‍⚕️','O‘rta tibbiyot xodimlari',d.mid26,'Hamshira va boshqa xodimlar',h.y2025.mid,d.mid26)+
    refKpi('🛌','Shifo o‘rinlari',d.beds,'Jami shifo o‘rinlari',h.y2025.beds,d.beds)+
    refKpi('🔎','Vrach vakansiyasi',d.vac,'Bo‘sh shtat o‘rinlari',h.y2025.vac,d.vac)+
    refKpi('🏢','Xususiy litsenziantlar',d.priv,'Xususiy tibbiyot muassasalari',h.y2025.priv,d.priv)+
    refKpi('📈','Vrach / 10 ming',doc26.toFixed(1),'Aholiga vrach ta’minoti',doc25,doc26)+
    refKpi('📊','O‘TX / 10 ming',mid26.toFixed(1),'Aholiga O‘TX ta’minoti',mid25,mid26)+
    refKpi('🛏','O‘rin / 10 ming',bed26.toFixed(1),'Shifo o‘rni ta’minoti',bed25,bed26)+'</div>';
};
const refDimNeighbours=(u)=>{
  if(Array.isArray(detM))detM.forEach(m=>{const k=m&&m.userData&&m.userData.u;if(!k||k===u.key)return;const mats=Array.isArray(m.material)?m.material:[m.material];mats.forEach(mt=>{if(!mt)return;mt.transparent=true;mt.opacity=.07;mt.depthWrite=false});m.renderOrder=-5});
  if(Array.isArray(lbs))lbs.forEach(l=>{if(l._refOriginalGroup===undefined)l._refOriginalGroup=l.g;const mapped=U2&&U2[l.d&&l.d.textContent];if(mapped&&mapped.key!==u.key)l.g='__ref_hidden';});
};
const refRestoreLabels=()=>{if(Array.isArray(lbs))lbs.forEach(l=>{if(l._refOriginalGroup!==undefined){l.g=l._refOriginalGroup;delete l._refOriginalGroup}})};
const _refRenderUnit=renderUnit;
renderUnit=function(u){
  _refRenderUnit(u);
  const d=hsFind(u),h=d&&dccHistFor(u);if(!d||!h)return;
  document.body.classList.add('medical-command-center','district-mode');
  Lp.innerHTML=refDistrictLeft(u,d,h);
  Rp.innerHTML=dccRight(u,d,h);
  dccEnsure(u,d,h);
  rdG=145;phG=.90;tgG.set(0,0,0);fly=true;
  refDimNeighbours(u);
};
const _refHome=home;
home=function(){
  document.getElementById('dcc-bottom')?.remove();
  refRestoreLabels();
  document.body.classList.remove('district-mode');
  const r=_refHome();
  return r;
};
`;

  let out=input.replace(styleAnchor,css+styleAnchor);
  out=out.replace(runtimeAnchor,runtime+'\n'+runtimeAnchor);
  return out;
}

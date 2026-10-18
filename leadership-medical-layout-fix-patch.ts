export const LEADERSHIP_MEDICAL_LAYOUT_FIX_MARKER='BUXORO_MEDICAL_LAYOUT_FIX_V1';

export function patchLeadershipMedicalLayoutFix(input:string):string{
  if(!input||input.includes(LEADERSHIP_MEDICAL_LAYOUT_FIX_MARKER)) return input;
  const styleAnchor='</style>';
  const runtimeAnchor='home();fly=false;loop();';
  if(!input.includes(styleAnchor)||!input.includes(runtimeAnchor)) return input;

  const css=`
/* ${LEADERSHIP_MEDICAL_LAYOUT_FIX_MARKER} */
.medical-command-center #L{left:16px!important;top:76px!important;width:350px!important;max-height:calc(100vh - 184px)!important;padding:10px 11px!important}
.medical-command-center #R{right:16px!important;top:76px!important;width:350px!important;max-height:calc(100vh - 184px)!important;padding:10px 11px!important}
body.tv-mode.medical-command-center #L,body.tv-mode.medical-command-center #R{top:76px!important;width:350px!important;max-height:calc(100vh - 184px)!important}
.medical-command-center .btns{bottom:102px!important;z-index:25}
.medical-command-center .nt{bottom:102px!important;right:18px!important;z-index:23}
.medical-command-center .lg{bottom:102px!important;z-index:23}
.medical-command-center #mcc-bottom{left:14px!important;right:14px!important;bottom:8px!important;grid-template-columns:minmax(0,1fr) 360px!important;gap:9px!important}
.medical-command-center .mcc-bottom-title{padding:5px 9px 2px!important}
.medical-command-center .mcc-bottom-grid{padding:4px 6px 6px!important;gap:5px!important}
.medical-command-center .mcc-bcard{padding:5px 6px!important;grid-template-columns:30px 1fr!important;gap:6px!important;min-height:50px!important}
.medical-command-center .mcc-bicon{height:30px!important;font-size:16px!important}
.medical-command-center .mcc-bcard strong{font-size:13px!important}
.medical-command-center .mcc-ai{padding:6px!important}
.medical-command-center .mcc-ai-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;margin-top:5px!important}
.medical-command-center .mcc-ai-card{padding:5px!important;min-width:0!important}
.medical-command-center .mcc-ai-card label{font-size:6.3px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.medical-command-center .mcc-ai-card strong{font-size:12px!important;white-space:nowrap}
.medical-command-center .mcc-ai-card small{font-size:6px!important}
.medical-command-center .mcc-source{font-size:6px!important;margin-top:3px!important}
@media(max-width:1380px){
 .medical-command-center #L{width:330px!important}.medical-command-center #R{width:330px!important}
 body.tv-mode.medical-command-center #L,body.tv-mode.medical-command-center #R{width:330px!important}
 .medical-command-center #mcc-bottom{grid-template-columns:minmax(0,1fr) 330px!important}
}
`;

  const runtime=String.raw`
/* ${LEADERSHIP_MEDICAL_LAYOUT_FIX_MARKER} */
const _mccLayoutSelectUnit=selectUnit;
selectUnit=function(key){
  document.getElementById('mcc-bottom')?.remove();
  document.body.classList.remove('medical-command-center');
  return _mccLayoutSelectUnit(key);
};
`;

  let out=input.replace(styleAnchor,css+styleAnchor);
  out=out.replace(runtimeAnchor,runtime+'\n'+runtimeAnchor);
  return out;
}

export const RUNTIME_FIX_MARKER='BUXORO_SSB_LEADERSHIP_RUNTIME_FIX_V1';

export function patchLeadershipRuntimeFix(input:string):string{
  if(!input||input.includes(RUNTIME_FIX_MARKER))return input;
  let html=input.replace('</head>',`<meta name="buxoro-leadership-runtime-fix" content="${RUNTIME_FIX_MARKER}"></head>`);
  html=html.replaceAll('o.material.opacity=active?.6:.06','o.material.opacity=active ? .6 : .06');
  const flow='// hierarchical medical data flow: OP/OShP -> TTB/SHTB -> Buxoro SSB';
  if(html.includes(flow)){
    let calls='';
    if(html.includes('function buildDistrictMedicalCenters')&&!html.includes('buildDistrictMedicalCenters();'))calls+='buildDistrictMedicalCenters();\n';
    if(html.includes('function buildNeighbourhoodHouses')&&!html.includes('buildNeighbourhoodHouses();'))calls+='buildNeighbourhoodHouses();\n';
    if(calls)html=html.replace(flow,calls+flow);
  }
  return html;
}

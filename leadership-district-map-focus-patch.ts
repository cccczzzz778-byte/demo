export const LEADERSHIP_DISTRICT_MAP_FOCUS_MARKER = 'BUXORO_LEADERSHIP_DISTRICT_MAP_FOCUS_V1';

export function patchLeadershipDistrictMapFocus(input: string): string {
  if (!input || input.includes(LEADERSHIP_DISTRICT_MAP_FOCUS_MARKER)) return input;

  let out = input;

  // Make the selected district/city visually larger in detail mode.
  out = out.replace(
    'rdG=215;phG=.82;fly=true;renderUnit(u)',
    `rdG=172;phG=.84;fly=true;renderUnit(u)/* ${LEADERSHIP_DISTRICT_MAP_FOCUS_MARKER} */`
  );
  out = out.replace(
    'function backUnit(){selLab.hide=true;tgG.set(0,0,0);rdG=215;phG=.82;fly=true;renderUnit(cur)}',
    'function backUnit(){selLab.hide=true;tgG.set(0,0,0);rdG=172;phG=.84;fly=true;renderUnit(cur)}'
  );

  // In district mode, keep only institution types that actually exist in that area.
  const legendSource = 'function lgDet(){return TYL.filter(t=>cur.I.some(x=>x.type===t)).map(t=>`<span><img src="${icon(t).toDataURL()}" width="16" height="16" style="vertical-align:middle;margin-right:5px"><b style="color:${hex(TY[t][1])}">${TY[t][0]}</b> — ${TFULL[t].replace("DPM · ","")}</span>`).join("")+`<span><u style="background:#f3e6cf"></u>aholi punkti (taxminiy)</span><span>Halqa: <u style="background:#35f0a0"></u>barqaror <u style="background:#ffc83d"></u>diqqat <u style="background:#ff4a4a"></u>yuklama yuqori</span>`}';
  const legendReplacement = 'function lgDet(){return TYL.map(t=>[t,cur.I.filter(x=>x.type===t).length]).filter(q=>q[1]>0).map(q=>{const t=q[0],n=q[1];return `<span><img src="${icon(t).toDataURL()}" width="16" height="16" style="vertical-align:middle;margin-right:5px"><b style="color:${hex(TY[t][1])}">${TY[t][0]}</b> — ${TFULL[t].replace("DPM · ","")} (${n})</span>`}).join("")+`<span><u style="background:#f3e6cf"></u>aholi punkti (taxminiy)</span><span>Halqa: <u style="background:#35f0a0"></u>barqaror <u style="background:#ffc83d"></u>diqqat <u style="background:#ff4a4a"></u>yuklama yuqori</span>`}';
  if (out.includes(legendSource)) out = out.replace(legendSource, legendReplacement);

  return out;
}

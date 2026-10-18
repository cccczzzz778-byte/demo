export const LEADERSHIP_DISTRICT_LEGEND_MARKER = 'BUXORO_LEADERSHIP_DISTRICT_LEGEND_V1';

export function patchLeadershipDistrictLegend(input: string): string {
  if (!input || input.includes(LEADERSHIP_DISTRICT_LEGEND_MARKER)) return input;
  const styleAnchor = '</style>';
  const lgDetAnchor = 'function lgDet(){return TYL.filter(t=>cur.I.some(x=>x.type===t)).map(t=>`<span><img src="${icon(t).toDataURL()}" width="16" height="16" style="vertical-align:middle;margin-right:5px"><b style="color:${hex(TY[t][1])}">${TY[t][0]}</b> — ${TFULL[t].replace("DPM · ","")}</span>`).join("")+`<span><u style="background:#f3e6cf"></u>aholi punkti (taxminiy)</span><span>Halqa: <u style="background:#35f0a0"></u>barqaror <u style="background:#ffc83d"></u>diqqat <u style="background:#ff4a4a"></u>yuklama yuqori</span>`}';
  if (!input.includes(styleAnchor) || !input.includes(lgDetAnchor)) return input;

  const css = `
/* ${LEADERSHIP_DISTRICT_LEGEND_MARKER} */
body.district-mode .lg{
  left:330px;
  right:auto;
  bottom:14px;
  max-width:calc(100vw - 700px);
  display:flex;
  flex-direction:row;
  flex-wrap:wrap;
  align-items:center;
  gap:7px 10px;
  padding:7px 10px;
  border:1px solid rgba(39,216,255,.24);
  border-radius:12px;
  background:rgba(3,20,48,.86);
  backdrop-filter:blur(9px);
  box-shadow:0 8px 24px rgba(0,0,0,.24);
  font-size:10px;
  line-height:1.2;
  z-index:3;
}
body.district-mode .lg span{
  display:inline-flex;
  align-items:center;
  white-space:nowrap;
  color:#d9f3ff;
}
body.district-mode .lg img{width:14px!important;height:14px!important;margin-right:4px!important}
body.district-mode .lg u{width:8px;height:8px;margin-right:4px}
body.district-mode .lg .legend-status{opacity:.82}
@media(max-width:1100px){
  body.district-mode .lg{left:12px;right:12px;bottom:48px;max-width:none;justify-content:center}
}
`;

  const newLgDet = 'function lgDet(){const types=TYL.filter(t=>cur.I.some(x=>x.type===t));return types.map(t=>`<span><img src="${icon(t).toDataURL()}" width="14" height="14"><b style="color:${hex(TY[t][1])}">${TY[t][0]}</b>&nbsp;—&nbsp;${TFULL[t].replace("DPM · ","")}</span>`).join("")+`<span><u style="background:#f3e6cf"></u>Aholi punkti</span><span class="legend-status">Holat: <u style="background:#35f0a0"></u>barqaror&nbsp; <u style="background:#ffc83d"></u>diqqat&nbsp; <u style="background:#ff4a4a"></u>yuqori yuklama</span>`}';

  return input.replace(styleAnchor, css + styleAnchor).replace(lgDetAnchor, newLgDet);
}

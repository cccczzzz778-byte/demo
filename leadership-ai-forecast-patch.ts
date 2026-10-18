export const LEADERSHIP_AI_FORECAST_MARKER = 'BUXORO_LEADERSHIP_AI_FORECAST_V2';

export function patchLeadershipAiForecast(input: string): string {
  if (!input || input.includes(LEADERSHIP_AI_FORECAST_MARKER)) return input;
  const styleAnchor = '</style>';
  const runtimeAnchor = 'home();fly=false;loop();';
  if (!input.includes(styleAnchor) || !input.includes(runtimeAnchor)) return input;

  const css = `
/* ${LEADERSHIP_AI_FORECAST_MARKER} */
.ai-forecast{margin-top:10px;padding:10px;border-radius:12px;border:1px solid rgba(129,105,255,.28);background:linear-gradient(145deg,rgba(18,16,54,.78),rgba(4,24,54,.78))}
.ai-forecast-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.ai-forecast-head b{font-size:11px;color:#fff}.ai-badge{font-size:8px;padding:3px 6px;border-radius:999px;border:1px solid rgba(134,120,255,.35);color:#c9c2ff;background:rgba(95,78,255,.12)}
.ai-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ai-card{padding:8px;border-radius:9px;background:rgba(2,15,40,.55);border:1px solid rgba(128,154,255,.13)}.ai-card strong{display:block;font-size:16px;color:#fff;line-height:1.05;font-variant-numeric:tabular-nums}.ai-card span{font-size:8.5px;color:#9fb8d6}.ai-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}.ai-row .ai-card strong{font-size:14px}
`;

  const runtime = String.raw`
/* ${LEADERSHIP_AI_FORECAST_MARKER} */
const aiPct=(a,b)=>a?((b-a)/a):0;
const aiClamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const aiForecast=d=>{const bt=aiClamp(aiPct(d.birth25,d.birth26),-.35,.35),dt=aiClamp(aiPct(d.death25,d.death26),-.35,.35),gt=aiClamp(aiPct(d.growth25,d.growth26),-.5,.5),pt=aiClamp(aiPct(d.pop25,d.pop26),-.1,.1);const y26={pop:Math.round(d.pop26),birth:Math.round(d.birth26*2),death:Math.round(d.death26*2),growth:Math.round(d.growth26*2)};const y27={pop:Math.round(y26.pop*(1+pt)),birth:Math.round(y26.birth*(1+bt)),death:Math.round(y26.death*(1+dt)),growth:Math.round(y26.growth*(1+gt))};return{y26,y27}};
const aiPanel=(d,name)=>{const f=aiForecast(d);return '<div class="ai-forecast"><div class="ai-forecast-head"><b>✦ AI PROGNOZ</b><span class="ai-badge">TAXMINIY</span></div><div class="ai-grid"><div class="ai-card"><strong>'+demoFmt(f.y26.birth)+'</strong><span>2026 yakun · tug‘ilish</span></div><div class="ai-card"><strong>'+demoFmt(f.y26.death)+'</strong><span>2026 yakun · o‘lim</span></div><div class="ai-card"><strong>'+demoFmt(f.y27.birth)+'</strong><span>2027 · tug‘ilish</span></div><div class="ai-card"><strong>'+demoFmt(f.y27.growth)+'</strong><span>2027 · tabiiy o‘sish</span></div></div><div class="ai-row"><div class="ai-card"><strong>'+demoFmt(f.y27.pop)+'</strong><span>2027 · aholi</span></div><div class="ai-card"><strong>'+demoFmt(f.y26.growth)+'</strong><span>2026 yakun · tabiiy o‘sish</span></div><div class="ai-card"><strong>'+demoFmt(f.y27.death)+'</strong><span>2027 · o‘lim</span></div></div></div>'};
const _demoRenderOv=renderOv;renderOv=function(){_demoRenderOv();const d=DEMO_COMPARE[0];Rp.insertAdjacentHTML('beforeend',aiPanel(d,'Buxoro viloyati'));};
const _demoRenderUnit=renderUnit;renderUnit=function(u){_demoRenderUnit(u);const d=findDemo(u);if(!d)return;Rp.insertAdjacentHTML('beforeend',aiPanel(d,u.title));};
`;

  let out = input.replace(styleAnchor, css + styleAnchor);
  out = out.replace(runtimeAnchor, runtime + '\n' + runtimeAnchor);
  return out;
}

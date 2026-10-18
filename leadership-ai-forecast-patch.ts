export const LEADERSHIP_AI_FORECAST_MARKER = 'BUXORO_LEADERSHIP_AI_FORECAST_V1';

export function patchLeadershipAiForecast(input: string): string {
  if (!input || input.includes(LEADERSHIP_AI_FORECAST_MARKER)) return input;
  const styleAnchor = '</style>';
  const runtimeAnchor = 'home();fly=false;loop();';
  if (!input.includes(styleAnchor) || !input.includes(runtimeAnchor)) return input;

  const css = `
/* ${LEADERSHIP_AI_FORECAST_MARKER} */
.ai-forecast{margin-top:10px;padding:10px;border-radius:12px;border:1px solid rgba(129,105,255,.28);background:linear-gradient(145deg,rgba(18,16,54,.78),rgba(4,24,54,.78));box-shadow:inset 0 0 28px rgba(94,74,255,.06)}
.ai-forecast-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.ai-forecast-head b{font-size:12px;color:#fff}.ai-badge{font-size:8px;padding:3px 6px;border-radius:999px;border:1px solid rgba(134,120,255,.35);color:#c9c2ff;background:rgba(95,78,255,.12);letter-spacing:.5px}
.ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ai-card{padding:8px;border-radius:9px;background:rgba(2,15,40,.55);border:1px solid rgba(128,154,255,.13)}.ai-card strong{display:block;font-size:16px;color:#fff}.ai-card span{font-size:9px;color:#9fb8d6}.ai-status{margin-top:8px;padding:7px 8px;border-radius:8px;font-size:9px;line-height:1.45}.ai-positive{background:rgba(44,208,132,.08);color:#79efb8;border:1px solid rgba(44,208,132,.2)}.ai-stable{background:rgba(255,200,61,.07);color:#ffe08a;border:1px solid rgba(255,200,61,.18)}.ai-attention{background:rgba(255,95,112,.08);color:#ff9aa7;border:1px solid rgba(255,95,112,.2)}
.ai-analysis{margin-top:8px;color:#c7d9ed;font-size:9px;line-height:1.5}.ai-analysis em{color:#7f98b9}.ai-loading{opacity:.7}
`;

  const runtime = String.raw`
/* ${LEADERSHIP_AI_FORECAST_MARKER} */
const aiPct=(a,b)=>a?((b-a)/a):0;
const aiClamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const aiForecast=d=>{const bt=aiClamp(aiPct(d.birth25,d.birth26),-.35,.35),dt=aiClamp(aiPct(d.death25,d.death26),-.35,.35),gt=aiClamp(aiPct(d.growth25,d.growth26),-.5,.5),pt=aiClamp(aiPct(d.pop25,d.pop26),-.1,.1);const y26={pop:Math.round(d.pop26),birth:Math.round(d.birth26*2),death:Math.round(d.death26*2),growth:Math.round(d.growth26*2)};const y27={pop:Math.round(y26.pop*(1+pt)),birth:Math.round(y26.birth*(1+bt)),death:Math.round(y26.death*(1+dt)),growth:Math.round(y26.growth*(1+gt))};const status=gt<-.12||dt>.12?'attention':gt>.08&&dt<=.08?'positive':'stable';return{y26,y27,status,trends:{birth:bt,death:dt,growth:gt,pop:pt}}};
const aiStatusText=s=>s==='positive'?'Ijobiy dinamika':s==='attention'?'E’tibor talab qiladi':'Barqaror trend';
const aiStatusClass=s=>s==='positive'?'ai-positive':s==='attention'?'ai-attention':'ai-stable';
const aiPanel=(d,name)=>{const f=aiForecast(d);return '<div class="ai-forecast" data-ai-region="'+name.replace(/"/g,'&quot;')+'"><div class="ai-forecast-head"><b>✦ AI prognoz · 2026–2027</b><span class="ai-badge">TAHMINIY</span></div><div class="ai-grid"><div class="ai-card"><strong>'+demoFmt(f.y26.birth)+'</strong><span>2026 yakun · tug‘ilish</span></div><div class="ai-card"><strong>'+demoFmt(f.y26.death)+'</strong><span>2026 yakun · o‘lim</span></div><div class="ai-card"><strong>'+demoFmt(f.y27.birth)+'</strong><span>2027 · tug‘ilish</span></div><div class="ai-card"><strong>'+demoFmt(f.y27.growth)+'</strong><span>2027 · tabiiy o‘sish</span></div></div><div class="ai-status '+aiStatusClass(f.status)+'">'+aiStatusText(f.status)+' · 2025→2026 trendi asosida</div><div class="ai-analysis ai-loading">AI tahlil tayyorlanmoqda…</div></div>'};
async function loadAiAnalysis(container,d,name){const el=container&&container.querySelector('.ai-analysis');if(!el)return;try{const r=await fetch('/api/ai-forecast',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,data:d,forecast:aiForecast(d)})});const j=await r.json();if(j&&j.analysis){el.classList.remove('ai-loading');el.textContent=j.analysis}else{el.classList.remove('ai-loading');el.innerHTML='<em>Statistik prognoz ko‘rsatilmoqda. AI tahlil serverda hali faollashtirilmagan.</em>'}}catch(e){el.classList.remove('ai-loading');el.innerHTML='<em>Statistik prognoz ko‘rsatilmoqda.</em>'}}
}
const _demoRenderOv=renderOv;renderOv=function(){_demoRenderOv();const d=DEMO_COMPARE[0];Rp.insertAdjacentHTML('beforeend',aiPanel(d,'Buxoro viloyati'));loadAiAnalysis(Rp,d,'Buxoro viloyati')};
const _demoRenderUnit=renderUnit;renderUnit=function(u){_demoRenderUnit(u);const d=findDemo(u);if(!d)return;Rp.insertAdjacentHTML('beforeend',aiPanel(d,u.title));loadAiAnalysis(Rp,d,u.title)};
`;

  let out = input.replace(styleAnchor, css + styleAnchor);
  out = out.replace(runtimeAnchor, runtime + '\n' + runtimeAnchor);
  return out;
}

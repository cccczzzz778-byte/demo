export const LEADERSHIP_DEMOGRAPHY_TV_PRESENTATION_MARKER = 'BUXORO_LEADERSHIP_DEMOGRAPHY_TV_PRESENTATION_V2';

export function patchLeadershipDemographyTvPresentation(input: string): string {
  if (!input || input.includes(LEADERSHIP_DEMOGRAPHY_TV_PRESENTATION_MARKER)) return input;

  const styleAnchor = '</style>';
  const toolbarAnchor = '<div id="tip"></div><div class="btns">';
  const runtimeAnchor = 'home();fly=false;loop();';
  if (!input.includes(styleAnchor) || !input.includes(toolbarAnchor) || !input.includes(runtimeAnchor)) return input;

  const css = `
/* ${LEADERSHIP_DEMOGRAPHY_TV_PRESENTATION_MARKER} */
body.demography-only .chips{display:none!important}
.view-modes{position:fixed;right:14px;top:14px;z-index:9;display:flex;gap:8px;align-items:center}
.view-modes button{appearance:none;border:1px solid rgba(39,216,255,.52);background:rgba(3,28,63,.9);color:#dff8ff;padding:7px 12px;border-radius:999px;font:700 11px "Exo 2",sans-serif;letter-spacing:.35px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22),inset 0 0 14px rgba(39,216,255,.05);backdrop-filter:blur(10px)}
.view-modes button:hover,.view-modes button[aria-pressed="true"]{background:rgba(39,216,255,.18);border-color:#27d8ff;color:#fff;box-shadow:0 0 0 3px rgba(39,216,255,.08),0 8px 24px rgba(0,0,0,.22)}
.demo-note{margin:8px 0 0;padding:7px 9px;border:1px solid rgba(39,216,255,.14);border-radius:8px;background:rgba(0,16,52,.4);color:#9ccfe6;font-size:10px;line-height:1.4}
.demo-metrics{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:8px 0}
.demo-metric{padding:8px 9px;border:1px solid rgba(39,216,255,.15);border-radius:9px;background:rgba(1,20,48,.52)}
.demo-metric b{display:block;font-size:17px;color:#fff;font-variant-numeric:tabular-nums}.demo-metric span{font-size:10px;color:#9ccfe6}
.demo-bars{display:flex;flex-direction:column;gap:7px;margin:7px 0}
.demo-bar-row{display:grid;grid-template-columns:104px 1fr 54px;gap:7px;align-items:center;font-size:10px;color:#d8f1ff}
.demo-bar-track{height:7px;border-radius:999px;background:rgba(39,216,255,.08);overflow:hidden}.demo-bar-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#0b4a8f,#27d8ff)}
.demo-bar-row strong{text-align:right;color:#fff;font-size:10px;font-variant-numeric:tabular-nums}
body.tv-mode #L,body.tv-mode #R{top:88px;max-height:calc(100vh - 116px);width:295px;background:rgba(2,18,45,.88);border-radius:14px}
body.tv-mode #L{left:10px}body.tv-mode #R{right:10px}
body.tv-mode #L .hint,body.tv-mode #R .hint,body.tv-mode .nt{display:none!important}
body.tv-mode header h1{font-size:clamp(22px,2.15vw,32px)}
body.tv-mode .view-modes{top:10px}
body.presentation-mode .view-modes #presentationMode{border-color:#ffc83d;color:#ffc83d;background:rgba(74,52,5,.78)}
@media(max-width:1100px){.view-modes{top:auto;right:8px;bottom:8px}.view-modes button{padding:6px 9px;font-size:10px}.demo-bar-row{grid-template-columns:88px 1fr 48px}}
`;

  const toolbar = `<div class="view-modes" aria-label="Ko'rish rejimlari"><button id="tvMode" type="button" aria-pressed="false">▣ TV rejimi</button><button id="presentationMode" type="button" aria-pressed="false">▶ Taqdimot rejimi</button></div>`;

  const runtime = [
    `/* ${LEADERSHIP_DEMOGRAPHY_TV_PRESENTATION_MARKER} */`,
    'document.body.classList.add("demography-only");',
    'const DEMO_2026=[',
    ' {name:"Buxoro viloyati",pop:2117200,birth:17535,bcoef:16.5643302475,death:4699,dcoef:4.4388815417,growth:12836,gcoef:12.1254487058,ratio:3.7316450309},',
    ' {name:"Buxoro shahri",pop:306200,birth:2674,bcoef:17.4657086871,death:803,dcoef:5.2449379491,growth:1871,gcoef:12.2207707381,ratio:3.3300124533},',
    ' {name:"Kogon shahri",pop:66400,birth:452,bcoef:13.6144578313,death:164,dcoef:4.9397590361,growth:288,gcoef:8.6746987952,ratio:2.7560975610},',
    ' {name:"Olot tumani",pop:107800,birth:989,bcoef:18.3487940631,death:253,dcoef:4.6938775510,growth:736,gcoef:13.6549165121,ratio:3.9090909091},',
    ' {name:"Buxoro tumani",pop:186500,birth:1489,bcoef:15.9678284182,death:401,dcoef:4.3002680965,growth:1088,gcoef:11.6675603217,ratio:3.7132169576},',
    ' {name:"Vobkent tumani",pop:155100,birth:1674,bcoef:21.5860735010,death:296,dcoef:3.8168923275,growth:1378,gcoef:17.7691811734,ratio:5.6554054054},',
    ' {name:"G‘ijduvon tumani",pop:333600,birth:3229,bcoef:19.3585131894,death:772,dcoef:4.6282973621,growth:2457,gcoef:14.7302158273,ratio:4.1826424870},',
    ' {name:"Kogon tumani",pop:88700,birth:846,bcoef:19.0755355130,death:225,dcoef:5.0732807215,growth:621,gcoef:14.0022547914,ratio:3.7600000000},',
    ' {name:"Qorako‘l tumani",pop:177100,birth:1417,bcoef:16.0022586110,death:346,dcoef:3.9073969509,growth:1071,gcoef:12.0948616601,ratio:4.0953757225},',
    ' {name:"Qorovulbozor tumani",pop:20700,birth:133,bcoef:12.8502415459,death:35,dcoef:3.3816425121,growth:98,gcoef:9.4685990338,ratio:3.8000000000},',
    ' {name:"Peshku tumani",pop:136400,birth:1005,bcoef:14.7360703812,death:264,dcoef:3.8709677419,growth:741,gcoef:10.8651026393,ratio:3.8068181818},',
    ' {name:"Romitan tumani",pop:155900,birth:1062,bcoef:13.6241180244,death:314,dcoef:4.0282232200,growth:748,gcoef:9.5958948044,ratio:3.3821656051},',
    ' {name:"Jondor tumani",pop:192700,birth:1473,bcoef:15.2880124546,death:390,dcoef:4.0477426051,growth:1083,gcoef:11.2402698495,ratio:3.7769230769},',
    ' {name:"Shofirkon tumani",pop:190100,birth:1092,bcoef:11.4886901631,death:436,dcoef:4.5870594424,growth:656,gcoef:6.9016307207,ratio:2.5045871560}',
    '];',
    'const DEMO_PROVINCE=DEMO_2026[0];',
    'const demoNorm=s=>String(s||"").toLowerCase().replace(/[‘’ʻʼ\\u0060\x27]/g,"_").replace(/_/g,"\x27").replace(/\\s+/g," ").trim();',
    'const demoKogon=()=>{const a=DEMO_2026.find(d=>d.name==="Kogon shahri"),b=DEMO_2026.find(d=>d.name==="Kogon tumani");const pop=a.pop+b.pop,birth=a.birth+b.birth,death=a.death+b.death,growth=birth-death;return{name:"Kogon tumani va shahri",pop,birth,death,growth,bcoef:birth/pop*2000,dcoef:death/pop*2000,gcoef:growth/pop*2000,ratio:birth/death}};',
    'const findDemo=u=>{if(!u)return DEMO_PROVINCE;if(demoNorm(u.key)==="kogon"||demoNorm(u.title).includes("kogon tumani va shahri"))return demoKogon();const t=demoNorm(u.title),k=demoNorm(u.key);return DEMO_2026.find(d=>demoNorm(d.name)===t)||DEMO_2026.find(d=>{const n=demoNorm(d.name);return n===k||n.replace(/ tumani$/,"")===k||n.replace(/ shahri$/,"")===k})||null};',
    'const demoFmt=n=>Number(n||0).toLocaleString("en-US");',
    'const demoDec=n=>Number(n||0).toFixed(1);',
    'const demoMini=(v,t)=>"<div class=\"demo-metric\"><b>"+v+"</b><span>"+t+"</span></div>";',
    'const demoPanel=d=>"<div class=\"g\">"+stat(demoFmt(d.pop),"Doimiy aholi, kishi")+stat(demoFmt(d.birth),"Tug‘ilganlar")+stat(demoFmt(d.death),"Vafot etganlar")+stat(demoFmt(d.growth),"Tabiiy o‘sish")+"</div><div class=\"demo-metrics\">"+demoMini(demoDec(d.bcoef)+" ‰","Tug‘ilish koeffitsiyenti")+demoMini(demoDec(d.dcoef)+" ‰","O‘lim koeffitsiyenti")+demoMini(demoDec(d.gcoef)+" ‰","Tabiiy o‘sish koeffitsiyenti")+demoMini(demoDec(d.ratio),"Tug‘ilish / o‘lim nisbati")+"</div>";',
    'const demoBars=rows=>{const mx=Math.max.apply(null,rows.map(r=>r[1]).concat([1]));return "<div class=\"demo-bars\">"+rows.map(r=>"<div class=\"demo-bar-row\"><span>"+r[0]+"</span><div class=\"demo-bar-track\"><div class=\"demo-bar-fill\" style=\"width:"+Math.max(2,r[1]/mx*100)+"%\"></div></div><strong>"+demoFmt(r[1])+"</strong></div>").join("")+"</div>"};',
    'renderOv=function(){const rows=UL.map(u=>({u:u,d:findDemo(u)})).filter(x=>x.d).sort((a,b)=>b.d.pop-a.d.pop);Lp.innerHTML="<h2>Buxoro viloyati · 2026 I yarim yillik</h2>"+demoPanel(DEMO_PROVINCE)+"<h2 style=\"margin-top:12px\">Tuman va shaharlar kesimida</h2><table class=\"tb\"><thead><tr><th>Hudud</th><th>Aholi, ming</th><th>Tug‘ilish</th><th>O‘lim</th></tr></thead><tbody>"+rows.map(r=>"<tr class=\"cl\" tabindex=\"0\" data-u=\""+r.u.key+"\"><td>"+r.u.title+"</td><td>"+(r.d.pop/1000).toFixed(1)+"</td><td>"+demoFmt(r.d.birth)+"</td><td>"+demoFmt(r.d.death)+"</td></tr>").join("")+"</tbody></table><p class=\"demo-note\">Manba: 2026-Q2 demografik jadval. Tug‘ilish va o‘lim — yanvar–iyun kumulyativ.</p>";Lp.querySelectorAll("tr.cl").forEach(t=>{t.onclick=()=>selectUnit(t.dataset.u);t.onkeydown=e=>{if(e.key==="Enter")selectUnit(t.dataset.u)}});Rp.innerHTML="<h2>Viloyat demografik ko‘rsatkichlari</h2>"+demoPanel(DEMO_PROVINCE)+"<h2 style=\"margin-top:10px\">Aholi soni bo‘yicha hududlar</h2>"+demoBars(rows.slice(0,8).map(r=>[r.u.title,r.d.pop]))+"<p class=\"demo-note\">Hozircha dashboardda faqat yuklangan demografik ko‘rsatkichlar aks ettiriladi.</p>"};',
    'renderUnit=function(u){const d=findDemo(u);if(!d)return;Lp.innerHTML="<button class=\"bk\" onclick=\"home()\">← Butun viloyat</button><div class=\"district-head\"><div class=\"district-kicker\">Demografik dashboard · 2026 I yarim yillik</div><h2>"+u.title+"</h2></div>"+demoPanel(d)+"<p class=\"demo-note\">Aholi — 2026-Q2. Tug‘ilish va o‘lim — 2026-yil yanvar–iyun kumulyativ. Koeffitsiyentlar yilliklashtirilgan.</p>";Rp.innerHTML="<h2>"+u.title+" · demografiya</h2>"+demoPanel(d)+"<h2 style=\"margin-top:10px\">Tug‘ilish va o‘lim</h2>"+demoBars([["Tug‘ilganlar",d.birth],["Vafot etganlar",d.death],["Tabiiy o‘sish",d.growth]])};',
    'renderInst=function(){if(cur)renderUnit(cur)};',
    'const tvBtn=document.getElementById("tvMode"),presentationBtn=document.getElementById("presentationMode");',
    'let presentationTimer=null,presentationIndex=0;',
    'async function setTvMode(force){const on=force===undefined?!document.body.classList.contains("tv-mode"):!!force;document.body.classList.toggle("tv-mode",on);tvBtn.setAttribute("aria-pressed",String(on));tvBtn.textContent=on?"▣ TV rejimidan chiqish":"▣ TV rejimi";try{if(on&&!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();if(!on&&document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen()}catch(e){}}',
    'function stopPresentation(goHome=true){if(presentationTimer){clearInterval(presentationTimer);presentationTimer=null}document.body.classList.remove("presentation-mode");presentationBtn.setAttribute("aria-pressed","false");presentationBtn.textContent="▶ Taqdimot rejimi";if(goHome)home()}',
    'function startPresentation(){if(presentationTimer){stopPresentation(true);return}presentationIndex=0;document.body.classList.add("presentation-mode");presentationBtn.setAttribute("aria-pressed","true");presentationBtn.textContent="■ Taqdimotni to‘xtatish";const step=()=>{if(!UL.length)return;selectUnit(UL[presentationIndex%UL.length].key);presentationIndex++};step();presentationTimer=setInterval(step,7000)}',
    'tvBtn.addEventListener("click",()=>setTvMode());presentationBtn.addEventListener("click",startPresentation);',
    'document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&document.body.classList.contains("tv-mode")){document.body.classList.remove("tv-mode");tvBtn.setAttribute("aria-pressed","false");tvBtn.textContent="▣ TV rejimi"}});',
    'cv.addEventListener("pointerdown",()=>{if(presentationTimer)stopPresentation(false)},{capture:true});',
    runtimeAnchor
  ].join('\n');

  let out = input.replace(styleAnchor, css + styleAnchor);
  out = out.replace(toolbarAnchor, `<div id="tip"></div>${toolbar}<div class="btns">`);
  out = out.replace(runtimeAnchor, runtime);
  return out;
}

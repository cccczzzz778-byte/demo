export const LEADERSHIP_DEMOGRAPHY_MARKER = 'BUXORO_LEADERSHIP_DEMOGRAPHY_V2';

export function patchLeadershipDemography(input: string): string {
  if (!input || input.includes(LEADERSHIP_DEMOGRAPHY_MARKER)) return input;
  const styleAnchor = '</style>';
  const runtimeAnchor = 'home();fly=false;loop();';
  if (!input.includes(styleAnchor) || !input.includes(runtimeAnchor)) return input;

  const css = `
/* ${LEADERSHIP_DEMOGRAPHY_MARKER} */
.demo-head{margin:0 0 8px}.demo-head .k{font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:#63dfff}.demo-head h2{margin:3px 0 0;font-size:18px;color:#fff}
.demo-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:8px 0}.demo-card{padding:9px 10px;border:1px solid rgba(39,216,255,.17);border-radius:10px;background:rgba(2,20,48,.58)}.demo-card b{display:block;color:#fff;font-size:18px;line-height:1.1;font-variant-numeric:tabular-nums}.demo-card span{display:block;margin-top:3px;color:#9ccfe6;font-size:10px;line-height:1.25}
.demo-coefs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:8px 0}.demo-coef{padding:8px 9px;border-radius:9px;border:1px solid rgba(74,173,255,.15);background:rgba(1,17,42,.55)}.demo-coef b{display:block;color:#dff8ff;font-size:15px}.demo-coef span{color:#8ebfd4;font-size:9px}
.demo-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}.demo-table th,.demo-table td{padding:7px 6px;border-bottom:1px solid rgba(111,203,255,.1);text-align:left}.demo-table th{color:#75dfff;font-weight:700;position:sticky;top:0;background:rgba(2,20,48,.96)}.demo-table td{color:#dcefff}.demo-table tr[data-u]{cursor:pointer}.demo-table tr[data-u]:hover{background:rgba(39,216,255,.08)}
.demo-bars{display:flex;flex-direction:column;gap:7px;margin-top:8px}.demo-bar{display:grid;grid-template-columns:92px 1fr 58px;gap:7px;align-items:center;font-size:10px;color:#dff3ff}.demo-track{height:7px;border-radius:999px;background:rgba(39,216,255,.08);overflow:hidden}.demo-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#0b4a8f,#27d8ff)}.demo-bar strong{text-align:right;color:#fff;font-size:10px}.demo-note{margin:8px 0 0;color:#7fb5cb;font-size:9px;line-height:1.4}
`;

  const runtime = String.raw`
/* ${LEADERSHIP_DEMOGRAPHY_MARKER} */
const DEMO_2026=[
 {name:"Buxoro viloyati",pop:2117200,birth:17535,bcoef:16.5643302475,death:4699,dcoef:4.4388815417,growth:12836,gcoef:12.1254487058,ratio:3.7316450309},
 {name:"Buxoro shahri",pop:306200,birth:2674,bcoef:17.4657086871,death:803,dcoef:5.2449379491,growth:1871,gcoef:12.2207707381,ratio:3.3300124533},
 {name:"Kogon shahri",pop:66400,birth:452,bcoef:13.6144578313,death:164,dcoef:4.9397590361,growth:288,gcoef:8.6746987952,ratio:2.7560975610},
 {name:"Olot tumani",pop:107800,birth:989,bcoef:18.3487940631,death:253,dcoef:4.6938775510,growth:736,gcoef:13.6549165121,ratio:3.9090909091},
 {name:"Buxoro tumani",pop:186500,birth:1489,bcoef:15.9678284182,death:401,dcoef:4.3002680965,growth:1088,gcoef:11.6675603217,ratio:3.7132169576},
 {name:"Vobkent tumani",pop:155100,birth:1674,bcoef:21.5860735010,death:296,dcoef:3.8168923275,growth:1378,gcoef:17.7691811734,ratio:5.6554054054},
 {name:"G‘ijduvon tumani",pop:333600,birth:3229,bcoef:19.3585131894,death:772,dcoef:4.6282973621,growth:2457,gcoef:14.7302158273,ratio:4.1826424870},
 {name:"Kogon tumani",pop:88700,birth:846,bcoef:19.0755355130,death:225,dcoef:5.0732807215,growth:621,gcoef:14.0022547914,ratio:3.7600000000},
 {name:"Qorako‘l tumani",pop:177100,birth:1417,bcoef:16.0022586110,death:346,dcoef:3.9073969509,growth:1071,gcoef:12.0948616601,ratio:4.0953757225},
 {name:"Qorovulbozor tumani",pop:20700,birth:133,bcoef:12.8502415459,death:35,dcoef:3.3816425121,growth:98,gcoef:9.4685990338,ratio:3.8000000000},
 {name:"Peshku tumani",pop:136400,birth:1005,bcoef:14.7360703812,death:264,dcoef:3.8709677419,growth:741,gcoef:10.8651026393,ratio:3.8068181818},
 {name:"Romitan tumani",pop:155900,birth:1062,bcoef:13.6241180244,death:314,dcoef:4.0282232200,growth:748,gcoef:9.5958948044,ratio:3.3821656051},
 {name:"Jondor tumani",pop:192700,birth:1473,bcoef:15.2880124546,death:390,dcoef:4.0477426051,growth:1083,gcoef:11.2402698495,ratio:3.7769230769},
 {name:"Shofirkon tumani",pop:190100,birth:1092,bcoef:11.4886901631,death:436,dcoef:4.5870594424,growth:656,gcoef:6.9016307207,ratio:2.5045871560}
];
const DEMO_PROVINCE=DEMO_2026[0];
const demoNorm=s=>String(s||"").toLowerCase().replace(/[‘’ʻʼ]/g,"'").replace(/\s+/g," ").trim();
const demoFmt=n=>Number(n||0).toLocaleString("en-US");
const demoDec=n=>Number(n||0).toFixed(1);
const demoKogon=()=>{const a=DEMO_2026.find(d=>d.name==="Kogon shahri"),b=DEMO_2026.find(d=>d.name==="Kogon tumani");const pop=a.pop+b.pop,birth=a.birth+b.birth,death=a.death+b.death,growth=birth-death;return{name:"Kogon tumani va shahri",pop,birth,death,growth,bcoef:birth/pop*2000,dcoef:death/pop*2000,gcoef:growth/pop*2000,ratio:birth/death}};
const findDemo=u=>{if(!u)return DEMO_PROVINCE;if(demoNorm(u.key)==="kogon")return demoKogon();const t=demoNorm(u.title),k=demoNorm(u.key);return DEMO_2026.find(d=>demoNorm(d.name)===t)||DEMO_2026.find(d=>{const n=demoNorm(d.name);return n===k||n.replace(/ tumani$/,'')===k||n.replace(/ shahri$/,'')===k})||null};
const demoPanel=d=>'<div class="demo-grid"><div class="demo-card"><b>'+demoFmt(d.pop)+'</b><span>Doimiy aholi, kishi</span></div><div class="demo-card"><b>'+demoFmt(d.birth)+'</b><span>Tug‘ilganlar</span></div><div class="demo-card"><b>'+demoFmt(d.death)+'</b><span>Vafot etganlar</span></div><div class="demo-card"><b>'+demoFmt(d.growth)+'</b><span>Tabiiy o‘sish</span></div></div><div class="demo-coefs"><div class="demo-coef"><b>'+demoDec(d.bcoef)+' ‰</b><span>Tug‘ilish koeffitsiyenti</span></div><div class="demo-coef"><b>'+demoDec(d.dcoef)+' ‰</b><span>O‘lim koeffitsiyenti</span></div><div class="demo-coef"><b>'+demoDec(d.gcoef)+' ‰</b><span>Tabiiy o‘sish koeffitsiyenti</span></div><div class="demo-coef"><b>'+demoDec(d.ratio)+'</b><span>Tug‘ilish / o‘lim nisbati</span></div></div>';
const demoBars=rows=>{const mx=Math.max(...rows.map(r=>r[1]),1);return '<div class="demo-bars">'+rows.map(r=>'<div class="demo-bar"><span>'+r[0]+'</span><div class="demo-track"><div class="demo-fill" style="width:'+Math.max(2,r[1]/mx*100)+'%"></div></div><strong>'+demoFmt(r[1])+'</strong></div>').join('')+'</div>'};
renderOv=function(){const rows=UL.map(u=>({u,d:findDemo(u)})).filter(x=>x.d).sort((a,b)=>b.d.pop-a.d.pop);Lp.innerHTML='<div class="demo-head"><div class="k">2026 I yarim yillik</div><h2>Buxoro viloyati demografiyasi</h2></div>'+demoPanel(DEMO_PROVINCE)+'<table class="demo-table"><thead><tr><th>Hudud</th><th>Aholi</th><th>Tug‘ilish</th><th>O‘lim</th></tr></thead><tbody>'+rows.map(r=>'<tr data-u="'+r.u.key+'"><td>'+r.u.title+'</td><td>'+demoFmt(r.d.pop)+'</td><td>'+demoFmt(r.d.birth)+'</td><td>'+demoFmt(r.d.death)+'</td></tr>').join('')+'</tbody></table><p class="demo-note">2026-yil I yarim yillik demografik ko‘rsatkichlari.</p>';Lp.querySelectorAll('tr[data-u]').forEach(t=>t.onclick=()=>selectUnit(t.dataset.u));Rp.innerHTML='<div class="demo-head"><div class="k">Viloyat kesimi</div><h2>Asosiy ko‘rsatkichlar</h2></div>'+demoPanel(DEMO_PROVINCE)+'<div class="demo-head" style="margin-top:10px"><div class="k">Reyting</div><h2>Aholi soni bo‘yicha</h2></div>'+demoBars(rows.slice(0,8).map(r=>[r.u.title,r.d.pop]));};
renderUnit=function(u){const d=findDemo(u);if(!d)return;Lp.innerHTML='<button class="bk" onclick="home()">← Butun viloyat</button><div class="demo-head"><div class="k">Demografik dashboard · 2026 I yarim yillik</div><h2>'+u.title+'</h2></div>'+demoPanel(d)+'<p class="demo-note">Aholi, tug‘ilish, o‘lim va tabiiy o‘sish ko‘rsatkichlari.</p>';Rp.innerHTML='<div class="demo-head"><div class="k">'+u.title+'</div><h2>Demografik ko‘rsatkichlar</h2></div>'+demoPanel(d)+'<div class="demo-head" style="margin-top:10px"><div class="k">Taqqoslash</div><h2>Tug‘ilish va o‘lim</h2></div>'+demoBars([["Tug‘ilganlar",d.birth],["Vafot etganlar",d.death],["Tabiiy o‘sish",d.growth]]);};
renderInst=function(){if(cur)renderUnit(cur)};
`;

  let out = input.replace(styleAnchor, css + styleAnchor);
  out = out.replace(runtimeAnchor, runtime + '\n' + runtimeAnchor);
  return out;
}

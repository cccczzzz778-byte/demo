export const LEADERSHIP_HISTORY_STATS_MARKER = 'BUXORO_LEADERSHIP_HISTORY_STATS_V1';

export function patchLeadershipHistoryStats(input: string): string {
  if (!input || input.includes(LEADERSHIP_HISTORY_STATS_MARKER)) return input;
  const styleAnchor = '</style>';
  const runtimeAnchor = 'home();fly=false;loop();';
  if (!input.includes(styleAnchor) || !input.includes(runtimeAnchor)) return input;

  const css = `
/* ${LEADERSHIP_HISTORY_STATS_MARKER} */
.hs-history{margin-top:10px;padding:10px;border-radius:14px;border:1px solid rgba(118,211,255,.18);background:linear-gradient(145deg,rgba(2,20,48,.78),rgba(6,29,67,.72));box-shadow:inset 0 0 26px rgba(77,183,255,.045)}
.hs-history-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.hs-history-head b{font-size:11px;letter-spacing:.45px;color:#e6f9ff}.hs-history-head span{font-size:8px;color:#9fddff;border:1px solid rgba(108,205,255,.22);padding:3px 6px;border-radius:999px}
.hs-history-years{display:grid;grid-template-columns:1.3fr repeat(3,.9fr);gap:4px;align-items:center;margin-bottom:5px;padding:0 3px}.hs-history-years span{font-size:8px;color:#6d93b8;text-align:right}.hs-history-years span:first-child{text-align:left}
.hs-trend-row{display:grid;grid-template-columns:1.3fr repeat(3,.9fr);gap:4px;align-items:center;padding:6px 3px;border-top:1px solid rgba(117,171,220,.08)}.hs-trend-row:first-of-type{border-top:0}.hs-trend-row label{font-size:8.5px;color:#9fc1d9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hs-trend-row strong{font-size:10px;color:#f7fbff;text-align:right;font-variant-numeric:tabular-nums}.hs-trend-row strong.current{color:#5ee7ff}.hs-history-note{margin-top:6px;font-size:7.5px;line-height:1.35;color:#6687aa}
body.tv-mode .hs-trend-row strong,body.presentation-mode .hs-trend-row strong{font-size:12px}body.tv-mode .hs-trend-row label,body.presentation-mode .hs-trend-row label{font-size:9.5px}
`;

  const runtime = String.raw`
/* ${LEADERSHIP_HISTORY_STATS_MARKER} */
const HIST_STATS={
 province:{y2024:{pop:2068351,beds:7141,doc:5621,mid:24037,vac:278.5,priv:714,dpm:251,hosp:31,privateBeds:2995,privateCapacity:142215},y2025:{pop:2077025,beds:7239,doc:5966,mid:22980,vac:174.5,priv:714,dpm:261,hosp:31,privateBeds:3500,privateCapacity:143090}},
 "Buxoro shahri":{y2024:{pop:298992,beds:344,doc:468,mid:1739,vac:34.75,priv:333},y2025:{pop:300179,beds:504,doc:505,mid:1750,vac:16.25,priv:333}},
 "Kogon shahri":{y2024:{pop:65312,beds:167,doc:123,mid:541,vac:14,priv:39},y2025:{pop:65500,beds:167,doc:227,mid:547,vac:1.5,priv:39}},
 "Olot":{y2024:{pop:105468,beds:220,doc:139,mid:1117,vac:3.25,priv:8},y2025:{pop:105801,beds:220,doc:148,mid:1104,vac:4.5,priv:8}},
 "Buxoro":{y2024:{pop:180773,beds:225,doc:203,mid:1012,vac:12.25,priv:54},y2025:{pop:181722,beds:240,doc:274,mid:1025,vac:5,priv:54}},
 "Vobkent":{y2024:{pop:150584,beds:278,doc:197,mid:1412,vac:3.5,priv:26},y2025:{pop:151214,beds:278,doc:207,mid:1437,vac:2.5,priv:26}},
 "G‘ijduvon":{y2024:{pop:326453,beds:656,doc:353,mid:2385,vac:4.75,priv:72},y2025:{pop:327477,beds:656,doc:395,mid:2232,vac:5.5,priv:72}},
 "Jondor":{y2024:{pop:187762,beds:367,doc:263,mid:1616,vac:.75,priv:44},y2025:{pop:188822,beds:367,doc:335,mid:1512,vac:1.25,priv:44}},
 "Kogon":{y2024:{pop:85839,beds:183,doc:117,mid:626,vac:1,priv:13},y2025:{pop:86323,beds:183,doc:131,mid:604,vac:2.5,priv:13}},
 "Qorako‘l":{y2024:{pop:173580,beds:352,doc:224,mid:1601,vac:32,priv:29},y2025:{pop:174269,beds:352,doc:241,mid:1541,vac:4,priv:29}},
 "Qorovulbozor":{y2024:{pop:20262,beds:98,doc:50,mid:291,vac:17.5,priv:8},y2025:{pop:20338,beds:101,doc:64,mid:289,vac:10,priv:8}},
 "Peshku":{y2024:{pop:132779,beds:255,doc:179,mid:1399,vac:5.5,priv:26},y2025:{pop:133479,beds:255,doc:196,mid:1258,vac:1.25,priv:26}},
 "Romitan":{y2024:{pop:152739,beds:356,doc:212,mid:1468,vac:16.75,priv:31},y2025:{pop:153503,beds:356,doc:243,mid:1405,vac:11,priv:31}},
 "Shofirkon":{y2024:{pop:187808,beds:364,doc:212,mid:1674,vac:5.75,priv:31},y2025:{pop:188398,beds:364,doc:238,mid:1428,vac:5,priv:31}}
};
const histFmt=v=>Number.isInteger(Number(v))?demoFmt(Number(v)):Number(v).toFixed(2).replace(/\.00$/,'');
const histKey=u=>{if(!u)return null;const n=hsNorm(u.key);if(n==='kogon')return 'Kogon combined';const direct=Object.keys(HIST_STATS).find(k=>k!=='province'&&hsNorm(k)===n);return direct||Object.keys(HIST_STATS).find(k=>k!=='province'&&hsNorm(k)===hsNorm(u.title))||null};
const histCurrent=d=>({pop:d.pop26,beds:d.beds,doc:d.doc26,mid:d.mid26,vac:d.vac,priv:d.priv});
const histCombined=()=>{const a=HIST_STATS['Kogon shahri'],b=HIST_STATS['Kogon'];const add=(y,k)=>Number(a[y][k]||0)+Number(b[y][k]||0);return{y2024:{pop:add('y2024','pop'),beds:add('y2024','beds'),doc:add('y2024','doc'),mid:add('y2024','mid'),vac:add('y2024','vac'),priv:add('y2024','priv')},y2025:{pop:add('y2025','pop'),beds:add('y2025','beds'),doc:add('y2025','doc'),mid:add('y2025','mid'),vac:add('y2025','vac'),priv:add('y2025','priv')}}};
const histRow=(label,a,b,c)=>'<div class="hs-trend-row"><label>'+label+'</label><strong>'+histFmt(a)+'</strong><strong>'+histFmt(b)+'</strong><strong class="current">'+histFmt(c)+'</strong></div>';
const histPanel=(h,current,province=false)=>{let x='<div class="hs-history"><div class="hs-history-head"><b>2024–2026 DINAMIKA</b><span>SONLAR</span></div><div class="hs-history-years"><span>Ko‘rsatkich</span><span>2024</span><span>2025</span><span>2026 · 9 oy</span></div>';x+=histRow('Aholi',h.y2024.pop,h.y2025.pop,current.pop);x+=histRow('Shifo o‘rni',h.y2024.beds,h.y2025.beds,current.beds);x+=histRow('Shifokor',h.y2024.doc,h.y2025.doc,current.doc);x+=histRow('O‘TX',h.y2024.mid,h.y2025.mid,current.mid);x+=histRow('Vrach vakansiya',h.y2024.vac,h.y2025.vac,current.vac);x+=histRow('Xususiy litsenziant',h.y2024.priv,h.y2025.priv,current.priv);if(province){x+=histRow('DPM',h.y2024.dpm,h.y2025.dpm,current.dpm);x+=histRow('Stasionar muassasa',h.y2024.hosp,h.y2025.hosp,current.hospitals);x+=histRow('Xususiy shifo o‘rni',h.y2024.privateBeds,h.y2025.privateBeds,current.privateBeds);x+=histRow('Xususiy APM quvvati',h.y2024.privateCapacity,h.y2025.privateCapacity,current.privateCapacity)}x+='<div class="hs-history-note">2024 va 2025 — 12 oylik tezkor ma’lumotlar; 2026 — joriy 9 oylik tezkor ko‘rsatkichlar.</div></div>';return x};
const _histRenderOv=renderOv;renderOv=function(){_histRenderOv();Lp.insertAdjacentHTML('beforeend',histPanel(HIST_STATS.province,histCurrent(HEALTH_PROVINCE),true));};
const _histRenderUnit=renderUnit;renderUnit=function(u){_histRenderUnit(u);const d=hsFind(u);if(!d)return;let k=histKey(u),h=k==='Kogon combined'?histCombined():HIST_STATS[k];if(h)Lp.insertAdjacentHTML('beforeend',histPanel(h,histCurrent(d),false));};
`;

  let out=input.replace(styleAnchor,css+styleAnchor);
  out=out.replace(runtimeAnchor,runtime+'\n'+runtimeAnchor);
  return out;
}

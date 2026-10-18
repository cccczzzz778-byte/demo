import { brotliDecompressSync } from 'node:zlib';
import c01 from './leadership-full-statistics-min-01.ts';
import c02 from './leadership-full-statistics-min-02.ts';
import c03 from './leadership-full-statistics-min-03.ts';
import c04 from './leadership-full-statistics-min-04.ts';
import c05 from './leadership-full-statistics-min-05.ts';
import c06 from './leadership-full-statistics-min-06.ts';
import c07 from './leadership-full-statistics-min-07.ts';

export const LEADERSHIP_FULL_STATISTICS_MARKER='BUXORO_FULL_STATISTICS_V1';

const FULL_STATS_JSON=brotliDecompressSync(Buffer.from(c01+c02+c03+c04+c05+c06+c07,'base64')).toString('utf8');
const FULL_STATS_SAFE=FULL_STATS_JSON.replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');

export function patchLeadershipFullStatistics(input:string):string{
  if(!input||input.includes(LEADERSHIP_FULL_STATISTICS_MARKER)) return input;
  const styleAnchor='</style>';
  const runtimeAnchor='home();fly=false;loop();';
  if(!input.includes(styleAnchor)||!input.includes(runtimeAnchor)) return input;

  const css=`
/* ${LEADERSHIP_FULL_STATISTICS_MARKER} */
#fullStatBtn{position:fixed;z-index:48;top:11px;right:292px;height:31px;padding:0 13px;border:1px solid rgba(48,218,255,.62);border-radius:999px;background:linear-gradient(150deg,rgba(4,38,76,.96),rgba(2,20,48,.96));color:#e8fbff;font:800 10px/1 Arial,sans-serif;letter-spacing:.15px;box-shadow:0 0 18px rgba(40,207,255,.13);cursor:pointer}
#fullStatBtn:hover{border-color:#5ce8ff;box-shadow:0 0 24px rgba(40,207,255,.26)}
#fullStatOverlay{position:fixed;inset:0;z-index:80;display:none;background:rgba(0,7,22,.76);backdrop-filter:blur(8px);padding:58px 24px 22px;box-sizing:border-box}
#fullStatOverlay.open{display:block}
.fs-shell{height:100%;max-width:1500px;margin:0 auto;border:1px solid rgba(54,219,255,.52);border-radius:18px;background:linear-gradient(150deg,rgba(3,24,56,.985),rgba(1,12,31,.99));box-shadow:0 28px 90px rgba(0,0,0,.58),inset 0 0 55px rgba(39,216,255,.045);display:flex;flex-direction:column;overflow:hidden;color:#eafaff}
.fs-head{display:flex;align-items:center;gap:13px;padding:13px 15px;border-bottom:1px solid rgba(78,205,255,.17);background:linear-gradient(90deg,rgba(13,74,132,.25),rgba(8,35,77,.08))}.fs-title{min-width:240px}.fs-title b{display:block;font-size:17px;letter-spacing:.3px}.fs-title small{display:block;margin-top:4px;font-size:8px;color:#70dff7;letter-spacing:.5px}.fs-tools{display:flex;align-items:center;gap:8px;flex:1;min-width:0}.fs-year{height:32px;padding:0 13px;border-radius:9px;border:1px solid rgba(80,197,244,.24);background:#06264d;color:#a9d7e8;font-weight:900;cursor:pointer}.fs-year.on{color:#001a2d;background:#56e8ff;border-color:#56e8ff;box-shadow:0 0 15px rgba(65,222,255,.25)}#statSearch{height:32px;flex:1;min-width:140px;border-radius:9px;border:1px solid rgba(80,197,244,.22);background:#031a39;color:#e9faff;padding:0 11px;outline:none}#statSearch:focus{border-color:#45dfff}.fs-region{max-width:255px;padding:7px 10px;border-radius:9px;border:1px solid rgba(84,219,255,.2);background:rgba(4,31,66,.75);font-size:9px;color:#a9dff1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fs-close{width:34px;height:34px;border-radius:9px;border:1px solid rgba(255,100,126,.34);background:rgba(93,20,41,.34);color:#ffb7c4;font-size:18px;cursor:pointer}
.fs-meta{display:flex;justify-content:space-between;gap:12px;padding:8px 15px;border-bottom:1px solid rgba(71,180,226,.11);font-size:8.5px;color:#7fa8bd}.fs-meta b{color:#53e7ff}.fs-body{flex:1;min-height:0;overflow:auto;padding:12px 14px 22px;scrollbar-width:thin;scrollbar-color:#1aa9d6 #03142d}.fs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fs-card{border:1px solid rgba(71,193,241,.2);border-radius:12px;background:linear-gradient(145deg,rgba(5,34,72,.88),rgba(2,18,42,.91));overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}.fs-card-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:9px 10px 8px;border-bottom:1px solid rgba(71,193,241,.1)}.fs-card-head b{font-size:10px;line-height:1.35;color:#ecfbff}.fs-page{flex:none;padding:3px 6px;border-radius:999px;background:rgba(37,174,224,.13);border:1px solid rgba(70,216,255,.18);font-size:7.5px;color:#66e4ff}.fs-rows{padding:8px 10px}.fs-row{padding:7px 8px;margin:5px 0;border-radius:8px;background:rgba(5,28,59,.75);border-left:3px solid #2fdcff;font:500 9px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;color:#d7f3ff;white-space:pre-wrap;word-break:break-word}.fs-row.prov{border-left-color:#a78bfa;color:#cddcf0}.fs-empty{padding:9px 10px;font-size:8.5px;color:#64869c;font-style:italic}.fs-none{grid-column:1/-1;padding:30px;text-align:center;color:#799db2;font-size:11px}.fs-badge{display:inline-block;margin-left:6px;padding:2px 5px;border-radius:99px;background:rgba(64,219,255,.09);color:#72e8ff;font-size:7px}
@media(max-width:1100px){#fullStatBtn{right:14px;top:52px}.fs-grid{grid-template-columns:1fr}.fs-head{align-items:flex-start;flex-wrap:wrap}.fs-tools{width:100%;flex-wrap:wrap}.fs-region{max-width:100%}}
@media(max-width:700px){#fullStatOverlay{padding:52px 8px 8px}.fs-title{min-width:0}.fs-year{height:30px}.fs-grid{gap:7px}.fs-body{padding:8px}.fs-card-head b{font-size:9px}.fs-row{font-size:8px}}
`;

  const runtime=String.raw`
/* ${LEADERSHIP_FULL_STATISTICS_MARKER} */
const FULL_STAT_DATA=${FULL_STATS_SAFE};
const fsEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fsNorm=s=>String(s||'').toLowerCase().replace(/[‘’ʻʼ]/g,"'").replace(/g‘/g,"g'").replace(/o‘/g,"o'").replace(/\s+/g,' ').trim();
const FS_REGIONS={
 'buxoro shahri':{label:'Buxoro shahri',rx:/^\d+\s+Бухоро\s+ш(?:\s|$)/i,terms:['Бухоро ш']},
 'kogon shahri':{label:'Kogon shahri',rx:/^\d+\s+Когон\s+ш(?:\s|$)/i,terms:['Когон ш']},
 'olot':{label:'Olot tumani',rx:/^\d+\s+Олот(?:\s|$)/i,terms:['Олот']},
 'buxoro':{label:'Buxoro tumani',rx:/^\d+\s+Бухоро(?!\s+ш)(?:\s|$)/i,terms:['Бухоро']},
 'vobkent':{label:'Vobkent tumani',rx:/^\d+\s+Вобкент(?:\s|$)/i,terms:['Вобкент']},
 "g'ijduvon":{label:'G‘ijduvon tumani',rx:/^\d+\s+Ғиждувон(?:\s|$)/i,terms:['Ғиждувон']},
 'jondor':{label:'Jondor tumani',rx:/^\d+\s+Жондор(?:\s|$)/i,terms:['Жондор']},
 'kogon':{label:'Kogon tumani',rx:/^\d+\s+Когон(?!\s+ш)(?:\s|$)/i,terms:['Когон']},
 "qorako'l":{label:'Qorako‘l tumani',rx:/^\d+\s+Қоракўл(?:\s|$)/i,terms:['Қоракўл']},
 'qorovulbozor':{label:'Qorovulbozor tumani',rx:/^\d+\s+Қоровулбозор(?:\s|$)/i,terms:['Қоровулбозор']},
 'peshku':{label:'Peshku tumani',rx:/^\d+\s+Пешк[уў](?:\s|$)/i,terms:['Пешку','Пешкў']},
 'romitan':{label:'Romitan tumani',rx:/^\d+\s+Ромитан(?:\s|$)/i,terms:['Ромитан']},
 'shofirkon':{label:'Shofirkon tumani',rx:/^\d+\s+Шофиркон(?:\s|$)/i,terms:['Шофиркон']}
};
let fsYear='2025';
function fsRegionInfo(){if(!cur)return{label:'Buxoro viloyati',province:true,terms:['Вилоят','Жами']};const key=fsNorm(cur.key);return FS_REGIONS[key]||{label:cur.title||cur.key,terms:[cur.key]}}
function fsRows(rec,info){const all=Array.isArray(rec.r)?rec.r:[];if(info.province){const p=all.filter(x=>/^ВИЛОЯТ|^Вилоят|^Жами/i.test(x));return p.length?p:all.slice(-3)}let exact=info.rx?all.filter(x=>info.rx.test(x)):[];if(!exact.length&&info.terms)exact=all.filter(x=>info.terms.some(t=>x.includes(t)));return exact}
function fsProvinceRows(rec){return (Array.isArray(rec.r)?rec.r:[]).filter(x=>/^ВИЛОЯТ|^Вилоят|^Жами/i.test(x)).slice(0,3)}
function fsRender(){const info=fsRegionInfo(),q=fsNorm(document.getElementById('statSearch')?.value||''),data=FULL_STAT_DATA[fsYear]||[];document.getElementById('statRegion').textContent=info.label;const cards=[];for(const rec of data){let rows=fsRows(rec,info),prov=[];if(!rows.length&&!info.province)prov=fsProvinceRows(rec);const hay=fsNorm([rec.t,...(rec.r||[])].join(' '));if(q&&!hay.includes(q))continue;const shown=rows.length?rows:prov;if(!shown.length&&!q)continue;const badge=rows.length?'HUDUD':'VILOYAT';cards.push('<section class="fs-card"><div class="fs-card-head"><b>'+fsEsc(rec.t||('Statistika · '+rec.p+'-bet'))+'<span class="fs-badge">'+badge+'</span></b><span class="fs-page">'+fsEsc(fsYear)+' · '+fsEsc(rec.p)+'-bet</span></div><div class="fs-rows">'+(shown.length?shown.map(x=>'<div class="fs-row '+(rows.length?'':'prov')+'">'+fsEsc(x)+'</div>').join(''):'<div class="fs-empty">Hudud kesimida qator topilmadi.</div>')+'</div></section>')}
document.getElementById('statCount').textContent=cards.length+' ta statistik bo‘lim';document.getElementById('statGrid').innerHTML=cards.length?cards.join(''):'<div class="fs-none">Mos statistika topilmadi.</div>'}
function fsOpen(){document.getElementById('fullStatOverlay').classList.add('open');fsRender()}
function fsClose(){document.getElementById('fullStatOverlay').classList.remove('open')}
function fsMount(){if(document.getElementById('fullStatBtn'))return;const b=document.createElement('button');b.id='fullStatBtn';b.type='button';b.textContent='📊 To‘liq statistika';b.onclick=fsOpen;document.body.appendChild(b);const o=document.createElement('div');o.id='fullStatOverlay';o.innerHTML='<div class="fs-shell"><div class="fs-head"><div class="fs-title"><b>To‘liq statistika</b><small>BUXORO VILOYATI SOG‘LIQNI SAQLASH TIZIMI</small></div><div class="fs-tools"><button class="fs-year on" data-stat-year="2025">2025</button><button class="fs-year" data-stat-year="2024">2024</button><input id="statSearch" placeholder="Ko‘rsatkichni qidirish…"><div class="fs-region" id="statRegion"></div></div><button class="fs-close" aria-label="Yopish">×</button></div><div class="fs-meta"><span id="statCount"></span><span>Manba: 2023–2024 va 2024–2025 12 oylik tezkor statistik ma’lumotlar</span></div><div class="fs-body"><div class="fs-grid" id="statGrid"></div></div></div>';document.body.appendChild(o);o.querySelector('.fs-close').onclick=fsClose;o.addEventListener('click',e=>{if(e.target===o)fsClose()});o.querySelectorAll('[data-stat-year]').forEach(x=>x.onclick=()=>{fsYear=x.dataset.statYear;o.querySelectorAll('[data-stat-year]').forEach(y=>y.classList.toggle('on',y===x));fsRender()});o.querySelector('#statSearch').addEventListener('input',fsRender);addEventListener('keydown',e=>{if(e.key==='Escape')fsClose()})}
fsMount();
`;

  let out=input.replace(styleAnchor,css+styleAnchor);
  out=out.replace(runtimeAnchor,runtime+'\n'+runtimeAnchor);
  return out;
}

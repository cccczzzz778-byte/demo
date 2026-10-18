export const LEADERSHIP_HEALTH_STATS_MARKER = 'BUXORO_LEADERSHIP_HEALTH_STATS_V2';

export function patchLeadershipHealthStats(input: string): string {
  if (!input || input.includes(LEADERSHIP_HEALTH_STATS_MARKER)) return input;
  const styleAnchor = '</style>';
  const runtimeAnchor = 'home();fly=false;loop();';
  if (!input.includes(styleAnchor) || !input.includes(runtimeAnchor)) return input;

  const css = `
/* ${LEADERSHIP_HEALTH_STATS_MARKER} */
.hs-box{margin-top:12px;padding:11px;border:1px solid rgba(76,210,255,.24);border-radius:16px;background:linear-gradient(160deg,rgba(4,30,67,.90),rgba(2,14,36,.92));box-shadow:0 12px 32px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.035);overflow:hidden;position:relative}
.hs-box:before{content:"";position:absolute;inset:0 0 auto 0;height:2px;background:linear-gradient(90deg,transparent,#28d8ff,#9f7cff,transparent);opacity:.72}
.hs-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.hs-title b{font-size:10.5px;color:#e9fbff;letter-spacing:.85px}.hs-title span{font-size:8px;font-weight:800;color:#071a2f;background:#6ee7ff;padding:4px 8px;border-radius:999px;box-shadow:0 0 16px rgba(76,220,255,.25)}
.hs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.hs-card{position:relative;padding:10px 9px 9px 11px;border-radius:12px;border:1px solid rgba(113,188,255,.13);background:linear-gradient(145deg,rgba(10,42,79,.70),rgba(2,18,43,.78));min-width:0;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
.hs-card:before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:3px;background:#42d8ff;box-shadow:0 0 10px rgba(66,216,255,.65)}
.hs-grid>.hs-card:nth-child(2):before{background:#9f7cff;box-shadow:0 0 10px rgba(159,124,255,.55)}
.hs-grid>.hs-card:nth-child(3):before{background:#48e6a8;box-shadow:0 0 10px rgba(72,230,168,.55)}
.hs-grid>.hs-card:nth-child(4):before{background:#ffd15c;box-shadow:0 0 10px rgba(255,209,92,.50)}
.hs-grid>.hs-card:nth-child(5):before{background:#ff7f91;box-shadow:0 0 10px rgba(255,127,145,.50)}
.hs-grid>.hs-card:nth-child(6):before{background:#59a7ff;box-shadow:0 0 10px rgba(89,167,255,.50)}
.hs-card strong{display:block;color:#fff;font-size:18px;line-height:1;font-weight:850;font-variant-numeric:tabular-nums;letter-spacing:.15px;text-shadow:0 0 14px rgba(112,216,255,.10)}
.hs-card small{display:block;margin-top:5px;color:#9ec8db;font-size:8.2px;line-height:1.18;text-transform:uppercase;letter-spacing:.25px}.hs-card .d{display:inline-block;font-size:7.8px;margin-top:5px;padding:2px 5px;border-radius:999px;color:#69f0b3;background:rgba(43,211,138,.10);border:1px solid rgba(43,211,138,.16)}.hs-card .dn{color:#ff9aac;background:rgba(255,91,112,.09);border-color:rgba(255,91,112,.16)}
.hs-mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:7px}.hs-mini .hs-card{padding:8px 6px 7px 9px;background:rgba(4,23,51,.64)}.hs-mini .hs-card:before{top:7px;bottom:7px;width:2px;opacity:.78}.hs-mini .hs-card strong{font-size:14px}.hs-mini .hs-card small{font-size:7.4px;line-height:1.14}.hs-wide{grid-column:1/-1}
body.presentation-mode .hs-box,body.tv-mode .hs-box{padding:13px}.presentation-mode .hs-card strong,.tv-mode .hs-card strong{font-size:20px}.presentation-mode .hs-mini .hs-card strong,.tv-mode .hs-mini .hs-card strong{font-size:15px}
`;

  const runtime = String.raw`
/* ${LEADERSHIP_HEALTH_STATS_MARKER} */
const HEALTH_STATS=[
 {key:"Buxoro shahri",pop25:302420,pop26:306201,beds:504,doc25:505,doc26:514,mid25:1750,mid26:1698,vac:88.25,priv:346},
 {key:"Kogon shahri",pop25:65803,pop26:66357,beds:167,doc25:227,doc26:163,mid25:547,mid26:534,vac:19,priv:39},
 {key:"Olot",pop25:106461,pop26:107858,beds:220,doc25:148,doc26:146,mid25:1104,mid26:1066,vac:18.75,priv:10},
 {key:"Buxoro",pop25:183101,pop26:186465,beds:240,doc25:274,doc26:236,mid25:1025,mid26:817,vac:18,priv:57},
 {key:"Vobkent",pop25:152372,pop26:155114,beds:290,doc25:207,doc26:223,mid25:1437,mid26:1397,vac:8.75,priv:27},
 {key:"G‘ijduvon",pop25:329159,pop26:333643,beds:656,doc25:395,doc26:380,mid25:2232,mid26:1932,vac:0,priv:75},
 {key:"Jondor",pop25:189851,pop26:192695,beds:367,doc25:335,doc26:408,mid25:1512,mid26:1550,vac:8.5,priv:45},
 {key:"Kogon",pop25:87031,pop26:88690,beds:183,doc25:131,doc26:130,mid25:604,mid26:610,vac:27.75,priv:13},
 {key:"Qorako‘l",pop25:175163,pop26:177097,beds:352,doc25:241,doc26:233,mid25:1541,mid26:1507,vac:67.5,priv:29},
 {key:"Qorovulbozor",pop25:20523,pop26:20735,beds:101,doc25:64,doc26:63,mid25:289,mid26:289,vac:0,priv:8},
 {key:"Peshku",pop25:134278,pop26:136404,beds:255,doc25:196,doc26:192,mid25:1258,mid26:1209,vac:25.25,priv:27},
 {key:"Romitan",pop25:154172,pop26:155881,beds:356,doc25:243,doc26:246,mid25:1405,mid26:1363,vac:35.5,priv:35},
 {key:"Shofirkon",pop25:189044,pop26:190103,beds:364,doc25:238,doc26:272,mid25:1428,mid26:1454,vac:2,priv:31}
];
const HEALTH_PROVINCE={key:"Buxoro viloyati",pop25:2089378,pop26:2117243,beds:7237,doc25:5966,doc26:5994,mid25:22980,mid26:22476,vac:447.25,priv:742,dpm:258,hospitals:30,bedRate:34.2,docRate:28.3,midRate:106.2,docCat:47.4,midCat:48.9,docTrain:746,midTrain:3707,privateBeds:3755,privateCapacity:142215};
const hsNorm=s=>String(s||'').toLowerCase().replace(/[‘’ʻʼ]/g,"'").replace(/\s+/g,' ').trim();
const hsFind=u=>{if(!u)return HEALTH_PROVINCE;if(hsNorm(u.key)==='kogon'){const a=HEALTH_STATS.find(x=>x.key==='Kogon shahri'),b=HEALTH_STATS.find(x=>x.key==='Kogon');const sum=k=>a[k]+b[k];return{key:'Kogon tumani va shahri',pop25:sum('pop25'),pop26:sum('pop26'),beds:sum('beds'),doc25:sum('doc25'),doc26:sum('doc26'),mid25:sum('mid25'),mid26:sum('mid26'),vac:sum('vac'),priv:sum('priv')}};const title=hsNorm(u.title),key=hsNorm(u.key);return HEALTH_STATS.find(x=>{const n=hsNorm(x.key);return n===title||n===key||n.replace(/ tumani$/,'')===key||n.replace(/ shahri$/,'')===key})||null};
const hsPct=(a,b)=>a?((b-a)/a*100):0;
const hsDelta=(a,b)=>{const v=hsPct(a,b);return '<div class="d '+(v<0?'dn':'')+'">'+(v>0?'+':'')+v.toFixed(1)+'%</div>'};
const hsCard=(v,l,delta='')=>'<div class="hs-card"><strong>'+demoFmt(v)+'</strong><small>'+l+'</small>'+delta+'</div>';
const hsPanel=(d,province=false)=>{let x='<div class="hs-box"><div class="hs-title"><b>9 OYLIK TEZKOR STATISTIKA</b><span>2026</span></div><div class="hs-grid">';x+=hsCard(d.pop26,'Aholi',hsDelta(d.pop25,d.pop26));x+=hsCard(d.beds,'Shifo o‘rinlari');x+=hsCard(d.doc26,'Shifokorlar',hsDelta(d.doc25,d.doc26));x+=hsCard(d.mid26,'O‘rta tibbiyot xodimlari',hsDelta(d.mid25,d.mid26));x+=hsCard(Number(d.vac||0).toFixed(2),'Vrach vakansiyasi');x+=hsCard(d.priv,'Xususiy litsenziantlar');if(province){x+='</div><div class="hs-mini">'+hsCard(d.dpm,'DPM')+hsCard(d.hospitals,'Stasionar muassasa')+hsCard(d.bedRate,'O‘rin / 10 ming')+hsCard(d.docRate,'Vrach / 10 ming')+hsCard(d.midRate,'O‘TX / 10 ming')+hsCard(d.privateBeds,'Xususiy shifo o‘rni')+'</div><div class="hs-mini">'+hsCard(d.docCat+'%','Toifali vrachlar')+hsCard(d.midCat+'%','Toifali O‘TX')+hsCard(d.privateCapacity,'Xususiy APM quvvati')+'</div>';}else{x+='</div>';}return x+'</div>'};
const _healthRenderOv=renderOv;renderOv=function(){_healthRenderOv();Lp.insertAdjacentHTML('beforeend',hsPanel(HEALTH_PROVINCE,true));};
const _healthRenderUnit=renderUnit;renderUnit=function(u){_healthRenderUnit(u);const d=hsFind(u);if(d)Lp.insertAdjacentHTML('beforeend',hsPanel(d,false));};
`;

  let out=input.replace(styleAnchor,css+styleAnchor);
  out=out.replace(runtimeAnchor,runtime+'\n'+runtimeAnchor);
  return out;
}

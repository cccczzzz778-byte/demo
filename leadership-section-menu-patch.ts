export const LEADERSHIP_SECTION_MENU_MARKER='BUXORO_SECTION_MENU_V1';

export function patchLeadershipSectionMenu(input:string):string{
  if(!input||input.includes(LEADERSHIP_SECTION_MENU_MARKER)) return input;
  const styleAnchor='</style>';
  const runtimeAnchor='home();fly=false;loop();';
  if(!input.includes(styleAnchor)||!input.includes(runtimeAnchor)) return input;

  const css=`
/* ${LEADERSHIP_SECTION_MENU_MARKER} */
#sectionMenu{position:fixed;z-index:52;left:50%;top:54px;transform:translateX(-50%);width:min(1120px,calc(100vw - 420px));display:flex;align-items:center;gap:5px;padding:5px;border:1px solid rgba(57,217,255,.34);border-radius:12px;background:linear-gradient(150deg,rgba(3,27,62,.94),rgba(2,16,40,.94));box-shadow:0 12px 34px rgba(0,0,0,.26),inset 0 0 20px rgba(39,216,255,.04);backdrop-filter:blur(10px);overflow-x:auto;scrollbar-width:none}
#sectionMenu::-webkit-scrollbar{display:none}.sf-menu-btn{flex:0 0 auto;height:29px;padding:0 10px;border:1px solid rgba(86,190,235,.18);border-radius:8px;background:rgba(6,34,72,.76);color:#a8cee0;font:800 8px/1 Arial,sans-serif;white-space:nowrap;cursor:pointer;transition:.16s ease}.sf-menu-btn:hover{color:#ecfbff;border-color:rgba(76,221,255,.48);transform:translateY(-1px)}.sf-menu-btn.on{color:#001929;background:linear-gradient(135deg,#48e9ff,#4fbaff);border-color:#7cefff;box-shadow:0 0 16px rgba(58,220,255,.28)}.sf-menu-year{margin-left:auto;display:flex;gap:3px;flex:none}.sf-year{height:27px;padding:0 7px;border-radius:7px;border:1px solid rgba(91,184,229,.2);background:#05234a;color:#86b4ca;font:900 7px Arial;cursor:pointer}.sf-year.on{background:#9b7cff;color:#fff;border-color:#baa8ff}
.sf-panel{position:fixed;z-index:30;top:101px;bottom:105px;width:360px;padding:9px;box-sizing:border-box;border:1px solid rgba(49,216,255,.42);border-radius:14px;background:linear-gradient(160deg,rgba(4,29,65,.97),rgba(2,15,38,.97));box-shadow:0 18px 50px rgba(0,0,0,.34),inset 0 0 30px rgba(39,216,255,.05);overflow:auto;scrollbar-width:thin;scrollbar-color:#188db7 #03142d;display:none}.sf-panel.left{left:14px}.sf-panel.right{right:14px}.section-filtered .sf-panel{display:block}.section-filtered #L,.section-filtered #R,.section-filtered #mcc-bottom,.section-filtered #dcc-bottom,.section-filtered .lg,.section-filtered .chips{display:none!important}.sf-panel-head{position:sticky;top:-9px;z-index:2;margin:-9px -9px 8px;padding:10px 11px 9px;border-bottom:1px solid rgba(71,204,255,.15);background:linear-gradient(150deg,rgba(4,34,74,.99),rgba(3,22,50,.99))}.sf-panel-head small{display:block;color:#58e7ff;font-size:7px;font-weight:900;letter-spacing:1.1px}.sf-panel-head b{display:block;margin-top:3px;color:#fff;font-size:15px}.sf-panel-head span{display:block;margin-top:4px;color:#87abc0;font-size:7.5px}.sf-stat-card{margin:7px 0;border:1px solid rgba(73,191,239,.17);border-radius:10px;background:rgba(5,31,66,.80);overflow:hidden}.sf-stat-title{display:flex;justify-content:space-between;gap:8px;padding:7px 8px;border-bottom:1px solid rgba(63,181,227,.1)}.sf-stat-title b{font-size:8.5px;line-height:1.3;color:#e8faff}.sf-stat-title em{font-style:normal;flex:none;color:#52e7ff;font-size:6.5px}.sf-stat-row{margin:5px 7px;padding:6px 7px;border-radius:7px;border-left:2px solid #39dfff;background:rgba(3,20,47,.72);color:#cfeaf6;font:500 7.4px/1.42 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;word-break:break-word}.sf-empty{padding:20px 10px;text-align:center;color:#7296a9;font-size:9px}.sf-map-tag{position:fixed;z-index:21;left:50%;bottom:108px;transform:translateX(-50%);display:none;padding:6px 12px;border-radius:999px;border:1px solid rgba(67,220,255,.42);background:rgba(3,27,61,.92);color:#bcefff;font:900 8px Arial;box-shadow:0 0 18px rgba(39,216,255,.14);pointer-events:none}.section-filtered .sf-map-tag{display:block}
@media(max-width:1450px){#sectionMenu{width:min(900px,calc(100vw - 360px))}.sf-panel{width:320px}}
@media(max-width:1050px){#sectionMenu{left:8px;right:8px;width:auto;transform:none;top:50px}.sf-panel{width:300px}.sf-panel.left{left:8px}.sf-panel.right{right:8px}}
@media(max-width:780px){#sectionMenu{right:8px}.sf-panel{top:auto;bottom:8px;height:31vh;width:calc(50vw - 12px)}.sf-panel.left{left:8px}.sf-panel.right{right:8px}.sf-map-tag{display:none!important}}
`;

  const runtime=String.raw`
/* ${LEADERSHIP_SECTION_MENU_MARKER} */
const SF_SECTIONS=[
 {k:'umumiy',l:'Umumiy',i:'◉',kw:[]},
 {k:'muassasa',l:'Muassasalar',i:'🏥',kw:['структура','хусусий тиббиёт','шифохоналар сони','шифо ўрин','амбулатория поликлиника','дпмлар','муассасалар']},
 {k:'kadrlar',l:'Kadrlar',i:'👨‍⚕️',kw:['врач','шифокор','ўрта тиб','малака','тоиф','вакансия','эҳтиёж','штат']},
 {k:'demografiya',l:'Demografiya',i:'👥',kw:['аҳоли сони','демограф']},
 {k:'ona-bola',l:'Ona va bola',i:'🤱',kw:['туғруқ','тирик туғ','аборт','ҳомиладор','оналар ўлими','гўдак','неонатал','болалар ўлими','туғма','контрацеп','репродуктив']},
 {k:'kasallanish',l:'Kasallanish',i:'🩺',kw:['касалланиш','диспансер назорат','ногирон','профилактик кўрик']},
 {k:'skrining',l:'Skrining',i:'🔬',kw:['скрининг','маммография','калькоскоп','флюрография']},
 {k:'maxsus',l:'Maxsus yo‘nalishlar',i:'⚕',kw:['юқумли','оитс','оив','нарколог','ўсма','сил кас','қандли диабет','қалқонсимон','руҳий','суицид','онколог','фтизиатр']},
 {k:'murojaat',l:'Murojaatlar',i:'✉',kw:['ариза','шикоят','сайёр қабул','мурожаат']},
 {k:'tez-infra',l:'Tez yordam / infratuzilma',i:'🚑',kw:['тез тиббий','транспорт','компьютер','инвестиция','қурилиш','иситиш','қуёш','дорихона','мактаб','мтм','сув тизими']}
];
let sfSection='umumiy';
const sfSectionDef=()=>SF_SECTIONS.find(x=>x.k===sfSection)||SF_SECTIONS[0];
const sfNorm=s=>typeof fsNorm==='function'?fsNorm(s):String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const sfEsc=s=>typeof fsEsc==='function'?fsEsc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sfMatch(rec,def){if(def.k==='umumiy')return false;const t=sfNorm(rec.t||'');return def.kw.some(k=>t.includes(sfNorm(k)))}
function sfInfo(){if(typeof fsRegionInfo==='function')return fsRegionInfo();return cur?{label:cur.title||cur.key,terms:[cur.key]}:{label:'Buxoro viloyati',province:true,terms:['Вилоят','Жами']}}
function sfRows(rec,info){if(typeof fsRows==='function'){const a=fsRows(rec,info);if(a.length)return a;if(!info.province&&typeof fsProvinceRows==='function')return fsProvinceRows(rec)}const a=Array.isArray(rec.r)?rec.r:[];return info.province?a.slice(-2):a.slice(0,2)}
function sfCards(){const def=sfSectionDef(),info=sfInfo(),year=(typeof fsYear!=='undefined'?fsYear:'2025'),data=(typeof FULL_STAT_DATA!=='undefined'&&FULL_STAT_DATA[year])||[],out=[];for(const rec of data){if(!sfMatch(rec,def))continue;const rows=sfRows(rec,info);if(!rows.length)continue;out.push({t:rec.t||('Statistika · '+rec.p+'-bet'),p:rec.p,rows})}return{def,info,year,out}}
function sfCardHtml(c,year){return '<section class="sf-stat-card"><div class="sf-stat-title"><b>'+sfEsc(c.t)+'</b><em>'+sfEsc(year)+' · '+sfEsc(c.p)+'-bet</em></div>'+c.rows.slice(0,4).map(r=>'<div class="sf-stat-row">'+sfEsc(r)+'</div>').join('')+'</section>'}
function sfRenderPanels(){if(sfSection==='umumiy')return;const d=sfCards(),mid=Math.ceil(d.out.length/2),left=d.out.slice(0,mid),right=d.out.slice(mid),head='<div class="sf-panel-head"><small>'+d.def.i+' TANLANGAN BO‘LIM</small><b>'+sfEsc(d.def.l)+'</b><span>'+sfEsc(d.info.label)+' · '+sfEsc(d.year)+' yil</span></div>';document.getElementById('sfLeft').innerHTML=head+(left.length?left.map(x=>sfCardHtml(x,d.year)).join(''):'<div class="sf-empty">Hudud bo‘yicha mos ma’lumot topilmadi.</div>');document.getElementById('sfRight').innerHTML=head+(right.length?right.map(x=>sfCardHtml(x,d.year)).join(''):'<div class="sf-empty">Qo‘shimcha ko‘rsatkich yo‘q.</div>');const tag=document.getElementById('sfMapTag');if(tag)tag.textContent=d.def.i+' '+d.def.l+' · '+d.info.label}
function sfApply3D(){if(typeof DI==='undefined')return;const sec=sfSection;DI.forEach(I=>{let v=false;if(sec==='umumiy'){v=typeof act==='undefined'||act[I.type]!==0}else if(sec==='muassasa'){v=true}else if(sec==='kadrlar'){v=['TTB','SHTB','KTMP'].includes(I.type)}I.mesh.visible=v;I.fx.forEach(o=>o.visible=v)});if(typeof chips!=='undefined')chips.hidden=sec!=='muassasa'}
function sfRefresh(){const filtered=sfSection!=='umumiy';document.body.classList.toggle('section-filtered',filtered);document.querySelectorAll('.sf-menu-btn').forEach(b=>b.classList.toggle('on',b.dataset.section===sfSection));document.querySelectorAll('.sf-year').forEach(b=>b.classList.toggle('on',String(typeof fsYear!=='undefined'?fsYear:'2025')===b.dataset.year));sfApply3D();sfRenderPanels()}
function sfSet(k){sfSection=k;if(mode==='ov')renderOv();else if(cur)renderUnit(cur);else sfRefresh()}
function sfSetYear(y){if(typeof fsYear!=='undefined')fsYear=y;sfRefresh()}
function sfMount(){if(document.getElementById('sectionMenu'))return;const m=document.createElement('nav');m.id='sectionMenu';m.setAttribute('aria-label','Dashboard bo‘limlari');m.innerHTML=SF_SECTIONS.map(x=>'<button type="button" class="sf-menu-btn '+(x.k==='umumiy'?'on':'')+'" data-section="'+x.k+'">'+x.i+' '+x.l+'</button>').join('')+'<div class="sf-menu-year"><button class="sf-year on" data-year="2025">2025</button><button class="sf-year" data-year="2024">2024</button></div>';document.body.appendChild(m);m.querySelectorAll('.sf-menu-btn').forEach(b=>b.onclick=()=>sfSet(b.dataset.section));m.querySelectorAll('.sf-year').forEach(b=>b.onclick=()=>sfSetYear(b.dataset.year));const l=document.createElement('aside');l.id='sfLeft';l.className='sf-panel left';document.body.appendChild(l);const r=document.createElement('aside');r.id='sfRight';r.className='sf-panel right';document.body.appendChild(r);const t=document.createElement('div');t.id='sfMapTag';t.className='sf-map-tag';document.body.appendChild(t)}
sfMount();
const _sfRenderOv=renderOv;renderOv=function(){_sfRenderOv();sfRefresh()};
const _sfRenderUnit=renderUnit;renderUnit=function(u){_sfRenderUnit(u);sfRefresh()};
const _sfHome=home;home=function(){const r=_sfHome();sfRefresh();return r};
`;
  let out=input.replace(styleAnchor,css+styleAnchor);
  out=out.replace(runtimeAnchor,runtime+'\n'+runtimeAnchor);
  return out;
}

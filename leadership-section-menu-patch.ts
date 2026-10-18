export const LEADERSHIP_SECTION_MENU_MARKER='BUXORO_SECTION_MENU_V3';

export function patchLeadershipSectionMenu(input:string):string{
  if(!input||input.includes(LEADERSHIP_SECTION_MENU_MARKER)) return input;
  const styleAnchor='</style>';
  const runtimeAnchor='home();fly=false;loop();';
  if(!input.includes(styleAnchor)||!input.includes(runtimeAnchor)) return input;

  const css=`
/* ${LEADERSHIP_SECTION_MENU_MARKER} */
#sectionMenu{position:fixed;z-index:52;left:50%;top:58px;transform:translateX(-50%);width:min(1080px,calc(100vw - 470px));display:flex;align-items:center;gap:5px;padding:5px 6px;border:1px solid rgba(54,218,255,.28);border-radius:13px;background:linear-gradient(145deg,rgba(3,26,60,.92),rgba(2,15,38,.94));box-shadow:0 12px 34px rgba(0,0,0,.23),inset 0 0 24px rgba(39,216,255,.035);backdrop-filter:blur(12px);overflow-x:auto;scrollbar-width:none}
#sectionMenu::-webkit-scrollbar{display:none}.sf-menu-btn{flex:0 0 auto;height:30px;padding:0 11px;border:1px solid rgba(86,190,235,.14);border-radius:9px;background:linear-gradient(145deg,rgba(8,38,78,.78),rgba(4,25,57,.78));color:#a8cee0;font:800 8px/1 Arial,sans-serif;white-space:nowrap;cursor:pointer;transition:.16s ease}.sf-menu-btn:hover{color:#fff;border-color:rgba(76,221,255,.5);transform:translateY(-1px)}.sf-menu-btn.on{color:#001a2b;background:linear-gradient(135deg,#55ecff,#49bfff);border-color:#8df3ff;box-shadow:0 0 18px rgba(58,220,255,.30)}.sf-menu-year{margin-left:auto;display:flex;gap:3px;flex:none}.sf-year{height:27px;padding:0 8px;border-radius:8px;border:1px solid rgba(91,184,229,.18);background:#05234a;color:#86b4ca;font:900 7px Arial;cursor:pointer}.sf-year.on{background:linear-gradient(135deg,#9d7cff,#6c7dff);color:#fff;border-color:#baa8ff;box-shadow:0 0 13px rgba(140,110,255,.24)}
.section-filtered #L,.section-filtered #R{display:block!important;top:108px!important;max-height:calc(100vh - 218px)!important;overflow:auto!important;scrollbar-width:thin}.section-filtered #mcc-bottom,.section-filtered #dcc-bottom{display:none!important}.section-filtered .lg{bottom:18px!important}.section-filtered .chips{display:none!important}
.sf-view-head{position:sticky;top:-10px;z-index:4;margin:-10px -10px 9px;padding:11px 11px 10px;border-bottom:1px solid rgba(76,210,255,.15);background:linear-gradient(150deg,rgba(4,36,77,.985),rgba(2,22,51,.985));backdrop-filter:blur(10px)}.sf-view-head small{display:flex;align-items:center;gap:5px;color:#61e8ff;font-size:7px;font-weight:900;letter-spacing:1px}.sf-view-head b{display:block;margin-top:4px;color:#fff;font-size:16px;letter-spacing:.1px}.sf-view-head span{display:block;margin-top:4px;color:#88b7ca;font-size:7.5px}.sf-summary-card{margin:7px 0;padding:9px;border:1px solid rgba(75,198,244,.16);border-radius:11px;background:linear-gradient(150deg,rgba(7,39,80,.86),rgba(3,24,55,.91));box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 7px 18px rgba(0,0,0,.08)}.sf-summary-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.sf-summary-top b{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;color:#ecfbff;font-size:8.6px;line-height:1.34}.sf-source{flex:none;padding:3px 6px;border-radius:99px;border:1px solid rgba(79,215,255,.15);background:rgba(41,188,232,.08);color:#60e6ff;font-size:6.2px}.sf-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:8px}.sf-value{min-width:0;padding:7px 6px;border-radius:8px;background:linear-gradient(145deg,rgba(3,22,51,.92),rgba(5,30,64,.88));border:1px solid rgba(72,190,237,.11);text-align:center}.sf-value strong{display:block;overflow:hidden;text-overflow:ellipsis;color:#fff;font-size:13px;line-height:1.1}.sf-value small{display:block;margin-top:3px;color:#63dff6;font-size:5.9px;letter-spacing:.2px}.sf-summary-note{margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#81a8bb;font-size:6.7px}.sf-detail{margin-top:7px;width:100%;height:25px;border:1px solid rgba(68,204,247,.17);border-radius:7px;background:rgba(6,34,72,.72);color:#a8eaff;font:800 6.8px Arial;cursor:pointer}.sf-detail:hover{border-color:#4bdfff;color:#fff;background:rgba(8,49,92,.88)}.sf-empty{padding:30px 12px;text-align:center;color:#7296a9;font-size:9px}.sf-map-tag{position:fixed;z-index:23;left:50%;bottom:104px;transform:translateX(-50%);display:none;padding:7px 13px;border-radius:999px;border:1px solid rgba(67,220,255,.34);background:rgba(3,27,61,.88);color:#c5f5ff;font:900 8px Arial;box-shadow:0 0 18px rgba(39,216,255,.12);backdrop-filter:blur(8px);pointer-events:none}.section-filtered .sf-map-tag{display:block}
@media(max-width:1450px){#sectionMenu{width:min(900px,calc(100vw - 390px))}}
@media(max-width:1050px){#sectionMenu{left:8px;right:8px;width:auto;transform:none;top:52px}.section-filtered #L,.section-filtered #R{top:98px!important}}
@media(max-width:780px){#sectionMenu{right:8px}.sf-map-tag{display:none!important}.sf-values{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
function sfNums(row){const m=String(row||'').replace(/,/g,'.').match(/[-+]?\d+(?:\.\d+)?%?/g)||[];return m.filter(x=>x.length<15).slice(-3)}
function sfShortTitle(t){return String(t||'Statistika').replace(/тўғрисида.*$/i,'').replace(/маълумот.*$/i,'').replace(/Бухоро вилояти/gi,'').replace(/\s+/g,' ').trim().slice(0,120)||'Statistika'}
function sfCards(){const def=sfSectionDef(),info=sfInfo(),year=(typeof fsYear!=='undefined'?fsYear:'2025'),data=(typeof FULL_STAT_DATA!=='undefined'&&FULL_STAT_DATA[year])||[],out=[];for(const rec of data){if(!sfMatch(rec,def))continue;const rows=sfRows(rec,info);if(!rows.length)continue;const row=rows[0]||'',nums=sfNums(row);out.push({t:sfShortTitle(rec.t),p:rec.p,row,nums})}return{def,info,year,out:out.slice(0,12)}}
function sfCardHtml(c,year){const nums=(c.nums.length?c.nums:['—']).slice(0,3);return '<section class="sf-summary-card"><div class="sf-summary-top"><b>'+sfEsc(c.t)+'</b><span class="sf-source">'+sfEsc(year)+' · '+sfEsc(c.p)+'-bet</span></div><div class="sf-values">'+nums.map((n,i)=>'<div class="sf-value"><strong>'+sfEsc(n)+'</strong><small>'+(i===0?'asosiy':'ko‘rsatkich')+'</small></div>').join('')+'</div><div class="sf-summary-note">'+sfEsc(c.row)+'</div><button class="sf-detail" type="button" data-sf-title="'+sfEsc(c.t)+'">Batafsil</button></section>'}
function sfOpenDetail(title){if(typeof fsOpen!=='function')return;fsOpen();const q=document.getElementById('statSearch');if(q){q.value=title;if(typeof fsRender==='function')fsRender()}}
function sfBindDetails(){document.querySelectorAll('.sf-detail').forEach(b=>b.onclick=()=>sfOpenDetail(b.dataset.sfTitle||''))}
function sfRenderIntoMainPanels(){if(sfSection==='umumiy')return;const d=sfCards(),head='<div class="sf-view-head"><small>'+d.def.i+' TANLANGAN BO‘LIM</small><b>'+sfEsc(d.def.l)+'</b><span>'+sfEsc(d.info.label)+' · '+sfEsc(d.year)+' yil · '+d.out.length+' ta qisqa ko‘rsatkich</span></div>';const mid=Math.ceil(d.out.length/2),left=d.out.slice(0,mid),right=d.out.slice(mid);if(typeof Lp!=='undefined')Lp.innerHTML=head+(left.length?left.map(x=>sfCardHtml(x,d.year)).join(''):'<div class="sf-empty">Hudud bo‘yicha mos ma’lumot topilmadi.</div>');if(typeof Rp!=='undefined')Rp.innerHTML=head+(right.length?right.map(x=>sfCardHtml(x,d.year)).join(''):'<div class="sf-empty">Qo‘shimcha ko‘rsatkich yo‘q.</div>');sfBindDetails();const tag=document.getElementById('sfMapTag');if(tag)tag.textContent=d.def.i+' '+d.def.l+' · '+d.info.label}
function sfApply3D(){if(typeof DI==='undefined')return;const sec=sfSection;DI.forEach(I=>{let v=false;if(sec==='umumiy'){v=typeof act==='undefined'||act[I.type]!==0}else if(sec==='muassasa'){v=true}else if(sec==='kadrlar'){v=['TTB','SHTB','KTMP'].includes(I.type)}else{v=false}I.mesh.visible=v;I.fx.forEach(o=>o.visible=v)});if(typeof chips!=='undefined')chips.hidden=sec!=='muassasa'}
function sfRefresh(){const filtered=sfSection!=='umumiy';document.body.classList.toggle('section-filtered',filtered);document.querySelectorAll('.sf-menu-btn').forEach(b=>b.classList.toggle('on',b.dataset.section===sfSection));document.querySelectorAll('.sf-year').forEach(b=>b.classList.toggle('on',String(typeof fsYear!=='undefined'?fsYear:'2025')===b.dataset.year));sfApply3D();if(filtered)sfRenderIntoMainPanels()}
function sfSet(k){sfSection=k;if(mode==='ov')renderOv();else if(cur)renderUnit(cur);else sfRefresh()}
function sfSetYear(y){if(typeof fsYear!=='undefined')fsYear=y;if(mode==='ov')renderOv();else if(cur)renderUnit(cur);else sfRefresh()}
function sfMount(){if(document.getElementById('sectionMenu'))return;const m=document.createElement('nav');m.id='sectionMenu';m.setAttribute('aria-label','Dashboard bo‘limlari');m.innerHTML=SF_SECTIONS.map(x=>'<button type="button" class="sf-menu-btn '+(x.k==='umumiy'?'on':'')+'" data-section="'+x.k+'">'+x.i+' '+x.l+'</button>').join('')+'<div class="sf-menu-year"><button class="sf-year on" data-year="2025">2025</button><button class="sf-year" data-year="2024">2024</button></div>';document.body.appendChild(m);m.querySelectorAll('.sf-menu-btn').forEach(b=>b.onclick=()=>sfSet(b.dataset.section));m.querySelectorAll('.sf-year').forEach(b=>b.onclick=()=>sfSetYear(b.dataset.year));const t=document.createElement('div');t.id='sfMapTag';t.className='sf-map-tag';document.body.appendChild(t)}
sfMount();
const _sfRenderOv=renderOv;renderOv=function(){_sfRenderOv();sfRefresh()};
const _sfRenderUnit=renderUnit;renderUnit=function(u){_sfRenderUnit(u);sfRefresh()};
const _sfHome=home;home=function(){const r=_sfHome();sfRefresh();return r};
`;
  let out=input.replace(styleAnchor,css+styleAnchor);
  out=out.replace(runtimeAnchor,runtime+'\n'+runtimeAnchor);
  return out;
}

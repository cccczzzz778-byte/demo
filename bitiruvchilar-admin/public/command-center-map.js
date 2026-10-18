(()=>{'use strict';
const NS='http://www.w3.org/2000/svg';
const TERRITORIES=Object.freeze([
 {hudud:'Бухоро шаҳар',key:'buxoro-shahri',x:430,y:285,label:'Buxoro sh.'},
 {hudud:'Когон шаҳар',key:'kogon-shahri',x:520,y:300,label:'Kogon sh.'},
 {hudud:'Олот тумани',key:'olot',x:210,y:430,label:'Olot'},
 {hudud:'Бухоро тумани',key:'buxoro-tumani',x:380,y:330,label:'Buxoro t.'},
 {hudud:'Вобкент тумани',key:'vobkent',x:390,y:210,label:'Vobkent'},
 {hudud:'Ғиждувон тумани',key:'gijduvon',x:500,y:165,label:'G‘ijduvon'},
 {hudud:'Жондор тумани',key:'jondor',x:285,y:330,label:'Jondor'},
 {hudud:'Когон тумани',key:'kogon-tumani',x:555,y:345,label:'Kogon t.'},
 {hudud:'Қоракўл тумани',key:'qorakol',x:340,y:430,label:'Qorako‘l'},
 {hudud:'Қоровулбозор тумани',key:'qorovulbozor',x:675,y:365,label:'Qorovulbozor'},
 {hudud:'Пешку тумани',key:'peshku',x:285,y:215,label:'Peshku'},
 {hudud:'Ромитан тумани',key:'romitan',x:220,y:280,label:'Romitan'},
 {hudud:'Шофиркон тумани',key:'shofirkon',x:480,y:245,label:'Shofirkon'}
]);
const edges=[['romitan','peshku'],['peshku','vobkent'],['vobkent','gijduvon'],['gijduvon','shofirkon'],['shofirkon','buxoro-shahri'],['buxoro-shahri','buxoro-tumani'],['buxoro-tumani','jondor'],['jondor','qorakol'],['qorakol','olot'],['buxoro-shahri','kogon-shahri'],['kogon-shahri','kogon-tumani'],['kogon-tumani','qorovulbozor']];
const byKey=new Map(TERRITORIES.map(t=>[t.key,t]));
const el=(name,attrs={})=>{const n=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n};
const fmt=v=>new Intl.NumberFormat('uz-UZ').format(Number(v)||0);
function allowedFactory(value){
 if(value===undefined||value===null||value===''||value===true)return()=>true;
 const values=value instanceof Set?[...value]:Array.isArray(value)?value:[value];
 const set=new Set(values.map(String));return name=>set.has(name);
}
function stateClass(value){const s=String(value||'neutral').toLowerCase();return['green','yellow','red'].includes(s)?s:'neutral'}
function points(x,y,r=32){return Array.from({length:6},(_,i)=>{const a=(Math.PI/3)*i;return`${x+Math.cos(a)*r},${y+Math.sin(a)*r}`}).join(' ')}
function mount(container,options={}){
 if(!container)return()=>{};
 const data=new Map((Array.isArray(options.territories)?options.territories:[]).map(x=>[String(x&&x.hudud||''),x]));
 const isAllowed=allowedFactory(options.allowedHudud);
 const selected=String(options.selectedHudud||'');
 container.textContent='';
 const svg=el('svg',{viewBox:'150 115 590 365',role:'img','aria-label':'Buxoro viloyati 13 hududli operatsion xaritasi',class:'cc-map-svg'});
 const edgeLayer=el('g',{class:'cc-map-edges','aria-hidden':'true'});
 for(const [a,b] of edges){const aa=byKey.get(a),bb=byKey.get(b);if(aa&&bb)edgeLayer.appendChild(el('line',{x1:aa.x,y1:aa.y,x2:bb.x,y2:bb.y}))}
 svg.appendChild(edgeLayer);
 const nodes=el('g',{class:'cc-map-nodes'});
 for(const t of TERRITORIES){
  const row=data.get(t.hudud)||{};const permitted=isAllowed(t.hudud);const active=selected===t.hudud;const state=stateClass(row.state);
  const g=el('g',{class:`cc-territory cc-state-${state}${active?' is-selected':''}${permitted?'':' is-disabled'}`,transform:`translate(0 0)`,role:'button',tabindex:permitted?'0':'-1','aria-disabled':permitted?'false':'true','aria-pressed':active?'true':'false','data-hudud':t.hudud});
  g.appendChild(el('polygon',{points:points(t.x,t.y)}));
  const value=el('text',{x:t.x,y:t.y-2,class:'cc-map-value','text-anchor':'middle'});value.textContent=fmt(row.metrics&&row.metrics.total);
  const label=el('text',{x:t.x,y:t.y+15,class:'cc-map-label','text-anchor':'middle'});label.textContent=t.label;
  const status=el('title');status.textContent=`${t.hudud}: ${row.stateLabel||state}`;g.append(value,label,status);
  const activate=()=>{if(permitted&&typeof options.onSelect==='function')options.onSelect(t.hudud)};
  g.addEventListener('click',activate);
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}});
  nodes.appendChild(g);
 }
 svg.appendChild(nodes);container.appendChild(svg);
 return()=>{container.textContent=''};
}
window.CommandCenterMap=Object.freeze({mount:mount,territories:TERRITORIES.map(t=>t.hudud)});
})();

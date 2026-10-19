(()=>{'use strict';
const $=id=>document.getElementById(id);
const fmt=new Intl.NumberFormat('uz-UZ');
const dateFmt=new Intl.DateTimeFormat('uz-UZ',{dateStyle:'medium',timeStyle:'short'});
const state={summary:null,selectedHudud:'',detailAbort:null};

function clear(node){if(node)node.textContent=''}
function make(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node}
function number(value){const n=Number(value);return Number.isFinite(n)?fmt.format(n):'—'}
function setStatus(message,kind='loading'){
 const box=$('cc-status');if(!box)return;box.dataset.state=kind;clear(box);box.append(make('span','cc-status-dot',''),make('span','',message));
}
function apiErrorMessage(status){
 if(status===401)return'Tizimga qayta kirish talab qilinadi.';
 if(status===403)return'Ushbu bo‘limga kirish huquqi mavjud emas.';
 return'Ma’lumotlarni olishda xatolik yuz berdi.';
}
async function requestJson(url,signal){
 const response=await fetch(url,{credentials:'same-origin',headers:{Accept:'application/json'},signal});
 if(!response.ok){const error=new Error(apiErrorMessage(response.status));error.status=response.status;throw error}
 return response.json();
}
function metricCard(label,value){const card=make('article','cc-card');card.append(make('span','',label),make('strong','',number(value)));return card}
function renderMetrics(data){
 const box=$('cc-metrics');if(!box)return;clear(box);const m=data&&data.metrics||{};const r=data&&data.risks||{};
 const items=[['Jami bitiruvchilar',m.total],['Oliy ma’lumotli',m.higher],['Ishga joylashgan',m.working],['Ishsiz',m.unemployed],['Tibbiy ko‘rikdan o‘tgan',m.examined],['Faol risklar',r.unavailable?'—':r.total]];
 for(const [label,value] of items)box.append(metricCard(label,value));
}
function summaryRows(metrics){return[['Jami',metrics&&metrics.total],['Oliy',metrics&&metrics.higher],['Oliy bo‘lmagan',metrics&&metrics.nonHigher],['Ishga joylashgan',metrics&&metrics.working],['Ishsiz',metrics&&metrics.unemployed],['Tibbiy ko‘rikdan o‘tgan',metrics&&metrics.examined]]}
function renderDetail(hudud,data){
 const box=$('cc-territory-panel');if(!box)return;clear(box);
 const head=make('div','cc-panel-head');const titleWrap=make('div');titleWrap.append(make('p','cc-kicker','Drill-down'),make('h2','',hudud||'Hudud tafsiloti'));head.append(titleWrap);box.append(head);
 const grid=make('div','cc-detail-grid');for(const [label,value] of summaryRows(data&&data.metrics)){const row=make('div','cc-detail-row');row.append(make('span','',label),make('strong','',number(value)));grid.append(row)}box.append(grid);
}
function renderUnavailable(box,title){clear(box);const head=make('div','cc-panel-head');const wrap=make('div');wrap.append(make('p','cc-kicker','Holat'),make('h2','',title));head.append(wrap);box.append(head,make('div','cc-empty','Ma’lumot vaqtincha mavjud emas'))}
function addStatRows(box,rows){const list=make('div','cc-stat-list');for(const [label,value] of rows){const row=make('div','cc-stat-row');row.append(make('span','',label),make('strong','',number(value)));list.append(row)}box.append(list)}
function renderRisks(risks){
 const box=$('cc-risks');if(!box)return;if(!risks||risks.unavailable){renderUnavailable(box,'Risklar');return}clear(box);
 const head=make('div','cc-panel-head');const wrap=make('div');wrap.append(make('p','cc-kicker','Nazorat'),make('h2','','Risklar'));head.append(wrap);box.append(head);
 addStatRows(box,[['Jami',risks.total],['Kritik',risks.critical],['Ogohlantirish',risks.warning],['Axborot',risks.info]]);
 const rules=risks.byRule&&typeof risks.byRule==='object'?Object.entries(risks.byRule):[];if(rules.length){const list=make('div','cc-rule-list');for(const [rule,count] of rules.slice(0,8)){const row=make('div','cc-rule-row');row.append(make('span','',rule),make('strong','',number(count)));list.append(row)}box.append(list)}
}
function renderQuality(quality){
 const box=$('cc-quality');if(!box)return;if(!quality||quality.unavailable){renderUnavailable(box,'Sifat nazorati');return}clear(box);
 const head=make('div','cc-panel-head');const wrap=make('div');wrap.append(make('p','cc-kicker','Ma’lumot sifati'),make('h2','','Sifat nazorati'));head.append(wrap);box.append(head);
 addStatRows(box,[['Tekshirilgan yozuvlar',quality.total],['Aniqlangan muammolar',quality.issueCount]]);
 const counts=quality.counts&&typeof quality.counts==='object'?Object.entries(quality.counts):[];if(counts.length){const list=make('div','cc-rule-list');for(const [key,count] of counts){if(Number(count)<=0)continue;const row=make('div','cc-rule-row');row.append(make('span','',key),make('strong','',number(count)));list.append(row)}box.append(list)}
}
function allowedHudud(scope){return scope&&scope.all?null:(scope&&scope.hudud?[scope.hudud]:[])}
function renderMap(data){
 const map=$('cc-map');if(!map||!window.CommandCenterMap)return;window.CommandCenterMap.mount(map,{territories:Array.isArray(data&&data.territories)?data.territories:[],selectedHudud:state.selectedHudud,allowedHudud:allowedHudud(data&&data.scope),onSelect:loadTerritory});
}
function generatedMessage(value){const d=new Date(value);return Number.isNaN(d.getTime())?'Ma’lumot yangilandi.':`Ma’lumot yangilandi: ${dateFmt.format(d)}`}
function renderSummary(data){state.summary=data;renderMetrics(data);renderRisks(data&&data.risks);renderQuality(data&&data.dataQuality);renderMap(data);setStatus(generatedMessage(data&&data.generatedAt),'ok')}
async function loadTerritory(hudud){
 state.selectedHudud=String(hudud||'');if(state.detailAbort)state.detailAbort.abort();state.detailAbort=new AbortController();renderMap(state.summary);
 const box=$('cc-territory-panel');if(box){clear(box);box.append(make('div','cc-empty','Hudud ma’lumotlari yuklanmoqda…'))}
 try{const url=`/api/command-center/territory?hudud=${encodeURIComponent(state.selectedHudud)}`;const data=await requestJson(url,state.detailAbort.signal);renderDetail(state.selectedHudud,data)}catch(error){if(error&&error.name==='AbortError')return;if(box){clear(box);box.append(make('div','cc-empty',error&&error.message||'Hudud ma’lumotlarini olishda xatolik yuz berdi.'))}}
}
async function loadSummary(){
 const button=$('cc-refresh');if(button)button.disabled=true;setStatus('Ma’lumot yuklanmoqda…','loading');
 try{const data=await requestJson('/api/command-center');renderSummary(data)}catch(error){setStatus(error&&error.message||'Ma’lumotlarni olishda xatolik yuz berdi.','error');renderMetrics({metrics:{},risks:{unavailable:true}});renderUnavailable($('cc-risks'),'Risklar');renderUnavailable($('cc-quality'),'Sifat nazorati');const map=$('cc-map');if(map){clear(map);map.append(make('div','cc-empty','Ma’lumot vaqtincha mavjud emas'))}}
 finally{if(button)button.disabled=false}
}
const refresh=$('cc-refresh');if(refresh)refresh.addEventListener('click',loadSummary);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadSummary,{once:true});else loadSummary();
})();

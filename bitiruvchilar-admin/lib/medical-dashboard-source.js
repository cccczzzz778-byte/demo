'use strict';
const DATA=require('./medical-dashboard-source.json');
const MAP={
 'buxoro shahri':'Бухоро шаҳар','buxoro shahar':'Бухоро шаҳар','бухоро шаҳар':'Бухоро шаҳар','бухоро шаҳри':'Бухоро шаҳар',
 'kogon shahri':'Когон шаҳар','kogon shahar':'Когон шаҳар','когон шаҳар':'Когон шаҳар','когон шаҳри':'Когон шаҳар',
 'buxoro tumani':'Бухоро тумани','бухоро тумани':'Бухоро тумани','vobkent tumani':'Вобкент тумани','вобкент тумани':'Вобкент тумани',
 "g'ijduvon tumani":'Ғиждувон тумани','g‘ijduvon tumani':'Ғиждувон тумани','ғиждувон тумани':'Ғиждувон тумани',
 'jondor tumani':'Жондор тумани','жondor tumani':'Жондор тумани','жондор тумани':'Жондор тумани','kogon tumani':'Когон тумани','когон тумани':'Когон тумани',
 'olot tumani':'Олот тумани','олот тумани':'Олот тумани','peshku tumani':'Пешку тумани','пешку тумани':'Пешку тумани',
 "qorako'l tumani":'Қоракўл тумани','qorako‘l tumani':'Қоракўл тумани','қоракўл тумани':'Қоракўл тумани',
 'qorovulbozor tumani':'Қоровулбозор тумани','қоровулбозор тумани':'Қоровулбозор тумани',
 'romitan tumani':'Ромитан тумани','ромитан тумани':'Ромитан тумани','shofirkon tumani':'Шофиркон тумани','шофиркон тумани':'Шофиркон тумани'
};
function keyOf(v){const raw=String(v||'').trim();const s=raw.toLowerCase().replace(/\s+/g,' ');return MAP[s]||raw}
function clone(v){return JSON.parse(JSON.stringify(v))}
function getMedicalDashboard(hudud=''){
 const key=keyOf(hudud),base=key?(DATA.regions[key]||null):DATA.global;
 if(!base)return {source:DATA.source,sourceTitle:DATA.sourceTitle,hudud:key,total:0,otm:0,technical:0,notFound:true};
 return {source:DATA.source,sourceTitle:DATA.sourceTitle,hudud:key||'Buxoro viloyati',...clone(base)};
}
function medicalRegions(){return Object.entries(DATA.regions).map(([hudud,v])=>({hudud,total:v.total,otm:v.otm,technical:v.technical}))}
module.exports={getMedicalDashboard,medicalRegions,DATA};

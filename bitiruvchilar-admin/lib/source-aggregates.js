'use strict';
const {canonicalHudud}=require('./graduate-utils');
const REGIONS={
 'Бухоро тумани':{total:957,higher:301,nonHigher:656,working:337,unemployed:618,medicalEducation:{total:37,otm:31,technical:6}},
 'Бухоро шаҳар':{total:1455,higher:539,nonHigher:916,working:840,unemployed:612,medicalEducation:{total:76,otm:75,technical:1}},
 'Вобкент тумани':{total:657,higher:201,nonHigher:456,working:366,unemployed:291,medicalEducation:{total:12,otm:8,technical:4}},
 'Жондор тумани':{total:911,higher:307,nonHigher:604,working:615,unemployed:295,medicalEducation:{total:19,otm:16,technical:3}},
 'Когон тумани':{total:516,higher:151,nonHigher:365,working:303,unemployed:213,medicalEducation:{total:15,otm:12,technical:3}},
 'Когон шаҳар':{total:278,higher:86,nonHigher:192,working:159,unemployed:119,medicalEducation:{total:7,otm:4,technical:3}},
 'Олот тумани':{total:467,higher:132,nonHigher:335,working:267,unemployed:199,medicalEducation:{total:10,otm:4,technical:6}},
 'Пешку тумани':{total:486,higher:178,nonHigher:308,working:317,unemployed:168,medicalEducation:{total:23,otm:8,technical:15}},
 'Ромитан тумани':{total:651,higher:209,nonHigher:442,working:495,unemployed:155,examined:604,healthy:601,sick:3,medicalEducation:{total:21,otm:16,technical:5},diagnoses:[{name:'Bolalar miya falaji',count:1},{name:'Itsinka kushing',count:1},{name:"Endemik Bo'qoq",count:1}]},
 'Шофиркон тумани':{total:814,higher:282,nonHigher:532,working:471,unemployed:340,medicalEducation:{total:22,otm:16,technical:6}},
 'Ғиждувон тумани':{total:1626,higher:500,nonHigher:1126,working:899,unemployed:722,medicalEducation:{total:15,otm:11,technical:4}},
 'Қоракўл тумани':{total:874,higher:260,nonHigher:614,working:538,unemployed:336,medicalEducation:{total:23,otm:7,technical:16}},
 'Қоровулбозор тумани':{total:131,higher:38,nonHigher:93,working:67,unemployed:63,medicalEducation:{total:3,otm:2,technical:1}}
};
const GLOBAL={hudud:'Buxoro viloyati',total:9823,higher:3184,nonHigher:6639,working:5674,unemployed:4131,examined:604,healthy:601,sick:3,medicalEducation:{total:283,otm:210,technical:73},diagnoses:[{name:'Bolalar miya falaji',count:1},{name:'Itsinka kushing',count:1},{name:"Endemik Bo'qoq",count:1}]};
function sourceSummary(hudud=''){
 const key=hudud?canonicalHudud(hudud):'';
 if(!key)return {...GLOBAL,medicalEducation:{...GLOBAL.medicalEducation},diagnoses:GLOBAL.diagnoses.map(x=>({...x}))};
 const r=REGIONS[key]||{total:0,higher:0,nonHigher:0,working:0,unemployed:0,medicalEducation:{total:0,otm:0,technical:0}};
 return {hudud:key,total:r.total||0,higher:r.higher||0,nonHigher:r.nonHigher||0,working:r.working||0,unemployed:r.unemployed||0,examined:r.examined||0,healthy:r.healthy||0,sick:r.sick||0,medicalEducation:{...(r.medicalEducation||{total:0,otm:0,technical:0})},diagnoses:(r.diagnoses||[]).map(x=>({...x}))};
}
module.exports={sourceSummary,REGIONS,GLOBAL};

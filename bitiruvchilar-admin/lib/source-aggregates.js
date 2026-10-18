'use strict';
const {canonicalHudud}=require('./graduate-utils');
const {DETAILS}=require('./source-details');
const REGIONS={
 'Бухоро тумани':{total:957,higher:301,nonHigher:656,working:337,unemployed:618,medicalEducation:{total:37,otm:31,technical:6}},
 'Бухоро шаҳар':{total:1455,higher:539,nonHigher:916,working:840,unemployed:612,medicalEducation:{total:76,otm:75,technical:1}},
 'Вобкент тумани':{total:657,higher:201,nonHigher:456,working:366,unemployed:291,medicalEducation:{total:12,otm:8,technical:4}},
 'Жондор тумани':{total:911,higher:307,nonHigher:604,working:615,unemployed:295,examined:911,healthy:900,sick:0,healthOther:11,medicalEducation:{total:19,otm:16,technical:3},healthPathways:{ambulatory:9,inpatient:0,operative:0,district:0,region:0,republic:0}},
 'Когон тумани':{total:516,higher:151,nonHigher:365,working:303,unemployed:213,medicalEducation:{total:15,otm:12,technical:3}},
 'Когон шаҳар':{total:278,higher:86,nonHigher:192,working:159,unemployed:119,examined:274,healthy:244,sick:13,healthOther:17,medicalEducation:{total:7,otm:4,technical:3},healthPathways:{ambulatory:14,inpatient:1,operative:0,district:0,region:0,republic:0}},
 'Олот тумани':{total:467,higher:132,nonHigher:335,working:267,unemployed:199,medicalEducation:{total:10,otm:4,technical:6}},
 'Пешку тумани':{total:486,higher:178,nonHigher:308,working:317,unemployed:168,examined:486,healthy:475,sick:11,healthOther:0,medicalEducation:{total:23,otm:8,technical:15},diagnoses:[{name:'Kamqonlik',count:11}],healthPathways:{ambulatory:11,inpatient:0,operative:0,district:11,region:0,republic:0}},
 'Ромитан тумани':{total:651,higher:209,nonHigher:442,working:495,unemployed:155,examined:604,healthy:601,sick:3,healthOther:0,medicalEducation:{total:21,otm:16,technical:5},diagnoses:[{name:'Bolalar miya falaji',count:1},{name:'Itsinka kushing',count:1},{name:"Endemik Bo'qoq",count:1}],healthPathways:{ambulatory:3,inpatient:0,operative:0,district:0,region:0,republic:0}},
 'Шофиркон тумани':{total:814,higher:282,nonHigher:532,working:471,unemployed:340,medicalEducation:{total:22,otm:16,technical:6}},
 'Ғиждувон тумани':{total:1626,higher:500,nonHigher:1126,working:899,unemployed:722,medicalEducation:{total:15,otm:11,technical:4}},
 'Қоракўл тумани':{total:874,higher:260,nonHigher:614,working:538,unemployed:336,examined:873,healthy:788,sick:73,healthOther:12,medicalEducation:{total:23,otm:7,technical:16},diagnoses:[{name:'Kamqonlik',count:14},{name:'O‘RVI / yuqori nafas yo‘llari',count:23},{name:'Bronxit',count:7},{name:'Karies',count:3},{name:'Periodontit',count:3},{name:'Miopiya',count:2}],healthPathways:{ambulatory:77,inpatient:5,operative:5,district:0,region:0,republic:0}},
 'Қоровулбозор тумани':{total:131,higher:38,nonHigher:93,working:67,unemployed:63,medicalEducation:{total:3,otm:2,technical:1}}
};
const GLOBAL={hudud:'Buxoro viloyati',total:9823,higher:3184,nonHigher:6639,working:5674,unemployed:4131,examined:3148,healthy:3008,sick:100,healthOther:40,medicalEducation:{total:283,otm:210,technical:73},diagnoses:[{name:'Kamqonlik',count:25},{name:'O‘RVI / yuqori nafas yo‘llari',count:23},{name:'Bronxit',count:7},{name:'Miopiya',count:5},{name:'Qalqonsimon bez kasalliklari',count:3},{name:'Bolalar miya falaji',count:1},{name:'Itsinka kushing',count:1}],healthPathways:{ambulatory:114,inpatient:6,operative:5,district:11,region:0,republic:0}};
const blankEdu=()=>({otm:0,technical:0,lyceum:0,school:0,unknown:0});
const blankGender=()=>({male:0,female:0,unknown:0});
const blankEmp=()=>({publicSector:0,privateSector:0,lawEnforcement:0,entrepreneur:0,credit:0,nextEducation:0,migration:0,selfEmployed:0,vocational:0,childcare:0,unemployed:0,deceased:0,prison:0,other:0,unknown:0});
const blankPlans=()=>({jobPlacement:0,entrepreneurship:0,credit:0,selfEmployment:0,migration:0,vocational:0,homemaker:0,affluentFamily:0,applicant:0,marriedOtherRegion:0});
const blankHealth=()=>({ambulatory:0,inpatient:0,operative:0,district:0,region:0,republic:0});
function withDetails(base,key){const d=DETAILS[key]||{};return {...base,education:{...blankEdu(),...(d.education||{})},gender:{...blankGender(),...(d.gender||{})},employmentBreakdown:{...blankEmp(),...(d.employmentBreakdown||{})},plans:{...blankPlans(),...(d.plans||{})},healthPathways:{...blankHealth(),...(base.healthPathways||{})},medicalSpecialties:(d.medicalSpecialties||[]).map(x=>({...x}))};}
function sourceSummary(hudud=''){
 const key=hudud?canonicalHudud(hudud):'';
 if(!key)return withDetails({...GLOBAL,medicalEducation:{...GLOBAL.medicalEducation},diagnoses:GLOBAL.diagnoses.map(x=>({...x}))},'__GLOBAL__');
 const r=REGIONS[key]||{total:0,higher:0,nonHigher:0,working:0,unemployed:0,medicalEducation:{total:0,otm:0,technical:0}};
 return withDetails({hudud:key,total:r.total||0,higher:r.higher||0,nonHigher:r.nonHigher||0,working:r.working||0,unemployed:r.unemployed||0,examined:r.examined||0,healthy:r.healthy||0,sick:r.sick||0,healthOther:r.healthOther||0,medicalEducation:{...(r.medicalEducation||{total:0,otm:0,technical:0})},diagnoses:(r.diagnoses||[]).map(x=>({...x})),healthPathways:r.healthPathways||blankHealth()},key);
}
module.exports={sourceSummary,REGIONS,GLOBAL};

'use strict';
const {canonicalHudud}=require('./graduate-utils');
const {DETAILS}=require('./source-details');
const REGIONS={
 'Бухоро тумани':{total:957,higher:301,nonHigher:656,working:337,unemployed:618,examined:957,healthy:907,sick:50,healthOther:0,medicalEducation:{total:37,otm:31,technical:6},diagnoses:[{name:'Anemiya / kamqonlik',count:23},{name:'Qalqonsimon bez / bo‘qoq',count:20},{name:'Miopiya',count:7}],healthPathways:{ambulatory:47,inpatient:2,operative:0,district:0,region:0,republic:0}},
 'Бухоро шаҳар':{total:1455,higher:539,nonHigher:916,working:840,unemployed:612,examined:1361,healthy:1317,sick:37,healthOther:7,medicalEducation:{total:76,otm:75,technical:1},diagnoses:[{name:'Anemiya / kamqonlik',count:29},{name:'Qalqonsimon bez / bo‘qoq',count:4},{name:'Boshqa kasalliklar',count:3},{name:'Miopiya',count:1}],healthPathways:{ambulatory:10,inpatient:3,operative:0,district:0,region:2,republic:1}},
 'Вобкент тумани':{total:657,higher:201,nonHigher:456,working:366,unemployed:291,medicalEducation:{total:12,otm:8,technical:4}},
 'Жондор тумани':{total:911,higher:307,nonHigher:604,working:615,unemployed:295,examined:906,healthy:895,sick:0,healthOther:11,medicalEducation:{total:19,otm:16,technical:3},healthPathways:{ambulatory:9,inpatient:0,operative:0,district:0,region:0,republic:0}},
 'Когон тумани':{total:516,higher:151,nonHigher:365,working:303,unemployed:213,medicalEducation:{total:15,otm:12,technical:3}},
 'Когон шаҳар':{total:278,higher:86,nonHigher:192,working:159,unemployed:119,examined:274,healthy:244,sick:13,healthOther:17,medicalEducation:{total:7,otm:4,technical:3},diagnoses:[{name:'Boshqa kasalliklar',count:13}],healthPathways:{ambulatory:14,inpatient:1,operative:0,district:0,region:0,republic:0}},
 'Олот тумани':{total:467,higher:132,nonHigher:335,working:267,unemployed:199,examined:466,healthy:405,sick:48,healthOther:13,medicalEducation:{total:10,otm:4,technical:6},diagnoses:[{name:'Boshqa kasalliklar',count:33},{name:'Anemiya / kamqonlik',count:9},{name:'Miopiya',count:2},{name:'Bronxit',count:2},{name:'O‘RVI / yuqori nafas yo‘llari',count:1},{name:'Qalqonsimon bez / bo‘qoq',count:1}],healthPathways:{ambulatory:28,inpatient:5,operative:2,district:1,region:0,republic:0}},
 'Пешку тумани':{total:486,higher:178,nonHigher:308,working:317,unemployed:168,examined:485,healthy:474,sick:11,healthOther:0,medicalEducation:{total:23,otm:8,technical:15},diagnoses:[{name:'Anemiya / kamqonlik',count:11}],healthPathways:{ambulatory:11,inpatient:0,operative:0,district:11,region:0,republic:0}},
 'Ромитан тумани':{total:651,higher:209,nonHigher:442,working:495,unemployed:155,examined:604,healthy:601,sick:3,healthOther:0,medicalEducation:{total:21,otm:16,technical:5},diagnoses:[{name:'Boshqa kasalliklar',count:3}],healthPathways:{ambulatory:3,inpatient:0,operative:0,district:0,region:0,republic:0}},
 'Шофиркон тумани':{total:814,higher:282,nonHigher:532,working:471,unemployed:340,examined:814,healthy:813,sick:0,healthOther:1,medicalEducation:{total:22,otm:16,technical:6}},
 'Ғиждувон тумани':{total:1626,higher:500,nonHigher:1126,working:899,unemployed:722,examined:1624,healthy:1623,sick:1,healthOther:0,medicalEducation:{total:15,otm:11,technical:4},diagnoses:[{name:'Qalqonsimon bez / bo‘qoq',count:1}]},
 'Қоракўл тумани':{total:874,higher:260,nonHigher:614,working:538,unemployed:336,examined:872,healthy:787,sick:73,healthOther:12,medicalEducation:{total:23,otm:7,technical:16},diagnoses:[{name:'O‘RVI / yuqori nafas yo‘llari',count:23},{name:'Boshqa kasalliklar',count:21},{name:'Anemiya / kamqonlik',count:14},{name:'Bronxit',count:7},{name:'Stomatologik kasalliklar',count:6},{name:'Miopiya',count:2}],healthPathways:{ambulatory:77,inpatient:5,operative:5,district:0,region:0,republic:0}},
 'Қоровулбозор тумани':{total:131,higher:38,nonHigher:93,working:67,unemployed:63,medicalEducation:{total:3,otm:2,technical:1}}
};
const GLOBAL={hudud:'Buxoro viloyati',total:9823,higher:3184,nonHigher:6639,working:5674,unemployed:4131,examined:8363,healthy:8066,sick:236,healthOther:61,medicalEducation:{total:283,otm:210,technical:73},diagnoses:[{name:'Anemiya / kamqonlik',count:86},{name:'Boshqa kasalliklar',count:73},{name:'Qalqonsimon bez / bo‘qoq',count:26},{name:'O‘RVI / yuqori nafas yo‘llari',count:24},{name:'Miopiya',count:12},{name:'Bronxit',count:9},{name:'Stomatologik kasalliklar',count:6}],healthPathways:{ambulatory:199,inpatient:16,operative:7,district:12,region:2,republic:1}};
const blankEdu=()=>({otm:0,technical:0,lyceum:0,school:0,unknown:0});
const blankGender=()=>({male:0,female:0,unknown:0});
const blankEmp=()=>({publicSector:0,privateSector:0,lawEnforcement:0,entrepreneur:0,credit:0,nextEducation:0,migration:0,selfEmployed:0,vocational:0,childcare:0,unemployed:0,deceased:0,prison:0,other:0,unknown:0});
const blankPlans=()=>({jobPlacement:0,entrepreneurship:0,credit:0,selfEmployment:0,migration:0,vocational:0,homemaker:0,affluentFamily:0,applicant:0,marriedOtherRegion:0});
const blankHealth=()=>({ambulatory:0,inpatient:0,operative:0,district:0,region:0,republic:0});
function withDetails(base,key){const d=DETAILS[key]||{};const education={...blankEdu(),...(d.education||{})};education.school+=Number(education.unknown||0);education.unknown=0;return {...base,education,gender:{...blankGender(),...(d.gender||{})},employmentBreakdown:{...blankEmp(),...(d.employmentBreakdown||{})},plans:{...blankPlans(),...(d.plans||{})},healthPathways:{...blankHealth(),...(base.healthPathways||{})},medicalSpecialties:(d.medicalSpecialties||[]).map(x=>({...x}))};}
function sourceSummary(hudud=''){
 const key=hudud?canonicalHudud(hudud):'';
 if(!key)return withDetails({...GLOBAL,medicalEducation:{...GLOBAL.medicalEducation},diagnoses:GLOBAL.diagnoses.map(x=>({...x}))},'__GLOBAL__');
 const r=REGIONS[key]||{total:0,higher:0,nonHigher:0,working:0,unemployed:0,medicalEducation:{total:0,otm:0,technical:0}};
 return withDetails({hudud:key,total:r.total||0,higher:r.higher||0,nonHigher:r.nonHigher||0,working:r.working||0,unemployed:r.unemployed||0,examined:r.examined||0,healthy:r.healthy||0,sick:r.sick||0,healthOther:r.healthOther||0,medicalEducation:{...(r.medicalEducation||{total:0,otm:0,technical:0})},diagnoses:(r.diagnoses||[]).map(x=>({...x})),healthPathways:r.healthPathways||blankHealth()},key);
}
module.exports={sourceSummary,REGIONS,GLOBAL};

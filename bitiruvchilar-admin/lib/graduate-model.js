'use strict';
const {norm,canonicalHudud,statusFlags}=require('./graduate-utils');
function normalizeEducationLevel(value){
  const n=norm(value);
  if(!n)return 'unknown';
  if(/(^| )otm($| )|oliy talim|олий таълим|(^| )отм($| )|bakalavr|magistr/.test(n))return 'OTM';
  if(/texnikum|техникум|kollej|коллеж|kasbiy|касбий|prof|проф/.test(n))return 'Texnikum';
  if(/litsey|лицей/.test(n))return 'Litsey';
  if(/maktab|мактаб/.test(n))return 'Maktab';
  return 'unknown';
}
function normalizeEmploymentStatus(value){
  const n=norm(value);if(!n)return 'unknown';
  const f=statusFlags(value);if(f.unemployed)return 'Ishsiz';if(f.working)return 'Ishlaydi';if(f.deceased)return 'Vafot etgan';
  if(/migrats/.test(n))return 'Migratsiyada';if(/jarayon/.test(n))return 'Jarayonda';return String(value).trim();
}
function deriveHealthStatus(row={}){
  const explicit=norm(row.health_status);
  if(/soglom|соглом/.test(explicit))return 'Sog‘lom';
  if(/kasal|бемор|касал/.test(explicit))return 'Kasal';
  if(/aniqlanmagan|аниқланмаган|unknown|boshqa holat/.test(explicit))return 'Aniqlanmagan';
  const dx=norm(row.diagnosis||row.tashxis);
  if(/soglom|соглом/.test(dx))return 'Sog‘lom';
  if(dx)return 'Kasal';
  return 'Aniqlanmagan';
}
function matchGraduateKey(row={}){
  const pinfl=String(row.pinfl??row.jshshir??'').replace(/\D/g,'');if(pinfl)return `pinfl:${pinfl}`;
  const fio=norm(row.fio),hud=canonicalHudud(row.hudud||row.tuman||''),dob=String(row.tugilgan_sana||row.birth_date||'').trim();
  if(fio&&hud&&dob)return `fallback:${fio}|${norm(hud)}|${dob}`;
  return '';
}
function aggregateGraduateRows(rows=[],filterHudud=''){
  const out={
    total:0,higher:0,nonHigher:0,working:0,unemployed:0,examined:0,healthy:0,sick:0,healthOther:0,
    education:{otm:0,technical:0,lyceum:0,school:0,unknown:0},
    gender:{male:0,female:0,unknown:0},
    employmentBreakdown:{publicSector:0,privateSector:0,lawEnforcement:0,entrepreneur:0,credit:0,nextEducation:0,migration:0,selfEmployed:0,vocational:0,childcare:0,unemployed:0,deceased:0,prison:0,other:0,unknown:0},
    healthPathways:{ambulatory:0,inpatient:0,operative:0,district:0,region:0,republic:0},
    medicalEducation:{total:0,otm:0,technical:0},diagnoses:[]
  };
  const diag=new Map();const filter=filterHudud?canonicalHudud(filterHudud):'';
  for(const row of rows){
    const hud=canonicalHudud(row.hudud||row.tuman||'');if(filter&&hud!==filter)continue;out.total++;
    const edu=normalizeEducationLevel(row.education_level||row.bitirgan_turi||row.talim_darajasi);
    if(edu==='OTM'){out.higher++;out.education.otm++;}
    else if(edu==='Texnikum'){out.nonHigher++;out.education.technical++;}
    else if(edu==='Litsey'){out.nonHigher++;out.education.lyceum++;}
    else if(edu==='Maktab'){out.nonHigher++;out.education.school++;}
    else{out.nonHigher++;out.education.school++;}
    const g=norm(row.jins||row.gender);if(/erkak|эркак/.test(g))out.gender.male++;else if(/ayol|аел|аёл/.test(g))out.gender.female++;else out.gender.unknown++;
    const emp=normalizeEmploymentStatus(row.employment_status||row.holat||row.bandlik_holati);if(emp==='Ishlaydi')out.working++;if(emp==='Ishsiz')out.unemployed++;
    const h=norm(row.holat||row.employment_detail||'');const eb=out.employmentBreakdown;
    if(emp==='Ishsiz')eb.unemployed++;
    else if(emp==='Vafot etgan'||/vafot|вафот/.test(h))eb.deceased++;
    else if(/jiem|жием/.test(h))eb.prison++;
    else if(/davlat|давлат/.test(h))eb.publicSector++;
    else if(/xususiy|хусусий/.test(h))eb.privateSector++;
    else if(/huquqni muhofaza|хукукни мухофаза|ҳуқуқни муҳофаза/.test(h))eb.lawEnforcement++;
    else if(/tadbirkor|тадбиркор/.test(h))eb.entrepreneur++;
    else if(/kredit|кредит/.test(h))eb.credit++;
    else if(/keyingi bosqich|кейинги боскич|кейинги босқич/.test(h))eb.nextEducation++;
    else if(/migrats|миграц/.test(h)||emp==='Migratsiyada')eb.migration++;
    else if(/ozini ozi band|узини узи банд|ўзини ўзи банд/.test(h))eb.selfEmployed++;
    else if(/kasb hunar|касб хунар|касб-хунар/.test(h))eb.vocational++;
    else if(/2 yoshgacha|2 ешгача|2 ёшгача/.test(h))eb.childcare++;
    else if(emp==='Ishlaydi')eb.other++;else eb.unknown++;
    const examined=Boolean(String(row.medical_exam_date||row.korik_sana||'').trim());if(examined)out.examined++;
    const hs=deriveHealthStatus(row);if(hs==='Sog‘lom')out.healthy++;else if(hs==='Kasal')out.sick++;else if(examined)out.healthOther++;
    if(Number(row.ambulatory)||0)out.healthPathways.ambulatory++;if(Number(row.inpatient)||0)out.healthPathways.inpatient++;if(Number(row.operative)||0)out.healthPathways.operative++;if(Number(row.wellness_district)||0)out.healthPathways.district++;if(Number(row.wellness_region)||0)out.healthPathways.region++;if(Number(row.wellness_republic)||0)out.healthPathways.republic++;
    const med=Boolean(row.medical_education===true||row.medical_education===1||row.medical_education==='1'||norm(row.medical_education)==='ha');if(med){out.medicalEducation.total++;const ml=normalizeEducationLevel(row.medical_education_level);if(ml==='OTM')out.medicalEducation.otm++;else if(ml==='Texnikum')out.medicalEducation.technical++;}
    const d=String(row.diagnosis_category||row.diagnosis||row.tashxis||'').trim();if(hs==='Kasal'&&d)diag.set(d,(diag.get(d)||0)+1);
  }
  out.diagnoses=[...diag.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  return out;
}
module.exports={normalizeEducationLevel,normalizeEmploymentStatus,deriveHealthStatus,matchGraduateKey,aggregateGraduateRows};

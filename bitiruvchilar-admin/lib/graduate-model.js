'use strict';
const {norm,canonicalHudud,statusFlags}=require('./graduate-utils');
function normalizeEducationLevel(value){
  const n=norm(value);
  if(!n)return 'unknown';
  if(/(^| )otm($| )|oliy talim|олий таълим|(^| )отм($| )|bakalavr|magistr/.test(n))return 'OTM';
  if(/texnikum|техникум|kollej|коллеж/.test(n))return 'Texnikum';
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
  if(norm(row.diagnosis)||norm(row.tashxis))return 'Kasal';
  return 'Aniqlanmagan';
}
function matchGraduateKey(row={}){
  const pinfl=String(row.pinfl??row.jshshir??'').replace(/\D/g,'');if(pinfl)return `pinfl:${pinfl}`;
  const fio=norm(row.fio),hud=canonicalHudud(row.hudud||row.tuman||''),dob=String(row.tugilgan_sana||row.birth_date||'').trim();
  if(fio&&hud&&dob)return `fallback:${fio}|${norm(hud)}|${dob}`;
  return '';
}
function aggregateGraduateRows(rows=[],filterHudud=''){
  const out={total:0,higher:0,nonHigher:0,working:0,unemployed:0,examined:0,healthy:0,sick:0,medicalEducation:{total:0,otm:0,technical:0},diagnoses:[]};
  const diag=new Map();const filter=filterHudud?canonicalHudud(filterHudud):'';
  for(const row of rows){const hud=canonicalHudud(row.hudud||row.tuman||'');if(filter&&hud!==filter)continue;out.total++;
    const edu=normalizeEducationLevel(row.education_level||row.bitirgan_turi||row.talim_darajasi);if(edu==='OTM')out.higher++;else if(['Texnikum','Litsey','Maktab'].includes(edu))out.nonHigher++;
    const emp=normalizeEmploymentStatus(row.employment_status||row.holat||row.bandlik_holati);if(emp==='Ishlaydi')out.working++;if(emp==='Ishsiz')out.unemployed++;
    if(String(row.medical_exam_date||row.korik_sana||'').trim())out.examined++;
    const hs=deriveHealthStatus(row);if(hs==='Sog‘lom')out.healthy++;if(hs==='Kasal')out.sick++;
    const med=Boolean(row.medical_education===true||row.medical_education===1||row.medical_education==='1'||norm(row.medical_education)==='ha');if(med){out.medicalEducation.total++;const ml=normalizeEducationLevel(row.medical_education_level);if(ml==='OTM')out.medicalEducation.otm++;else if(ml==='Texnikum')out.medicalEducation.technical++;}
    const d=String(row.diagnosis_category||row.diagnosis||row.tashxis||'').trim();if(hs==='Kasal'&&d)diag.set(d,(diag.get(d)||0)+1);
  }
  out.diagnoses=[...diag.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  return out;
}
module.exports={normalizeEducationLevel,normalizeEmploymentStatus,deriveHealthStatus,matchGraduateKey,aggregateGraduateRows};

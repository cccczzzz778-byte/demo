const {normalizeEmploymentRate}=require('./validation');

const TEMPLATE_HEADERS = [
  '№','Туман','Муассаса номи','Типи','Ходимнинг Ф.И.О.','ПИНФЛ','Лавозими',
  'Мутахассислиги','Ставкаси','Телефон рақами','Изоҳ'
];

function clean(v){return String(v ?? '').trim();}
function normKey(v){return clean(v).toLowerCase().replace(/[’ʻ`']/g,"'").replace(/\s+/g,' ');}
function get(row, aliases){
  const entries = Object.entries(row || {});
  for (const alias of aliases){
    const wanted = normKey(alias);
    const hit = entries.find(([k]) => normKey(k) === wanted);
    if (hit) return clean(hit[1]);
  }
  return '';
}
function normalizeStaffRows(rows){
  const valid=[],errors=[],seen=new Set();
  (rows||[]).forEach((row,index)=>{
    const rowNumber=index+2;
    const fullName=get(row,['Ходимнинг Ф.И.О.','Xodimning F.I.O.','F.I.O.','FIO','full_name']);
    const pinfl=get(row,['ПИНФЛ','PINFL','JSHSHIR']).replace(/\D/g,'');
    const position=get(row,['Лавозими','Lavozimi','Lavozim','position']);
    const specialty=get(row,['Мутахассислиги','Mutaxassisligi','Mutaxassislik','specialty']);
    const employment=normalizeEmploymentRate(get(row,['Ставкаси','Ставкаси (ўриндош, асосий)','Stavkasi','Stavkasi (o‘rindosh, asosiy)','employment']));
    const phone=get(row,['Телефон рақами','Telefon raqami','Telefon','phone']);
    const note=get(row,['Изоҳ','Izoh','note']);
    if(!fullName&&!pinfl&&!position&&!specialty&&!phone&&!note) return;
    const problems=[];
    if(!fullName) problems.push('F.I.O. kiritilmagan');
    if(!/^\d{14}$/.test(pinfl)) problems.push('PINFL 14 ta raqam bo‘lishi kerak');
    if(!position) problems.push('Lavozim kiritilmagan');
    if(!employment) problems.push('Stavka son ko‘rinishida kiritilishi kerak (masalan: 1, 0,5, 0,25)');
    if(/^\d{14}$/.test(pinfl)&&seen.has(pinfl)) problems.push('PINFL fayl ichida takrorlangan');
    if(problems.length){errors.push({row:rowNumber,rowNumber,fullName,pinfl,message:problems.join('; ')});return;}
    seen.add(pinfl);
    valid.push({row:rowNumber,rowNumber,fullName,pinfl,position,specialty,employment,phone,note});
  });
  return {valid,errors};
}
module.exports={TEMPLATE_HEADERS,normalizeStaffRows,normalizeEmploymentRate};

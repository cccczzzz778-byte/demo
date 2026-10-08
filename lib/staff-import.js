const {normalizeEmploymentType}=require('./validation');

const TEMPLATE_HEADERS = [
  '№','Туман','Муассаса номи','Типи','Ходимнинг Ф.И.О.','ПИНФЛ','Лавозими',
  'Мутахассислиги','Ставкаси (ўриндош, асосий)','Телефон рақами','Изоҳ'
];

function clean(v){return String(v ?? '').trim();}
function normKey(v){return clean(v).toLowerCase().replace(/[’ʻ`']/g,"'").replace(/\s+/g,' ');}
function get(row, aliases){
  const entries=Object.entries(row||{});
  for(const alias of aliases){const wanted=normKey(alias);const hit=entries.find(([k])=>normKey(k)===wanted);if(hit)return clean(hit[1]);}
  return '';
}
function normalizeStaffRows(rows){
  const valid=[],errors=[];
  (rows||[]).forEach((row,index)=>{
    const rowNumber=index+2;
    const fullName=get(row,['Ходимнинг Ф.И.О.','Xodimning F.I.O.','Ф.И.О. сотрудника','ФИО сотрудника','F.I.O.','FIO','full_name']);
    const pinflRaw=get(row,['ПИНФЛ','PINFL','JSHSHIR']);
    const pinfl=pinflRaw.replace(/\D/g,'');
    const position=get(row,['Лавозими','Lavozimi','Lavozim','Должность','position']);
    const specialty=get(row,['Мутахассислиги','Mutaxassisligi','Mutaxassislik','Специальность','specialty']);
    const employmentRaw=get(row,['Ставкаси (ўриндош, асосий)','Ставкаси','Stavkasi (o‘rindosh, asosiy)',"Stavkasi (o'rindosh, asosiy)",'Ставка (совместитель, основной)','Ставка','Stavkasi','employment']);
    const employment=normalizeEmploymentType(employmentRaw);
    const phone=get(row,['Телефон рақами','Telefon raqami','Номер телефона','Телефон','Telefon','phone']);
    const note=get(row,['Изоҳ','Izoh','Примечание','note']);
    if(!fullName&&!pinflRaw&&!position&&!specialty&&!phone&&!note)return;
    const item={row:rowNumber,rowNumber,fullName,pinfl,pinflRaw,position,specialty,employment,employmentRaw,phone,note};
    const problems=[];
    if(!fullName)problems.push('F.I.O. kiritilmagan');
    if(!/^\d{14}$/.test(pinfl))problems.push('PINFL 14 ta raqam bo‘lishi kerak');
    if(!position)problems.push('Lavozim kiritilmagan');
    if(!employment)problems.push("Stavka 'asosiy' yoki 'o‘rindosh' bo‘lishi kerak");
    if(problems.length){errors.push({...item,message:problems.join('; ')});return;}
    valid.push(item);
  });
  return {valid,errors};
}
module.exports={TEMPLATE_HEADERS,normalizeStaffRows,normalizeEmploymentType};

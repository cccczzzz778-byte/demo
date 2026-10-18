'use strict';
const {REGIONS}=require('./source-aggregates');

const DISPLAY={
  'Бухоро тумани':'Buxoro tumani',
  'Бухоро шаҳар':'Buxoro shahri',
  'Вобкент тумани':'Vobkent tumani',
  'Жондор тумани':'Jondor tumani',
  'Когон тумани':'Kogon tumani',
  'Когон шаҳар':'Kogon shahri',
  'Олот тумани':'Olot tumani',
  'Пешку тумани':'Peshku tumani',
  'Ромитан тумани':'Romitan tumani',
  'Шофиркон тумани':'Shofirkon tumani',
  'Ғиждувон тумани':'G‘ijduvon tumani',
  'Қоракўл тумани':'Qorako‘l tumani',
  'Қоровулбозор тумани':'Qorovulbozor tumani'
};

// Tibbiy ko‘rik natijalari bir shaxs bir marta tamoyili bilan JSHSHIR+F.I.O.
// bo‘yicha takrorlardan tozalangan. Jami bitiruvchi nazorat soni 9 823 bo‘lib qoladi.
const EXAMINED={
  'Бухоро тумани':957,
  'Бухоро шаҳар':1361,
  'Когон шаҳар':274,
  'Жондор тумани':906,
  'Олот тумани':466,
  'Пешку тумани':485,
  'Ромитан тумани':604,
  'Шофиркон тумани':814,
  'Ғиждувон тумани':1624,
  'Қоракўл тумани':872
};

const num=v=>Number(v)||0;
const percent=(v,t)=>t>0?(num(v)*100/num(t)).toFixed(1)+'%':'0.0%';
function maxBy(rows,fn){return rows.reduce((best,row)=>!best||fn(row)>fn(best)?row:best,null)}

function buildRankingSummary(){
  const hududlar=Object.entries(REGIONS).map(([key,r])=>({
    name:DISPLAY[key]||key,
    total:num(r.total),
    working:num(r.working),
    unemployed:num(r.unemployed),
    higher:num(r.higher),
    examined:Object.prototype.hasOwnProperty.call(EXAMINED,key)?EXAMINED[key]:0,
    sick:num(r.sick)
  }));
  const employment=maxBy(hududlar,x=>x.total?x.working/x.total:-1);
  const unemployed=maxBy(hududlar,x=>x.unemployed);
  const higher=maxBy(hududlar,x=>x.total?x.higher/x.total:-1);
  const exam=maxBy(hududlar.filter(x=>x.examined>0),x=>x.total?x.examined/x.total:-1);
  const sick=maxBy(hududlar,x=>x.sick);
  return {
    source:'9 823 bitiruvchi va takrorlardan tozalangan tibbiy ko‘riklar',
    hududlar,
    winners:{
      employment:{name:employment.name,value:percent(employment.working,employment.total)},
      unemployed:{name:unemployed.name,value:String(unemployed.unemployed)},
      higher:{name:higher.name,value:percent(higher.higher,higher.total)},
      exam:{name:exam.name,value:percent(exam.examined,exam.total)},
      sick:{name:sick.name,value:String(sick.sick)}
    }
  };
}

module.exports={buildRankingSummary,EXAMINED};

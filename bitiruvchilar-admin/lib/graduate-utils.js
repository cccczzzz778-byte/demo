'use strict';
const norm=s=>String(s??'').toLowerCase().replace(/[ʻʼ’‘`']/g,'').replace(/ё/g,'е').replace(/ў/g,'у').replace(/қ/g,'к').replace(/ғ/g,'г').replace(/ҳ/g,'х').replace(/[^a-zа-я0-9]+/gi,' ').trim();
const DISTRICTS=[
  [['buxoro shahri','buxoro shahar','бухоро шахар','бухоро шахри'],'Бухоро шаҳар'],
  [['kogon shahri','kogon shahar','когон шахар','когон шахри'],'Когон шаҳар'],
  [['buxoro tumani','buxoro tuman','бухоро тумани','бухоро туман'],'Бухоро тумани'],
  [['vobkent','вобкент'],'Вобкент тумани'],
  [['gijduvon','гиждувон'],'Ғиждувон тумани'],
  [['jondor','жондор'],'Жондор тумани'],
  [['kogon tumani','kogon tuman','когон тумани','когон туман'],'Когон тумани'],
  [['qorakol','qorako l','коракул','коракул тумани'],'Қоракўл тумани'],
  [['qorovulbozor','коровулбозор'],'Қоровулбозор тумани'],
  [['olot','олот'],'Олот тумани'],
  [['peshku','пешку'],'Пешку тумани'],
  [['romitan','rometan','ромитан','рометан'],'Ромитан тумани'],
  [['shofirkon','шофиркон'],'Шофиркон тумани']
];
function canonicalHudud(value){const n=norm(value);for(const [aliases,out] of DISTRICTS){if(aliases.some(a=>n.includes(norm(a))))return out}return String(value??'').trim()}
function statusFlags(value){const n=norm(value);const deceased=/vafot|вафот/.test(n);const unemployed=!deceased&&/ishsiz|ишсиз/.test(n);const working=!deceased&&!unemployed&&(/ishlaydi|ишлайди/.test(n)||/^band$/.test(n)||/o zini o zi band|узини узи банд|tadbirkor|тадбиркор|huquqni muhofaza|хукукни мухофаза/.test(n));return {unemployed,deceased,working}}
function isHigherEducation(value){const n=norm(value);return /oliy talim|олий таълим|otm|отм|bakalavr|magistr/.test(n)}
module.exports={norm,canonicalHudud,statusFlags,isHigherEducation};

'use strict';
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function norm(v){
  return String(v??'').toLowerCase().trim()
    .replace(/[ʻʼ’‘`´]/g,"'")
    .replace(/ё/g,'е').replace(/ў/g,'у').replace(/қ/g,'к').replace(/ғ/g,'г').replace(/ҳ/g,'х')
    .replace(/[^a-zа-я0-9']+/gi,' ').replace(/\s+/g,' ').trim();
}

const MAP = new Map([
  ['buxoro shahri','Бухоро шаҳар'],['buxoro shahar','Бухоро шаҳар'],['бухоро шахар','Бухоро шаҳар'],['бухоро шахри','Бухоро шаҳар'],
  ['kogon shahri','Когон шаҳар'],['kogon shahar','Когон шаҳар'],['когон шахар','Когон шаҳар'],['когон шахри','Когон шаҳар'],
  ['olot','Олот тумани'],['olot tumani','Олот тумани'],['олот','Олот тумани'],['олот тумани','Олот тумани'],
  ['buxoro tumani','Бухоро тумани'],['бухоро тумани','Бухоро тумани'],
  ['vobkent','Вобкент тумани'],['vobkent tumani','Вобкент тумани'],['вобкент','Вобкент тумани'],['вобкент тумани','Вобкент тумани'],
  ["g'ijduvon",'Ғиждувон тумани'],["g'ijduvon tumani",'Ғиждувон тумани'],['gijduvon','Ғиждувон тумани'],['gijduvon tumani','Ғиждувон тумани'],['гиждувон','Ғиждувон тумани'],['гиждувон тумани','Ғиждувон тумани'],
  ['jondor','Жондор тумани'],['jondor tumani','Жондор тумани'],['жондор','Жондор тумани'],['жондор тумани','Жондор тумани'],
  ['kogon tumani','Когон тумани'],['когон тумани','Когон тумани'],
  ["qorako'l",'Қоракўл тумани'],["qorako'l tumani",'Қоракўл тумани'],['qorakol','Қоракўл тумани'],['qorakol tumani','Қоракўл тумани'],['коракул','Қоракўл тумани'],['коракул тумани','Қоракўл тумани'],
  ['qorovulbozor','Қоровулбозор тумани'],['qorovulbozor tumani','Қоровулбозор тумани'],['коровулбозор','Қоровулбозор тумани'],['коровулбозор тумани','Қоровулбозор тумани'],
  ['peshku','Пешку тумани'],['peshku tumani','Пешку тумани'],['пешку','Пешку тумани'],['пешку тумани','Пешку тумани'],
  ['romitan','Ромитан тумани'],['romitan tumani','Ромитан тумани'],['ромитан','Ромитан тумани'],['ромитан тумани','Ромитан тумани'],
  ['shofirkon','Шофиркон тумани'],['shofirkon tumani','Шофиркон тумани'],['шофиркон','Шофиркон тумани'],['шофиркон тумани','Шофиркон тумани'],
]);

function canonicalHudud(v){
  const raw=String(v??'').trim();
  return MAP.get(norm(raw)) || raw;
}

function runMigration(){
  const dbPath=process.env.DB_PATH||path.join(__dirname,'data.sqlite');
  const db=new DatabaseSync(dbPath);
  const has=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='excel_graduates'").get();
  if(!has){db.close();return;}
  const rows=db.prepare('SELECT id,hudud FROM excel_graduates').all();
  const upd=db.prepare('UPDATE excel_graduates SET hudud=? WHERE id=?');
  let changed=0;
  db.exec('BEGIN IMMEDIATE');
  try{
    for(const r of rows){const c=canonicalHudud(r.hudud);if(c!==r.hudud){upd.run(c,r.id);changed++;}}
    db.exec('DROP TRIGGER IF EXISTS normalize_excel_hudud_after_insert');
    db.exec(`CREATE TRIGGER normalize_excel_hudud_after_insert AFTER INSERT ON excel_graduates
      WHEN NEW.hudud IS NOT NULL AND NEW.hudud<>''
      BEGIN
        UPDATE excel_graduates SET hudud = CASE lower(trim(NEW.hudud))
          WHEN 'buxoro shahri' THEN 'Бухоро шаҳар'
          WHEN 'buxoro shahar' THEN 'Бухоро шаҳар'
          WHEN 'kogon shahri' THEN 'Когон шаҳар'
          WHEN 'kogon shahar' THEN 'Когон шаҳар'
          WHEN 'olot' THEN 'Олот тумани'
          WHEN 'olot tumani' THEN 'Олот тумани'
          WHEN 'buxoro tumani' THEN 'Бухоро тумани'
          WHEN 'vobkent' THEN 'Вобкент тумани'
          WHEN 'vobkent tumani' THEN 'Вобкент тумани'
          WHEN 'g''ijduvon' THEN 'Ғиждувон тумани'
          WHEN 'gijduvon' THEN 'Ғиждувон тумани'
          WHEN 'g''ijduvon tumani' THEN 'Ғиждувон тумани'
          WHEN 'gijduvon tumani' THEN 'Ғиждувон тумани'
          WHEN 'jondor' THEN 'Жондор тумани'
          WHEN 'jondor tumani' THEN 'Жондор тумани'
          WHEN 'kogon tumani' THEN 'Когон тумани'
          WHEN 'qorako''l' THEN 'Қоракўл тумани'
          WHEN 'qorakol' THEN 'Қоракўл тумани'
          WHEN 'qorako''l tumani' THEN 'Қоракўл тумани'
          WHEN 'qorakol tumani' THEN 'Қоракўл тумани'
          WHEN 'qorovulbozor' THEN 'Қоровулбозор тумани'
          WHEN 'qorovulbozor tumani' THEN 'Қоровулбозор тумани'
          WHEN 'peshku' THEN 'Пешку тумани'
          WHEN 'peshku tumani' THEN 'Пешку тумани'
          WHEN 'romitan' THEN 'Ромитан тумани'
          WHEN 'romitan tumani' THEN 'Ромитан тумани'
          WHEN 'shofirkon' THEN 'Шофиркон тумани'
          WHEN 'shofirkon tumani' THEN 'Шофиркон тумани'
          ELSE NEW.hudud END
        WHERE id=NEW.id;
      END;`);
    db.exec('COMMIT');
    console.log(`Hudud canonical migratsiya: ${changed} ta yozuv yangilandi; trigger tayyor.`);
  }catch(e){try{db.exec('ROLLBACK')}catch{};db.close();throw e;}
  db.close();
}

if(require.main===module)runMigration();
module.exports={canonicalHudud,runMigration};

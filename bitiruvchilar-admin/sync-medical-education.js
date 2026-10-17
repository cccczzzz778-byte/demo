'use strict';
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const DB_PATH=process.env.DB_PATH||path.join(__dirname,'data.sqlite');
const db=new DatabaseSync(DB_PATH);
const norm=s=>String(s??'').toLowerCase().replace(/[ʻʼ’‘`']/g,'').replace(/ё/g,'е').replace(/ў/g,'у').replace(/қ/g,'к').replace(/ғ/g,'г').replace(/ҳ/g,'х').replace(/[^a-zа-я0-9]+/gi,' ').trim();
try{
 const grads=db.prepare('SELECT id,fio,bitirgan_turi FROM excel_graduates').all();
 const meds=db.prepare('SELECT fio,education_level FROM medical_graduates').all();
 const map=new Map();
 for(const m of meds){const k=norm(m.fio);if(!k)continue;const lvl=norm(m.education_level);if(/otm|олий|oliy|universitet|institut/.test(lvl))map.set(k,'Oliy ta’lim');else if(/texnikum|техникум|kollej|коллеж/.test(lvl))map.set(k,'Texnikum');}
 const upd=db.prepare("UPDATE excel_graduates SET bitirgan_turi=? WHERE id=?");
 let changed=0;
 db.exec('BEGIN IMMEDIATE');
 try{for(const g of grads){const v=map.get(norm(g.fio));if(v&&g.bitirgan_turi!==v){upd.run(v,g.id);changed++;}}db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
 console.log(`Ta'lim darajasi sinxronizatsiyasi: ${changed} ta yozuv yangilandi; OTM=oliy ta'lim.`);
}finally{db.close();}

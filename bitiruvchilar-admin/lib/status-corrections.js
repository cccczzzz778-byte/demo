'use strict';
const MIGRATION_KEY='2026-10-19-vafot-to-d-control';
const FROM='Vafot etgan';
const TO='D nazoratda turgan';

function ensureMigrationTable(db){
  db.exec("CREATE TABLE IF NOT EXISTS app_migrations(key TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')), details TEXT NOT NULL DEFAULT '')");
}
function correctDControlMisclassification(db){
  ensureMigrationTable(db);
  if(db.prepare('SELECT 1 FROM app_migrations WHERE key=?').get(MIGRATION_KEY))return{applied:false,count:0,reason:'already-applied'};
  const rows=db.prepare('SELECT * FROM excel_graduates WHERE employment_status=? OR holat=? ORDER BY id').all(FROM,FROM);
  const count=rows.length;
  if(count!==14)return{applied:false,count,reason:'unexpected-count'};
  db.exec('BEGIN IMMEDIATE');
  try{
    const upd=db.prepare('UPDATE excel_graduates SET employment_status=?,holat=? WHERE id=?');
    const audit=db.prepare('INSERT INTO graduate_audit(graduate_id,actor,action,old_json,new_json) VALUES(?,?,?,?,?)');
    for(const old of rows){
      upd.run(TO,TO,old.id);
      const neu={...old,employment_status:TO,holat:TO};
      audit.run(Number(old.id),'system:status-correction-2026-10-19','status-correction',JSON.stringify(old),JSON.stringify(neu));
    }
    db.prepare('INSERT INTO app_migrations(key,details) VALUES(?,?)').run(MIGRATION_KEY,JSON.stringify({from:FROM,to:TO,count}));
    db.exec('COMMIT');
    return{applied:true,count};
  }catch(error){
    try{db.exec('ROLLBACK')}catch{}
    throw error;
  }
}
module.exports={correctDControlMisclassification};

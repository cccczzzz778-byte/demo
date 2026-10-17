'use strict';
const {canonicalHudud}=require('./graduate-utils');
const {updateGraduateWithAudit}=require('./graduate-db');
function getGraduate(db,id){return db.prepare('SELECT * FROM excel_graduates WHERE id=?').get(Number(id))||null}
function listGraduates(db,filters={}){
 const where=[],args=[];const add=(sql,v)=>{where.push(sql);args.push(v)};
 if(filters.hudud)add('hudud=?',canonicalHudud(filters.hudud));
 if(filters.education_level)add('education_level=?',filters.education_level);
 if(filters.medical_education!==undefined&&filters.medical_education!=='')add('medical_education=?',Number(filters.medical_education));
 if(filters.medical_education_level)add('medical_education_level=?',filters.medical_education_level);
 if(filters.employment_status)add('employment_status=?',filters.employment_status);
 if(filters.health_status)add('health_status=?',filters.health_status);
 if(filters.examined==='1')where.push("medical_exam_date<>''");if(filters.examined==='0')where.push("medical_exam_date=''");
 if(filters.op_oshp==='__unmapped')where.push("op_oshp=''");else if(filters.op_oshp)add('op_oshp=?',filters.op_oshp);
 if(filters.q){where.push('(fio LIKE ? OR pinfl LIKE ? OR mahalla LIKE ? OR telefon LIKE ? OR education_institution LIKE ? OR specialty LIKE ?)');const q='%'+String(filters.q).trim()+'%';args.push(q,q,q,q,q,q)}
 const w=where.length?' WHERE '+where.join(' AND '):'';const total=Number(db.prepare('SELECT COUNT(*) n FROM excel_graduates'+w).get(...args).n||0);const limit=Math.max(20,Math.min(500,Number(filters.limit)||100)),offset=Math.max(0,Number(filters.offset)||0);const records=db.prepare('SELECT * FROM excel_graduates'+w+' ORDER BY hudud,fio LIMIT ? OFFSET ?').all(...args,limit,offset);return {total,limit,offset,records}
}
function patchGraduate(db,id,patch,actor){const allowedEdu=new Set(['','unknown','OTM','Texnikum','Litsey','Maktab']);const allowedMed=new Set(['','unknown','OTM','Texnikum']);const allowedHealth=new Set(['','Aniqlanmagan','Sog‘lom','Kasal']);if('education_level'in patch&&!allowedEdu.has(String(patch.education_level)))throw new Error('Ta’lim darajasi noto‘g‘ri.');if('medical_education_level'in patch&&!allowedMed.has(String(patch.medical_education_level)))throw new Error('Tibbiy ta’lim turi noto‘g‘ri.');if('health_status'in patch&&!allowedHealth.has(String(patch.health_status)))throw new Error('Sog‘liq holati noto‘g‘ri.');return updateGraduateWithAudit(db,Number(id),patch,actor)}
function deleteGraduate(db,id,actor='admin'){const row=getGraduate(db,id);if(!row)return false;db.exec('BEGIN IMMEDIATE');try{db.prepare('DELETE FROM excel_graduates WHERE id=?').run(Number(id));db.prepare('INSERT INTO graduate_audit(graduate_id,actor,action,old_json,new_json) VALUES(?,?,?,?,?)').run(Number(id),String(actor||''),'delete',JSON.stringify(row),'{}');db.exec('COMMIT');return true}catch(e){try{db.exec('ROLLBACK')}catch{}throw e}}
module.exports={getGraduate,listGraduates,patchGraduate,deleteGraduate};

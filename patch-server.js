const fs=require('fs');
const path=require('path');

const file=path.join(__dirname,'server.js');
let src=fs.readFileSync(file,'utf8');
const marker='staff-export-scope-v1';

if(!src.includes(marker)){
  const importLine="const {TEMPLATE_HEADERS,normalizeStaffRows,normalizeEmploymentRate}=require('./lib/staff-import');";
  if(!src.includes(importLine)) throw new Error('staff import require not found');
  src=src.replace(importLine,importLine+"\nconst {staffExportScope}=require('./lib/staff-scope'); // "+marker);

  const route=/app\.get\('\/api\/export\/staff\.xlsx',auth,async\(req,res\)=>\{[\s\S]*?\n\}\);\n\napp\.get\('\*'/;
  if(!route.test(src)) throw new Error('staff export route not found');
  const replacement=`app.get('/api/export/staff.xlsx',auth,async(req,res)=>{
  const scopedId=staffExportScope(req.user,req.query.institutionId);
  if(req.user.role==='institution'&&!scopedId)return res.status(403).json({error:'forbidden'});
  let rows;
  if(scopedId){
    rows=(await pool.query('SELECT district,institution,type,full_name,pinfl,position,specialty,employment,phone,note FROM staff WHERE institution_id=$1 ORDER BY district,institution,full_name',[scopedId])).rows;
  }else{
    rows=(await pool.query('SELECT district,institution,type,full_name,pinfl,position,specialty,employment,phone,note FROM staff ORDER BY district,institution,full_name')).rows;
  }
  const ws=XLSX.utils.json_to_sheet(exportRows(rows),{header:TEMPLATE_HEADERS});ws['!cols']=[{wch:6},{wch:20},{wch:34},{wch:16},{wch:30},{wch:18},{wch:24},{wch:24},{wch:18},{wch:20},{wch:30}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Xodimlar');const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Disposition','attachment; filename="tibbiyot_xodimlari.xlsx"');res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(out);
});

app.get('*'`;
  src=src.replace(route,replacement);
  fs.writeFileSync(file,src);
  console.log('INSTITUTION_STAFF_EXPORT_READY');
}

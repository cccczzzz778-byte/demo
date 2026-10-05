const fs=require('fs');
const path=require('path');

const file=path.join(__dirname,'public','index.html');
let html=fs.readFileSync(file,'utf8');
const marker='institution-staff-view-v1';

if(!html.includes(marker)){
  const addon=`
<style id="${marker}-style">
.institution-link{border:0;background:transparent;padding:0;color:#075e54;font-weight:700;text-decoration:underline;cursor:pointer;text-align:left}
.staff-scope{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;margin-bottom:14px;border:1px solid #cfe0dc;border-radius:10px;background:#f5fbf9}
.staff-scope b{color:#075e54}.staff-scope small{display:block;color:#6d7d79;margin-top:3px}
@media(max-width:800px){.staff-scope{align-items:flex-start;flex-direction:column}}
</style>
<script id="${marker}">
window.dmedSelectedInstitutionId=null;
function dmedScopedInstitution(){return institutions.find(function(x){return Number(x.id)===Number(window.dmedSelectedInstitutionId)})||null}
function dmedEditStaff(id){var x=staff.find(function(v){return Number(v.id)===Number(id)});if(x)openStaff(x)}
function dmedEditInstitution(id){var x=institutions.find(function(v){return Number(v.id)===Number(id)});if(x)openInst(x)}
function dmedUpdateStaffScope(){
  var box=document.getElementById('staffScope');if(!box)return;
  var ins=dmedScopedInstitution();
  if(me&&me.role==='admin'&&ins){
    box.classList.remove('hidden');
    box.innerHTML='<div><b>'+esc(ins.name)+'</b><small>'+esc(ins.district)+' · Shu muassasa kiritgan xodimlar</small></div><button class="outline" onclick="clearInstitutionStaff()">Barcha xodimlar</button>';
  }else{box.classList.add('hidden');box.innerHTML=''}
}
function openInstitutionStaff(id){
  if(!me||me.role!=='admin')return;
  window.dmedSelectedInstitutionId=Number(id);
  var btn=document.querySelector('[data-tab="staff"]');
  if(btn)tab('staff',btn);
  var ins=dmedScopedInstitution();
  if(ins)pageTitle.textContent='Xodimlar — '+ins.name;
  renderStaff();
}
function clearInstitutionStaff(){
  window.dmedSelectedInstitutionId=null;
  pageTitle.textContent=T[lang].staff;
  renderStaff();
}
function renderStaff(){
  var q=(search&&search.value||'').toLowerCase();
  var rows=staff;
  if(me&&me.role==='admin'&&window.dmedSelectedInstitutionId){rows=rows.filter(function(x){return Number(x.institution_id)===Number(window.dmedSelectedInstitutionId)})}
  rows=rows.filter(function(x){return [x.full_name,x.pinfl,x.institution,x.district,x.position,x.specialty].join(' ').toLowerCase().includes(q)});
  staffBody.innerHTML=rows.map(function(x,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(x.district)+'</td><td>'+esc(x.institution)+'</td><td><b>'+esc(x.full_name)+'</b></td><td>'+esc(x.pinfl)+'</td><td>'+esc(x.position)+'</td><td>'+esc(x.specialty)+'</td><td>'+esc(x.employment)+'</td><td>'+esc(x.phone)+'</td><td class="actions"><button onclick="dmedEditStaff('+x.id+')">✏️</button><button onclick="delStaff('+x.id+')">🗑️</button></td></tr>'}).join('');
  dmedUpdateStaffScope();
}
function renderInst(){
  instBody.innerHTML=institutions.map(function(x,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(x.district)+'</td><td><button class="institution-link" onclick="openInstitutionStaff('+x.id+')">'+esc(x.name)+'</button></td><td>'+esc(x.type)+'</td><td class="'+(x.status==='done'?'done':'pending')+'">'+(x.status==='done'?'Topshirgan':'Topshirmagan')+'</td><td>'+esc(x.phone)+'</td><td class="actions"><button onclick="dmedEditInstitution('+x.id+')">✏️</button><button onclick="account('+x.id+')">🔑</button><button onclick="delInst('+x.id+')">🗑️</button></td></tr>'}).join('')
}
function downloadExcel(){
  var url='/api/export/staff.xlsx';
  if(me&&me.role==='admin'&&window.dmedSelectedInstitutionId)url+='?institutionId='+encodeURIComponent(window.dmedSelectedInstitutionId);
  window.location.href=url;
}
(function(){
  var section=document.getElementById('staff');
  if(section&&!document.getElementById('staffScope')){
    var box=document.createElement('div');box.id='staffScope';box.className='staff-scope hidden';section.insertBefore(box,section.firstChild);
  }
})();
</script>`;
  html=html.replace('</body>',addon+'</body>');
  fs.writeFileSync(file,html);
  console.log('INSTITUTION_STAFF_UI_READY');
}

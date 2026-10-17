import type { AccessProfile } from './rbac.ts';

export function enhanceAdminShell(input:string,profile:AccessProfile):string{
  const isSuper=profile.role==='SUPER_ADMIN';
  const canWrite=isSuper||profile.role==='ADMIN'||(profile.role==='CONTROL_ADMIN'&&profile.controlMode==='active');
  if(!canWrite)return input;
  const script=`<script nonce="__CSP_NONCE__" data-account-actions="1">
const accountEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
${isSuper?`loadAdmins=async function(){
 const d=await fetch('/api/control/admins').then(r=>r.json());
 $('#admins').innerHTML=(d.admins||[]).map(x=>'<div class="card"><b>'+accountEsc(x.username)+'</b> · '+accountEsc(x.role)+' · '+accountEsc(x.districtId||x.scopeType)+' · '+accountEsc(x.controlMode||'—')+' · '+(x.active?'Faol':'Blok')+(x.username==='admin'?' <span class="muted">Root Super Admin</span>':' <button class="action adminReset" data-u="'+encodeURIComponent(x.username)+'">Parol reset</button> <button class="'+(x.active?'danger':'action')+' adminStatus" data-u="'+encodeURIComponent(x.username)+'" data-active="'+x.active+'">'+(x.active?'Bloklash':'Faollashtirish')+'</button>')+'</div>').join('');
 $$('.adminReset').forEach(b=>b.onclick=async()=>{const p=window.prompt('Yangi parol (kamida 8 belgi)');if(!p)return;try{await api('/api/control/admins/'+b.dataset.u+'/reset',{method:'POST',body:JSON.stringify({password:p})});status('Admin paroli yangilandi')}catch(e){status(e.message,true)}});
 $$('.adminStatus').forEach(b=>b.onclick=async()=>{try{await api('/api/control/admins/'+b.dataset.u+'/status',{method:'POST',body:JSON.stringify({active:b.dataset.active!=='true'})});status('Admin holati yangilandi');loadAdmins()}catch(e){status(e.message,true)}});
};`:''}
loadUsers=async function(q=''){
 const d=await fetch('/api/control/users?q='+encodeURIComponent(q)).then(r=>r.json());
 $('#users').innerHTML=(d.users||[]).map(x=>{const may=${isSuper?'true':'x.institution_type!==\'DPM\''};const actions=may?' <button class="action userReset" data-id="'+encodeURIComponent(x.id)+'">Parol reset</button> <button class="'+(x.active?'danger':'action')+' userStatus" data-id="'+encodeURIComponent(x.id)+'" data-active="'+x.active+'">'+(x.active?'Bloklash':'Faollashtirish')+'</button>':'';return '<div class="card"><b>'+accountEsc(x.institution_name||'—')+'</b> · '+accountEsc(x.username)+' · '+accountEsc(x.role)+' · '+(x.active?'Faol':'Blok')+actions+'</div>'}).join('');
 $$('.userReset').forEach(b=>b.onclick=async()=>{const p=window.prompt('Yangi parol (kamida 8 belgi)');if(!p)return;try{await api('/api/control/users/'+b.dataset.id+'/reset',{method:'POST',body:JSON.stringify({password:p})});status('Parol yangilandi')}catch(e){status(e.message,true)}});
 $$('.userStatus').forEach(b=>b.onclick=async()=>{try{await api('/api/control/users/'+b.dataset.id+'/status',{method:'POST',body:JSON.stringify({active:b.dataset.active!=='true'})});status('Foydalanuvchi holati yangilandi');loadUsers($('#userQ')?.value||'')}catch(e){status(e.message,true)}});
};
</script>`;
  return input.replace('</body>',script+'</body>');
}

(function(){
  const DMED=window.DMED=window.DMED||{};
  const messages={
    required_district:'Tumanni kiriting.',required_name:'Muassasa nomini kiriting.',required_type:'Muassasa turini kiriting.',
    invalid_phone:'Telefon raqamini tekshiring.',duplicate_institution:'Bu muassasa nomi avval kiritilgan.',
    required_username:'Loginni kiriting.',invalid_username:'Loginda bo‘sh joy bo‘lmasin.',weak_credentials:'Parol kamida 8 ta belgidan iborat bo‘lsin.',
    password_too_long:'Parol juda uzun.',username_taken:'Bu login boshqa akkauntga biriktirilgan.'
  };

  function render(){
    const body=document.getElementById('institutionsBody');
    const empty=document.getElementById('institutionsEmpty');
    if(!body||!empty)return;
    const esc=DMED.ui.escapeHtml;
    const rows=Array.isArray(DMED.state.institutions)?DMED.state.institutions:[];
    body.innerHTML=rows.map((item,index)=>{
      const count=DMED.state.staff.filter(row=>Number(row.institution_id)===Number(item.id)).length;
      return `<tr>
        <td>${index+1}</td>
        <td>${esc(item.district)}</td>
        <td class="wrap"><button class="link-button" type="button" data-institution-id="${item.id}">${esc(item.name)}</button></td>
        <td>${esc(item.type)}</td>
        <td><span class="badge">${count}</span></td>
        <td class="${item.status==='done'?'status-done':'status-pending'}">${item.status==='done'?'Topshirgan':'Topshirmagan'}</td>
        <td>${esc(item.phone)}</td>
        <td><div class="actions">
          <button class="icon-btn" type="button" data-inst-action="edit" data-id="${item.id}" aria-label="Muassasani tahrirlash" title="Muassasani tahrirlash">✏️</button>
          <button class="icon-btn" type="button" data-inst-action="account" data-id="${item.id}" aria-label="Login va parol" title="Login va parol">🔑</button>
          <button class="icon-btn" type="button" data-inst-action="delete" data-id="${item.id}" aria-label="Muassasani o‘chirish" title="Muassasani o‘chirish">🗑️</button>
        </div></td>
      </tr>`;
    }).join('');
    empty.classList.toggle('hidden',rows.length!==0);
  }

  function institutionPayload(form){
    DMED.ui.clearFieldErrors(form);
    const data=new FormData(form);
    const district=String(data.get('district')||'').trim();
    const name=String(data.get('name')||'').trim();
    const type=String(data.get('type')||'').trim();
    const phone=String(data.get('phone')||'').trim();
    if(!district){DMED.ui.fieldError(form,'district','Tumanni kiriting.');return null;}
    if(!name){DMED.ui.fieldError(form,'name','Muassasa nomini kiriting.');return null;}
    if(!type){DMED.ui.fieldError(form,'type','Turini kiriting.');return null;}
    if(phone&&!/^[+()\d\s.-]{5,32}$/.test(phone)){DMED.ui.fieldError(form,'phone','Telefon raqamini tekshiring.');return null;}
    return {district,name,type,status:String(data.get('status')||'pending'),phone,note:String(data.get('note')||'').trim()};
  }

  function openForm(item=null,opener=null){
    const esc=DMED.ui.escapeHtml;
    DMED.ui.openModal(`
      <div class="modal-header"><h2 id="modalTitle">${item?'Muassasani tahrirlash':'Yangi muassasa'}</h2><button class="icon-btn" type="button" data-close-inst aria-label="Yopish" title="Yopish">✕</button></div>
      <form id="institutionForm" novalidate>
        <div class="modal-grid">
          <div class="form-field"><label for="instDistrict">Tuman</label><input id="instDistrict" name="district" required maxlength="100" value="${esc(item?.district||'')}"><small class="field-error" data-error-for="district"></small></div>
          <div class="form-field"><label for="instName">Muassasa nomi</label><input id="instName" name="name" required maxlength="200" value="${esc(item?.name||'')}"><small class="field-error" data-error-for="name"></small></div>
          <div class="form-field"><label for="instType">Turi</label><input id="instType" name="type" required maxlength="80" value="${esc(item?.type||'birlamchi')}"><small class="field-error" data-error-for="type"></small></div>
          <div class="form-field"><label for="instStatus">Holati</label><select id="instStatus" name="status"><option value="pending" ${item?.status!=='done'?'selected':''}>Topshirmagan</option><option value="done" ${item?.status==='done'?'selected':''}>Topshirgan</option></select></div>
          <div class="form-field"><label for="instPhone">Telefon</label><input id="instPhone" name="phone" maxlength="32" value="${esc(item?.phone||'')}"><small class="field-error" data-error-for="phone"></small></div>
        </div>
        <div class="form-field"><label for="instNote">Izoh</label><textarea id="instNote" name="note" maxlength="500">${esc(item?.note||'')}</textarea><small class="field-error" data-error-for="note"></small></div>
        <div class="form-summary" role="alert"></div>
        <div class="modal-actions"><button class="btn btn-secondary" type="button" data-close-inst>Bekor</button><button id="institutionSaveBtn" class="btn btn-primary" type="submit">Saqlash</button></div>
      </form>
    `,{initialFocus:'#instDistrict',opener});
    const form=document.getElementById('institutionForm');
    form.addEventListener('submit',event=>save(event,item?.id||null));
    document.querySelectorAll('[data-close-inst]').forEach(btn=>btn.addEventListener('click',()=>DMED.ui.closeModal()));
  }

  async function save(event,id){
    event.preventDefault();
    const form=event.currentTarget;
    if(!DMED.ui.beginSubmit(form))return;
    const payload=institutionPayload(form);
    if(!payload){DMED.ui.endSubmit(form);return;}
    const button=document.getElementById('institutionSaveBtn');
    DMED.ui.setModalBusy(true);DMED.ui.setBusy(button,true,{busyText:'Saqlanmoqda...'});
    try{
      await DMED.api(`/api/institutions${id?`/${id}`:''}`,{method:id?'PUT':'POST',body:payload});
      DMED.ui.closeModal(true);DMED.ui.showToast(id?'Muassasa yangilandi.':'Muassasa qo‘shildi.');await DMED.refresh();
    }catch(error){
      const text=messages[error.code]||'Ma’lumotlarni tekshiring.';
      if(error.field)DMED.ui.fieldError(form,error.field,text);else form.querySelector('.form-summary').textContent=text;
    }finally{DMED.ui.setModalBusy(false);DMED.ui.setBusy(button,false,{idleText:'Saqlash'});DMED.ui.endSubmit(form);}
  }

  function toggleAccountPassword(button){DMED.ui.togglePassword('accountPassword',button);}

  function openAccount(item,opener=null){
    DMED.ui.openModal(`
      <div class="modal-header"><h2 id="modalTitle">Login va parol</h2><button class="icon-btn" type="button" data-close-account aria-label="Yopish" title="Yopish">✕</button></div>
      <p class="muted">${DMED.ui.escapeHtml(item.name)} uchun kabinet ma’lumotlarini belgilang.</p>
      <form id="accountForm" novalidate>
        <div class="form-field"><label for="accountUsername">Login</label><input id="accountUsername" name="username" required maxlength="80" autocomplete="off"><small class="field-error" data-error-for="username"></small></div>
        <div class="form-field"><label for="accountPassword">Parol</label><div class="password-wrap"><input id="accountPassword" name="password" type="password" required minlength="8" maxlength="128" autocomplete="new-password"><button id="toggleAccountPassword" class="icon-btn password-toggle" type="button" aria-label="Parolni ko‘rsatish" title="Parolni ko‘rsatish">👁</button></div><small class="field-error" data-error-for="password"></small></div>
        <div class="form-summary" role="alert"></div>
        <div class="modal-actions"><button class="btn btn-secondary" type="button" data-close-account>Bekor</button><button id="accountSaveBtn" class="btn btn-primary" type="submit">Saqlash</button></div>
      </form>
    `,{initialFocus:'#accountUsername',opener});
    document.getElementById('toggleAccountPassword')?.addEventListener('click',event=>toggleAccountPassword(event.currentTarget));
    document.getElementById('accountForm')?.addEventListener('submit',event=>saveAccount(event,item.id));
    document.querySelectorAll('[data-close-account]').forEach(btn=>btn.addEventListener('click',()=>DMED.ui.closeModal()));
  }

  async function saveAccount(event,id){
    event.preventDefault();
    const form=event.currentTarget;
    if(!DMED.ui.beginSubmit(form))return;
    DMED.ui.clearFieldErrors(form);
    const data=new FormData(form);const username=String(data.get('username')||'').trim();const password=String(data.get('password')||'');
    if(!username){DMED.ui.fieldError(form,'username','Loginni kiriting.');DMED.ui.endSubmit(form);return;}
    if(/\s/.test(username)||username.length>80){DMED.ui.fieldError(form,'username','Login formatini tekshiring.');DMED.ui.endSubmit(form);return;}
    if(password.length<8){DMED.ui.fieldError(form,'password','Parol kamida 8 ta belgi bo‘lsin.');DMED.ui.endSubmit(form);return;}
    const button=document.getElementById('accountSaveBtn');DMED.ui.setModalBusy(true);DMED.ui.setBusy(button,true,{busyText:'Saqlanmoqda...'});
    try{
      await DMED.api(`/api/institutions/${id}/account`,{method:'POST',body:{username,password}});
      DMED.ui.closeModal(true);DMED.ui.showToast('Login va parol saqlandi.');
    }catch(error){
      const text=messages[error.code]||'Login yoki parolni tekshiring.';
      if(error.field)DMED.ui.fieldError(form,error.field,text);else form.querySelector('.form-summary').textContent=text;
    }finally{DMED.ui.setModalBusy(false);DMED.ui.setBusy(button,false,{idleText:'Saqlash'});DMED.ui.endSubmit(form);}
  }

  async function remove(item,opener){
    const ok=await DMED.ui.confirmAction({title:'Muassasani o‘chirish',message:`${item.name} va unga bog‘langan xodimlarni o‘chirasizmi?`,confirmText:'O‘chirish',danger:true});
    if(!ok){opener?.focus();return;}
    try{await DMED.api(`/api/institutions/${item.id}`,{method:'DELETE'});DMED.ui.showToast('Muassasa o‘chirildi.');if(Number(DMED.state.selectedInstitutionId)===Number(item.id))DMED.state.selectedInstitutionId=null;await DMED.refresh();}
    catch{DMED.ui.showToast('Muassasani o‘chirishda xatolik.','error');}
  }

  function init(){
    document.getElementById('addInstitutionBtn')?.addEventListener('click',event=>openForm(null,event.currentTarget));
    document.getElementById('institutionsBody')?.addEventListener('click',event=>{
      const scopeButton=event.target.closest('[data-institution-id]');
      if(scopeButton){DMED.staff.selectInstitutionScope(Number(scopeButton.dataset.institutionId));return;}
      const button=event.target.closest('[data-inst-action]');if(!button)return;
      const item=DMED.state.institutions.find(row=>Number(row.id)===Number(button.dataset.id));if(!item)return;
      if(button.dataset.instAction==='edit')openForm(item,button);
      if(button.dataset.instAction==='account')openAccount(item,button);
      if(button.dataset.instAction==='delete')remove(item,button);
    });
  }

  DMED.institutions={init,render,openForm,openAccount,toggleAccountPassword};
})();

(function(){
  const DMED=window.DMED=window.DMED||{};
  const errorMessages={
    required_institution:'Muassasani tanlang.',
    required_full_name:'Xodim F.I.O.sini kiriting.',
    too_long_full_name:'F.I.O. juda uzun.',
    invalid_pinfl:'PINFL aynan 14 ta raqam bo‘lishi kerak.',
    required_position:'Lavozimni kiriting.',
    too_long_position:'Lavozim juda uzun.',
    too_long_specialty:'Mutaxassislik juda uzun.',
    invalid_employment:'Stavkani son ko‘rinishida kiriting: 1, 0,5, 0,25.',
    invalid_phone:'Telefon raqami formatini tekshiring.',
    too_long_note:'Izoh juda uzun.',
    duplicate_pinfl:'Bu PINFL avval bazaga kiritilgan.',
    institution_not_found:'Muassasa topilmadi.'
  };

  function scopedStaff(){
    const state=DMED.state;
    let rows=Array.isArray(state.staff)?state.staff:[];
    if(state.me?.role==='admin'&&state.selectedInstitutionId){
      rows=rows.filter(row=>Number(row.institution_id)===Number(state.selectedInstitutionId));
    }
    const q=(document.getElementById('staffSearch')?.value||'').trim().toLowerCase();
    if(q){
      rows=rows.filter(row=>[row.full_name,row.pinfl,row.institution,row.district,row.position,row.specialty,row.phone].join(' ').toLowerCase().includes(q));
    }
    return rows;
  }

  function updateScopeBar(){
    const bar=document.getElementById('staffScopeBar');
    const name=document.getElementById('staffScopeName');
    const count=document.getElementById('staffScopeCount');
    if(!bar||!name||!count)return;
    const id=DMED.state.selectedInstitutionId;
    const institution=DMED.state.institutions.find(item=>Number(item.id)===Number(id));
    if(DMED.state.me?.role==='admin'&&institution){
      const total=DMED.state.staff.filter(row=>Number(row.institution_id)===Number(id)).length;
      name.textContent=institution.name;
      count.textContent=`${total} xodim`;
      bar.classList.remove('hidden');
    }else{
      bar.classList.add('hidden');
      name.textContent='';
      count.textContent='';
    }
  }

  function render(){
    const body=document.getElementById('staffBody');
    const empty=document.getElementById('staffEmpty');
    if(!body||!empty)return;
    const rows=scopedStaff();
    const esc=DMED.ui.escapeHtml;
    body.innerHTML=rows.map((row,index)=>`
      <tr>
        <td>${index+1}</td>
        <td>${esc(row.district)}</td>
        <td class="wrap">${esc(row.institution)}</td>
        <td class="wrap"><strong>${esc(row.full_name)}</strong></td>
        <td>${esc(row.pinfl)}</td>
        <td class="wrap">${esc(row.position)}</td>
        <td class="wrap">${esc(row.specialty)}</td>
        <td>${esc(row.employment)}</td>
        <td>${esc(row.phone)}</td>
        <td><div class="actions">
          <button class="icon-btn" type="button" data-staff-action="edit" data-id="${row.id}" aria-label="Xodimni tahrirlash" title="Xodimni tahrirlash">✏️</button>
          <button class="icon-btn" type="button" data-staff-action="delete" data-id="${row.id}" aria-label="Xodimni o‘chirish" title="Xodimni o‘chirish">🗑️</button>
        </div></td>
      </tr>
    `).join('');
    empty.classList.toggle('hidden',rows.length!==0);
    updateScopeBar();
  }

  function normalizeEmployment(value){
    const raw=String(value||'').trim().replace(/\s+/g,'').replace(',','.');
    if(!/^\d+(?:\.\d+)?$/.test(raw))return null;
    const n=Number(raw);
    return Number.isFinite(n)&&n>0&&n<=10?String(n):null;
  }

  function validateForm(form){
    DMED.ui.clearFieldErrors(form);
    const data=new FormData(form);
    if(DMED.state.me?.role==='admin'&&!Number(data.get('institutionId'))){DMED.ui.fieldError(form,'institutionId','Muassasani tanlang.');return null;}
    const fullName=String(data.get('fullName')||'').trim();
    if(!fullName){DMED.ui.fieldError(form,'fullName','F.I.O.ni kiriting.');return null;}
    if(fullName.length>160){DMED.ui.fieldError(form,'fullName','F.I.O. juda uzun.');return null;}
    const pinfl=String(data.get('pinfl')||'').trim();
    if(!/^\d{14}$/.test(pinfl)){DMED.ui.fieldError(form,'pinfl','PINFL 14 ta raqam bo‘lishi kerak.');return null;}
    const position=String(data.get('position')||'').trim();
    if(!position){DMED.ui.fieldError(form,'position','Lavozimni kiriting.');return null;}
    const employment=normalizeEmployment(data.get('employment'));
    if(!employment){DMED.ui.fieldError(form,'employment','Masalan: 1, 0,5 yoki 0,25.');return null;}
    const phone=String(data.get('phone')||'').trim();
    if(phone&&!/^[+()\d\s.-]{5,32}$/.test(phone)){DMED.ui.fieldError(form,'phone','Telefon raqamini tekshiring.');return null;}
    return {
      institutionId:DMED.state.me?.role==='admin'?Number(data.get('institutionId')):undefined,
      fullName,
      pinfl,
      position,
      specialty:String(data.get('specialty')||'').trim(),
      employment,
      phone,
      note:String(data.get('note')||'').trim()
    };
  }

  function showServerError(form,error){
    const message=errorMessages[error.code]||'Ma’lumotlarni tekshiring.';
    if(error.field)DMED.ui.fieldError(form,error.field,message);
    else{
      const summary=form.querySelector('.form-summary');
      if(summary)summary.textContent=message;
    }
  }

  function openForm(item=null,opener=null){
    const esc=DMED.ui.escapeHtml;
    const selectedId=item?.institution_id||DMED.state.selectedInstitutionId||DMED.state.institutions[0]?.id||'';
    const institutionField=DMED.state.me?.role==='admin'?`
      <div class="form-field"><label for="staffInstitution">Muassasa</label><select id="staffInstitution" name="institutionId" required>
        <option value="">Muassasani tanlang</option>
        ${DMED.state.institutions.map(inst=>`<option value="${inst.id}" ${Number(inst.id)===Number(selectedId)?'selected':''}>${esc(inst.name)}</option>`).join('')}
      </select><small class="field-error" data-error-for="institutionId"></small></div>`:'';
    DMED.ui.openModal(`
      <div class="modal-header"><h2 id="modalTitle">${item?'Xodimni tahrirlash':'Yangi xodim'}</h2><button class="icon-btn" type="button" data-close-staff aria-label="Yopish" title="Yopish">✕</button></div>
      <form id="staffForm" novalidate>
        ${institutionField}
        <div class="modal-grid">
          <div class="form-field"><label for="staffFullName">F.I.O.</label><input id="staffFullName" name="fullName" required maxlength="160" value="${esc(item?.full_name||'')}"><small class="field-error" data-error-for="fullName"></small></div>
          <div class="form-field"><label for="staffPinfl">PINFL</label><input id="staffPinfl" name="pinfl" required maxlength="14" inputmode="numeric" autocomplete="off" value="${esc(item?.pinfl||'')}"><small class="field-error" data-error-for="pinfl"></small></div>
          <div class="form-field"><label for="staffPosition">Lavozim</label><input id="staffPosition" name="position" required maxlength="120" value="${esc(item?.position||'')}"><small class="field-error" data-error-for="position"></small></div>
          <div class="form-field"><label for="staffSpecialty">Mutaxassislik</label><input id="staffSpecialty" name="specialty" maxlength="120" value="${esc(item?.specialty||'')}"><small class="field-error" data-error-for="specialty"></small></div>
          <div class="form-field"><label for="staffEmployment">Stavka</label><input id="staffEmployment" name="employment" required inputmode="decimal" placeholder="Masalan: 1 yoki 0,5" value="${esc(item?.employment||'1')}"><small class="field-error" data-error-for="employment"></small></div>
          <div class="form-field"><label for="staffPhone">Telefon</label><input id="staffPhone" name="phone" maxlength="32" placeholder="+998 90 123 45 67" value="${esc(item?.phone||'')}"><small class="field-error" data-error-for="phone"></small></div>
        </div>
        <div class="form-field"><label for="staffNote">Izoh</label><textarea id="staffNote" name="note" maxlength="500">${esc(item?.note||'')}</textarea><small class="field-error" data-error-for="note"></small></div>
        <div class="form-summary" role="alert"></div>
        <div class="modal-actions"><button class="btn btn-secondary" type="button" data-close-staff>Bekor</button><button id="staffSaveBtn" class="btn btn-primary" type="submit">Saqlash</button></div>
      </form>
    `,{initialFocus:DMED.state.me?.role==='admin'?'#staffInstitution':'#staffFullName',opener});
    const form=document.getElementById('staffForm');
    form.addEventListener('submit',event=>save(event,item?.id||null));
    document.getElementById('staffPinfl')?.addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,14);});
    document.querySelectorAll('[data-close-staff]').forEach(btn=>btn.addEventListener('click',()=>DMED.ui.closeModal()));
  }

  async function save(event,id){
    event.preventDefault();
    const form=event.currentTarget;
    if(!DMED.ui.beginSubmit(form))return;
    const payload=validateForm(form);
    if(!payload){DMED.ui.endSubmit(form);return;}
    const button=document.getElementById('staffSaveBtn');
    DMED.ui.setModalBusy(true);
    DMED.ui.setBusy(button,true,{busyText:'Saqlanmoqda...'});
    try{
      await DMED.api(`/api/staff${id?`/${id}`:''}`,{method:id?'PUT':'POST',body:payload});
      DMED.ui.closeModal(true);
      DMED.ui.showToast(id?'Xodim ma’lumoti yangilandi.':'Xodim qo‘shildi.');
      await DMED.refresh();
    }catch(error){
      showServerError(form,error);
    }finally{
      DMED.ui.setModalBusy(false);
      DMED.ui.setBusy(button,false,{idleText:'Saqlash'});
      DMED.ui.endSubmit(form);
    }
  }

  async function remove(id,opener){
    const row=DMED.state.staff.find(item=>Number(item.id)===Number(id));
    const ok=await DMED.ui.confirmAction({title:'Xodimni o‘chirish',message:`${row?.full_name||'Xodim'} ma’lumotini o‘chirasizmi?`,confirmText:'O‘chirish',danger:true});
    if(!ok){opener?.focus();return;}
    try{
      await DMED.api(`/api/staff/${id}`,{method:'DELETE'});
      DMED.ui.showToast('Xodim o‘chirildi.');
      await DMED.refresh();
    }catch{DMED.ui.showToast('Xodimni o‘chirishda xatolik.', 'error');}
  }

  function selectInstitutionScope(id){
    const institution=DMED.state.institutions.find(item=>Number(item.id)===Number(id));
    if(!institution){clearInstitutionScope();return;}
    DMED.state.selectedInstitutionId=Number(id);
    document.getElementById('staffSearch').value='';
    DMED.showView('staff');
    render();
  }

  function clearInstitutionScope(){
    DMED.state.selectedInstitutionId=null;
    const search=document.getElementById('staffSearch');
    if(search)search.value='';
    render();
  }

  function init(){
    document.getElementById('staffSearch')?.addEventListener('input',render);
    document.getElementById('addStaffBtn')?.addEventListener('click',event=>openForm(null,event.currentTarget));
    document.getElementById('clearStaffScopeBtn')?.addEventListener('click',clearInstitutionScope);
    document.getElementById('staffBody')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-staff-action]');
      if(!button)return;
      const id=Number(button.dataset.id);
      if(button.dataset.staffAction==='edit')openForm(DMED.state.staff.find(item=>Number(item.id)===id),button);
      if(button.dataset.staffAction==='delete')remove(id,button);
    });
  }

  DMED.staff={init,render,openForm,selectInstitutionScope,clearInstitutionScope,scopedStaff};
})();

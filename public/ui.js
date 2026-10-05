(function(){
  const DMED=window.DMED=window.DMED||{};
  let lastOpener=null;

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function setBusy(button,busy,labels={}){
    if(!button)return;
    if(!button.dataset.idleText)button.dataset.idleText=button.textContent;
    button.disabled=Boolean(busy);
    button.setAttribute('aria-busy',busy?'true':'false');
    if(busy){
      const text=labels.busyText||'Kutilmoqda...';
      button.innerHTML='<span class="spinner" aria-hidden="true"></span>'+escapeHtml(text);
    }else{
      button.textContent=labels.idleText||button.dataset.idleText||'Saqlash';
    }
  }

  function clearFieldErrors(form){
    if(!form)return;
    form.querySelectorAll('.input-error').forEach(el=>el.classList.remove('input-error'));
    form.querySelectorAll('[data-error-for]').forEach(el=>{el.textContent='';});
    const summary=form.querySelector('.form-summary');
    if(summary)summary.textContent='';
  }

  function fieldError(form,field,message){
    if(!form)return;
    const input=form.querySelector(`[name="${field}"]`)||form.querySelector(`#${field}`);
    const target=form.querySelector(`[data-error-for="${field}"]`);
    if(input){input.classList.add('input-error');input.setAttribute('aria-invalid','true');}
    if(target)target.textContent=message;
    else{
      const summary=form.querySelector('.form-summary');
      if(summary)summary.textContent=message;
    }
    if(input&&document.activeElement!==input)input.focus();
  }

  function openModal(html,options={}){
    const modal=document.getElementById('modal');
    const box=document.getElementById('modalBox');
    if(!modal||!box)return;
    lastOpener=options.opener||document.activeElement;
    box.innerHTML=html;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    modal.dataset.busy='false';
    requestAnimationFrame(()=>{
      const focusTarget=options.initialFocus?box.querySelector(options.initialFocus):box.querySelector('input:not([type="hidden"]),select,textarea,button');
      if(focusTarget)focusTarget.focus();
    });
  }

  function closeModal(force=false){
    const modal=document.getElementById('modal');
    const box=document.getElementById('modalBox');
    if(!modal||modal.classList.contains('hidden'))return;
    if(!force&&modal.dataset.busy==='true')return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    modal.dataset.busy='false';
    if(box)box.innerHTML='';
    if(lastOpener&&typeof lastOpener.focus==='function'&&document.contains(lastOpener))lastOpener.focus();
    lastOpener=null;
  }

  function setModalBusy(busy){
    const modal=document.getElementById('modal');
    if(modal)modal.dataset.busy=busy?'true':'false';
  }

  function togglePassword(inputId,button){
    const input=document.getElementById(inputId);
    if(!input)return;
    const showing=input.type==='text';
    input.type=showing?'password':'text';
    const label=showing?'Parolni ko‘rsatish':'Parolni yashirish';
    if(button){button.setAttribute('aria-label',label);button.setAttribute('title',label);button.textContent=showing?'👁':'🙈';}
    input.focus();
  }

  function showToast(message,type='success'){
    const region=document.getElementById('toastRegion');
    if(!region)return;
    const toast=document.createElement('div');
    toast.className='toast'+(type==='error'?' error':'');
    toast.textContent=message;
    region.appendChild(toast);
    setTimeout(()=>toast.remove(),3600);
  }

  function confirmAction({title='Tasdiqlash',message,confirmText='Tasdiqlash',danger=false}={}){
    return new Promise(resolve=>{
      openModal(`
        <div class="modal-header"><h2 id="modalTitle">${escapeHtml(title)}</h2><button class="icon-btn" type="button" data-confirm-cancel aria-label="Yopish" title="Yopish">✕</button></div>
        <p>${escapeHtml(message||'Amalni tasdiqlaysizmi?')}</p>
        <div class="modal-actions"><button class="btn btn-secondary" type="button" data-confirm-cancel>Bekor</button><button class="btn ${danger?'btn-danger':'btn-primary'}" type="button" data-confirm-ok>${escapeHtml(confirmText)}</button></div>
      `,{initialFocus:'[data-confirm-ok]'});
      const box=document.getElementById('modalBox');
      let settled=false;
      const done=value=>{if(settled)return;settled=true;closeModal(true);resolve(value);};
      box.querySelectorAll('[data-confirm-cancel]').forEach(btn=>btn.addEventListener('click',()=>done(false)));
      box.querySelector('[data-confirm-ok]')?.addEventListener('click',()=>done(true));
    });
  }

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')closeModal();
  });
  document.addEventListener('click',event=>{
    if(event.target&&event.target.matches('[data-modal-close]'))closeModal();
  });

  DMED.ui={escapeHtml,setBusy,clearFieldErrors,fieldError,openModal,closeModal,setModalBusy,togglePassword,showToast,confirmAction};
})();

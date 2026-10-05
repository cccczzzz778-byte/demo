(function(){
  const DMED=window.DMED=window.DMED||{};
  let importPayload=null;

  function fileAsBase64(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');
      reader.onerror=()=>reject(new Error('file_read_failed'));
      reader.readAsDataURL(file);
    });
  }

  function open(opener=null){
    importPayload=null;
    DMED.ui.openModal(`
      <div class="modal-header"><h2 id="modalTitle">Excel orqali xodimlarni yuklash</h2><button class="icon-btn" type="button" data-close-import aria-label="Yopish" title="Yopish">✕</button></div>
      <p class="muted">Ustunlar: №, Tuman, Muassasa nomi, Tipi, Xodimning F.I.O., PINFL, Lavozimi, Mutaxassisligi, Stavkasi, Telefon raqami, Izoh.</p>
      <p class="muted">Stavka: 1, 0,5, 0,25 yoki 0.5. PINFL 14 ta raqam bo‘lishi shart. Muassasa ma’lumoti kabinetdan olinadi.</p>
      <p><a class="btn btn-secondary" href="/api/import/template.xlsx">⬇ Excel shablon</a></p>
      <form id="importForm" novalidate>
        <div class="form-field"><label for="importFile">Excel fayl (.xlsx yoki .xls)</label><input id="importFile" name="file" type="file" accept=".xlsx,.xls" required><small class="field-error" data-error-for="file"></small></div>
        <div class="form-summary" role="alert"></div>
        <div id="importResults" class="hidden">
          <div class="import-stats">
            <div class="mini-stat"><span>O‘qilgan</span><strong id="importTotal">0</strong></div>
            <div class="mini-stat"><span>Yuklashga tayyor</span><strong id="importValid">0</strong></div>
            <div class="mini-stat"><span>Xatolar</span><strong id="importErrors">0</strong></div>
          </div>
          <ol id="importErrorList" class="error-list"></ol>
        </div>
        <div class="modal-actions"><button class="btn btn-secondary" type="button" data-close-import>Bekor</button><button id="importPreviewBtn" class="btn btn-secondary" type="submit">Tekshirish</button><button id="importConfirmBtn" class="btn btn-primary hidden" type="button">Bazaga yuklash</button></div>
      </form>
    `,{initialFocus:'#importFile',opener});
    document.getElementById('importForm')?.addEventListener('submit',preview);
    document.getElementById('importConfirmBtn')?.addEventListener('click',confirmImport);
    document.querySelectorAll('[data-close-import]').forEach(btn=>btn.addEventListener('click',()=>DMED.ui.closeModal()));
  }

  function setSummary(text){const el=document.querySelector('#importForm .form-summary');if(el)el.textContent=text||'';}

  async function preview(event){
    event.preventDefault();
    if(!DMED.ui.beginSubmit(event.currentTarget))return;
    const file=document.getElementById('importFile')?.files?.[0];
    if(!file){DMED.ui.fieldError(event.currentTarget,'file','Excel faylni tanlang.');DMED.ui.endSubmit(event.currentTarget);return;}
    if(file.size>10*1024*1024){DMED.ui.fieldError(event.currentTarget,'file','Fayl hajmi 10 MB dan oshmasligi kerak.');DMED.ui.endSubmit(event.currentTarget);return;}
    DMED.ui.clearFieldErrors(event.currentTarget);setSummary('');
    const button=document.getElementById('importPreviewBtn');DMED.ui.setModalBusy(true);DMED.ui.setBusy(button,true,{busyText:'Tekshirilmoqda...'});
    try{
      importPayload={filename:file.name,data:await fileAsBase64(file)};
      const result=await DMED.api('/api/import/preview',{method:'POST',body:importPayload});
      document.getElementById('importResults').classList.remove('hidden');
      document.getElementById('importTotal').textContent=result.total;
      document.getElementById('importValid').textContent=result.validCount;
      document.getElementById('importErrors').textContent=result.errorCount;
      const list=document.getElementById('importErrorList');
      list.innerHTML=(result.errors||[]).slice(0,100).map(error=>`<li>${DMED.ui.escapeHtml(`${error.row}-qator: ${error.message}${error.fullName?` — ${error.fullName}`:''}`)}</li>`).join('');
      list.classList.toggle('hidden',!result.errorCount);
      document.getElementById('importConfirmBtn').classList.toggle('hidden',result.validCount===0);
      if(result.errorCount===0)setSummary('Barcha qatorlar tekshiruvdan o‘tdi.');
    }catch(error){
      const map={excel_invalid:'Excel fayl formati yoki ustunlarini tekshiring.',too_many_rows:'Bir faylda 5000 tadan ko‘p xodim bo‘lmasligi kerak.'};
      setSummary(map[error.code]||'Excel faylni tekshirishda xatolik yuz berdi.');
    }finally{
      DMED.ui.setModalBusy(false);
      DMED.ui.setBusy(button,false,{idleText:'Tekshirish'});
      DMED.ui.endSubmit(event.currentTarget);
    }
  }

  async function confirmImport(){
    if(!importPayload)return;
    const button=document.getElementById('importConfirmBtn');
    if(!button||button.disabled)return;
    DMED.ui.setModalBusy(true);DMED.ui.setBusy(button,true,{busyText:'Yuklanmoqda...'});
    try{
      const result=await DMED.api('/api/import/staff',{method:'POST',body:importPayload});
      DMED.ui.showToast(`${result.inserted} ta xodim bazaga yuklandi.`);
      if(result.errorCount)setSummary(`${result.errorCount} ta qator yuklanmadi.`);
      else DMED.ui.closeModal(true);
      await DMED.refresh();
    }catch{setSummary('Bazaga yuklashda xatolik yuz berdi.');}
    finally{DMED.ui.setModalBusy(false);DMED.ui.setBusy(button,false,{idleText:'Bazaga yuklash'});}
  }

  function init(){document.getElementById('importStaffBtn')?.addEventListener('click',event=>open(event.currentTarget));}
  DMED.importer={init,open};
})();

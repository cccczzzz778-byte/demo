(function(){
  const DMED=window.DMED=window.DMED||{};
  class ApiError extends Error{
    constructor(code,status,field){super(code||'request_failed');this.name='ApiError';this.code=code||'request_failed';this.status=status;this.field=field||null;}
  }

  DMED.state={me:null,staff:[],institutions:[],dashboard:{staff:0,institutions:0,done:0},selectedInstitutionId:null,lang:DMED.i18n?.savedLanguage?.()||'uz',activeView:'dashboard'};
  const titles={dashboard:'home',staff:'staff',institutions:'institutions',reports:'reports'};

  async function api(url,options={}){
    const fetchOptions={method:options.method||'GET',credentials:'same-origin',headers:{...(options.headers||{})}};
    if(options.body!==undefined){fetchOptions.headers['Content-Type']='application/json';fetchOptions.body=JSON.stringify(options.body);}
    let response;
    try{response=await fetch(url,fetchOptions);}catch(error){throw error;}
    const type=response.headers.get('content-type')||'';
    const payload=type.includes('application/json')?await response.json().catch(()=>({})):null;
    if(!response.ok){
      if(response.status===401&&!options.skipAuthRedirect)DMED.auth?.showLogin();
      throw new ApiError(payload?.error||`http_${response.status}`,response.status,payload?.field);
    }
    return payload;
  }

  function configureRole(){
    const admin=DMED.state.me?.role==='admin';
    document.getElementById('institutionsNav')?.classList.toggle('hidden',!admin);
    document.getElementById('submitPanel')?.classList.toggle('hidden',admin);
    document.getElementById('importStaffBtn')?.classList.toggle('hidden',admin);
    const role=document.getElementById('roleText');if(role)role.textContent=admin?DMED.t('roleAdmin'):DMED.t('roleInstitution');
    const user=document.getElementById('userChip');if(user)user.textContent=DMED.state.me?.username||'';
  }

  function applyLanguage(){
    DMED.i18n?.applyStatic?.();
    const lang=DMED.state.lang;
    const switchText=lang==='uz'?DMED.t('languageToRussian'):DMED.t('languageToUzbek');
    const appButton=document.getElementById('languageBtn');if(appButton)appButton.textContent=switchText;
    const loginButton=document.getElementById('loginLanguageBtn');if(loginButton)loginButton.textContent=switchText;
    const key=titles[DMED.state.activeView]||'home';
    const title=document.getElementById('pageTitle');if(title)title.textContent=DMED.t(key);
    if(DMED.state.me)configureRole();
    DMED.staff?.render?.();
    DMED.institutions?.render?.();
  }

  function toggleLanguage(){
    DMED.i18n.setLanguage(DMED.state.lang==='uz'?'ru':'uz');
    applyLanguage();
  }

  function showView(name){
    const allowed=['dashboard','staff','institutions','reports'];
    if(!allowed.includes(name))name='dashboard';
    if(name==='institutions'&&DMED.state.me?.role!=='admin')name='dashboard';
    DMED.state.activeView=name;
    allowed.forEach(view=>document.getElementById(`${view}View`)?.classList.toggle('hidden',view!==name));
    document.querySelectorAll('.nav-btn[data-tab]').forEach(button=>button.classList.toggle('active',button.dataset.tab===name));
    applyLanguage();
  }

  async function refresh(){
    const main=document.querySelector('.main-content');if(main)main.setAttribute('aria-busy','true');
    try{
      const [staff,institutions,dashboard]=await Promise.all([api('/api/staff'),api('/api/institutions'),api('/api/dashboard')]);
      DMED.state.staff=Array.isArray(staff)?staff:[];
      DMED.state.institutions=Array.isArray(institutions)?institutions:[];
      DMED.state.dashboard=dashboard||{staff:0,institutions:0,done:0};
      if(DMED.state.selectedInstitutionId&&!DMED.state.institutions.some(item=>Number(item.id)===Number(DMED.state.selectedInstitutionId)))DMED.state.selectedInstitutionId=null;
      document.getElementById('statStaff').textContent=dashboard.staff??0;
      document.getElementById('statInstitutions').textContent=dashboard.institutions??0;
      document.getElementById('statDone').textContent=dashboard.done??0;
      DMED.staff?.render();
      DMED.institutions?.render();
    }finally{if(main)main.setAttribute('aria-busy','false');}
  }

  async function bootstrap(){
    try{
      DMED.state.me=await api('/api/me',{skipAuthRedirect:true});
      configureRole();
      DMED.auth.showApp();
      await refresh();
      showView('dashboard');
    }catch(error){
      if(error.status===401||error.code==='unauthorized'){DMED.auth.showLogin();return;}
      DMED.auth.showLogin();
      DMED.ui.showToast(DMED.t('connectError'),'error');
    }
  }

  async function submitData(){
    const button=document.getElementById('submitDataBtn');
    const ok=await DMED.ui.confirmAction({title:DMED.t('submitConfirmTitle'),message:DMED.t('submitConfirmMessage'),confirmText:DMED.t('submitButton')});
    if(!ok)return;
    DMED.ui.setBusy(button,true,{busyText:DMED.t('submitting')});
    try{await api('/api/submit',{method:'POST'});DMED.ui.showToast(DMED.t('submitSuccess'));await refresh();}
    catch{DMED.ui.showToast(DMED.t('submitError'),'error');}
    finally{DMED.ui.setBusy(button,false,{idleText:DMED.t('submitButton')});}
  }

  function bind(){
    document.querySelectorAll('.nav-btn[data-tab]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.tab)));
    document.getElementById('languageBtn')?.addEventListener('click',toggleLanguage);
    document.getElementById('loginLanguageBtn')?.addEventListener('click',toggleLanguage);
    document.getElementById('submitDataBtn')?.addEventListener('click',submitData);
    DMED.staff?.init();DMED.institutions?.init();DMED.importer?.init();DMED.reports?.init();
  }

  DMED.api=api;DMED.bootstrap=bootstrap;DMED.refresh=refresh;DMED.showView=showView;DMED.applyLanguage=applyLanguage;DMED.ApiError=ApiError;
  document.addEventListener('DOMContentLoaded',()=>{bind();applyLanguage();bootstrap();});
})();

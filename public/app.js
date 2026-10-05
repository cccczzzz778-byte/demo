(function(){
  const DMED=window.DMED=window.DMED||{};
  class ApiError extends Error{
    constructor(code,status,field){super(code||'request_failed');this.name='ApiError';this.code=code||'request_failed';this.status=status;this.field=field||null;}
  }

  DMED.state={me:null,staff:[],institutions:[],dashboard:{staff:0,institutions:0,done:0},selectedInstitutionId:null,lang:'uz',activeView:'dashboard'};
  const translations={
    uz:{home:'Bosh sahifa',staff:'Xodimlar',institutions:'Muassasalar',reports:'Hisobotlar',logout:'Chiqish'},
    ru:{home:'Главная',staff:'Сотрудники',institutions:'Учреждения',reports:'Отчёты',logout:'Выход'}
  };
  const titles={dashboard:'home',staff:'staff',institutions:'institutions',reports:'reports'};

  async function api(url,options={}){
    const fetchOptions={method:options.method||'GET',credentials:'same-origin',headers:{...(options.headers||{})}};
    if(options.body!==undefined){
      fetchOptions.headers['Content-Type']='application/json';
      fetchOptions.body=JSON.stringify(options.body);
    }
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

  function applyLanguage(){
    const lang=DMED.state.lang;const dict=translations[lang];
    document.documentElement.lang=lang==='uz'?'uz':'ru';
    document.querySelectorAll('[data-i18n]').forEach(node=>{const key=node.dataset.i18n;if(dict[key])node.textContent=dict[key];});
    const button=document.getElementById('languageBtn');if(button)button.textContent=lang==='uz'?'Русский':'O‘zbekcha';
    const key=titles[DMED.state.activeView]||'home';
    const title=document.getElementById('pageTitle');if(title)title.textContent=dict[key]||dict.home;
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

  function configureRole(){
    const admin=DMED.state.me?.role==='admin';
    document.getElementById('institutionsNav')?.classList.toggle('hidden',!admin);
    document.getElementById('submitPanel')?.classList.toggle('hidden',admin);
    document.getElementById('importStaffBtn')?.classList.toggle('hidden',admin);
    const role=document.getElementById('roleText');if(role)role.textContent=admin?'Administrator':'Muassasa kabineti';
    const user=document.getElementById('userChip');if(user)user.textContent=DMED.state.me?.username||'';
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
      DMED.ui.showToast('Tizimga ulanishda xatolik.','error');
    }
  }

  async function submitData(){
    const button=document.getElementById('submitDataBtn');
    const ok=await DMED.ui.confirmAction({title:'Ma’lumotlarni topshirish',message:'Barcha xodimlar ma’lumotlari tekshirilganini tasdiqlaysizmi?',confirmText:'Topshirish'});
    if(!ok)return;
    DMED.ui.setBusy(button,true,{busyText:'Topshirilmoqda...'});
    try{await api('/api/submit',{method:'POST'});DMED.ui.showToast('Ma’lumotlar boshqarmaga topshirildi.');await refresh();}
    catch{DMED.ui.showToast('Topshirishda xatolik yuz berdi.','error');}
    finally{DMED.ui.setBusy(button,false,{idleText:'Topshirish'});}
  }

  function bind(){
    document.querySelectorAll('.nav-btn[data-tab]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.tab)));
    document.getElementById('languageBtn')?.addEventListener('click',()=>{DMED.state.lang=DMED.state.lang==='uz'?'ru':'uz';applyLanguage();});
    document.getElementById('submitDataBtn')?.addEventListener('click',submitData);
    DMED.staff?.init();
    DMED.institutions?.init();
    DMED.importer?.init();
    DMED.reports?.init();
  }

  DMED.api=api;
  DMED.bootstrap=bootstrap;
  DMED.refresh=refresh;
  DMED.showView=showView;
  DMED.applyLanguage=applyLanguage;
  DMED.ApiError=ApiError;

  document.addEventListener('DOMContentLoaded',()=>{bind();bootstrap();});
})();

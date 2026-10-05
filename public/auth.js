(function(){
  const DMED=window.DMED=window.DMED||{};
  let loginBusy=false;

  function showLogin(){
    document.getElementById('loginScreen')?.classList.remove('hidden');
    document.getElementById('appShell')?.classList.add('hidden');
    DMED.applyLanguage?.();
    setTimeout(()=>document.getElementById('username')?.focus(),0);
  }
  function showApp(){document.getElementById('loginScreen')?.classList.add('hidden');document.getElementById('appShell')?.classList.remove('hidden');}

  function messageForLoginError(error){
    if(error?.code==='invalid_credentials')return DMED.t('loginInvalid');
    if(error?.code==='credentials_required')return DMED.t('loginRequired');
    if(error?.code==='too_many_login_attempts')return DMED.t('loginRate');
    if(error?.name==='TypeError')return DMED.t('networkError');
    return DMED.t('loginError');
  }

  async function handleLogin(event){
    event.preventDefault();
    if(loginBusy)return;
    const form=event.currentTarget,username=document.getElementById('username'),password=document.getElementById('password'),message=document.getElementById('loginMessage'),button=document.getElementById('loginBtn');
    DMED.ui.clearFieldErrors(form);message.textContent='';
    if(!username.value.trim()){DMED.ui.fieldError(form,'username',DMED.t('requiredUsername'));return;}
    if(!password.value){DMED.ui.fieldError(form,'password',DMED.t('requiredPassword'));return;}
    loginBusy=true;DMED.ui.setBusy(button,true,{busyText:DMED.t('loginBusy')});
    try{
      await DMED.api('/api/login',{method:'POST',body:{username:username.value.trim(),password:password.value},skipAuthRedirect:true});
      password.value='';message.textContent='';await DMED.bootstrap();
    }catch(error){message.textContent=messageForLoginError(error);}
    finally{loginBusy=false;DMED.ui.setBusy(button,false,{idleText:DMED.t('loginButton')});}
  }

  function updateCapsLock(event){const warning=document.getElementById('capsLockWarning');if(!warning||typeof event.getModifierState!=='function')return;warning.classList.toggle('hidden',!event.getModifierState('CapsLock'));}
  async function logout(){try{await fetch('/api/logout',{method:'POST',credentials:'same-origin'});}catch{}if(DMED.state){DMED.state.me=null;DMED.state.selectedInstitutionId=null;}showLogin();}

  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('loginForm')?.addEventListener('submit',handleLogin);
    const password=document.getElementById('password');password?.addEventListener('keydown',updateCapsLock);password?.addEventListener('keyup',updateCapsLock);
    document.getElementById('toggleLoginPassword')?.addEventListener('click',event=>DMED.ui.togglePassword('password',event.currentTarget));
    document.getElementById('logoutBtn')?.addEventListener('click',logout);
  });
  DMED.auth={showLogin,showApp,logout};
})();

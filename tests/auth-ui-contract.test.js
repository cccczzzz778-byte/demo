const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','public');
function read(name){return fs.readFileSync(path.join(root,name),'utf8');}

test('login is a real keyboard-submittable form',()=>{
  const html=read('index.html');
  assert.match(html,/<form[^>]+id=["']loginForm["']/);
  assert.match(html,/id=["']loginBtn["'][^>]+type=["']submit["']|type=["']submit["'][^>]+id=["']loginBtn["']/);
});

test('login has accessible password visibility and caps lock controls',()=>{
  const html=read('index.html');
  assert.match(html,/id=["']toggleLoginPassword["']/);
  assert.match(html,/aria-label=["'][^"']*Parol[^"']*["']/);
  assert.match(html,/id=["']capsLockWarning["']/);
});

test('frontend uses external CSS and JavaScript assets',()=>{
  const html=read('index.html');
  assert.match(html,/href=["']\/app\.css["']/);
  assert.match(html,/src=["']\/auth\.js["']/);
  assert.match(html,/src=["']\/app\.js["']/);
  assert.doesNotMatch(html,/<script>(?!\s*<\/script>)/);
});

test('keyboard and focus contracts exist',()=>{
  const ui=read('ui.js');
  const auth=read('auth.js');
  const css=read('app.css');
  assert.match(ui,/Escape/);
  assert.match(ui,/focus\(/);
  assert.match(css,/:focus-visible/);
  assert.match(auth,/loginBusy/);
  assert.match(auth,/getModifierState\(['"]CapsLock['"]\)/);
});

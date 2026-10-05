const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','public');
function read(name){return fs.readFileSync(path.join(root,name),'utf8');}

test('staff form supports professional keyboard submission and numeric employment',()=>{
  const js=read('staff.js');
  assert.match(js,/id=["']staffForm["']/);
  assert.match(js,/addEventListener\(['"]submit['"]/);
  assert.match(js,/inputmode=["']decimal["']/);
  assert.match(js,/maxlength=["']14["']/);
});

test('institution account form includes password visibility control',()=>{
  const js=read('institutions.js');
  assert.match(js,/id=["']accountForm["']/);
  assert.match(js,/toggleAccountPassword/);
  assert.match(js,/aria-label=["'][^"']*Parol[^"']*["']/);
});

test('icon-only table actions are labeled for keyboard and assistive technology',()=>{
  const staff=read('staff.js');
  const inst=read('institutions.js');
  assert.match(staff,/aria-label=["']Xodimni tahrirlash["']/);
  assert.match(staff,/aria-label=["']Xodimni o‘chirish["']/);
  assert.match(inst,/aria-label=["']Muassasani tahrirlash["']/);
  assert.match(inst,/aria-label=["']Login va parol["']/);
});

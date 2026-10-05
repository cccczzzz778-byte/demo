const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const publicDir=path.join(root,'public');
function read(name){return fs.readFileSync(path.join(publicDir,name),'utf8');}

function loadI18n(){
  const context={window:{DMED:{}},globalThis:{},module:{exports:{}},document:{querySelectorAll:()=>[],documentElement:{},title:''}};
  vm.runInNewContext(read('i18n.js'),context);
  return context.module.exports.translations||context.window.DMED.i18n.translations;
}

test('Uzbek and Russian dictionaries have exactly the same keys',()=>{
  const tr=loadI18n();
  assert.ok(tr.uz&&tr.ru);
  assert.deepEqual(Object.keys(tr.uz).sort(),Object.keys(tr.ru).sort());
  assert.ok(Object.keys(tr.uz).length>=80);
});

test('every static data-i18n key exists in both languages',()=>{
  const tr=loadI18n();
  const html=read('index.html');
  const keys=[...html.matchAll(/data-i18n(?:-placeholder|-title|-aria)?=["']([^"']+)["']/g)].map(m=>m[1]);
  assert.ok(keys.length>=35);
  for(const key of keys){assert.ok(tr.uz[key],`missing uz:${key}`);assert.ok(tr.ru[key],`missing ru:${key}`);}
});

test('login and app both expose language switching',()=>{
  const html=read('index.html');
  assert.match(html,/id=["']loginLanguageBtn["']/);
  assert.match(html,/id=["']languageBtn["']/);
});

test('dynamic UI modules use centralized translations',()=>{
  for(const file of ['app.js','auth.js','ui.js','staff.js','institutions.js','import.js']){
    assert.match(read(file),/DMED\.t\(/,`${file} must use DMED.t`);
  }
});

test('known dynamic Uzbek-only messages are not hardcoded in feature modules',()=>{
  const joined=['auth.js','ui.js','staff.js','institutions.js','import.js'].map(read).join('\n');
  for(const phrase of ['Login yoki parol noto‘g‘ri','Xodim qo‘shildi','Muassasa yangilandi','Barcha qatorlar tekshiruvdan o‘tdi','Kutilmoqda...','Parolni ko‘rsatish']){
    assert.doesNotMatch(joined,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});

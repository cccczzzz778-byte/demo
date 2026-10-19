'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const publicDir=path.join(root,'public');
const read=name=>fs.readFileSync(path.join(publicDir,name),'utf8');

test('command center shell exposes required anchors and local assets only',()=>{
  const html=read('command-center.html');
  for(const id of ['cc-root','cc-status','cc-metrics','cc-map','cc-territory-panel','cc-risks','cc-quality','cc-refresh']){
    assert.match(html,new RegExp(`id=["']${id}["']`));
  }
  assert.match(html,/href=["']\/command-center\.css["']/);
  assert.match(html,/src=["']\/command-center-map\.js["']/);
  assert.match(html,/src=["']\/command-center\.js["']/);
  assert.doesNotMatch(html,/https?:\/\//i);
  assert.match(html,/href=["']\/(?:dashboard|dashboard\.html)["']/);
});

test('command center shell contains no sample personal or secret data',()=>{
  const html=read('command-center.html');
  assert.doesNotMatch(html,/\b\d{14}\b/);
  assert.doesNotMatch(html,/\+998\s?\d{2}\s?\d{3}/);
  assert.doesNotMatch(html,/pinfl|jshshir|telefon|diagnosis|tashxis|password|secret|token\s*[:=]/i);
});

test('command center stylesheet avoids forced desktop-only minimum width',()=>{
  const css=read('command-center.css');
  assert.doesNotMatch(css,/min-width\s*:\s*(?:9\d\d|1\d{3,})px/i);
});

test('smart map defines the 13 canonical Buxoro territories and no personal fields',()=>{
  const js=read('command-center-map.js');
  const names=['Бухоро шаҳар','Когон шаҳар','Олот тумани','Бухоро тумани','Вобкент тумани','Ғиждувон тумани','Жондор тумани','Когон тумани','Қоракўл тумани','Қоровулбозор тумани','Пешку тумани','Ромитан тумани','Шофиркон тумани'];
  for(const name of names)assert.ok(js.includes(name),`missing ${name}`);
  assert.equal((js.match(/hudud:/g)||[]).length,13);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|axios|WebSocket/i);
  assert.doesNotMatch(js,/pinfl|jshshir|telefon|diagnosis|tashxis/i);
});

test('Kogon city and district map targets do not overlap',()=>{
  const js=read('command-center-map.js');
  const city=js.match(/hudud:'Когон шаҳар',key:'kogon-shahri',x:(\d+),y:(\d+)/);
  const district=js.match(/hudud:'Когон тумани',key:'kogon-tumani',x:(\d+),y:(\d+)/);
  assert.ok(city,'Kogon city coordinates missing');
  assert.ok(district,'Kogon district coordinates missing');
  const distance=Math.hypot(Number(city[1])-Number(district[1]),Number(city[2])-Number(district[2]));
  assert.ok(distance>=72,`Kogon city/district click targets overlap: distance=${distance.toFixed(1)}`);
});

test('smart map exposes mount and scoped selection behavior',()=>{
  const js=read('command-center-map.js');
  assert.match(js,/CommandCenterMap\s*=\s*Object\.freeze/);
  assert.match(js,/Object\.freeze\(\{(?:mount|mount\s*:)/);
  assert.match(js,/allowedHudud/);
  assert.match(js,/onSelect/);
  assert.match(js,/keydown/);
  assert.match(js,/Enter|Space/);
});

test('smart map keeps interactive descendants accessible and does not fake missing counts as zero',()=>{
  const js=read('command-center-map.js');
  assert.match(js,/role:'group'/);
  assert.doesNotMatch(js,/role:'img'/);
  assert.doesNotMatch(js,/Number\(v\)\|\|0/);
  assert.match(js,/v===undefined/);
  assert.ok(js.includes('—'));
});

test('command center controller uses same-origin scoped APIs and safe DOM rendering',()=>{
  const js=read('command-center.js');
  assert.match(js,/['"]\/api\/command-center['"]/);
  assert.match(js,/\/api\/command-center\/territory\?hudud=/);
  assert.doesNotMatch(js,/https?:\/\//i);
  assert.match(js,/textContent/);
  assert.match(js,/createElement/);
  assert.doesNotMatch(js,/\.innerHTML\s*=/);
  assert.doesNotMatch(js,/pinfl|jshshir|telefon|diagnosis|tashxis/i);
});

test('command center controller distinguishes auth errors and degrades derived sections safely',()=>{
  const js=read('command-center.js');
  assert.match(js,/401/);
  assert.match(js,/403/);
  assert.match(js,/unavailable/);
  assert.match(js,/Ma’lumot vaqtincha mavjud emas/);
  assert.match(js,/AbortController/);
  assert.match(js,/Intl\.NumberFormat\(['"]uz-UZ['"]\)/);
  assert.match(js,/encodeURIComponent/);
});

test('hardened gateway exposes authenticated command center page and fixed local assets',()=>{
  const gateway=fs.readFileSync(path.join(root,'medical-dashboard-gateway.js'),'utf8');
  assert.match(gateway,/p===['"]\/command-center['"]/);
  assert.match(gateway,/command-center\.html/);
  assert.match(gateway,/command-center\.css/);
  assert.match(gateway,/command-center-map\.js/);
  assert.match(gateway,/command-center\.js/);
  assert.match(gateway,/await authenticated\(req\)/);
  assert.match(gateway,/COMMAND_CENTER_ASSETS/);
  assert.match(gateway,/hardenedHeaders/);
  assert.match(gateway,/p==='\/'\|\|p==='\/dashboard'\|\|p==='\/dashboard\.html'/);
});

test('canonical server keeps command center APIs and existing health route',()=>{
  const server=fs.readFileSync(path.join(root,'canonical-server-v2.js'),'utf8');
  assert.match(server,/p==='\/api\/command-center'/);
  assert.match(server,/p==='\/api\/command-center\/territory'/);
  assert.match(server,/p==='\/health'/);
});

test('npm check includes command center browser scripts',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.match(pkg.scripts.check,/node --check public\/command-center-map\.js/);
  assert.match(pkg.scripts.check,/node --check public\/command-center\.js/);
});

test('map status is not communicated by color alone and keyboard/mobile support remains explicit',()=>{
  const html=read('command-center.html');
  const css=read('command-center.css');
  assert.match(html,/class=["'][^"']*cc-map-legend/);
  for(const label of ['Barqaror','Diqqat','Kritik','Holat berilmagan'])assert.ok(html.includes(label),`missing ${label}`);
  assert.match(html,/aria-live=["']polite["']/);
  assert.match(html,/<button[^>]+id=["']cc-refresh["']/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

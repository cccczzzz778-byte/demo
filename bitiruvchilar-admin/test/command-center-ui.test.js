'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const publicDir=path.join(__dirname,'..','public');
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

test('smart map exposes mount and scoped selection behavior',()=>{
  const js=read('command-center-map.js');
  assert.match(js,/CommandCenterMap\s*=\s*Object\.freeze/);
  assert.match(js,/mount\s*:/);
  assert.match(js,/allowedHudud/);
  assert.match(js,/onSelect/);
  assert.match(js,/keydown/);
  assert.match(js,/Enter|Space/);
});

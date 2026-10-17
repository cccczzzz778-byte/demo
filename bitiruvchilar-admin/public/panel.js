'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const fmt = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const HCLS = { 'Ishlayapti': 'ok', 'Ishsiz': 'bad', 'Oʻqishda': 'info', 'Harbiy xizmatda': 'info', 'Bola parvarishi taʼtilida': 'info', 'Boshqa': 'mut' };
  let ME = null, HUD = [], HOLAT = [], DARAJA = [], RECS = [], editing = null;
  const hName = (k) => (k === 'boshqa' ? 'Viloyatdan tashqarida' : (HUD.find((h) => h[0] === k) || [k, k || '—'])[1]);

  async function api(method, url, body) {
    const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { location.href = '/login'; throw new Error('auth'); }
    if (!r.ok) { const e = new Error(j.error || 'Xatolik.'); e.data = j; throw e; }
    return j;
  }
  const opts = (sel, list, all) => { sel.replaceChildren(); if (all) sel.append(new Option(all, '')); list.forEach(([v, l]) => sel.append(new Option(l, v))); };

  (async () => {
    const me = await api('GET', '/api/me');
    ME = me.user; HUD = me.hududlar; HOLAT = me.holat; DARAJA = me.daraja;
    $('#who').textContent = (ME.fio || ME.login) + ' · ' + ME.login;
    $('#role').textContent = ME.role === 'admin' ? 'Administrator' : ('Operator' + (ME.hudud ? ' · ' + hName(ME.hudud) : ''));
    if (ME.mustChange) { $('#must').hidden = false; $('#tabs').hidden = true; return; }
    start();
  })().catch(() => {});

  $('#logout').addEventListener('click', async () => { await api('POST', '/api/logout').catch(() => {}); location.href = '/login'; });

  async function changePw(cur, a, b, errEl) {
    errEl.textContent = '';
    if (a !== b) { errEl.textContent = 'Yangi parollar bir xil emas.'; return false; }
    try { const j = await api('POST', '/api/password', { current: cur, next: a }); ME = j.user; return true; }
    catch (e) { errEl.textContent = e.message; return false; }
  }
  $('#m-save').addEventListener('click', async () => {
    if (await changePw($('#m-cur').value, $('#m-new').value, $('#m-new2').value, $('#m-err'))) { $('#must').hidden = true; $('#tabs').hidden = false; start(); }
  });
  $('#p-save').addEventListener('click', async () => {
    $('#p-msg').textContent = '';
    if (await changePw($('#p-cur').value, $('#p-new').value, $('#p-new2').value, $('#p-err'))) { ['#p-cur', '#p-new', '#p-new2'].forEach((s) => ($(s).value = '')); $('#p-msg').textContent = 'Parol almashtirildi.'; $('#p-msg').className = 'msg ok'; }
  });

  function start() {
    if (ME.role === 'admin') $('#tab-usr').hidden = false;
    const hud = ME.role === 'operator' && ME.hudud ? HUD.filter((h) => h[0] === ME.hudud) : HUD;
    opts($('#f-hudud'), hud, hud.length > 1 ? 'Barcha hududlar' : null);
    opts($('#f-holat'), HOLAT.map((h) => [h, h]), 'Barcha holatlar');
    opts($('#f-daraja'), DARAJA.map((d) => [d, d]), 'Barcha darajalar');
    opts($('#r-hudud'), hud);
    opts($('#r-holat'), HOLAT.map((h) => [h, h]));
    opts($('#r-daraja'), DARAJA.map((d) => [d, d]));
    opts($('#r-ish-hudud'), [['', '—'], ...HUD, ['boshqa', 'Viloyatdan tashqarida']]);
    opts($('#u-hudud'), HUD, 'Barcha hududlar');
    showTab('t-rec');
  }

  function showTab(id) {
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    document.querySelectorAll('.pane').forEach((p) => (p.hidden = p.id !== id));
    if (id === 't-rec') loadRecords();
    if (id === 't-rep') loadReport();
    if (id === 't-usr') loadUsers();
  }
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));

  let qTimer = null;
  $('#q').addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(loadRecords, 250); });
  ['#f-hudud', '#f-holat', '#f-daraja'].forEach((s) => $(s).addEventListener('change', loadRecords));
  $('#f-reset').addEventListener('click', () => { $('#q').value = ''; ['#f-holat', '#f-daraja'].forEach((s) => ($(s).value = '')); if ($('#f-hudud').options[0].value === '') $('#f-hudud').value = ''; loadRecords(); });

  async function loadRecords() {
    const p = new URLSearchParams();
    if ($('#q').value.trim()) p.set('q', $('#q').value.trim());
    for (const [k, s] of [['hudud', '#f-hudud'], ['holat', '#f-holat'], ['daraja', '#f-daraja']]) if ($(s).value) p.set(k, $(s).value);
    try { RECS = (await api('GET', '/api/records?' + p)).records; } catch (e) { $('#rec-msg').textContent = e.message; return; }
    renderRecords();
    api('GET', '/api/muassasalar').then((m) => {
      $('#dl-muassasa').replaceChildren(...m.muassasa.map((v) => new Option(v)));
      $('#dl-mut').replaceChildren(...m.mutaxassislik.map((v) => new Option(v)));
    }).catch(() => {});
  }
  function renderRecords() {
    const sum = $('#sum'); sum.replaceChildren();
    const c = (f) => RECS.filter(f).length;
    [['Roʻyxatda', RECS.length, ''], ['Ishlayapti', c((r) => r.holat === 'Ishlayapti'), 'ok'], ['Ishsiz', c((r) => r.holat === 'Ishsiz'), 'bad'],
     ['Oʻz hududida ishlaydi', c((r) => r.holat === 'Ishlayapti' && r.ish_hududi === r.hudud), 'ok'], ['Boshqa holatda', c((r) => !['Ishlayapti', 'Ishsiz'].includes(r.holat)), 'info']]
      .forEach(([l, v, k]) => { const s = el('div', 'stat ' + k); s.append(el('div', 'l', l), el('div', 'v', fmt(v))); sum.append(s); });
    const tb = $('#tbl tbody'); tb.replaceChildren();
    RECS.forEach((r, i) => {
      const tr = el('tr', 'click'); tr.tabIndex = 0;
      tr.addEventListener('click', () => openForm(r)); tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') openForm(r); });
      const hol = el('td'); hol.append(el('span', 'pill ' + (HCLS[r.holat] || 'mut'), r.holat));
      tr.append(el('td', 'num', String(i + 1)), el('td', 'nm', r.fio), el('td', null, r.muassasa), el('td', null, r.mutaxassislik || '—'), el('td', 'hide-sm', r.daraja), el('td', null, hName(r.hudud)), hol,
        el('td', null, r.ish_joyi || '—'), el('td', 'hide-sm', r.lavozim || '—'), el('td', 'hide-sm', r.ish_hududi ? hName(r.ish_hududi) : '—'));
      tb.append(tr);
    });
    const empty = $('#empty');
    empty.hidden = RECS.length > 0;
    empty.textContent = 'Hali bitiruvchi kiritilmagan yoki qidiruvga mos yozuv yoʻq. «+ Bitiruvchi qoʻshish» yoki «Exceldan import» orqali kiriting.';
  }

  const F = { fio: '#r-fio', muassasa: '#r-muassasa', mutaxassislik: '#r-mutaxassislik', daraja: '#r-daraja', hudud: '#r-hudud', holat: '#r-holat', ish_joyi: '#r-ish', lavozim: '#r-lavozim', ish_hududi: '#r-ish-hudud' };
  function openForm(r) {
    editing = r || null;
    $('#form').hidden = false; $('#imp').hidden = true; $('#r-err').textContent = '';
    $('#form-title').textContent = r ? 'Tahrirlash: ' + r.fio : 'Yangi bitiruvchi';
    for (const [k, s] of Object.entries(F)) $(s).value = r ? (r[k] || '') : '';
    if (!r) { $('#r-daraja').value = DARAJA[0]; $('#r-holat').value = 'Ishlayapti'; $('#r-hudud').value = $('#f-hudud').value || $('#r-hudud').options[0].value; }
    $('#r-del').hidden = !r; delArmed = false; $('#r-del').textContent = 'Oʻchirish';
    $('#form').scrollIntoView({ block: 'start', behavior: 'smooth' }); $('#r-fio').focus({ preventScroll: true });
  }
  $('#add').addEventListener('click', () => openForm(null));
  $('#r-cancel').addEventListener('click', () => { $('#form').hidden = true; editing = null; });
  $('#r-save').addEventListener('click', async () => {
    const body = {}; for (const [k, s] of Object.entries(F)) body[k] = $(s).value;
    $('#r-save').disabled = true; $('#r-err').textContent = '';
    try {
      if (editing) await api('PUT', '/api/records/' + editing.id, body); else await api('POST', '/api/records', body);
      $('#form').hidden = true; flash('#rec-msg', 'Saqlandi: ' + body.fio.trim()); editing = null; loadRecords();
    } catch (e) { $('#r-err').textContent = e.message; }
    $('#r-save').disabled = false;
  });
  let delArmed = false;
  $('#r-del').addEventListener('click', async () => {
    if (!editing) return;
    if (!delArmed) { delArmed = true; $('#r-del').textContent = 'Rostdan oʻchirilsinmi? Yana bosing'; return; }
    try { await api('DELETE', '/api/records/' + editing.id); flash('#rec-msg', 'Oʻchirildi: ' + editing.fio); $('#form').hidden = true; editing = null; loadRecords(); }
    catch (e) { $('#r-err').textContent = e.message; }
  });
  function flash(sel, text, warn) { const m = $(sel); m.textContent = text; m.className = 'msg ' + (warn ? 'warn' : 'ok'); }

  $('#imp-toggle').addEventListener('click', () => { $('#imp').hidden = !$('#imp').hidden; $('#form').hidden = true; if (!$('#imp').hidden) $('#imp-text').focus(); });
  const norm = (s) => String(s || '').toLowerCase().replace(/[ʻʼ'`’‘]/g, '').replace(/(^|\s)(tumani|tuman|t\.)(?=\s|$)/g, ' ').replace(/(^|\s)(shahri|shahar|sh\.?)(?=\s|$)/g, ' shahri').replace(/\s+/g, ' ').trim();
  function hudKey(s) {
    const k = norm(s); if (!k) return '';
    const h = HUD.find(([, n]) => norm(n) === k) || HUD.find(([, n]) => norm(n).split(' ')[0] === k.split(' ')[0] && k.includes('shahri') === norm(n).includes('shahri'));
    return h ? h[0] : '';
  }
  const holatOf = (s) => { const t = norm(s); if (/ishsiz|ishlamay/.test(t)) return 'Ishsiz'; if (/ishla|ishda/.test(t)) return 'Ishlayapti'; if (/oqi|ordinat|magistr|talaba/.test(t)) return 'Oʻqishda'; if (/harbiy/.test(t)) return 'Harbiy xizmatda'; if (/dekret|parvarish|tatil/.test(t)) return 'Bola parvarishi taʼtilida'; return 'Boshqa'; };
  const darajaOf = (s) => (/orta|texnikum|kollej/.test(norm(s)) ? 'Oʻrta tibbiy' : 'Oliy');
  $('#imp-go').addEventListener('click', async () => {
    const lines = $('#imp-text').value.split(/\r?\n/);
    const rows = [];
    lines.forEach((line, i) => {
      if (!line.trim()) return;
      const c = line.split(/\t|;/).map((x) => x.trim());
      if (/^(fio|f\.i\.o|familiya)/i.test(c[0])) return;
      rows.push({ _line: i + 1, fio: c[0], muassasa: c[1], mutaxassislik: c[2], daraja: darajaOf(c[3]), hudud: hudKey(c[4]), holat: holatOf(c[5]), ish_joyi: c[6] || '', lavozim: c[7] || '', ish_hududi: hudKey(c[8]) || (c[8] ? 'boshqa' : '') });
    });
    if (!rows.length) { flash('#imp-msg', 'Import qilinadigan qator topilmadi.', true); return; }
    $('#imp-go').disabled = true; flash('#imp-msg', 'Import qilinmoqda…');
    try {
      const j = await api('POST', '/api/import', { rows });
      flash('#imp-msg', fmt(j.ok) + ' ta yozuv saqlandi' + (j.badCount ? ', ' + fmt(j.badCount) + ' ta qator xato.' : '.'), !!j.badCount);
      const box = $('#imp-bad'); box.replaceChildren();
      (j.bad || []).forEach((b) => box.append(el('div', null, b.qator + '-qator: ' + b.xato)));
      if (j.ok) { $('#imp-text').value = ''; loadRecords(); }
    } catch (e) { flash('#imp-msg', e.message, true); }
    $('#imp-go').disabled = false;
  });

  $('#exp').addEventListener('click', () => {
    const head = ['FIO', 'Bitirgan muassasa', 'Mutaxassislik', 'Daraja', 'Yashash hududi', 'Holat', 'Ish joyi', 'Lavozim', 'Ish joyi hududi'];
    const rows = RECS.map((r) => [r.fio, r.muassasa, r.mutaxassislik, r.daraja, hName(r.hudud), r.holat, r.ish_joyi, r.lavozim, r.ish_hududi ? hName(r.ish_hududi) : '']);
    const csv = '﻿' + [head, ...rows].map((r) => r.map((x) => { const s = String(x == null ? '' : x); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
    const a = el('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'bitiruvchilar-2026.csv';
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  let REP = [];
  async function loadReport() {
    try { REP = (await api('GET', '/api/hisobot')).hududlar; } catch (e) { flash('#rep-msg', e.message, true); return; }
    const admin = ME.role === 'admin';
    $('#rep-save').hidden = !admin;
    const tb = $('#rep tbody'); tb.replaceChildren();
    REP.forEach((h) => {
      const tr = el('tr'); tr.append(el('td', null, h.name));
      ['jami', 'oliy', 'texnikum', 'ishda', 'oz_hududida', 'ishsiz'].forEach((k) => tr.append(el('td', 'num', fmt(h[k]))));
      const td = el('td', 'num');
      if (admin) { const i = el('input'); i.type = 'number'; i.min = '0'; i.step = '1'; i.value = h.bosh_shtat; i.setAttribute('aria-label', h.name + ' — boʻsh shtat'); i.addEventListener('input', () => { h.bosh_shtat = Math.max(0, Math.round(Number(i.value) || 0)); }); td.append(i); }
      else td.textContent = fmt(h.bosh_shtat);
      tr.append(td); tb.append(tr);
    });
    const s = (k) => REP.reduce((a, h) => a + (h[k] || 0), 0);
    const tf = $('#rep tfoot'); tf.replaceChildren();
    const tr = el('tr'); tr.append(el('td', null, 'Viloyat jami'));
    ['jami', 'oliy', 'texnikum', 'ishda', 'oz_hududida', 'ishsiz', 'bosh_shtat'].forEach((k) => tr.append(el('td', 'num', fmt(s(k)))));
    tf.append(tr);
  }
  $('#rep-save').addEventListener('click', async () => {
    try { await api('PUT', '/api/shtat', { items: REP.map((h) => ({ key: h.key, bosh_shtat: h.bosh_shtat })) }); flash('#rep-msg', 'Boʻsh shtatlar saqlandi.'); loadReport(); }
    catch (e) { flash('#rep-msg', e.message, true); }
  });
  $('#rep-copy').addEventListener('click', async () => {
    const text = REP.map((h) => [h.name, h.oliy, h.texnikum, h.ishda, h.oz_hududida, h.bosh_shtat].join('\t')).join('\n');
    try { await navigator.clipboard.writeText(text); flash('#rep-msg', 'Nusxalandi. Dashboard → «Maʼlumotlarni tahrirlash» → «Exceldan qoʻyish» ga qoʻying.'); }
    catch { const t = $('#rep-text'); t.hidden = false; t.value = text; t.select(); flash('#rep-msg', 'Belgilangan matnni Ctrl+C bilan nusxalang.', true); }
  });

  async function loadUsers() {
    let users = [];
    try { users = (await api('GET', '/api/users')).users; } catch (e) { flash('#u-msg', e.message, true); return; }
    const tb = $('#usr tbody'); tb.replaceChildren();
    users.forEach((u) => {
      const tr = el('tr');
      tr.append(el('td', 'nm', u.login), el('td', null, u.fio || '—'), el('td', null, u.role === 'admin' ? 'Administrator' : 'Operator'), el('td', null, u.role === 'admin' ? 'Barchasi' : (u.hudud ? hName(u.hudud) : 'Barchasi')));
      const st = el('td'); st.append(el('span', 'pill ' + (u.active ? 'ok' : 'bad'), u.active ? (u.mustChange ? 'Parol almashtirilmagan' : 'Faol') : 'Bloklangan')); tr.append(st);
      const act = el('td'); const row = el('div', 'row');
      if (u.id !== ME.id) {
        const b = el('button', 'btn', u.active ? 'Bloklash' : 'Faollashtirish'); b.type = 'button';
        b.addEventListener('click', async () => { try { await api('PUT', '/api/users/' + u.id, { active: !u.active }); loadUsers(); } catch (e) { flash('#u-msg', e.message, true); } });
        row.append(b);
      }
      const pw = el('input'); pw.type = 'text'; pw.placeholder = 'Yangi vaqtinchalik parol'; pw.setAttribute('aria-label', u.login + ' uchun yangi parol');
      const pb = el('button', 'btn', 'Parolni tiklash'); pb.type = 'button';
      pb.addEventListener('click', async () => { try { await api('PUT', '/api/users/' + u.id, { password: pw.value }); flash('#u-msg', u.login + ': parol tiklandi, birinchi kirishda almashtiriladi.'); pw.value = ''; loadUsers(); } catch (e) { flash('#u-msg', e.message, true); } });
      row.append(pw, pb); act.append(row); tr.append(act);
      tb.append(tr);
    });
  }
  $('#u-role').addEventListener('change', () => { $('#u-hudud').disabled = $('#u-role').value === 'admin'; });
  $('#u-add').addEventListener('click', async () => {
    $('#u-err').textContent = '';
    try {
      await api('POST', '/api/users', { login: $('#u-login').value.trim(), fio: $('#u-fio').value, password: $('#u-pass').value, role: $('#u-role').value, hudud: $('#u-hudud').value });
      flash('#u-msg', 'Foydalanuvchi qoʻshildi: ' + $('#u-login').value.trim()); ['#u-login', '#u-fio', '#u-pass'].forEach((s) => ($(s).value = '')); loadUsers();
    } catch (e) { $('#u-err').textContent = e.message; }
  });
})();

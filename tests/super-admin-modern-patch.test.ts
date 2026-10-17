import { describe, expect, test } from 'bun:test';
import { patchSuperAdminModernUi } from '../super-admin-modern-patch.ts';

describe('modern super admin shell patch',()=>{
  test('adds professional dashboard shell and converts raw settings JSON to cards',()=>{
    const input=`<!doctype html><html><head></head><body><div class="app"><aside class="side"><div class="brand">BUXORO SSB<br><small>Boshqaruv markazi</small></div><nav class="nav"><button data-nav="home" class="active">Bosh sahifa</button><button data-nav="settings">Sozlamalar</button></nav></aside><main class="main"><section data-panel="home" class="panel active"><div id="summary" class="grid"></div></section></main></div><script nonce="x">async function loadSettings(){const d=await fetch('/api/control/settings').then(r=>r.json());$('#settings').innerHTML='<pre>'+JSON.stringify(d,null,2)+'</pre>'}</script></body></html>`;
    const html=patchSuperAdminModernUi(input);
    expect(html).toContain('admin-shell-modern-v1');
    expect(html).toContain('BUXORO SSB · SUPERADMIN');
    expect(html).toContain('dashboard-hero');
    expect(html).toContain('settings-grid');
    expect(html).not.toContain('JSON.stringify(d,null,2)');
    expect(html).toContain('data-nav="settings"');
  });
  test('is idempotent',()=>{
    const input='<!doctype html><html><head></head><body></body></html>';
    const once=patchSuperAdminModernUi(input);
    expect(patchSuperAdminModernUi(once)).toBe(once);
  });
});

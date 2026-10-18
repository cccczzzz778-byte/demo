import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('leadership monitoring route contract',()=>{
  test('serves the approved monitoring template through the production entrypoint',()=>{
    const entry=readFileSync(new URL('../monitoring-entry.ts',import.meta.url),'utf8');
    const wrapper=readFileSync(new URL('../monitoring-route-wrapper.ts',import.meta.url),'utf8');
    const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
    expect(pkg.scripts.start).toBe('bun monitoring-entry.ts');
    expect(entry).toContain("import './monitoring-route-wrapper.ts';");
    expect(entry).toContain("await import('./super-admin-wrapper.ts');");
    expect(wrapper).toContain("import { prepareMonitoringDashboardHtml } from './monitoring-template.ts';");
    expect(wrapper).toContain('prepareMonitoringDashboardHtml(nonce)');
    expect(wrapper).toContain("pathname === '/leadership'");
    expect(wrapper).toContain("https://cdnjs.cloudflare.com");
    expect(wrapper).toContain("https://fonts.googleapis.com");
  });
});

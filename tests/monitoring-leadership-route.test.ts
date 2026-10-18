import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('leadership monitoring route contract',()=>{
  test('serves the approved monitoring template on leadership route',()=>{
    const src=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(src).toContain("import { prepareMonitoringDashboardHtml } from './monitoring-template.ts';");
    expect(src).toContain('prepareMonitoringDashboardHtml(nonce)');
    expect(src).toContain("pathname === '/leadership'");
  });
});

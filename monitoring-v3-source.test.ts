import { createHash } from 'node:crypto';
import { expect, test } from 'bun:test';
import { getMonitoringDashboardHtml, prepareMonitoringDashboardHtml } from './monitoring-template.ts';

test('embedded source is exactly the uploaded monitoring model', () => {
  const source = getMonitoringDashboardHtml();
  expect(createHash('sha256').update(source).digest('hex')).toBe('a81ffbf14f73a95cf65094ac9dbe4549fdfa462a80023e50fb7d965b6e060602');
  expect(source).toContain("BUXORO VILOYATI SOG'LIQNI SAQLASH TIZIMI");
  expect(source).toContain('id="M"');
  expect(source).toContain('id="R"');
});

test('production preparation adds local Three.js plus TV and presentation controls', () => {
  const html = prepareMonitoringDashboardHtml('test-nonce');
  expect(html).toContain('/assets/three-r128.min.js');
  expect(html).toContain('id="tvModeBtn"');
  expect(html).toContain('id="presentationModeBtn"');
  expect(html).toContain('PRESENTATION_INTERVAL_MS=10000');
  expect(html).toContain('nonce="test-nonce"');
  expect(html).not.toContain('__CSP_NONCE__');
});

import { expect, test } from 'bun:test';
import { prepareMonitoringV3Html } from './monitoring-template-v3.ts';

test('uploaded monitoring dashboard is the production leadership template', () => {
  const html = prepareMonitoringV3Html('test-nonce');
  expect(html).toContain("BUXORO VILOYATI SOG'LIQNI SAQLASH TIZIMI");
  expect(html).toContain('id="M"');
  expect(html).toContain('id="R"');
  expect(html).toContain('/assets/three-r128.min.js');
  expect(html).toContain('id="bTv"');
  expect(html).toContain('id="bPresent"');
  expect(html).toContain('setInterval(presentationStep,10000)');
  expect(html).toContain('nonce="test-nonce"');
  expect(html).not.toContain('__CSP_NONCE__');
});

import { describe, expect, test } from 'bun:test';
import { getMonitoringDashboardHtml, prepareMonitoringDashboardHtml } from '../monitoring-template.ts';

describe('monitoring dashboard template', () => {
  test('contains the approved 3D monitoring sections', () => {
    const html = getMonitoringDashboardHtml();
    expect(html).toContain('Buxoro viloyati tibbiyot muassasalari monitoringi');
    expect(html).toContain('Aholi va demografiya');
    expect(html).toContain('Muassasalar va o\'rinlar');
    expect(html).toContain('Kadrlar');
    expect(html).toContain('Ona va bola');
    expect(html).toContain('Kasallanish');
    expect(html).toContain('Profilaktika va skrining');
    expect(html).toContain('Tez tibbiy yordam');
    expect(html).toContain('three.min.js');
  });

  test('prepares the page for strict CSP with the response nonce', () => {
    const html = prepareMonitoringDashboardHtml('nonce123');
    expect(html).toContain('BUXORO_SSB_MONITORING_TEMPLATE_V1');
    expect(html).toContain('<style nonce="nonce123">');
    expect(html).toContain('<script nonce="nonce123" src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>');
    expect(html).toContain('<script nonce="nonce123">');
  });
});

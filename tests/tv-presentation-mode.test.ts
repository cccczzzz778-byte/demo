import { describe, expect, test } from 'bun:test';
import { prepareMonitoringDashboardHtml } from '../monitoring-template.ts';

describe('leadership TV and presentation modes',()=>{
  test('renders TV and presentation controls',()=>{
    const html=prepareMonitoringDashboardHtml('test-nonce');
    expect(html).toContain('id="tvModeBtn"');
    expect(html).toContain('id="presentationModeBtn"');
    expect(html).toContain('id="normalModeBtn"');
    expect(html).toContain('TV rejim');
    expect(html).toContain('Taqdimot');
  });

  test('includes mode layout and automatic presentation rotation',()=>{
    const html=prepareMonitoringDashboardHtml('test-nonce');
    expect(html).toContain('dashboard-tv-mode');
    expect(html).toContain('dashboard-presentation-mode');
    expect(html).toContain('PRESENTATION_INTERVAL_MS=10000');
    expect(html).toContain('requestFullscreen');
    expect(html).toContain('presentationTimer');
    expect(html).toContain("addEventListener('keydown'");
  });
});

import { describe, expect, test } from 'bun:test';
import { prepareMonitoringDashboardHtml } from '../monitoring-template.ts';
import { patchTvPresentationMode } from '../tv-presentation-mode-patch.ts';

const render=()=>patchTvPresentationMode(prepareMonitoringDashboardHtml('test-nonce'),'test-nonce');

describe('leadership TV and presentation modes',()=>{
  test('renders TV and presentation controls',()=>{
    const html=render();
    expect(html).toContain('id="tvModeBtn"');
    expect(html).toContain('id="presentationModeBtn"');
    expect(html).toContain('id="normalModeBtn"');
    expect(html).toContain('TV rejim');
    expect(html).toContain('Taqdimot');
  });

  test('includes mode layout and automatic presentation rotation',()=>{
    const html=render();
    expect(html).toContain('dashboard-tv-mode');
    expect(html).toContain('dashboard-presentation-mode');
    expect(html).toContain('PRESENTATION_INTERVAL_MS=10000');
    expect(html).toContain('requestFullscreen');
    expect(html).toContain('presentationTimer');
    expect(html).toContain("addEventListener('keydown'");
  });

  test('uses the route CSP nonce for injected style and script',()=>{
    const html=render();
    expect(html).toContain('<style nonce="test-nonce" data-patch="BUXORO_TV_PRESENTATION_MODE_V1">');
    expect(html).toContain('<script nonce="test-nonce" data-patch="BUXORO_TV_PRESENTATION_MODE_V1">');
  });
});

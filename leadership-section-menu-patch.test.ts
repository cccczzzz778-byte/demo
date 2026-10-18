import { describe, expect, test } from 'bun:test';
import { patchLeadershipSectionMenu } from './leadership-section-menu-patch.ts';

describe('leadership section menu patch', () => {
  const src='</style><script>const DI=[];let mode="ov",cur=null;function renderOv(){} function renderUnit(u){} function home(){} home();fly=false;loop();</script>';

  test('adds a compact premium section menu and concise side-panel summaries', () => {
    const out=patchLeadershipSectionMenu(src);
    expect(out).toContain('BUXORO_SECTION_MENU_V3');
    expect(out).toContain('Muassasalar');
    expect(out).toContain('Kadrlar');
    expect(out).toContain('Demografiya');
    expect(out).toContain('Ona va bola');
    expect(out).toContain('Kasallanish');
    expect(out).toContain('Skrining');
    expect(out).toContain('Maxsus yo‘nalishlar');
    expect(out).toContain('Tez yordam / infratuzilma');
    expect(out).toContain('Murojaatlar');
    expect(out).toContain('sf-summary-card');
    expect(out).toContain('sf-value');
    expect(out).toContain('Batafsil');
    expect(out).toContain('sfOpenDetail');
    expect(out).toContain('.section-filtered #L,.section-filtered #R{display:block!important');
  });

  test('filters 3D facility layers by section', () => {
    const out=patchLeadershipSectionMenu(src);
    expect(out).toContain("sec==='muassasa'");
    expect(out).toContain("sec==='kadrlar'");
    expect(out).toContain("['TTB','SHTB','KTMP']");
    expect(out).toContain('I.mesh.visible=v');
  });

  test('is idempotent', () => {
    const once=patchLeadershipSectionMenu(src);
    expect(patchLeadershipSectionMenu(once)).toBe(once);
  });
});

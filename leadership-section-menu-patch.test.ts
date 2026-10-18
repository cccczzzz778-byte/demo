import { describe, expect, test } from 'bun:test';
import { patchLeadershipSectionMenu } from './leadership-section-menu-patch.ts';

describe('leadership section menu patch', () => {
  const src='</style><script>const DI=[];let mode="ov",cur=null;function renderOv(){} function renderUnit(u){} function home(){} function selectUnit(k){} home();fly=false;loop();</script>';

  test('adds top section menu without replacing the premium side-panel layout', () => {
    const out=patchLeadershipSectionMenu(src);
    expect(out).toContain('BUXORO_SECTION_MENU_V2');
    expect(out).toContain('Umumiy');
    expect(out).toContain('Muassasalar');
    expect(out).toContain('Kadrlar');
    expect(out).toContain('Demografiya');
    expect(out).toContain('Ona va bola');
    expect(out).toContain('Kasallanish');
    expect(out).toContain('Skrining');
    expect(out).toContain('Maxsus yo‘nalishlar');
    expect(out).toContain('Tez yordam / infratuzilma');
    expect(out).toContain('Murojaatlar');
    expect(out).toContain('sfRenderIntoMainPanels');
    expect(out).toContain('.section-filtered #L,.section-filtered #R{display:block!important');
    expect(out).not.toContain('className=\'sf-panel left\'');
    expect(out).not.toContain('className=\'sf-panel right\'');
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

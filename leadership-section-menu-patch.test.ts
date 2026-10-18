import { describe, expect, test } from 'bun:test';
import { patchLeadershipSectionMenu } from './leadership-section-menu-patch.ts';

describe('leadership section menu patch', () => {
  const src='</style><script>const DI=[];let mode="ov",cur=null;function renderOv(){} function renderUnit(u){} function home(){} function selectUnit(k){} home();fly=false;loop();</script>';

  test('adds top section menu and filtered statistic panels', () => {
    const out=patchLeadershipSectionMenu(src);
    expect(out).toContain('BUXORO_SECTION_MENU_V1');
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
    expect(out).toContain('FULL_STAT_DATA');
    expect(out).toContain('section-filtered');
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

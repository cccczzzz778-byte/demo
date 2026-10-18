import { describe, expect, test } from 'bun:test';
import { patchLeadershipDistrictCommandCenter } from './leadership-district-command-center-patch.ts';

const fixture = `<!doctype html><style>body{}</style><script>
function renderUnit(u){Lp.innerHTML='old';Rp.innerHTML='old'}
function home(){}
home();fly=false;loop();
</script>`;

describe('district command center patch', () => {
  test('injects approved district medical dashboard layout and compact legend', () => {
    const out = patchLeadershipDistrictCommandCenter(fixture);
    expect(out).toContain('BUXORO_DISTRICT_COMMAND_CENTER_V1');
    expect(out).toContain('HUDUD DASHBOARDI');
    expect(out).toContain('2025 → 2026 o‘zgarishlar');
    expect(out).toContain('Shifokorlar soni bo‘yicha TOP 8');
    expect(out).toContain('Belgilar');
    expect(out).toContain('Asosiy tibbiy ko‘rsatkichlar');
    expect(out).toContain('const _dccRenderUnit=renderUnit');
  });

  test('is idempotent', () => {
    const once = patchLeadershipDistrictCommandCenter(fixture);
    expect(patchLeadershipDistrictCommandCenter(once)).toBe(once);
  });
});

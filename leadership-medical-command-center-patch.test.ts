import { describe, expect, test } from 'bun:test';
import { patchLeadershipMedicalCommandCenter } from './leadership-medical-command-center-patch.ts';

const fixture = `<!doctype html><style>body{}</style><script>
let Lp={innerHTML:''},Rp={innerHTML:''};
function renderOv(){Lp.innerHTML='old-left';Rp.innerHTML='old-right'}
function renderUnit(u){}
function home(){}
home();fly=false;loop();
</script>`;

describe('medical command center patch', () => {
  test('injects approved province medical statistics UI without replacing district drilldown', () => {
    const out = patchLeadershipMedicalCommandCenter(fixture);
    expect(out).toContain('BUXORO_MEDICAL_COMMAND_CENTER_V1');
    expect(out).toContain('Asosiy tibbiy ko‘rsatkichlar');
    expect(out).toContain('Shifokorlar soni bo‘yicha TOP 8');
    expect(out).toContain('Shifo o‘rinlari bo‘yicha TOP 8');
    expect(out).toContain('AI prognoz');
    expect(out).toContain('const _mccRenderOv=renderOv');
    expect(out).not.toContain('renderUnit=function');
  });

  test('is idempotent', () => {
    const once = patchLeadershipMedicalCommandCenter(fixture);
    expect(patchLeadershipMedicalCommandCenter(once)).toBe(once);
  });
});

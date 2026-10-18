import { describe, expect, test } from 'bun:test';
import { patchLeadershipReferenceLayout } from './leadership-reference-layout-patch.ts';

const fixture = `<!doctype html><style>body{}</style><script>
let Lp={innerHTML:''},Rp={innerHTML:''},lgE={innerHTML:''};
let lbs=[],detM=[],rdG=172,phG=.84,fly=false,tgG={set(){}};
let U2={},UL=[];
function renderUnit(u){}
function home(){}
function hsFind(){return null}
function dccHistFor(){return null}
function dccRight(){return ''}
function dccEnsure(){}
function dccKpi(){return ''}
function dccRate(){return 0}
home();fly=false;loop();
</script>`;

describe('approved reference layout patch', () => {
  test('adds district reference sizing, real KPI layout and map focus behavior', () => {
    const out = patchLeadershipReferenceLayout(fixture);
    expect(out).toContain('BUXORO_REFERENCE_LAYOUT_V1');
    expect(out).toContain('width:404px');
    expect(out).toContain('grid-template-columns:repeat(5,minmax(0,1fr))');
    expect(out).toContain('Vrach / 10 ming');
    expect(out).toContain('O‘TX / 10 ming');
    expect(out).toContain('O‘rin / 10 ming');
    expect(out).toContain('rdG=145');
    expect(out).toContain("l.g='__ref_hidden'");
  });

  test('is idempotent', () => {
    const once = patchLeadershipReferenceLayout(fixture);
    expect(patchLeadershipReferenceLayout(once)).toBe(once);
  });
});

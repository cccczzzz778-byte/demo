import { describe, expect, test } from 'bun:test';
import { patchLeadershipMedicalLayoutFix } from './leadership-medical-layout-fix-patch.ts';

const fixture='<!doctype html><style>body{}</style><script>function selectUnit(key){} home();fly=false;loop();</script>';

describe('medical dashboard layout fix',()=>{
  test('reserves a clear bottom zone and prevents TV mode from shrinking side panels',()=>{
    const out=patchLeadershipMedicalLayoutFix(fixture);
    expect(out).toContain('.medical-command-center .btns{bottom:102px!important');
    expect(out).toContain('body.tv-mode.medical-command-center #L');
    expect(out).toContain('width:350px!important');
    expect(out).toContain('#mcc-bottom{grid-template-columns:minmax(0,1fr) 360px');
    expect(out).toContain('.mcc-ai-grid{grid-template-columns:repeat(4,minmax(0,1fr))');
  });

  test('district selection removes province-only bottom command strip',()=>{
    const out=patchLeadershipMedicalLayoutFix(fixture);
    expect(out).toContain('const _mccLayoutSelectUnit=selectUnit');
    expect(out).toContain("document.getElementById('mcc-bottom')?.remove()");
    expect(out).toContain("document.body.classList.remove('medical-command-center')");
  });
});

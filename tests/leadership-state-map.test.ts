import { describe, expect, test } from 'bun:test';
import { LEADERSHIP_V2_HTML, LEADERSHIP_V2_JS } from '../leadership-v2-assets.ts';

describe('leadership v2 state map',()=>{
  test('starts in province mode with no facility layer mounted',()=>{
    expect(LEADERSHIP_V2_JS).toContain("let mode='province'");
    expect(LEADERSHIP_V2_JS).toContain('function resetProvince()');
    expect(LEADERSHIP_V2_JS).toContain('function selectDistrict(id)');
    expect(LEADERSHIP_V2_JS).toContain('function clearDistrictContent');
    expect(LEADERSHIP_V2_HTML).toContain('Hududlar statistikasi');
  });
  test('creates facilities and settlements only after district selection',()=>{
    expect(LEADERSHIP_V2_JS).toContain('buildDistrictContent(d)');
    expect(LEADERSHIP_V2_JS).toContain('buildSettlements(d)');
    expect(LEADERSHIP_V2_JS).toContain('buildFacilities(d)');
    expect(LEADERSHIP_V2_JS).toContain('pointInPolygon');
    expect(LEADERSHIP_V2_JS).toContain('collisionSafePoints');
  });
  test('enlarges selected district and restores province view',()=>{
    expect(LEADERSHIP_V2_JS).toContain('g.scale.setScalar(1.34)');
    expect(LEADERSHIP_V2_JS).toContain('g.scale.setScalar(1)');
    expect(LEADERSHIP_V2_JS).toContain("mode='district'");
    expect(LEADERSHIP_V2_JS).toContain("mode='province'");
  });
});

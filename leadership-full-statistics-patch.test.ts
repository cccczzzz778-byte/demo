import { describe, expect, test } from 'bun:test';
import { patchLeadershipFullStatistics } from './leadership-full-statistics-patch.ts';

describe('leadership full statistics patch', () => {
  test('adds full statistics drawer with year tabs and search', () => {
    const src='</style><div class="btns"></div><script>home();fly=false;loop();</script>';
    const out=patchLeadershipFullStatistics(src);
    expect(out).toContain('BUXORO_FULL_STATISTICS_V1');
    expect(out).toContain('To‘liq statistika');
    expect(out).toContain('data-stat-year="2025"');
    expect(out).toContain('data-stat-year="2024"');
    expect(out).toContain('statSearch');
    expect(out).toContain('statRegion');
  });

  test('is idempotent', () => {
    const src='</style><div class="btns"></div><script>home();fly=false;loop();</script>';
    const once=patchLeadershipFullStatistics(src);
    expect(patchLeadershipFullStatistics(once)).toBe(once);
  });
});

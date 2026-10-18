import { expect, test } from 'bun:test';
import { buildForecast } from './forecast-engine.ts';

test('projects 2026 year-end and 2027 from half-year demographic values', () => {
  const out = buildForecast({
    name: 'Test hudud',
    y2025: { pop: 100000, birth: 1000, death: 400, growth: 600 },
    y2026: { pop: 102000, birth: 1100, death: 420, growth: 680 },
  });
  expect(out.yearEnd2026.birth).toBe(2200);
  expect(out.yearEnd2026.death).toBe(840);
  expect(out.yearEnd2026.growth).toBe(1360);
  expect(out.y2027.birth).toBeGreaterThan(2200);
  expect(out.confidence).toBe('past');
});

test('flags weakening natural growth as attention', () => {
  const out = buildForecast({
    name: 'Test hudud',
    y2025: { pop: 100000, birth: 1200, death: 300, growth: 900 },
    y2026: { pop: 100500, birth: 900, death: 420, growth: 480 },
  });
  expect(out.status).toBe('attention');
});

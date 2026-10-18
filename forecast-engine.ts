export type DemoYear = { pop: number; birth: number; death: number; growth: number };
export type ForecastInput = { name: string; y2025: DemoYear; y2026: DemoYear };

function pct(a: number, b: number) {
  if (!a) return 0;
  return (b - a) / a;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function buildForecast(input: ForecastInput) {
  const birthTrend = clamp(pct(input.y2025.birth, input.y2026.birth), -0.35, 0.35);
  const deathTrend = clamp(pct(input.y2025.death, input.y2026.death), -0.35, 0.35);
  const growthTrend = clamp(pct(input.y2025.growth, input.y2026.growth), -0.5, 0.5);
  const popTrend = clamp(pct(input.y2025.pop, input.y2026.pop), -0.1, 0.1);

  const yearEnd2026 = {
    pop: Math.round(input.y2026.pop),
    birth: Math.round(input.y2026.birth * 2),
    death: Math.round(input.y2026.death * 2),
    growth: Math.round(input.y2026.growth * 2),
  };

  const y2027 = {
    pop: Math.round(yearEnd2026.pop * (1 + popTrend)),
    birth: Math.round(yearEnd2026.birth * (1 + birthTrend)),
    death: Math.round(yearEnd2026.death * (1 + deathTrend)),
    growth: Math.round(yearEnd2026.growth * (1 + growthTrend)),
  };

  const status = growthTrend < -0.12 || deathTrend > 0.12 ? 'attention' : growthTrend > 0.08 && deathTrend <= 0.08 ? 'positive' : 'stable';
  return {
    name: input.name,
    yearEnd2026,
    y2027,
    trends: { birth: birthTrend, death: deathTrend, growth: growthTrend, pop: popTrend },
    status,
    confidence: 'past' as const,
  };
}

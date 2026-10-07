import { samplePlan } from '../domain/sample';
import { drawPlan, exportScale } from './exportPng';

function fakeCtx() {
  const texts: string[] = [];
  const target: Record<string | symbol, unknown> = {};
  const ctx = new Proxy(target, {
    get(t, k) {
      if (k === 'fillText') return (s: string) => texts.push(s);
      if (k === 'measureText') return (s: string) => ({ width: s.length * 7 });
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, texts };
}

describe('exportScale', () => {
  it('targets ~6000 px on the long side within 10–60 px/m', () => {
    expect(exportScale(30, 22)).toBe(60);
    expect(exportScale(200, 100)).toBe(30);
    expect(exportScale(500, 10)).toBe(12);
  });
});

describe('drawPlan', () => {
  it('draws labels, boundary dimensions, footer and scale bar', () => {
    const { ctx, texts } = fakeCtx();
    drawPlan(ctx, samplePlan(), null, 60, 1912, 1462, '2026-10-05');
    expect(texts).toContain('Plan ogrodu · działka 508 m² · 2026-10-05');
    expect(texts).toContain('26,50 m');
    expect(texts).toContain('Dom');
    expect(texts).toContain('88,0 m²');
    expect(texts).toContain('Klon');
    expect(texts).toContain('5 m');
    expect(texts).toContain('30');
  });
  it('omits the plot area in the footer when there is no boundary', () => {
    const { ctx, texts } = fakeCtx();
    drawPlan(ctx, { W: 10, H: 10, shapes: [], bg: null }, null, 60, 712, 742, '2026-10-05');
    expect(texts).toContain('Plan ogrodu · 2026-10-05');
  });
});

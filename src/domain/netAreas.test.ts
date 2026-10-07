import { netAreas, summarize, summaryRows } from './netAreas';
import { samplePlan } from './sample';
import type { Shape } from './types';

const rect = (id: string, type: 'boundary' | 'grass' | 'house' | 'paving', x0: number, y0: number, x1: number, y1: number): Shape =>
  ({ id, type, pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] });

describe('netAreas — reference values from the prototype (PRD 6.8)', () => {
  const net = netAreas(samplePlan().shapes);
  it.each([
    ['grass', 338.44],
    ['paving', 48.8],
    ['gravel', 6],
    ['bed', 27.2],
    ['house', 88],
  ] as const)('%s = %f m²', (k, v) => {
    expect(net[k]).toBeCloseTo(v, 2);
  });
  it('nothing left unassigned', () => {
    expect(net.free).toBeLessThan(0.05);
  });
});

describe('netAreas — rules', () => {
  it('higher layer covers lower one inside the boundary', () => {
    const net = netAreas([rect('b', 'boundary', 0, 0, 10, 10), rect('g', 'grass', 0, 0, 10, 10), rect('h', 'house', 0, 0, 5, 10)]);
    expect(net.grass).toBeCloseTo(50, 1);
    expect(net.house).toBeCloseTo(50, 1);
    expect(net.free).toBeCloseTo(0, 5);
  });
  it('area outside the boundary is ignored, empty part counts as free', () => {
    const net = netAreas([rect('b', 'boundary', 0, 0, 10, 10), rect('g', 'grass', 5, 0, 15, 10)]);
    expect(net.grass).toBeCloseTo(50, 1);
    expect(net.free).toBeCloseTo(50, 1);
  });
  it('without a boundary it uses the bbox of all areas', () => {
    const net = netAreas([rect('g', 'grass', 0, 0, 10, 10)]);
    expect(net.grass).toBeCloseTo(100, 1);
  });
  it('empty plan', () => {
    expect(netAreas([])).toEqual({ free: 0 });
  });
});

describe('summarize / summaryRows', () => {
  it('sample plan', () => {
    const s = summarize(samplePlan().shapes);
    expect(s.plot).toBeCloseTo(508.25, 6);
    expect(s.pbc).toBe(72);
    expect(s.counts).toEqual({ tree: 2, conifer: 3, shrub: 3 });
    expect(summaryRows(s)).toEqual([
      { key: 'grass', label: 'Trawnik', value: '338 m²' },
      { key: 'paving', label: 'Kostka brukowa', value: '48,8 m²' },
      { key: 'gravel', label: 'Żwir', value: '6,0 m²' },
      { key: 'bed', label: 'Rabata', value: '27,2 m²' },
      { key: 'house', label: 'Dom / budynek', value: '88,0 m²' },
      { key: 'tree', label: 'Drzewo liściaste', value: '2 szt.' },
      { key: 'conifer', label: 'Iglak', value: '3 szt.' },
      { key: 'shrub', label: 'Krzew', value: '3 szt.' },
    ]);
  });
  it('shows unassigned area only when there is a plot', () => {
    const withPlot = summarize([rect('b', 'boundary', 0, 0, 10, 10), rect('g', 'grass', 0, 0, 5, 10)]);
    expect(summaryRows(withPlot).map((r) => r.label)).toEqual(['Trawnik', 'Niezagospodarowane']);
    expect(withPlot.pbc).toBe(50);
  });
  it('no plot → pbc null', () => {
    expect(summarize([rect('g', 'grass', 0, 0, 5, 5)]).pbc).toBeNull();
  });
});

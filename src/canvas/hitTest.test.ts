import { samplePlan } from '../domain/sample';
import type { Shape } from '../domain/types';
import { hitTest } from './hitTest';

const shapes = samplePlan().shapes;
const hit = (x: number, y: number, list: Shape[] = shapes) => hitTest(list, [x, y], 28)?.id ?? null;

describe('hitTest (PRD F-4.1)', () => {
  it('plants win over areas', () => expect(hit(24, 7)).toBe('t2'));
  it('topmost area wins', () => expect(hit(11.5, 8)).toBe('h1'));
  it('boundary is hit near its edge', () => expect(hit(10, 1.25)).toBe('b1'));
  it('inside boundary but away from the edge hits the area below', () => expect(hit(12, 18)).toBe('g1'));
  it('outside everything', () => expect(hit(29, 21.5)).toBeNull());
  it('later shape wins on the same layer', () => {
    const a: Shape = { id: 'a', type: 'paving', pts: [[0, 0], [4, 0], [4, 4], [0, 4]] };
    const b: Shape = { id: 'b', type: 'gravel', pts: [[0, 0], [4, 0], [4, 4], [0, 4]] };
    expect(hit(2, 2, [a, b])).toBe('b');
    expect(hit(2, 2, [b, a])).toBe('a');
  });
  it('small plants are clickable within 8 px', () => {
    const s: Shape = { id: 's', type: 'shrub', x: 5, y: 5, r: 0.1 };
    expect(hit(5.25, 5, [s])).toBe('s');
  });
});

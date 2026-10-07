import { samplePlan } from '../domain/sample';
import type { PolyShape } from '../domain/types';
import { makeState } from '../test/factories';
import { doubleClick, pointerDown, pointerMove, pointerUp, type Drag } from './pointer';

const ids = () => 'n1';
const sample = (ui = {}) => makeState({ plan: { shapes: samplePlan().shapes }, ui });
const bg = { src: 'data:image/png;base64,A', x: 2, y: 3, w: 20, aspect: 0.5, opacity: 0.6, visible: true };
const house = samplePlan().shapes.find((x) => x.id === 'h1') as PolyShape;

describe('select tool', () => {
  it('click on a shape selects it and starts a move drag', () => {
    const r = pointerDown(sample(), [11.5, 8], ids);
    expect(r.actions).toEqual([{ type: 'ui/select', id: 'h1' }]);
    expect(r.drag).toEqual({ kind: 'move', id: 'h1', start: [11.5, 8], orig: house, pushed: false });
    expect(r.capture).toBe(true);
  });
  it('click on empty space clears selection', () => {
    const r = pointerDown(sample({ sel: 'h1' }), [29, 21.5], ids);
    expect(r.actions).toEqual([{ type: 'ui/select', id: null }]);
    expect(r.drag).toBeNull();
  });
  it('grabbing a vertex of the selected polygon starts a vertex drag', () => {
    const r = pointerDown(sample({ sel: 'h1' }), [6.1, 4.1], ids);
    expect(r.drag).toEqual({ kind: 'vertex', id: 'h1', index: 0, pushed: false });
    expect(r.actions).toEqual([]);
  });
  it('moving pushes history once and moves by snapped delta', () => {
    const drag: Drag = { kind: 'move', id: 'h1', start: [11.5, 8], orig: house, pushed: false };
    const r1 = pointerMove(sample(), [13.7, 8.2], drag);
    expect(r1.actions[0]).toEqual({ type: 'plan/checkpoint' });
    expect(r1.actions[1]).toEqual({ type: 'plan/replace', id: 'h1', shape: { ...house, pts: [[8, 4], [19, 4], [19, 12], [8, 12]] } });
    expect(r1.drag).toMatchObject({ pushed: true });
    const r2 = pointerMove(sample(), [14, 8], r1.drag);
    expect(r2.actions.some((a) => a.type === 'plan/checkpoint')).toBe(false);
  });
  it('vertex drag moves one snapped vertex', () => {
    const drag: Drag = { kind: 'vertex', id: 'h1', index: 2, pushed: true };
    const r = pointerMove(sample(), [18.2, 13.9], drag);
    expect(r.actions[0]).toEqual({ type: 'plan/moveVertex', id: 'h1', index: 2, pt: [18, 14] });
  });
  it('double-click near an edge of the selected polygon inserts a vertex', () => {
    expect(doubleClick(sample({ sel: 'h1' }), [10.2, 4.1], ids)).toEqual([{ type: 'plan/insertVertex', id: 'h1', after: 0, pt: [10, 4] }]);
    expect(doubleClick(sample({ sel: 'h1' }), [10, 8], ids)).toEqual([]);
  });
});

describe('drawing areas', () => {
  it('click adds a snapped draft point', () => {
    const r = pointerDown(makeState({ ui: { tool: 'grass' } }), [1.26, 1.74], ids);
    expect(r.actions).toEqual([{ type: 'ui/draftAdd', pt: [1.5, 1.5] }]);
  });
  it('a point within 5 mm of the previous one is ignored', () => {
    const r = pointerDown(makeState({ ui: { tool: 'grass', draft: [[1, 1]] } }), [1.1, 1.1], ids);
    expect(r.actions).toEqual([]);
  });
  it('clicking the first point closes the shape when there are 3+ points', () => {
    const draft: [number, number][] = [[1, 1], [5, 1], [5, 4]];
    const r = pointerDown(makeState({ ui: { tool: 'bed', draft } }), [1.1, 1.05], ids);
    expect(r.actions).toEqual([{ type: 'plan/add', shape: { id: 'n1', type: 'bed', pts: draft } }]);
  });
  it('double-click closes the draft', () => {
    const draft: [number, number][] = [[1, 1], [5, 1], [5, 4]];
    expect(doubleClick(makeState({ ui: { tool: 'bed', draft } }), [5, 4], ids)).toEqual([
      { type: 'plan/add', shape: { id: 'n1', type: 'bed', pts: draft } },
    ]);
    expect(doubleClick(makeState({ ui: { tool: 'bed', draft: [[1, 1]] } }), [5, 4], ids)).toEqual([]);
  });
  it('hover while drawing uses angle snap', () => {
    const r = pointerMove(makeState({ ui: { tool: 'grass', draft: [[0, 0]], angleSnap: true } }), [10, 0.9], null);
    expect(r.actions).toEqual([{ type: 'ui/hover', pt: [10, 0] }]);
  });
  it('rectangle: press sets the start, release adds the rectangle', () => {
    const s = makeState({ ui: { tool: 'house', mode: 'rect' } });
    const down = pointerDown(s, [1.1, 0.9], ids);
    expect(down.actions).toEqual([{ type: 'ui/rectStart', pt: [1, 1] }, { type: 'ui/hover', pt: [1, 1] }]);
    const up = pointerUp(makeState({ ui: { tool: 'house', mode: 'rect', rectStart: [1, 1] } }), [4.1, 3.2], ids);
    expect(up).toEqual([
      { type: 'ui/rectStart', pt: null },
      { type: 'plan/add', shape: { id: 'n1', type: 'house', pts: [[1, 1], [4, 1], [4, 3], [1, 3]] } },
    ]);
  });
  it('a rectangle thinner than 0.1 m is cancelled', () => {
    const up = pointerUp(makeState({ ui: { tool: 'house', mode: 'rect', rectStart: [1, 1] } }), [4, 1], ids);
    expect(up).toEqual([{ type: 'ui/rectStart', pt: null }]);
  });
});

describe('plants', () => {
  it('click plants with the default radius and keeps the tool', () => {
    const r = pointerDown(makeState({ ui: { tool: 'conifer' } }), [3.3, 4.6], ids);
    expect(r.actions).toEqual([{ type: 'plan/add', shape: { id: 'n1', type: 'conifer', x: 3.5, y: 4.5, r: 1 }, keepTool: true }]);
  });
});

describe('background', () => {
  it('calibration click records a point rounded to mm', () => {
    const r = pointerDown(makeState({ plan: { bg }, ui: { bgMode: 'calib' } }), [1.23456, 2.34567], ids);
    expect(r.actions).toEqual([{ type: 'ui/calibClick', pt: [1.235, 2.346] }]);
  });
  it('move mode drags the background', () => {
    const s = makeState({ plan: { bg }, ui: { bgMode: 'move' } });
    const down = pointerDown(s, [5, 5], ids);
    expect(down.drag).toEqual({ kind: 'bg', start: [5, 5], orig: { x: 2, y: 3 } });
    const mv = pointerMove(s, [6.5, 4], down.drag);
    expect(mv.actions[0]).toEqual({ type: 'plan/patchBackground', patch: { x: 3.5, y: 2 } });
  });
});

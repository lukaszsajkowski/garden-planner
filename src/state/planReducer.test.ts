import { samplePlan } from '../domain/sample';
import type { PointShape, PolyShape, Shape } from '../domain/types';
import { pushPast } from './history';
import { planReducer, type DocState } from './planReducer';

const poly: PolyShape = { id: 'a', type: 'grass', pts: [[0, 0], [4, 0], [4, 3], [0, 3]] };
const tree: PointShape = { id: 't', type: 'tree', x: 5, y: 5, r: 2.5 };
const doc = (shapes: Shape[] = [poly, tree]): DocState => ({ plan: { W: 30, H: 22, shapes, bg: null }, past: [] });
const find = (s: DocState, id: string) => s.plan.shapes.find((x) => x.id === id);

describe('history', () => {
  it('keeps at most 80 snapshots, dropping the oldest', () => {
    let past: Shape[][] = [];
    for (let i = 0; i < 85; i++) past = pushPast(past, [{ ...tree, id: 's' + i }]);
    expect(past).toHaveLength(80);
    expect(past[0][0].id).toBe('s5');
  });
});

describe('planReducer', () => {
  it('add appends and records history', () => {
    const s = planReducer(doc([]), { type: 'plan/add', shape: tree });
    expect(s.plan.shapes).toEqual([tree]);
    expect(s.past).toEqual([[]]);
  });

  it('update and replace do not record', () => {
    let s = planReducer(doc(), { type: 'plan/update', id: 'a', patch: { name: 'Przód' } });
    expect(find(s, 'a')?.name).toBe('Przód');
    s = planReducer(s, { type: 'plan/replace', id: 't', shape: { ...tree, x: 9 } });
    expect((find(s, 't') as PointShape).x).toBe(9);
    expect(s.past).toEqual([]);
  });

  it('unknown id returns the same state object', () => {
    const s0 = doc();
    expect(planReducer(s0, { type: 'plan/update', id: 'nope', patch: { name: 'x' } })).toBe(s0);
    expect(planReducer(s0, { type: 'plan/remove', id: 'nope' })).toBe(s0);
  });

  it('remove records', () => {
    const s = planReducer(doc(), { type: 'plan/remove', id: 'a' });
    expect(s.plan.shapes).toEqual([tree]);
    expect(s.past).toHaveLength(1);
  });

  it('duplicate offsets by +1 m and records', () => {
    let s = planReducer(doc(), { type: 'plan/duplicate', id: 'a', newId: 'a2' });
    expect(find(s, 'a2')).toEqual({ id: 'a2', type: 'grass', pts: [[1, 1], [5, 1], [5, 4], [1, 4]] });
    s = planReducer(s, { type: 'plan/duplicate', id: 't', newId: 't2' });
    expect(find(s, 't2')).toEqual({ ...tree, id: 't2', x: 6, y: 6 });
    expect(s.past).toHaveLength(2);
  });

  it('setType stays within kind; default radius follows the new type', () => {
    const s0 = doc();
    expect(planReducer(s0, { type: 'plan/setType', id: 'a', shapeType: 'tree' })).toBe(s0);
    let s = planReducer(s0, { type: 'plan/setType', id: 't', shapeType: 'shrub' });
    expect(find(s, 't')).toMatchObject({ type: 'shrub', r: 0.6 });
    s = planReducer(doc([{ ...tree, r: 3 }]), { type: 'plan/setType', id: 't', shapeType: 'conifer' });
    expect(find(s, 't')).toMatchObject({ type: 'conifer', r: 3 });
    s = planReducer(s0, { type: 'plan/setType', id: 'a', shapeType: 'paving' });
    expect(find(s, 'a')?.type).toBe('paving');
    expect(s.past).toHaveLength(1);
  });

  it('vertex operations', () => {
    let s = planReducer(doc(), { type: 'plan/moveVertex', id: 'a', index: 0, pt: [1, 1] });
    expect((find(s, 'a') as PolyShape).pts[0]).toEqual([1, 1]);
    expect(s.past).toHaveLength(0);
    s = planReducer(s, { type: 'plan/insertVertex', id: 'a', after: 0, pt: [2, 0] });
    expect((find(s, 'a') as PolyShape).pts).toEqual([[1, 1], [2, 0], [4, 0], [4, 3], [0, 3]]);
    expect(s.past).toHaveLength(1);
    s = planReducer(s, { type: 'plan/deleteVertex', id: 'a', index: 1 });
    s = planReducer(s, { type: 'plan/deleteVertex', id: 'a', index: 0 });
    expect((find(s, 'a') as PolyShape).pts).toHaveLength(3);
    const s3 = planReducer(s, { type: 'plan/deleteVertex', id: 'a', index: 0 });
    expect(s3).toBe(s);
  });

  it('setPlotSize ignores values outside 5–500', () => {
    const s0 = doc();
    expect(planReducer(s0, { type: 'plan/setPlotSize', W: 600 })).toBe(s0);
    expect(planReducer(s0, { type: 'plan/setPlotSize', H: 2 })).toBe(s0);
    const s = planReducer(s0, { type: 'plan/setPlotSize', W: 40 });
    expect(s.plan).toMatchObject({ W: 40, H: 22 });
    expect(s.past).toEqual([]);
  });

  it('background set/patch is not in history', () => {
    const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };
    let s = planReducer(doc(), { type: 'plan/setBackground', bg });
    s = planReducer(s, { type: 'plan/patchBackground', patch: { opacity: 0.3 } });
    expect(s.plan.bg?.opacity).toBe(0.3);
    expect(s.past).toEqual([]);
    const noBg = doc();
    expect(planReducer(noBg, { type: 'plan/patchBackground', patch: { x: 1 } })).toBe(noBg);
  });

  it('load, loadSample and clear record and can be undone', () => {
    const s0 = doc();
    let s = planReducer(s0, { type: 'plan/clear' });
    expect(s.plan.shapes).toEqual([]);
    s = planReducer(s, { type: 'plan/undo' });
    expect(s.plan.shapes).toEqual(s0.plan.shapes);

    s = planReducer(s0, { type: 'plan/load', plan: { W: 40, H: 40, shapes: [tree], bg: null } });
    expect(s.plan).toMatchObject({ W: 40, shapes: [tree] });
    s = planReducer(s, { type: 'plan/undo' });
    expect(s.plan.shapes).toEqual(s0.plan.shapes);

    s = planReducer({ ...s0, plan: { ...s0.plan, W: 50 } }, { type: 'plan/loadSample' });
    expect(s.plan.shapes).toEqual(samplePlan().shapes);
    expect(s.plan.W).toBe(30);
    expect(s.past).toHaveLength(1);
  });

  it('clear keeps background and plot size', () => {
    const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };
    const s = planReducer({ plan: { W: 44, H: 33, shapes: [tree], bg }, past: [] }, { type: 'plan/clear' });
    expect(s.plan).toEqual({ W: 44, H: 33, shapes: [], bg });
  });

  it('checkpoint + undo restores the state before a drag', () => {
    let s = planReducer(doc(), { type: 'plan/checkpoint' });
    s = planReducer(s, { type: 'plan/replace', id: 't', shape: { ...tree, x: 1 } });
    s = planReducer(s, { type: 'plan/replace', id: 't', shape: { ...tree, x: 2 } });
    s = planReducer(s, { type: 'plan/undo' });
    expect((find(s, 't') as PointShape).x).toBe(5);
    expect(s.past).toEqual([]);
  });

  it('undo with empty history is a no-op', () => {
    const s0 = doc();
    expect(planReducer(s0, { type: 'plan/undo' })).toBe(s0);
  });
});

import { samplePlan } from '../domain/sample';
import type { PointShape } from '../domain/types';
import { makeState } from '../test/factories';
import { rootReducer } from './rootReducer';
import { canUndo, selectSelected, selectSummary } from './selectors';

const tree: PointShape = { id: 't', type: 'tree', x: 5, y: 5, r: 2.5 };

describe('rootReducer', () => {
  it('add selects the new shape and returns to select tool unless keepTool', () => {
    let s = rootReducer(makeState({ ui: { tool: 'grass', draft: [[0, 0]] } }), {
      type: 'plan/add', shape: { id: 'g', type: 'grass', pts: [[0, 0], [1, 0], [1, 1]] },
    });
    expect(s.ui).toMatchObject({ sel: 'g', tool: 'select', draft: [] });
    s = rootReducer(makeState({ ui: { tool: 'tree' } }), { type: 'plan/add', shape: tree, keepTool: true });
    expect(s.ui).toMatchObject({ sel: 't', tool: 'tree' });
  });
  it('duplicate selects the copy', () => {
    const s = rootReducer(makeState({ plan: { shapes: [tree] } }), { type: 'plan/duplicate', id: 't', newId: 't2' });
    expect(s.ui.sel).toBe('t2');
  });
  it('remove and undo clear the selection', () => {
    let s = rootReducer(makeState({ plan: { shapes: [tree] }, ui: { sel: 't' } }), { type: 'plan/remove', id: 't' });
    expect(s.ui.sel).toBeNull();
    s = rootReducer({ ...s, ui: { ...s.ui, sel: 'x' } }, { type: 'plan/undo' });
    expect(s.ui.sel).toBeNull();
    expect(s.doc.plan.shapes).toEqual([tree]);
  });
  it('clear switches to boundary/polygon and can be undone', () => {
    const s0 = makeState({ plan: { shapes: samplePlan().shapes }, ui: { mode: 'rect', sel: 'h1' } });
    let s = rootReducer(s0, { type: 'plan/clear' });
    expect(s.ui).toMatchObject({ tool: 'boundary', mode: 'poly', sel: null });
    expect(canUndo(s)).toBe(true);
    s = rootReducer(s, { type: 'plan/undo' });
    expect(s.doc.plan.shapes).toEqual(samplePlan().shapes);
  });
  it('load resets tool, draft and background mode', () => {
    const s = rootReducer(makeState({ ui: { tool: 'grass', draft: [[1, 1]], bgMode: 'calib', sel: 'x' } }), {
      type: 'plan/load', plan: { W: 30, H: 22, shapes: [tree], bg: null },
    });
    expect(s.ui).toMatchObject({ tool: 'select', draft: [], bgMode: null, sel: null });
  });
  it('removing the background leaves background modes', () => {
    const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };
    const s = rootReducer(makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[1, 1]] } }), { type: 'plan/setBackground', bg: null });
    expect(s.ui).toMatchObject({ bgMode: null, calib: [] });
  });
  it('no-op actions return the same state', () => {
    const s0 = makeState();
    expect(rootReducer(s0, { type: 'plan/undo' })).toBe(s0);
  });
  it('ui actions go to uiReducer', () => {
    expect(rootReducer(makeState(), { type: 'ui/setStep', step: 1 }).ui.step).toBe(1);
  });
});

describe('selectors', () => {
  it('selectSummary is memoised by shapes identity', () => {
    const s = makeState({ plan: { shapes: samplePlan().shapes } });
    expect(selectSummary(s)).toBe(selectSummary({ ...s, ui: { ...s.ui, hover: [1, 1] } }));
    expect(selectSummary(s).pbc).toBe(72);
  });
  it('selectSelected', () => {
    const s = makeState({ plan: { shapes: [tree] }, ui: { sel: 't' } });
    expect(selectSelected(s)).toBe(tree);
    expect(selectSelected({ ...s, ui: { ...s.ui, sel: 'zz' } })).toBeNull();
  });
});

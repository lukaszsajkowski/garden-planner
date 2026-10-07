import { initialUi, uiReducer, type UiState } from './uiReducer';

const ui = (o: Partial<UiState> = {}): UiState => ({ ...initialUi, ...o });

describe('uiReducer', () => {
  it('has prototype defaults', () => {
    expect(initialUi).toMatchObject({ tool: 'select', mode: 'poly', scale: 28, step: 0.5, angleSnap: false, showDims: true, showLabels: true });
    expect(initialUi.drawInputs).toEqual({ startX: '0', startY: '0', segLen: '', segAng: '0', rectW: '10', rectH: '8' });
  });
  it('setTool clears drawing state and keeps selection only for select', () => {
    const s0 = ui({ sel: 'a', draft: [[0, 0]], rectStart: [1, 1], bgMode: 'calib', calib: [[1, 1]] });
    expect(uiReducer(s0, { type: 'ui/setTool', tool: 'grass' })).toMatchObject({ tool: 'grass', sel: null, draft: [], rectStart: null, bgMode: null, calib: [] });
    expect(uiReducer(s0, { type: 'ui/setTool', tool: 'select' }).sel).toBe('a');
  });
  it('setMode clears the other mode state', () => {
    expect(uiReducer(ui({ draft: [[0, 0]] }), { type: 'ui/setMode', mode: 'rect' })).toMatchObject({ mode: 'rect', draft: [] });
    expect(uiReducer(ui({ mode: 'rect', rectStart: [1, 1] }), { type: 'ui/setMode', mode: 'poly' })).toMatchObject({ mode: 'poly', rectStart: null });
  });
  it('draft actions', () => {
    let s = uiReducer(ui(), { type: 'ui/draftSet', pts: [[1, 1]] });
    s = uiReducer(s, { type: 'ui/draftAdd', pt: [2, 2] });
    expect(s.draft).toEqual([[1, 1], [2, 2]]);
    expect(uiReducer(s, { type: 'ui/draftPop' }).draft).toEqual([[1, 1]]);
  });
  it('zoom steps through ZOOMS and clamps', () => {
    expect(uiReducer(ui(), { type: 'ui/zoom', dir: 1 }).scale).toBe(36);
    expect(uiReducer(ui(), { type: 'ui/zoom', dir: -1 }).scale).toBe(20);
    expect(uiReducer(ui({ scale: 80 }), { type: 'ui/zoom', dir: 1 }).scale).toBe(80);
    expect(uiReducer(ui({ scale: 8 }), { type: 'ui/zoom', dir: -1 }).scale).toBe(8);
  });
  it('toggle flips a boolean', () => {
    expect(uiReducer(ui(), { type: 'ui/toggle', key: 'angleSnap' }).angleSnap).toBe(true);
    expect(uiReducer(ui(), { type: 'ui/toggle', key: 'showDims' }).showDims).toBe(false);
  });
  it('bg modes are exclusive and reset tool/selection', () => {
    const s0 = ui({ tool: 'grass', sel: 'a', draft: [[0, 0]] });
    const s = uiReducer(s0, { type: 'ui/toggleBgMode', mode: 'calib' });
    expect(s).toMatchObject({ bgMode: 'calib', tool: 'select', sel: null, draft: [], calib: [] });
    expect(uiReducer(s, { type: 'ui/toggleBgMode', mode: 'move' }).bgMode).toBe('move');
    expect(uiReducer(s, { type: 'ui/toggleBgMode', mode: 'calib' }).bgMode).toBeNull();
  });
  it('calibClick keeps at most two points; third starts over', () => {
    let s = uiReducer(ui(), { type: 'ui/calibClick', pt: [1, 1] });
    s = uiReducer(s, { type: 'ui/calibClick', pt: [2, 2] });
    expect(s.calib).toEqual([[1, 1], [2, 2]]);
    expect(uiReducer(s, { type: 'ui/calibClick', pt: [3, 3] }).calib).toEqual([[3, 3]]);
  });
  it('pickElement selects and switches to select tool', () => {
    expect(uiReducer(ui({ tool: 'tree', draft: [[0, 0]] }), { type: 'ui/pickElement', id: 'x' })).toMatchObject({ sel: 'x', tool: 'select', draft: [] });
  });
  it('pickElement leaves background calibration and move modes', () => {
    expect(uiReducer(ui({ bgMode: 'calib', calib: [[1, 1]] }), { type: 'ui/pickElement', id: 'x' })).toMatchObject({ sel: 'x', bgMode: null, calib: [] });
    expect(uiReducer(ui({ bgMode: 'move' }), { type: 'ui/pickElement', id: 'x' }).bgMode).toBeNull();
  });
  it('setDrawInput, setCalibLen, notify', () => {
    let s = uiReducer(ui(), { type: 'ui/setDrawInput', key: 'segLen', value: '3,5' });
    s = uiReducer(s, { type: 'ui/setCalibLen', value: '10' });
    s = uiReducer(s, { type: 'ui/notify', notice: { msg: 'ok' } });
    expect(s.drawInputs.segLen).toBe('3,5');
    expect(s.calibLen).toBe('10');
    expect(s.notice).toEqual({ msg: 'ok' });
  });
});

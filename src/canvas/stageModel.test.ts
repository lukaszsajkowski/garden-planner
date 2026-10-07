import { samplePlan } from '../domain/sample';
import { makeState } from '../test/factories';
import { buildStageModel, calibInfo, coordsText, draftInfo, stageTip, tickStep } from './stageModel';

const sample = () => makeState({ plan: { shapes: samplePlan().shapes } });
const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 20, aspect: 0.5, opacity: 0.6, visible: true };

describe('buildStageModel — sample plan', () => {
  const m = buildStageModel(sample());

  it('sizes the stage in px', () => {
    expect(m).toMatchObject({ W: 30, H: 22, scale: 28, widthPx: 840, heightPx: 616, cursor: 'default' });
  });
  it('orders shapes by layer', () => {
    expect(m.polys.map((p) => p.key)).toEqual(['g1', 'p1', 'p2', 'v1', 'd1', 'h1']);
    expect(m.bounds.map((p) => p.key)).toEqual(['b1']);
    expect(m.points.map((p) => p.key)).toEqual(['s1', 's2', 's3', 'c1', 'c2', 'c3', 't1', 't2']);
    expect(m.polys[0].fill).toBe('url(#pat-grass)');
  });
  it('puts a centre dot on trees and conifers only', () => {
    expect(m.points.find((p) => p.key === 's1')?.dotR).toBe(0);
    expect(m.points.find((p) => p.key === 't1')?.dotR).toBe(0.15);
  });
  it('labels areas big enough on screen and named plants', () => {
    expect(m.labels.map((l) => l.title)).toEqual(['Działka', 'Trawnik', 'Podjazd', 'Taras', 'Rabata bylinowa', 'Dom', 'Klon', 'Jabłoń']);
    expect(m.labels[0]).toMatchObject({ anchor: 'corner', x: 28, y: 42, sub: '508 m²' });
    expect(m.labels.find((l) => l.title === 'Klon')?.sub).toBe('Ø 5,6 m');
  });
  it('shows boundary dimensions', () => {
    expect(m.edgeLabels.map((e) => [e.text, e.tone])).toEqual([
      ['26,50 m', 'boundary'], ['19,51 m', 'boundary'], ['27,00 m', 'boundary'], ['18,50 m', 'boundary'],
    ]);
  });
  it('ruler ticks every 5 m at 28 px/m', () => {
    expect(m.ticksX.map((t) => t.label)).toEqual(['0', '5', '10', '15', '20', '25', '30']);
    expect(m.ticksY.map((t) => t.label)).toEqual(['0', '5', '10', '15', '20']);
  });
});

describe('buildStageModel — toggles and states', () => {
  it('hides labels and dimensions when switched off', () => {
    const s = sample();
    const m = buildStageModel({ ...s, ui: { ...s.ui, showLabels: false, showDims: false } });
    expect(m.labels).toEqual([]);
    expect(m.edgeLabels).toEqual([]);
  });
  it('selected polygon: outline, vertex handles, edge lengths', () => {
    const s = sample();
    const m = buildStageModel({ ...s, ui: { ...s.ui, sel: 'h1' } });
    expect(m.selection).toEqual({ kind: 'poly', points: '6,4 17,4 17,12 6,12' });
    expect(m.handles.map((h) => h.kind)).toEqual(['vertex', 'vertex', 'vertex', 'vertex']);
    expect(m.edgeLabels.filter((e) => e.tone === 'selection').map((e) => e.text)).toEqual(['11,00 m', '8,00 m', '11,00 m', '8,00 m']);
  });
  it('selected plant: dashed circle and centre handle', () => {
    const s = sample();
    const m = buildStageModel({ ...s, ui: { ...s.ui, sel: 't1' } });
    expect(m.selection).toEqual({ kind: 'point', cx: 4.5, cy: 16, r: 2.8 });
    expect(m.handles).toEqual([{ key: 'hc', x: 126, y: 448, kind: 'pointCenter' }]);
  });
  it('polygon draft with hover', () => {
    const s = makeState({ ui: { tool: 'grass', draft: [[0, 0], [4, 0]], hover: [4, 3] } });
    const m = buildStageModel(s);
    expect(m.draftLine).toBe('0,0 4,0 4,3');
    expect(m.handles.map((h) => h.kind)).toEqual(['draftFirst', 'draft']);
    expect(m.edgeLabels.map((e) => e.text)).toEqual(['4,00 m', '3,00 m']);
    expect(m.cursor).toBe('crosshair');
    expect(draftInfo(s)).toBe('Punkty: 2 · odcinek 3,00 m · 270°');
  });
  it('first draft point becomes closable from 3 points', () => {
    const m = buildStageModel(makeState({ ui: { tool: 'grass', draft: [[0, 0], [4, 0], [4, 3]] } }));
    expect(m.handles[0].kind).toBe('draftClosable');
  });
  it('rectangle preview shows two sides', () => {
    const m = buildStageModel(makeState({ ui: { tool: 'house', mode: 'rect', rectStart: [1, 1], hover: [5, 4] } }));
    expect(m.draftRect).toBe('1,1 5,1 5,4 1,4');
    expect(m.edgeLabels.map((e) => e.text)).toEqual(['4,00 m', '3,00 m']);
  });
  it('small polygons get no label', () => {
    const m = buildStageModel(makeState({ plan: { shapes: [{ id: 'x', type: 'bed', pts: [[0, 0], [1, 0], [1, 1], [0, 1]] }] } }));
    expect(m.labels).toEqual([]);
  });
  it('background image and calibration overlay', () => {
    const s = makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[1, 1]], hover: [6, 1] } });
    const m = buildStageModel(s);
    expect(m.bg).toEqual({ src: bg.src, left: 0, top: 0, width: 560, height: 280, opacity: 0.6 });
    expect(m.calibLine).toBe('1,1 6,1');
    expect(m.handles.map((h) => h.kind)).toEqual(['calib']);
    expect(m.edgeLabels).toEqual([{ key: 'kal', x: 98, y: 28, text: '5,00 m', tone: 'calib' }]);
    expect(calibInfo(s)).toBe('Teraz drugi punkt · 5,00 m w obecnej skali');
    expect(m.cursor).toBe('crosshair');
  });
  it('hidden background is not rendered; move mode cursor', () => {
    const m = buildStageModel(makeState({ plan: { bg: { ...bg, visible: false } }, ui: { bgMode: 'move' } }));
    expect(m.bg).toBeNull();
    expect(m.cursor).toBe('move');
  });
});

describe('texts', () => {
  it('tickStep', () => {
    expect([tickStep(48), tickStep(28), tickStep(12)]).toEqual([2, 5, 10]);
  });
  it('coordsText', () => {
    expect(coordsText([1.5, 2])).toBe('X 1,50 m   Y 2,00 m');
    expect(coordsText(null)).toBe('Najedź na plan');
  });
  it('calibInfo', () => {
    expect(calibInfo(makeState({ plan: { bg }, ui: { bgMode: 'calib' } }))).toBe('Kliknij pierwszy punkt na mapce');
    expect(calibInfo(makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[0, 0], [0, 2]] } }))).toBe('Odcinek na mapce: 2,00 m w obecnej skali');
  });
  it('draftInfo without draft', () => {
    expect(draftInfo(makeState({ ui: { tool: 'grass' } }))).toBe('Kliknij na planie pierwszy punkt');
  });
  it.each([
    [{ plan: { bg }, ui: { bgMode: 'calib' as const } }, 'Kalibracja: kliknij dwa punkty na mapce o znanej odległości, wpisz ją po lewej i zastosuj.'],
    [{ plan: { bg }, ui: { bgMode: 'move' as const } }, 'Przeciągnij, aby przesunąć mapkę pod planem.'],
    [{ ui: { tool: 'grass' as const, draft: [[0, 0], [1, 0], [1, 1]] as [number, number][] } }, 'Kliknij pierwszy (niebieski) punkt albo kliknij dwukrotnie, aby zamknąć kształt.'],
    [{ ui: { tool: 'grass' as const } }, 'Klikaj kolejne narożniki. Długość i kąt możesz też wpisać po lewej.'],
    [{ ui: { tool: 'grass' as const, mode: 'rect' as const } }, 'Przeciągnij, aby narysować prostokąt.'],
    [{ ui: { tool: 'tree' as const } }, 'Kliknij, aby posadzić. Narzędzie zostaje aktywne, możesz sadzić dalej.'],
    [{ plan: { shapes: samplePlan().shapes }, ui: { sel: 'h1' } }, 'Przeciągnij element, aby go przesunąć. Kwadratowe uchwyty przesuwają narożniki.'],
    [{}, 'Wybierz narzędzie po lewej. Kliknij element na planie, aby go edytować.'],
  ])('stageTip %#', (o, text) => {
    expect(stageTip(makeState(o))).toBe(text);
  });
});

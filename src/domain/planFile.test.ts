import { readFileSync } from 'node:fs';
import { PlanFileError, parsePlan, serializePlan, validatePlan } from './planFile';
import { samplePlan } from './sample';

let n = 0;
const ids = () => `new${++n}`;
const fixture = readFileSync('tests/fixtures/prototype-sample.json', 'utf8');
const PNG = 'data:image/png;base64,AAAA';

describe('parsePlan', () => {
  beforeEach(() => { n = 0; });

  it('reads a file saved by the prototype', () => {
    expect(parsePlan(fixture, ids)).toEqual(samplePlan());
  });

  it('round-trips through serializePlan', () => {
    const plan = { ...samplePlan(), bg: { src: PNG, x: 1, y: 2, w: 20, aspect: 0.5, opacity: 0.6, visible: false } };
    expect(parsePlan(serializePlan(plan), ids)).toEqual(plan);
  });

  it('serializePlan writes the header fields', () => {
    const data = JSON.parse(serializePlan(samplePlan(), new Date('2026-10-05T10:00:00Z')));
    expect(data).toMatchObject({ app: 'planer-ogrodu', version: 1, savedAt: '2026-10-05T10:00:00.000Z', W: 30, H: 22, bg: null });
  });

  it.each(['nie json', '{}', '{"shapes":"x"}', 'null', '[]'])('rejects %s with a Polish message', (text) => {
    expect(() => parsePlan(text, ids)).toThrow(PlanFileError);
    expect(() => parsePlan(text, ids)).toThrow('to nie jest plik planu ogrodu');
  });

  it('accepts newer versions as v1', () => {
    const plan = parsePlan(JSON.stringify({ version: 2, shapes: [], extra: true }), ids);
    expect(plan).toEqual({ W: 30, H: 22, shapes: [], bg: null });
  });
});

describe('validatePlan — repairs and drops bad entries', () => {
  beforeEach(() => { n = 0; });
  const one = (shape: unknown) => validatePlan({ shapes: [shape] }, ids).shapes;

  it('drops unknown types, including inherited object keys', () => {
    expect(one({ id: 'a', type: 'pond', pts: [[0, 0], [1, 0], [1, 1]] })).toEqual([]);
    expect(one({ id: 'a', type: 'toString', x: 1, y: 1 })).toEqual([]);
    expect(one(null)).toEqual([]);
    expect(one('grass')).toEqual([]);
  });
  it('gives a new id when id is not a string', () => {
    expect(one({ id: 7, type: 'tree', x: 1, y: 2, r: 1 })).toEqual([{ id: 'new1', type: 'tree', x: 1, y: 2, r: 1 }]);
  });
  it('trims names to 80 chars and ignores non-string names', () => {
    expect(one({ id: 'a', type: 'tree', name: 'x'.repeat(100), x: 0, y: 0, r: 1 })[0].name).toHaveLength(80);
    expect(one({ id: 'a', type: 'tree', name: 5, x: 0, y: 0, r: 1 })[0]).not.toHaveProperty('name');
  });
  it('keeps only numeric points and drops polygons with fewer than 3', () => {
    expect(one({ id: 'a', type: 'grass', pts: [[0, 0], ['5', 0], [1, 0], [1, 1], [2]] })).toEqual([
      { id: 'a', type: 'grass', pts: [[0, 0], [1, 0], [1, 1]] },
    ]);
    expect(one({ id: 'a', type: 'grass', pts: [[0, 0], [1, '1'], [1, 0]] })).toEqual([]);
    expect(one({ id: 'a', type: 'grass' })).toEqual([]);
  });
  it('plants need numeric x/y; bad radius falls back to default', () => {
    expect(one({ id: 'a', type: 'shrub', x: '1', y: 1 })).toEqual([]);
    expect(one({ id: 'a', type: 'shrub', x: 1, y: 1, r: -2 })).toEqual([{ id: 'a', type: 'shrub', x: 1, y: 1, r: 0.6 }]);
    expect(one({ id: 'a', type: 'conifer', x: 1, y: 1 })).toEqual([{ id: 'a', type: 'conifer', x: 1, y: 1, r: 1 }]);
  });
  it('clamps plot size', () => {
    expect(validatePlan({ shapes: [], W: 1000, H: 2 }, ids)).toMatchObject({ W: 500, H: 5 });
    expect(validatePlan({ shapes: [], W: 'x' }, ids)).toMatchObject({ W: 30, H: 22 });
  });
  it('validates the background', () => {
    const bg = (b: unknown) => validatePlan({ shapes: [], bg: b }, ids).bg;
    expect(bg({ src: 'https://example.com/a.png', w: 10, aspect: 1 })).toBeNull();
    expect(bg({ src: PNG, w: 0, aspect: 1 })).toBeNull();
    expect(bg({ src: PNG, w: 10, aspect: 0 })).toBeNull();
    expect(bg({ src: PNG, w: 10, aspect: 1, opacity: 2 })).toEqual({ src: PNG, x: 0, y: 0, w: 10, aspect: 1, opacity: 1, visible: true });
    expect(bg({ src: PNG, w: 10, aspect: 1, opacity: 0, x: 3, y: 4, visible: false })).toEqual({ src: PNG, x: 3, y: 4, w: 10, aspect: 1, opacity: 0.1, visible: false });
  });
});

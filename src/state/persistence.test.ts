import { STORAGE_KEY } from '../domain/catalog';
import { samplePlan } from '../domain/sample';
import { loadSaved, savePlan } from './persistence';

function fakeStorage(limit = Infinity): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k); },
    setItem: (k, v) => {
      if (v.length > limit) throw new DOMException('full', 'QuotaExceededError');
      m.set(k, v);
    },
  };
}
const bg = { src: 'data:image/png;base64,' + 'A'.repeat(5000), x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };

describe('persistence', () => {
  it('saves and loads a plan', () => {
    const st = fakeStorage();
    savePlan(st, samplePlan());
    expect(JSON.parse(st.getItem(STORAGE_KEY)!)).toHaveProperty('shapes');
    expect(loadSaved(st)).toEqual(samplePlan());
  });
  it('drops the background when storage is full', () => {
    const st = fakeStorage(4000);
    savePlan(st, { ...samplePlan(), bg });
    expect(loadSaved(st)).toEqual(samplePlan());
  });
  it('silently gives up when even the plan does not fit', () => {
    const st = fakeStorage(10);
    expect(() => savePlan(st, samplePlan())).not.toThrow();
    expect(loadSaved(st)).toBeNull();
  });
  it('returns null for missing, corrupt or absent storage', () => {
    expect(loadSaved(fakeStorage())).toBeNull();
    const st = fakeStorage();
    st.setItem(STORAGE_KEY, '{oops');
    expect(loadSaved(st)).toBeNull();
    expect(loadSaved(null)).toBeNull();
    expect(() => savePlan(null, samplePlan())).not.toThrow();
  });
});

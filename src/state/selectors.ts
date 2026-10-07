import { summarize, type Summary } from '../domain/netAreas';
import type { Shape } from '../domain/types';
import type { AppState } from './rootReducer';

const summaryCache = new WeakMap<Shape[], Summary>();

export function selectSummary(s: AppState): Summary {
  const shapes = s.doc.plan.shapes;
  let v = summaryCache.get(shapes);
  if (!v) {
    v = summarize(shapes);
    summaryCache.set(shapes, v);
  }
  return v;
}

export function selectSelected(s: AppState): Shape | null {
  const id = s.ui.sel;
  return id ? s.doc.plan.shapes.find((x) => x.id === id) ?? null : null;
}

export function canUndo(s: AppState): boolean {
  return s.doc.past.length > 0;
}

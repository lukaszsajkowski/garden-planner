import { CATALOG, PLOT_MAX, PLOT_MIN, defaultRadius, isPoly } from '../domain/catalog';
import { round2 } from '../domain/format';
import { samplePlan } from '../domain/sample';
import type { Background, Plan, PointType, PolyType, Pt, Shape, ShapeType } from '../domain/types';
import { pushPast } from './history';

export interface DocState { plan: Plan; past: Shape[][] }
export interface ShapePatch { name?: string; pts?: Pt[]; x?: number; y?: number; r?: number }

export type PlanAction =
  | { type: 'plan/add'; shape: Shape; keepTool?: boolean }
  | { type: 'plan/update'; id: string; patch: ShapePatch }
  | { type: 'plan/replace'; id: string; shape: Shape }
  | { type: 'plan/remove'; id: string }
  | { type: 'plan/duplicate'; id: string; newId: string }
  | { type: 'plan/setType'; id: string; shapeType: ShapeType }
  | { type: 'plan/moveVertex'; id: string; index: number; pt: Pt }
  | { type: 'plan/insertVertex'; id: string; after: number; pt: Pt }
  | { type: 'plan/deleteVertex'; id: string; index: number }
  | { type: 'plan/setPlotSize'; W?: number; H?: number }
  | { type: 'plan/setBackground'; bg: Background | null }
  | { type: 'plan/patchBackground'; patch: Partial<Background> }
  | { type: 'plan/load'; plan: Plan }
  | { type: 'plan/loadSample' }
  | { type: 'plan/clear' }
  | { type: 'plan/checkpoint' }
  | { type: 'plan/undo' };

function setShapes(s: DocState, shapes: Shape[], record: boolean): DocState {
  return { plan: { ...s.plan, shapes }, past: record ? pushPast(s.past, s.plan.shapes) : s.past };
}
function swap(s: DocState, id: string, next: Shape, record: boolean): DocState {
  return setShapes(s, s.plan.shapes.map((x) => (x.id === id ? next : x)), record);
}
const find = (s: DocState, id: string) => s.plan.shapes.find((x) => x.id === id);
const inPlotRange = (v: number) => v >= PLOT_MIN && v <= PLOT_MAX;

export function planReducer(s: DocState, a: PlanAction): DocState {
  switch (a.type) {
    case 'plan/add':
      return setShapes(s, [...s.plan.shapes, a.shape], true);
    case 'plan/update': {
      const x = find(s, a.id);
      return x ? swap(s, a.id, { ...x, ...a.patch } as Shape, false) : s;
    }
    case 'plan/replace':
      return find(s, a.id) ? swap(s, a.id, a.shape, false) : s;
    case 'plan/remove':
      return find(s, a.id) ? setShapes(s, s.plan.shapes.filter((x) => x.id !== a.id), true) : s;
    case 'plan/duplicate': {
      const x = find(s, a.id);
      if (!x) return s;
      const copy: Shape = isPoly(x)
        ? { ...x, id: a.newId, pts: x.pts.map((q): Pt => [round2(q[0] + 1), round2(q[1] + 1)]) }
        : { ...x, id: a.newId, x: round2(x.x + 1), y: round2(x.y + 1) };
      return setShapes(s, [...s.plan.shapes, copy], true);
    }
    case 'plan/setType': {
      const x = find(s, a.id);
      if (!x || x.type === a.shapeType || CATALOG[x.type].kind !== CATALOG[a.shapeType].kind) return s;
      const next: Shape = isPoly(x)
        ? { ...x, type: a.shapeType as PolyType }
        : {
            ...x,
            type: a.shapeType as PointType,
            r: Math.abs(x.r - defaultRadius(x.type)) < 1e-6 ? defaultRadius(a.shapeType as PointType) : x.r,
          };
      return swap(s, a.id, next, true);
    }
    case 'plan/moveVertex': {
      const x = find(s, a.id);
      if (!x || !isPoly(x) || a.index < 0 || a.index >= x.pts.length) return s;
      const pts = x.pts.slice();
      pts[a.index] = a.pt;
      return swap(s, a.id, { ...x, pts }, false);
    }
    case 'plan/insertVertex': {
      const x = find(s, a.id);
      if (!x || !isPoly(x)) return s;
      const pts = x.pts.slice();
      pts.splice(a.after + 1, 0, a.pt);
      return swap(s, a.id, { ...x, pts }, true);
    }
    case 'plan/deleteVertex': {
      const x = find(s, a.id);
      if (!x || !isPoly(x) || x.pts.length <= 3) return s;
      return swap(s, a.id, { ...x, pts: x.pts.filter((_, j) => j !== a.index) }, true);
    }
    case 'plan/setPlotSize': {
      const W = a.W !== undefined && inPlotRange(a.W) ? a.W : s.plan.W;
      const H = a.H !== undefined && inPlotRange(a.H) ? a.H : s.plan.H;
      if (W === s.plan.W && H === s.plan.H) return s;
      return { ...s, plan: { ...s.plan, W, H } };
    }
    case 'plan/setBackground':
      return { ...s, plan: { ...s.plan, bg: a.bg } };
    case 'plan/patchBackground':
      return s.plan.bg ? { ...s, plan: { ...s.plan, bg: { ...s.plan.bg, ...a.patch } } } : s;
    case 'plan/load':
      return { plan: a.plan, past: pushPast(s.past, s.plan.shapes) };
    case 'plan/loadSample': {
      const sp = samplePlan();
      return { plan: { ...s.plan, shapes: sp.shapes, W: sp.W, H: sp.H }, past: pushPast(s.past, s.plan.shapes) };
    }
    case 'plan/clear':
      return setShapes(s, [], true);
    case 'plan/checkpoint':
      return { ...s, past: pushPast(s.past, s.plan.shapes) };
    case 'plan/undo':
      if (!s.past.length) return s;
      return { plan: { ...s.plan, shapes: s.past[s.past.length - 1] }, past: s.past.slice(0, -1) };
  }
}

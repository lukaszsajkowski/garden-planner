import { defaultRadius, isPoly, isPolyType } from '../domain/catalog';
import { round2 } from '../domain/format';
import { dist, rectPoints, segmentDistance } from '../domain/geometry';
import { draftPoint, snapPoint } from '../domain/snapping';
import type { Pt, Shape } from '../domain/types';
import type { AppAction, AppState } from '../state/rootReducer';
import { selectSelected } from '../state/selectors';
import { CLOSE_PX, EDGE_INSERT_PX, VERTEX_PX } from './coords';
import { hitTest } from './hitTest';
import { isPolyTool } from './stageModel';

export type Drag =
  | { kind: 'bg'; start: Pt; orig: { x: number; y: number } }
  | { kind: 'vertex'; id: string; index: number; pushed: boolean }
  | { kind: 'move'; id: string; start: Pt; orig: Shape; pushed: boolean };

export interface PointerResult { actions: AppAction[]; drag: Drag | null; capture: boolean }

const round3 = (v: number) => Math.round(v * 1000) / 1000;
const only = (actions: AppAction[]): PointerResult => ({ actions, drag: null, capture: false });

export function finishDraftActions(s: AppState, newId: () => string): AppAction[] {
  const { draft, tool } = s.ui;
  if (draft.length < 3 || tool === 'select' || !isPolyType(tool)) return [];
  return [{ type: 'plan/add', shape: { id: newId(), type: tool, pts: draft.slice() } }];
}

export function pointerDown(s: AppState, raw: Pt, newId: () => string): PointerResult {
  const { ui } = s;
  const bg = s.doc.plan.bg;
  if (bg && ui.bgMode === 'calib') return only([{ type: 'ui/calibClick', pt: [round3(raw[0]), round3(raw[1])] }]);
  if (bg && ui.bgMode === 'move') return { actions: [], drag: { kind: 'bg', start: raw, orig: { x: bg.x, y: bg.y } }, capture: true };

  if (ui.tool === 'select') {
    const sel = selectSelected(s);
    if (sel && isPoly(sel)) {
      const i = sel.pts.findIndex((p) => dist(p, raw) <= VERTEX_PX / ui.scale);
      if (i >= 0) return { actions: [], drag: { kind: 'vertex', id: sel.id, index: i, pushed: false }, capture: true };
    }
    const hit = hitTest(s.doc.plan.shapes, raw, ui.scale);
    if (!hit) return only([{ type: 'ui/select', id: null }]);
    return { actions: [{ type: 'ui/select', id: hit.id }], drag: { kind: 'move', id: hit.id, start: raw, orig: hit, pushed: false }, capture: true };
  }

  const tool = ui.tool;
  if (!isPolyType(tool)) {
    const p = snapPoint(raw, ui.step);
    return only([{ type: 'plan/add', shape: { id: newId(), type: tool, x: p[0], y: p[1], r: defaultRadius(tool) }, keepTool: true }]);
  }
  if (ui.mode === 'rect') {
    const p = snapPoint(raw, ui.step);
    return { actions: [{ type: 'ui/rectStart', pt: p }, { type: 'ui/hover', pt: p }], drag: null, capture: true };
  }
  const d = ui.draft;
  if (d.length >= 3 && dist(d[0], raw) <= CLOSE_PX / ui.scale) return only(finishDraftActions(s, newId));
  const last = d.length ? d[d.length - 1] : null;
  const np = draftPoint(raw, last, { step: ui.step, angleSnap: ui.angleSnap });
  if (last && dist(last, np) < 0.005) return only([]);
  return only([{ type: 'ui/draftAdd', pt: np }]);
}

export function pointerMove(s: AppState, raw: Pt, drag: Drag | null): PointerResult {
  const { ui } = s;
  if (drag && drag.kind === 'bg') {
    const patch = { x: round2(drag.orig.x + raw[0] - drag.start[0]), y: round2(drag.orig.y + raw[1] - drag.start[1]) };
    return { actions: [{ type: 'plan/patchBackground', patch }, { type: 'ui/hover', pt: raw }], drag, capture: false };
  }
  if (ui.bgMode === 'calib') return { actions: [{ type: 'ui/hover', pt: raw }], drag, capture: false };
  if (drag) {
    const actions: AppAction[] = [];
    let next: Drag = drag;
    if (!drag.pushed) {
      actions.push({ type: 'plan/checkpoint' });
      next = { ...drag, pushed: true };
    }
    if (drag.kind === 'vertex') {
      actions.push({ type: 'plan/moveVertex', id: drag.id, index: drag.index, pt: snapPoint(raw, ui.step) });
    } else {
      let dx = raw[0] - drag.start[0], dy = raw[1] - drag.start[1];
      if (ui.step) {
        dx = Math.round(dx / ui.step) * ui.step;
        dy = Math.round(dy / ui.step) * ui.step;
      }
      const o = drag.orig;
      const shape: Shape = isPoly(o)
        ? { ...o, pts: o.pts.map((q): Pt => [round2(q[0] + dx), round2(q[1] + dy)]) }
        : { ...o, x: round2(o.x + dx), y: round2(o.y + dy) };
      actions.push({ type: 'plan/replace', id: drag.id, shape });
    }
    actions.push({ type: 'ui/hover', pt: snapPoint(raw, ui.step) });
    return { actions, drag: next, capture: false };
  }
  const drawing = isPolyTool(s) && ui.mode === 'poly';
  const last = ui.draft.length ? ui.draft[ui.draft.length - 1] : null;
  const pt = drawing ? draftPoint(raw, last, { step: ui.step, angleSnap: ui.angleSnap }) : snapPoint(raw, ui.step);
  return { actions: [{ type: 'ui/hover', pt }], drag: null, capture: false };
}

export function pointerUp(s: AppState, raw: Pt, newId: () => string): AppAction[] {
  const { ui } = s;
  if (!ui.rectStart) return [];
  const a = ui.rectStart, b = snapPoint(raw, ui.step);
  const actions: AppAction[] = [{ type: 'ui/rectStart', pt: null }];
  const tool = ui.tool;
  if (tool !== 'select' && isPolyType(tool) && Math.abs(b[0] - a[0]) >= 0.1 && Math.abs(b[1] - a[1]) >= 0.1) {
    actions.push({ type: 'plan/add', shape: { id: newId(), type: tool, pts: rectPoints(a, b) } });
  }
  return actions;
}

export function doubleClick(s: AppState, raw: Pt, newId: () => string): AppAction[] {
  const { ui } = s;
  if (isPolyTool(s) && ui.mode === 'poly') return finishDraftActions(s, newId);
  const sel = selectSelected(s);
  if (ui.tool !== 'select' || !sel || !isPoly(sel)) return [];
  let best: { d: number; i: number; q: Pt } | null = null;
  for (let i = 0; i < sel.pts.length; i++) {
    const r = segmentDistance(raw, sel.pts[i], sel.pts[(i + 1) % sel.pts.length]);
    if (!best || r.d < best.d) best = { d: r.d, i, q: r.q };
  }
  if (!best || best.d > EDGE_INSERT_PX / ui.scale) return [];
  return [{ type: 'plan/insertVertex', id: sel.id, after: best.i, pt: snapPoint(best.q, ui.step) }];
}

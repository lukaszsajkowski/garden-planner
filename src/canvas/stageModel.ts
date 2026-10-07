import { canvasTokens } from '../design/tokens';
import { CATALOG, isPoly, isPolyType } from '../domain/catalog';
import { fmtArea, fmtLen, fmtNum } from '../domain/format';
import { area, bbox, centroid, dist, ptsAttr, rectPoints } from '../domain/geometry';
import { displayAngle } from '../domain/snapping';
import type { Pt } from '../domain/types';
import type { AppState } from '../state/rootReducer';
import { selectSelected } from '../state/selectors';
import { pointStyle, polyStyle } from './materialStyle';

export type EdgeTone = 'boundary' | 'selection' | 'draft' | 'calib';
export type HandleKind = 'vertex' | 'pointCenter' | 'draft' | 'draftFirst' | 'draftClosable' | 'calib';
export interface PolyItem { key: string; points: string; fill: string; stroke: string; sw: number; dash: string }
export interface PointItem { key: string; cx: number; cy: number; r: number; fill: string; stroke: string; dotR: number }
export interface LabelItem { key: string; x: number; y: number; anchor: 'center' | 'corner'; title: string; sub: string }
export interface EdgeLabel { key: string; x: number; y: number; text: string; tone: EdgeTone }
export interface HandleItem { key: string; x: number; y: number; kind: HandleKind }
export interface Tick { key: string; pos: number; label: string }
export type SelectionOverlay = { kind: 'poly'; points: string } | { kind: 'point'; cx: number; cy: number; r: number } | null;
export interface BgItem { src: string; left: number; top: number; width: number; height: number; opacity: number }

export interface StageModel {
  W: number;
  H: number;
  scale: number;
  widthPx: number;
  heightPx: number;
  cursor: 'default' | 'crosshair' | 'move';
  bg: BgItem | null;
  polys: PolyItem[];
  bounds: PolyItem[];
  points: PointItem[];
  selection: SelectionOverlay;
  draftLine: string | null;
  draftRect: string | null;
  calibLine: string | null;
  labels: LabelItem[];
  edgeLabels: EdgeLabel[];
  handles: HandleItem[];
  ticksX: Tick[];
  ticksY: Tick[];
}

const [LABEL_MIN_W, LABEL_MIN_H] = canvasTokens.labelMinBoxPx;
const EDGE_MIN = canvasTokens.edgeLabelMinPx;

export function tickStep(scale: number): 2 | 5 | 10 {
  return scale >= 40 ? 2 : scale >= 16 ? 5 : 10;
}

export function isPolyTool(s: AppState): boolean {
  return s.ui.tool !== 'select' && isPolyType(s.ui.tool);
}

function edgesOf(pts: Pt[], closed: boolean, prefix: string, tone: EdgeTone, sc: number): EdgeLabel[] {
  const out: EdgeLabel[] = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], len = dist(a, b);
    if (len * sc < EDGE_MIN) continue;
    out.push({ key: prefix + i, x: ((a[0] + b[0]) / 2) * sc, y: ((a[1] + b[1]) / 2) * sc, text: fmtLen(len), tone });
  }
  return out;
}

function calibPoints(s: AppState): Pt[] {
  const { calib, hover } = s.ui;
  return calib.length === 1 && hover ? [...calib, hover] : calib;
}

export function buildStageModel(s: AppState): StageModel {
  const { ui } = s;
  const { W, H, shapes, bg } = s.doc.plan;
  const sc = ui.scale;
  const sel = selectSelected(s);
  const ordered = shapes
    .map((sh, i) => ({ sh, i }))
    .sort((a, b) => CATALOG[a.sh.type].z - CATALOG[b.sh.type].z || a.i - b.i)
    .map((o) => o.sh);

  const polys: PolyItem[] = [], bounds: PolyItem[] = [], points: PointItem[] = [];
  const labels: LabelItem[] = [], edgeLabels: EdgeLabel[] = [], handles: HandleItem[] = [];

  for (const sh of ordered) {
    if (isPoly(sh)) {
      const st = polyStyle(sh.type);
      const item: PolyItem = { key: sh.id, points: ptsAttr(sh.pts), fill: st.fill, stroke: st.stroke, sw: st.sw, dash: st.dash };
      (sh.type === 'boundary' ? bounds : polys).push(item);
      if (!ui.showLabels || sh.pts.length < 3) continue;
      if (sh.type === 'boundary') {
        const tl = sh.pts.reduce((m, p) => (p[0] + p[1] < m[0] + m[1] ? p : m));
        labels.push({ key: 'l' + sh.id, x: tl[0] * sc, y: tl[1] * sc, anchor: 'corner', title: sh.name || 'Działka', sub: fmtArea(area(sh.pts)) });
      } else {
        const b = bbox(sh.pts);
        if ((b[2] - b[0]) * sc >= LABEL_MIN_W && (b[3] - b[1]) * sc >= LABEL_MIN_H) {
          const c = centroid(sh.pts);
          labels.push({ key: 'l' + sh.id, x: c[0] * sc, y: c[1] * sc, anchor: 'center', title: sh.name || CATALOG[sh.type].label, sub: fmtArea(area(sh.pts)) });
        }
      }
    } else {
      const st = pointStyle(sh.type);
      points.push({ key: sh.id, cx: sh.x, cy: sh.y, r: sh.r, fill: st.fill, stroke: st.stroke, dotR: st.centerDot ? Math.min(0.15, sh.r * 0.2) : 0 });
      if (ui.showLabels && sh.name) {
        labels.push({ key: 'l' + sh.id, x: sh.x * sc, y: sh.y * sc, anchor: 'center', title: sh.name, sub: 'Ø ' + fmtNum(sh.r * 2) + ' m' });
      }
    }
  }

  let selection: SelectionOverlay = null;
  if (sel) {
    if (isPoly(sel)) {
      selection = { kind: 'poly', points: ptsAttr(sel.pts) };
      sel.pts.forEach((p, i) => handles.push({ key: 'h' + i, x: p[0] * sc, y: p[1] * sc, kind: 'vertex' }));
      edgeLabels.push(...edgesOf(sel.pts, true, 'e', 'selection', sc));
    } else {
      selection = { kind: 'point', cx: sel.x, cy: sel.y, r: sel.r };
      handles.push({ key: 'hc', x: sel.x * sc, y: sel.y * sc, kind: 'pointCenter' });
    }
  }
  if (ui.showDims) {
    for (const sh of shapes) {
      if (isPoly(sh) && sh.type === 'boundary' && sh.id !== sel?.id) edgeLabels.push(...edgesOf(sh.pts, true, 'b' + sh.id + '-', 'boundary', sc));
    }
  }

  let draftLine: string | null = null, draftRect: string | null = null;
  if (isPolyTool(s) && ui.mode === 'poly' && ui.draft.length) {
    const dp = ui.hover ? [...ui.draft, ui.hover] : ui.draft;
    draftLine = ptsAttr(dp);
    ui.draft.forEach((p, i) =>
      handles.push({ key: 'd' + i, x: p[0] * sc, y: p[1] * sc, kind: i > 0 ? 'draft' : ui.draft.length >= 3 ? 'draftClosable' : 'draftFirst' }),
    );
    edgeLabels.push(...edgesOf(dp, false, 'd', 'draft', sc));
  }
  if (isPolyTool(s) && ui.mode === 'rect' && ui.rectStart && ui.hover) {
    const rp = rectPoints(ui.rectStart, ui.hover);
    draftRect = ptsAttr(rp);
    edgeLabels.push(...edgesOf(rp, true, 'r', 'draft', sc).slice(0, 2));
  }

  const calibActive = !!bg && ui.bgMode === 'calib';
  let calibLine: string | null = null;
  if (calibActive && ui.calib.length) {
    const cl = calibPoints(s);
    calibLine = ptsAttr(cl);
    ui.calib.forEach((p, i) => handles.push({ key: 'k' + i, x: p[0] * sc, y: p[1] * sc, kind: 'calib' }));
    if (cl.length === 2) {
      edgeLabels.push({ key: 'kal', x: ((cl[0][0] + cl[1][0]) / 2) * sc, y: ((cl[0][1] + cl[1][1]) / 2) * sc, text: fmtLen(dist(cl[0], cl[1])), tone: 'calib' });
    }
  }

  const step = tickStep(sc);
  const ticksX: Tick[] = [], ticksY: Tick[] = [];
  for (let v = 0; v <= W + 1e-9; v += step) ticksX.push({ key: 'x' + v, pos: v * sc, label: String(v) });
  for (let v = 0; v <= H + 1e-9; v += step) ticksY.push({ key: 'y' + v, pos: v * sc, label: String(v) });

  return {
    W, H, scale: sc, widthPx: W * sc, heightPx: H * sc,
    cursor: bg && ui.bgMode === 'move' ? 'move' : calibActive || ui.tool !== 'select' ? 'crosshair' : 'default',
    bg: bg && bg.visible ? { src: bg.src, left: bg.x * sc, top: bg.y * sc, width: bg.w * sc, height: bg.w * bg.aspect * sc, opacity: bg.opacity } : null,
    polys, bounds, points, selection, draftLine, draftRect, calibLine, labels, edgeLabels, handles, ticksX, ticksY,
  };
}

export function draftInfo(s: AppState): string {
  const { draft, hover } = s.ui;
  if (!draft.length) return 'Kliknij na planie pierwszy punkt';
  let out = 'Punkty: ' + draft.length;
  if (hover) {
    const l = draft[draft.length - 1];
    out += ' · odcinek ' + fmtLen(dist(l, hover)) + ' · ' + displayAngle(l, hover) + '°';
  }
  return out;
}

export function calibInfo(s: AppState): string {
  const cl = calibPoints(s);
  if (cl.length < 2) return 'Kliknij pierwszy punkt na mapce';
  const d = fmtLen(dist(cl[0], cl[1]));
  return (s.ui.calib.length === 2 ? 'Odcinek na mapce: ' : 'Teraz drugi punkt · ') + d + ' w obecnej skali';
}

export function stageTip(s: AppState): string {
  const { ui } = s;
  const bg = s.doc.plan.bg;
  if (bg && ui.bgMode === 'calib') return 'Kalibracja: kliknij dwa punkty na mapce o znanej odległości, wpisz ją po lewej i zastosuj.';
  if (bg && ui.bgMode === 'move') return 'Przeciągnij, aby przesunąć mapkę pod planem.';
  if (isPolyTool(s) && ui.mode === 'poly') {
    return ui.draft.length >= 3
      ? 'Kliknij pierwszy (niebieski) punkt albo kliknij dwukrotnie, aby zamknąć kształt.'
      : 'Klikaj kolejne narożniki. Długość i kąt możesz też wpisać po lewej.';
  }
  if (isPolyTool(s)) return 'Przeciągnij, aby narysować prostokąt.';
  if (ui.tool !== 'select') return 'Kliknij, aby posadzić. Narzędzie zostaje aktywne, możesz sadzić dalej.';
  if (selectSelected(s)) return 'Przeciągnij element, aby go przesunąć. Kwadratowe uchwyty przesuwają narożniki.';
  return 'Wybierz narzędzie po lewej. Kliknij element na planie, aby go edytować.';
}

export function coordsText(hover: Pt | null): string {
  return hover ? `X ${fmtLen(hover[0])}   Y ${fmtLen(hover[1])}` : 'Najedź na plan';
}

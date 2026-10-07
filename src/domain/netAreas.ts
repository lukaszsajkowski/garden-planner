import { CATALOG, ORDER_POINT, ORDER_POLY, isPoly } from './catalog';
import { fmtArea } from './format';
import { area, bbox, pointInPolygon, type BBox } from './geometry';
import type { PointType, PolyShape, PolyType, Pt, Shape } from './types';

export type AreaType = Exclude<PolyType, 'boundary'>;
export type NetAreas = Partial<Record<AreaType, number>> & { free: number };

const RES = 0.2;

export function netAreas(shapes: Shape[]): NetAreas {
  const bnds: PolyShape[] = [];
  const polys: { sh: PolyShape; i: number; b: BBox }[] = [];
  shapes.forEach((sh, i) => {
    if (!isPoly(sh) || sh.pts.length < 3) return;
    if (sh.type === 'boundary') bnds.push(sh);
    else polys.push({ sh, i, b: bbox(sh.pts) });
  });
  polys.sort((a, b) => CATALOG[b.sh.type].z - CATALOG[a.sh.type].z || b.i - a.i);

  const out: NetAreas = { free: 0 };
  const boxes = bnds.length ? bnds.map((b) => bbox(b.pts)) : polys.map((p) => p.b);
  if (!boxes.length) return out;
  const B: BBox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    B[0] = Math.min(B[0], b[0]);
    B[1] = Math.min(B[1], b[1]);
    B[2] = Math.max(B[2], b[2]);
    B[3] = Math.max(B[3], b[3]);
  }
  const cell = RES * RES;
  for (let x = B[0] + RES / 2; x < B[2]; x += RES) {
    for (let y = B[1] + RES / 2; y < B[3]; y += RES) {
      const p: Pt = [x, y];
      if (bnds.length && !bnds.some((b) => pointInPolygon(p, b.pts))) continue;
      const hit = polys.find((q) => x >= q.b[0] && x <= q.b[2] && y >= q.b[1] && y <= q.b[3] && pointInPolygon(p, q.sh.pts));
      if (hit) {
        const t = hit.sh.type as AreaType;
        out[t] = (out[t] ?? 0) + cell;
      } else {
        out.free += cell;
      }
    }
  }
  return out;
}

export interface Summary {
  plot: number;
  net: NetAreas;
  pbc: number | null;
  counts: Partial<Record<PointType, number>>;
}

export function summarize(shapes: Shape[]): Summary {
  const net = netAreas(shapes);
  let plot = 0;
  const counts: Partial<Record<PointType, number>> = {};
  for (const sh of shapes) {
    if (isPoly(sh)) {
      if (sh.type === 'boundary') plot += area(sh.pts);
    } else {
      counts[sh.type] = (counts[sh.type] ?? 0) + 1;
    }
  }
  const pbc = plot ? Math.round((((net.grass ?? 0) + (net.bed ?? 0)) / plot) * 100) : null;
  return { plot, net, pbc, counts };
}

export interface SummaryRow { key: string; label: string; value: string }

export function summaryRows(s: Summary): SummaryRow[] {
  const rows: SummaryRow[] = [];
  for (const k of ORDER_POLY) {
    if (k === 'boundary') continue;
    const v = s.net[k] ?? 0;
    if (v > 0.001) rows.push({ key: k, label: CATALOG[k].label, value: fmtArea(v) });
  }
  if (s.plot && s.net.free > 0.05) rows.push({ key: 'free', label: 'Niezagospodarowane', value: fmtArea(s.net.free) });
  for (const k of ORDER_POINT) {
    const n = s.counts[k];
    if (n) rows.push({ key: k, label: CATALOG[k].label, value: `${n} szt.` });
  }
  return rows;
}

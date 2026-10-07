import type { Pt } from './types';

export type BBox = [number, number, number, number];

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function area(p: Pt[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    a += p[i][0] * q[1] - q[0] * p[i][1];
  }
  return Math.abs(a) / 2;
}

export function perimeter(p: Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) s += dist(p[i], p[(i + 1) % p.length]);
  return s;
}

export function bbox(p: Pt[]): BBox {
  const b: BBox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const q of p) {
    b[0] = Math.min(b[0], q[0]);
    b[1] = Math.min(b[1], q[1]);
    b[2] = Math.max(b[2], q[0]);
    b[3] = Math.max(b[3], q[1]);
  }
  return b;
}

export function centroid(p: Pt[]): Pt {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    const f = p[i][0] * q[1] - q[0] * p[i][1];
    a += f;
    cx += (p[i][0] + q[0]) * f;
    cy += (p[i][1] + q[1]) * f;
  }
  if (Math.abs(a) < 1e-9) {
    const b = bbox(p);
    return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export function pointInPolygon(pt: Pt, p: Pt[]): boolean {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function segmentDistance(p: Pt, a: Pt, b: Pt): { d: number; q: Pt } {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  const q: Pt = [a[0] + t * dx, a[1] + t * dy];
  return { d: dist(p, q), q };
}

export function rectPoints(a: Pt, b: Pt): Pt[] {
  const x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]);
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}

export function ptsAttr(p: Pt[]): string {
  return p.map((q) => q[0] + ',' + q[1]).join(' ');
}

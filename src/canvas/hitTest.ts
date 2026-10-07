import { CATALOG, isPoly } from '../domain/catalog';
import { dist, pointInPolygon, segmentDistance } from '../domain/geometry';
import type { Pt, Shape } from '../domain/types';
import { HIT_PX } from './coords';

export function hitTest(shapes: Shape[], raw: Pt, scale: number): Shape | null {
  const thr = HIT_PX / scale;
  const list = shapes
    .map((sh, i) => ({ sh, i }))
    .sort((a, b) => CATALOG[b.sh.type].z - CATALOG[a.sh.type].z || b.i - a.i)
    .map((o) => o.sh);
  for (const sh of list) {
    if (!isPoly(sh) && dist([sh.x, sh.y], raw) <= Math.max(sh.r * 0.75, thr)) return sh;
  }
  for (const sh of list) {
    if (isPoly(sh) && sh.type === 'boundary' && sh.pts.some((p, k) => segmentDistance(raw, p, sh.pts[(k + 1) % sh.pts.length]).d <= thr)) return sh;
  }
  for (const sh of list) {
    if (isPoly(sh) && sh.type !== 'boundary' && pointInPolygon(raw, sh.pts)) return sh;
  }
  return null;
}

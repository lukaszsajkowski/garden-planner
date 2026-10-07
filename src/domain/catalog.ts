import type { PointType, PolyShape, PolyType, Shape, ShapeType } from './types';

export interface TypeInfo { label: string; kind: 'poly' | 'point'; z: number; r?: number }

export const CATALOG: Record<ShapeType, TypeInfo> = {
  boundary: { label: 'Granica działki', kind: 'poly', z: 0 },
  grass: { label: 'Trawnik', kind: 'poly', z: 1 },
  gravel: { label: 'Żwir', kind: 'poly', z: 2 },
  paving: { label: 'Kostka brukowa', kind: 'poly', z: 2 },
  bed: { label: 'Rabata', kind: 'poly', z: 3 },
  house: { label: 'Dom / budynek', kind: 'poly', z: 4 },
  shrub: { label: 'Krzew', kind: 'point', z: 5, r: 0.6 },
  conifer: { label: 'Iglak', kind: 'point', z: 6, r: 1.0 },
  tree: { label: 'Drzewo liściaste', kind: 'point', z: 7, r: 2.5 },
};

export const ORDER_POLY: PolyType[] = ['boundary', 'grass', 'paving', 'gravel', 'bed', 'house'];
export const ORDER_POINT: PointType[] = ['tree', 'conifer', 'shrub'];
export const ZOOMS = [8, 12, 16, 20, 28, 36, 48, 64, 80];
export const DEFAULT_ZOOM = 28;
export const HISTORY_LIMIT = 80;
export const STORAGE_KEY = 'planer-ogrodu-v1';
export const PLOT_MIN = 5;
export const PLOT_MAX = 500;
export const DEFAULT_PLOT = { W: 30, H: 22 };

export function isShapeType(v: unknown): v is ShapeType {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(CATALOG, v);
}
export function isPolyType(t: ShapeType): t is PolyType {
  return CATALOG[t].kind === 'poly';
}
export function isPoly(s: Shape): s is PolyShape {
  return isPolyType(s.type);
}
export function defaultRadius(t: PointType): number {
  return CATALOG[t].r!;
}

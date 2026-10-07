import { DEFAULT_PLOT, PLOT_MAX, PLOT_MIN, defaultRadius, isPolyType, isShapeType } from './catalog';
import type { Background, Plan, Pt, Shape } from './types';

export class PlanFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanFileError';
  }
}

const NOT_A_PLAN = 'to nie jest plik planu ogrodu';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function serializePlan(plan: Plan, now: Date = new Date()): string {
  return JSON.stringify({ app: 'planer-ogrodu', version: 1, savedAt: now.toISOString(), W: plan.W, H: plan.H, shapes: plan.shapes, bg: plan.bg });
}

export function parsePlan(text: string, newId: () => string): Plan {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new PlanFileError(NOT_A_PLAN);
  }
  return validatePlan(data, newId);
}

export function validatePlan(data: unknown, newId: () => string): Plan {
  if (!data || typeof data !== 'object' || !Array.isArray((data as { shapes?: unknown }).shapes)) {
    throw new PlanFileError(NOT_A_PLAN);
  }
  const d = data as Record<string, unknown>;
  const shapes: Shape[] = [];
  for (const raw of d.shapes as unknown[]) {
    const s = validateShape(raw, newId);
    if (s) shapes.push(s);
  }
  return {
    W: isNum(d.W) ? clamp(d.W, PLOT_MIN, PLOT_MAX) : DEFAULT_PLOT.W,
    H: isNum(d.H) ? clamp(d.H, PLOT_MIN, PLOT_MAX) : DEFAULT_PLOT.H,
    shapes,
    bg: validateBackground(d.bg),
  };
}

function validateShape(raw: unknown, newId: () => string): Shape | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const type = r.type;
  if (!isShapeType(type)) return null;
  const id = typeof r.id === 'string' ? r.id : newId();
  let shape: Shape;
  if (isPolyType(type)) {
    if (!Array.isArray(r.pts)) return null;
    const pts: Pt[] = (r.pts as unknown[])
      .filter((p): p is [number, number] => Array.isArray(p) && isNum(p[0]) && isNum(p[1]))
      .map((p) => [p[0], p[1]]);
    if (pts.length < 3) return null;
    shape = { id, type, pts };
  } else {
    if (!isNum(r.x) || !isNum(r.y)) return null;
    shape = { id, type, x: r.x, y: r.y, r: isNum(r.r) && r.r > 0 ? r.r : defaultRadius(type) };
  }
  if (typeof r.name === 'string') shape.name = r.name.slice(0, 80);
  return shape;
}

function validateBackground(raw: unknown): Background | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.src !== 'string' || !b.src.startsWith('data:image/')) return null;
  if (!isNum(b.w) || b.w <= 0 || !isNum(b.aspect) || b.aspect <= 0) return null;
  return {
    src: b.src,
    x: isNum(b.x) ? b.x : 0,
    y: isNum(b.y) ? b.y : 0,
    w: b.w,
    aspect: b.aspect,
    opacity: isNum(b.opacity) ? clamp(b.opacity, 0.1, 1) : 0.6,
    visible: b.visible !== false,
  };
}

import { round2 } from './format';
import { dist } from './geometry';
import type { Pt } from './types';

export function snapValue(v: number, step: number): number {
  return step ? round2(Math.round(v / step) * step) : round2(v);
}

export function snapPoint(p: Pt, step: number): Pt {
  return [snapValue(p[0], step), snapValue(p[1], step)];
}

export function draftPoint(raw: Pt, last: Pt | null, opts: { step: number; angleSnap: boolean }): Pt {
  if (!last || !opts.angleSnap) return snapPoint(raw, opts.step);
  const q = Math.PI / 12;
  const a = Math.round(Math.atan2(raw[1] - last[1], raw[0] - last[0]) / q) * q;
  let len = dist(raw, last);
  if (opts.step) len = Math.round(len / opts.step) * opts.step;
  return [round2(last[0] + len * Math.cos(a)), round2(last[1] + len * Math.sin(a))];
}

export function pointFromSegment(last: Pt, len: number, deg: number): Pt {
  const rad = (deg * Math.PI) / 180;
  return [round2(last[0] + len * Math.cos(rad)), round2(last[1] - len * Math.sin(rad))];
}

export function displayAngle(last: Pt, hover: Pt): number {
  let ang = (Math.atan2(-(hover[1] - last[1]), hover[0] - last[0]) * 180) / Math.PI;
  if (ang < 0) ang += 360;
  return Math.round(ang) || 0; // || 0 zamienia -0 na 0
}

import { PLOT_MAX } from './catalog';
import { round2 } from './format';
import { dist } from './geometry';
import type { Background, Pt } from './types';

export function fitBackgroundWidth(W: number, H: number, aspect: number): number {
  let bw = W;
  if (bw * aspect > H) bw = H / aspect;
  return Math.round(bw * 1000) / 1000;
}

export function newBackground(src: string, aspect: number, W: number, H: number): Background {
  return { src, x: 0, y: 0, w: fitBackgroundWidth(W, H, aspect), aspect, opacity: 0.6, visible: true };
}

export function applyCalibration(bg: Background, calib: Pt[], real: number, W: number, H: number): { bg: Background; W: number; H: number } | null {
  if (calib.length < 2 || !(real > 0)) return null;
  const [p, q] = calib;
  const measured = dist(p, q);
  if (measured < 1e-6) return null;
  const f = real / measured;
  const nb: Background = {
    ...bg,
    w: Math.round(bg.w * f * 10000) / 10000,
    x: Math.max(0, round2(p[0] - (p[0] - bg.x) * f)),
    y: Math.max(0, round2(p[1] - (p[1] - bg.y) * f)),
  };
  return {
    bg: nb,
    W: Math.min(PLOT_MAX, Math.max(W, Math.ceil(nb.x + nb.w))),
    H: Math.min(PLOT_MAX, Math.max(H, Math.ceil(nb.y + nb.w * nb.aspect))),
  };
}

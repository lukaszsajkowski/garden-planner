import { material } from '../design/tokens';
import type { PointType, PolyType } from '../domain/types';

export interface PolyStyle { fill: string; stroke: string; sw: number; dash: string; solid: string; toolDash: string }
export interface PointStyle { fill: string; stroke: string; centerDot: boolean }

type RawPoly = { fill: string; stroke: string; strokeWidth: number; dash?: string; toolDash?: string; solid?: string };
type RawPoint = { fill: string; stroke: string; centerDot: boolean };

export function polyStyle(t: PolyType): PolyStyle {
  const m = material[t] as unknown as RawPoly;
  const fill = m.fill.startsWith('pattern:') ? `url(#pat-${m.fill.slice('pattern:'.length)})` : m.fill;
  return { fill, stroke: m.stroke, sw: m.strokeWidth, dash: m.dash ?? 'none', solid: m.solid ?? 'transparent', toolDash: m.toolDash ?? 'none' };
}

export function pointStyle(t: PointType): PointStyle {
  const m = material[t] as unknown as RawPoint;
  return { fill: m.fill, stroke: m.stroke, centerDot: m.centerDot };
}

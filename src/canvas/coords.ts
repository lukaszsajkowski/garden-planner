import { canvasTokens } from '../design/tokens';
import type { Pt } from '../domain/types';

export const HIT_PX = canvasTokens.hitPx;
export const VERTEX_PX = canvasTokens.vertexGrabPx;
export const CLOSE_PX = canvasTokens.closeDraftPx;
export const EDGE_INSERT_PX = canvasTokens.edgeInsertPx;

export function toMeters(clientX: number, clientY: number, rect: { left: number; top: number }, scale: number): Pt {
  return [(clientX - rect.left) / scale, (clientY - rect.top) / scale];
}

import { HISTORY_LIMIT } from '../domain/catalog';
import type { Shape } from '../domain/types';

export function pushPast(past: Shape[][], shapes: Shape[]): Shape[][] {
  const next = past.concat([shapes]);
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

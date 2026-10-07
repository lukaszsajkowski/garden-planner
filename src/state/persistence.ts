import { STORAGE_KEY } from '../domain/catalog';
import { newId } from '../domain/ids';
import { parsePlan } from '../domain/planFile';
import type { Plan } from '../domain/types';

export function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSaved(storage: Storage | null): Plan | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? parsePlan(raw, newId) : null;
  } catch {
    return null;
  }
}

export function savePlan(storage: Storage | null, plan: Plan): void {
  if (!storage) return;
  const data = { shapes: plan.shapes, W: plan.W, H: plan.H, bg: plan.bg };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, bg: null }));
    } catch {
      /* brak miejsca: autozapis pomijamy (PRD F-9.4) */
    }
  }
}

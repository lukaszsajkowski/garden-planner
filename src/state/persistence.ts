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

/** `unavailable`: brak localStorage (np. tryb prywatny), aplikacja działa dalej bez autozapisu. */
export type SaveResult = 'saved' | 'withoutBackground' | 'failed' | 'unavailable';

export function savePlan(storage: Storage | null, plan: Plan): SaveResult {
  if (!storage) return 'unavailable';
  const data = { shapes: plan.shapes, W: plan.W, H: plan.H, bg: plan.bg };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return 'saved';
  } catch {
    if (!data.bg) return 'failed';
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, bg: null }));
      return 'withoutBackground';
    } catch {
      /* brak miejsca: autozapis pomijamy (PRD F-9.4) */
      return 'failed';
    }
  }
}

/** Ostrzeżenie dla użytkownika, gdy autozapis nie objął całego planu (PRD F-9.4). */
export function saveWarning(r: SaveResult): string | null {
  if (r === 'withoutBackground') return 'Mapka nie mieści się w pamięci przeglądarki, więc autozapis ją pomija. Użyj „Zapisz plik”, żeby jej nie stracić.';
  if (r === 'failed') return 'Plan nie mieści się w pamięci przeglądarki i nie zapisuje się automatycznie. Użyj „Zapisz plik”, żeby go nie stracić.';
  return null;
}

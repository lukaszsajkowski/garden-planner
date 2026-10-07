import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from 'react';
import { samplePlan } from '../domain/sample';
import { getStorage, loadSaved, savePlan } from './persistence';
import { rootReducer, type AppAction, type AppState } from './rootReducer';
import { initialUi } from './uiReducer';

/** Seria zmian (np. przeciąganie z mapką w data URL) daje jeden zapis do localStorage po ustaniu ruchu. */
export const AUTOSAVE_DELAY_MS = 300;

const StateCtx =createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<AppAction> | null>(null);

export function initAppState(storage: Storage | null): AppState {
  return { doc: { plan: loadSaved(storage) ?? samplePlan(), past: [] }, ui: initialUi };
}

export function AppProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(rootReducer, initial, (i: AppState | undefined) => i ?? initAppState(getStorage()));
  const plan = state.doc.plan;
  const latest = useRef(plan);
  useEffect(() => {
    latest.current = plan;
    const t = setTimeout(() => savePlan(getStorage(), plan), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [plan]);
  useEffect(() => {
    // Zamknięcie karty przed upływem opóźnienia nie może zgubić ostatniej zmiany.
    const flush = () => savePlan(getStorage(), latest.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);
  return (
    <DispatchCtx.Provider value={dispatch}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </DispatchCtx.Provider>
  );
}

export function useAppState(): AppState {
  const s = useContext(StateCtx);
  if (!s) throw new Error('useAppState użyty poza AppProvider');
  return s;
}

export function useAppDispatch(): Dispatch<AppAction> {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error('useAppDispatch użyty poza AppProvider');
  return d;
}

import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { samplePlan } from '../domain/sample';
import { getStorage, loadSaved, savePlan } from './persistence';
import { rootReducer, type AppAction, type AppState } from './rootReducer';
import { initialUi } from './uiReducer';

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<AppAction> | null>(null);

export function initAppState(storage: Storage | null): AppState {
  return { doc: { plan: loadSaved(storage) ?? samplePlan(), past: [] }, ui: initialUi };
}

export function AppProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(rootReducer, initial, (i: AppState | undefined) => i ?? initAppState(getStorage()));
  const plan = state.doc.plan;
  useEffect(() => {
    savePlan(getStorage(), plan);
  }, [plan]);
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

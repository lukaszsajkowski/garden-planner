import type { Plan, Shape } from '../domain/types';
import type { AppState } from '../state/rootReducer';
import { initialUi, type UiState } from '../state/uiReducer';

export function makeState(p: { plan?: Partial<Plan>; ui?: Partial<UiState>; past?: Shape[][] } = {}): AppState {
  return {
    doc: { plan: { W: 30, H: 22, shapes: [], bg: null, ...p.plan }, past: p.past ?? [] },
    ui: { ...initialUi, ...p.ui },
  };
}

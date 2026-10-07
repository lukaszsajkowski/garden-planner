import { planReducer, type DocState, type PlanAction } from './planReducer';
import { uiReducer, type UiAction, type UiState } from './uiReducer';

export interface AppState { doc: DocState; ui: UiState }
export type AppAction = PlanAction | UiAction;

export function isPlanAction(a: AppAction): a is PlanAction {
  return a.type.startsWith('plan/');
}

function uiAfterPlan(ui: UiState, a: PlanAction): UiState {
  switch (a.type) {
    case 'plan/add':
      return { ...ui, sel: a.shape.id, draft: [], rectStart: null, tool: a.keepTool ? ui.tool : 'select' };
    case 'plan/duplicate':
      return { ...ui, sel: a.newId, tool: 'select' };
    case 'plan/remove':
    case 'plan/undo':
      return { ...ui, sel: null };
    case 'plan/load':
      return { ...ui, sel: null, draft: [], rectStart: null, tool: 'select', bgMode: null, calib: [] };
    case 'plan/loadSample':
      return { ...ui, sel: null, draft: [], rectStart: null, tool: 'select' };
    case 'plan/clear':
      return { ...ui, sel: null, draft: [], rectStart: null, tool: 'boundary', mode: 'poly' };
    case 'plan/setBackground':
      return a.bg ? ui : { ...ui, bgMode: null, calib: [] };
    default:
      return ui;
  }
}

export function rootReducer(s: AppState, a: AppAction): AppState {
  if (isPlanAction(a)) {
    const doc = planReducer(s.doc, a);
    return doc === s.doc ? s : { doc, ui: uiAfterPlan(s.ui, a) };
  }
  const ui = uiReducer(s.ui, a);
  return ui === s.ui ? s : { ...s, ui };
}

import { useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { newId } from '../domain/ids';
import type { Pt } from '../domain/types';
import type { AppAction } from '../state/rootReducer';
import { useAppDispatch, useAppState } from '../state/store';
import { toMeters } from './coords';
import type { StageHandlers } from './PlanStage';
import { doubleClick, pointerDown, pointerMove, pointerUp, type Drag } from './pointer';

export function usePointerTools(): StageHandlers {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const stateRef = useRef(state);
  stateRef.current = state;
  const drag = useRef<Drag | null>(null);

  const run = (actions: AppAction[]) => actions.forEach(dispatch);
  const at = (e: MouseEvent<HTMLDivElement>): Pt =>
    toMeters(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), stateRef.current.ui.scale);

  return {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      if (e.button !== 0) return;
      const r = pointerDown(stateRef.current, at(e), newId);
      drag.current = r.drag;
      if (r.capture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* przeglądarka bez pointer capture */
        }
      }
      run(r.actions);
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      const r = pointerMove(stateRef.current, at(e), drag.current);
      drag.current = r.drag;
      run(r.actions);
    },
    onPointerUp(e: PointerEvent<HTMLDivElement>) {
      const actions = pointerUp(stateRef.current, at(e), newId);
      drag.current = null;
      run(actions);
    },
    onPointerLeave() {
      if (!drag.current && !stateRef.current.ui.rectStart) dispatch({ type: 'ui/hover', pt: null });
    },
    onDoubleClick(e: MouseEvent<HTMLDivElement>) {
      run(doubleClick(stateRef.current, at(e), newId));
    },
  };
}

import { useAppDispatch, useAppState } from '../state/store';
import { Button } from '../ui/primitives/Button';
import s from './canvas.module.css';
import { PlanStage } from './PlanStage';
import { buildStageModel, coordsText, stageTip, tickStep } from './stageModel';
import { usePointerTools } from './usePointerTools';

export function PlanView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const handlers = usePointerTools();
  const model = buildStageModel(state);
  const bar = tickStep(model.scale);
  return (
    <section className={s.view} aria-label="Plan">
      <div className={s.toolbar}>
        <div className={s.zoom}>
          <Button size="icon" aria-label="Oddal" onClick={() => dispatch({ type: 'ui/zoom', dir: -1 })}>−</Button>
          <span className={s.zoomLabel}>1 m = {model.scale} px</span>
          <Button size="icon" aria-label="Przybliż" onClick={() => dispatch({ type: 'ui/zoom', dir: 1 })}>+</Button>
        </div>
        <div className={s.scaleBar}>
          <div className={s.bar} style={{ width: bar * model.scale }} />
          <span>{bar} m</span>
        </div>
        <span className={s.coords}>{coordsText(state.ui.hover)}</span>
      </div>
      <div className={s.well}>
        <div className={s.pad}>
          <PlanStage model={model} handlers={handlers} />
        </div>
      </div>
      <p className={s.tip}>{stageTip(state)}</p>
    </section>
  );
}

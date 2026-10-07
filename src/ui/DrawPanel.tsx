import { finishDraftActions } from '../canvas/pointer';
import { draftInfo } from '../canvas/stageModel';
import { CATALOG, isPolyType } from '../domain/catalog';
import { parseNum, round2 } from '../domain/format';
import { rectPoints } from '../domain/geometry';
import { newId } from '../domain/ids';
import { pointFromSegment } from '../domain/snapping';
import { useAppDispatch, useAppState } from '../state/store';
import type { DrawInputKey } from '../state/uiReducer';
import { cx } from './cx';
import s from './panels.module.css';
import { Button } from './primitives/Button';
import { Segmented } from './primitives/controls';
import { StrField } from './primitives/fields';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

export function DrawPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { ui } = state;
  const tool = ui.tool;
  if (tool === 'select' || !isPolyType(tool)) return null;

  const field = (key: DrawInputKey) => ({
    value: ui.drawInputs[key],
    onChange: (value: string) => dispatch({ type: 'ui/setDrawInput', key, value }),
  });
  const num = (key: DrawInputKey) => parseNum(ui.drawInputs[key]);

  const addStart = () => {
    const x = num('startX'), y = num('startY');
    if (Number.isNaN(x) || Number.isNaN(y)) return;
    dispatch({ type: 'ui/draftSet', pts: [[round2(x), round2(y)]] });
  };
  const addSegment = () => {
    const len = num('segLen'), ang = num('segAng');
    if (!ui.draft.length || Number.isNaN(len) || len <= 0 || Number.isNaN(ang)) return;
    dispatch({ type: 'ui/draftAdd', pt: pointFromSegment(ui.draft[ui.draft.length - 1], len, ang) });
  };
  const insertRect = () => {
    const x = num('startX'), y = num('startY'), w = num('rectW'), h = num('rectH');
    if (Number.isNaN(x) || Number.isNaN(y) || !(w > 0) || !(h > 0)) return;
    dispatch({ type: 'plan/add', shape: { id: newId(), type: tool, pts: rectPoints([round2(x), round2(y)], [round2(x + w), round2(y + h)]) } });
  };

  return (
    <Panel title={`Rysowanie: ${CATALOG[tool].label}`}>
      <Segmented<'poly' | 'rect'>
        options={[{ value: 'poly', label: 'Wielokąt' }, { value: 'rect', label: 'Prostokąt' }]}
        value={ui.mode}
        onChange={(mode) => dispatch({ type: 'ui/setMode', mode })}
        columns={2}
      />
      {ui.mode === 'poly' ? (
        <>
          <p className={p.text}>Klikaj kolejne narożniki. Zamknij kształt klikając pierwszy punkt, dwuklikiem albo przyciskiem.</p>
          <p className={cx(p.monoInfo, s.draftInfo)}>{draftInfo(state)}</p>
          {ui.draft.length === 0 ? (
            <div className={s.stack8}>
              <div className={p.grid2}>
                <StrField label="Start X (m)" {...field('startX')} />
                <StrField label="Start Y (m)" {...field('startY')} />
              </div>
              <Button onClick={addStart}>Ustaw punkt startowy</Button>
            </div>
          ) : (
            <div className={s.stack8}>
              <div className={p.grid2}>
                <StrField label="Długość (m)" {...field('segLen')} />
                <StrField label="Kąt (°)" {...field('segAng')} />
              </div>
              <p className={p.hint}>0° w prawo, 90° w górę, 180° w lewo, 270° w dół</p>
              <Button variant="outlineDraft" onClick={addSegment}>Dodaj odcinek</Button>
            </div>
          )}
          <div className={p.row}>
            <Button variant="primary" disabled={ui.draft.length < 3} onClick={() => finishDraftActions(state, newId).forEach(dispatch)}>Zamknij kształt</Button>
            <Button disabled={!ui.draft.length} onClick={() => dispatch({ type: 'ui/draftPop' })}>Cofnij punkt</Button>
            <Button disabled={!ui.draft.length} onClick={() => dispatch({ type: 'ui/draftSet', pts: [] })}>Anuluj</Button>
          </div>
        </>
      ) : (
        <>
          <p className={p.text}>Przeciągnij na planie albo wpisz wymiary i wstaw dokładnie.</p>
          <div className={p.grid2}>
            <StrField label="X (m)" {...field('startX')} />
            <StrField label="Y (m)" {...field('startY')} />
            <StrField label="Szerokość (m)" {...field('rectW')} />
            <StrField label="Głębokość (m)" {...field('rectH')} />
          </div>
          <Button variant="primary" onClick={insertRect}>Wstaw prostokąt</Button>
        </>
      )}
    </Panel>
  );
}

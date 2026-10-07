import { useAppDispatch, useAppState } from '../state/store';
import s from './panels.module.css';
import { Segmented, Toggle } from './primitives/controls';
import { NumberField } from './primitives/fields';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

const STEPS = [
  { value: 1, label: '1 m' },
  { value: 0.5, label: '0,5 m' },
  { value: 0.1, label: '0,1 m' },
  { value: 0, label: 'Wył.' },
];
const TOGGLES = [
  ['angleSnap', 'Kąty co 15° przy rysowaniu'],
  ['showDims', 'Wymiary granicy działki'],
  ['showLabels', 'Nazwy i powierzchnie'],
] as const;

export function GridPanel() {
  const { ui, doc } = useAppState();
  const dispatch = useAppDispatch();
  return (
    <Panel title="Przyciąganie do siatki">
      <Segmented<number> options={STEPS} value={ui.step} onChange={(step) => dispatch({ type: 'ui/setStep', step })} columns={4} />
      <div className={s.stack4}>
        {TOGGLES.map(([key, label]) => (
          <Toggle key={key} pressed={ui[key]} label={label} onToggle={() => dispatch({ type: 'ui/toggle', key })} />
        ))}
      </div>
      <h2 className={s.subTitle}>Obszar rysunku</h2>
      <div className={p.grid2}>
        <NumberField label="Szerokość (m)" value={doc.plan.W} onValue={(W) => dispatch({ type: 'plan/setPlotSize', W })} />
        <NumberField label="Głębokość (m)" value={doc.plan.H} onValue={(H) => dispatch({ type: 'plan/setPlotSize', H })} />
      </div>
    </Panel>
  );
}

import { fmtArea } from '../domain/format';
import { summaryRows } from '../domain/netAreas';
import { selectSummary } from '../state/selectors';
import { useAppState } from '../state/store';
import s from './panels.module.css';
import { Panel, StatTile } from './primitives/layout';
import p from './primitives/primitives.module.css';

export function SummaryPanel() {
  const sum = selectSummary(useAppState());
  return (
    <Panel title="Podsumowanie">
      <div className={p.grid2}>
        <StatTile label="Działka" value={sum.plot ? fmtArea(sum.plot) : '—'} />
        <StatTile label="Biologicznie czynna" value={sum.pbc === null ? '—' : `${sum.pbc}%`} />
      </div>
      <div>
        {summaryRows(sum).map((r) => (
          <div key={r.key} className={s.summaryRow}>
            <span>{r.label}</span>
            <span className={s.mono}>{r.value}</span>
          </div>
        ))}
      </div>
      <p className={s.footnote}>Powierzchnie liczone są tak, jak widać je na planie: to, co przykrywa dom albo kostka, nie wlicza się do trawnika.</p>
    </Panel>
  );
}

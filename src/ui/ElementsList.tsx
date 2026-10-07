import { CATALOG, isPoly } from '../domain/catalog';
import { fmtArea, fmtNum } from '../domain/format';
import { area } from '../domain/geometry';
import { useAppDispatch, useAppState } from '../state/store';
import s from './panels.module.css';
import { Panel } from './primitives/layout';

export function ElementsList() {
  const { doc, ui } = useAppState();
  const dispatch = useAppDispatch();
  const shapes = doc.plan.shapes;
  return (
    <Panel title="Elementy planu">
      {shapes.length === 0 ? (
        <p className={s.empty}>Plan jest pusty. Zacznij od narzędzia „Granica działki”.</p>
      ) : (
        <div className={s.stack4}>
          {[...shapes].reverse().map((sh) => {
            const label = CATALOG[sh.type].label;
            return (
              <button key={sh.id} type="button" className={s.elItem} aria-pressed={ui.sel === sh.id}
                onClick={() => dispatch({ type: 'ui/pickElement', id: sh.id })}>
                <span>{sh.name ? `${sh.name} · ${label}` : label}</span>
                <span className={s.elSub}>{isPoly(sh) ? fmtArea(area(sh.pts)) : `Ø ${fmtNum(sh.r * 2)} m`}</span>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

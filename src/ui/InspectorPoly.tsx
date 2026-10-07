import { CATALOG, ORDER_POLY } from '../domain/catalog';
import { fmtArea, fmtLen } from '../domain/format';
import { area, dist, perimeter } from '../domain/geometry';
import { newId } from '../domain/ids';
import type { PolyShape } from '../domain/types';
import { useAppDispatch } from '../state/store';
import s from './panels.module.css';
import { Button } from './primitives/Button';
import { Chip } from './primitives/controls';
import { NumberField, TextField } from './primitives/fields';
import { GroupTitle, Panel, StatTile } from './primitives/layout';
import p from './primitives/primitives.module.css';

const WITH_RESERVE = new Set(['paving', 'gravel', 'grass']);

export function InspectorPoly({ shape }: { shape: PolyShape }) {
  const dispatch = useAppDispatch();
  const { id, pts } = shape;
  const a = area(pts);
  const checkpoint = () => dispatch({ type: 'plan/checkpoint' });
  return (
    <Panel
      title="Zaznaczony obszar"
      tone="selection"
      action={<Button size="sm" onClick={() => dispatch({ type: 'ui/select', id: null })}>Odznacz</Button>}
    >
      <TextField
        label="Nazwa"
        value={shape.name ?? ''}
        placeholder={CATALOG[shape.type].label}
        onChange={(name) => dispatch({ type: 'plan/update', id, patch: { name } })}
      />
      <div className={s.chips}>
        {ORDER_POLY.map((k) => (
          <Chip key={k} pressed={k === shape.type} onClick={() => dispatch({ type: 'plan/setType', id, shapeType: k })}>
            {CATALOG[k].label}
          </Chip>
        ))}
      </div>
      <div className={p.grid2}>
        <StatTile small label="Powierzchnia" value={fmtArea(a)} />
        <StatTile small label="Obwód" value={fmtLen(perimeter(pts))} />
      </div>
      {WITH_RESERVE.has(shape.type) && (
        <p className={s.reserve}>Do zamówienia z zapasem 5%: <strong>{fmtArea(a * 1.05)}</strong></p>
      )}
      <div>
        <GroupTitle>Wierzchołki (m) · przeciągnij na planie lub wpisz</GroupTitle>
        <div className={s.stack4}>
          {pts.map((pt, i) => (
            <div key={i} className={s.vertexRow}>
              <span className={s.vertexNum}>{i + 1}</span>
              <NumberField hideLabel variant="row" label={`Punkt ${i + 1} X`} value={pt[0]} onBeginEdit={checkpoint}
                onValue={(x) => dispatch({ type: 'plan/moveVertex', id, index: i, pt: [x, pt[1]] })} />
              <NumberField hideLabel variant="row" label={`Punkt ${i + 1} Y`} value={pt[1]} onBeginEdit={checkpoint}
                onValue={(y) => dispatch({ type: 'plan/moveVertex', id, index: i, pt: [pt[0], y] })} />
              <button type="button" className={s.vertexDel} aria-label={`Usuń punkt ${i + 1}`} disabled={pts.length <= 3}
                onClick={() => dispatch({ type: 'plan/deleteVertex', id, index: i })}>×</button>
            </div>
          ))}
        </div>
        <p className={p.hint}>Dwuklik na krawędzi dodaje nowy wierzchołek.</p>
      </div>
      <div>
        <GroupTitle>Długości boków</GroupTitle>
        {pts.map((pt, i) => {
          const j = (i + 1) % pts.length;
          return (
            <div key={i} className={s.edgeRow}>
              <span className={s.edgeNum}>{i + 1}–{j + 1}</span>
              <span>{fmtLen(dist(pt, pts[j]))}</span>
            </div>
          );
        })}
      </div>
      <div className={p.grid2}>
        <Button onClick={() => dispatch({ type: 'plan/duplicate', id, newId: newId() })}>Duplikuj</Button>
        <Button variant="danger" onClick={() => dispatch({ type: 'plan/remove', id })}>Usuń</Button>
      </div>
    </Panel>
  );
}

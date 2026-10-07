import { CATALOG, ORDER_POINT } from '../domain/catalog';
import { newId } from '../domain/ids';
import type { PointShape } from '../domain/types';
import { useAppDispatch } from '../state/store';
import s from './panels.module.css';
import { Button } from './primitives/Button';
import { Chip } from './primitives/controls';
import { NumberField, TextField } from './primitives/fields';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

export function InspectorPoint({ shape }: { shape: PointShape }) {
  const dispatch = useAppDispatch();
  const { id } = shape;
  const checkpoint = () => dispatch({ type: 'plan/checkpoint' });
  return (
    <Panel
      title="Zaznaczona roślina"
      tone="selection"
      action={<Button size="sm" onClick={() => dispatch({ type: 'ui/select', id: null })}>Odznacz</Button>}
    >
      <TextField
        label="Nazwa / gatunek"
        value={shape.name ?? ''}
        placeholder={CATALOG[shape.type].label}
        onChange={(name) => dispatch({ type: 'plan/update', id, patch: { name } })}
      />
      <div className={s.chips}>
        {ORDER_POINT.map((k) => (
          <Chip key={k} pressed={k === shape.type} onClick={() => dispatch({ type: 'plan/setType', id, shapeType: k })}>
            {CATALOG[k].label}
          </Chip>
        ))}
      </div>
      <div className={p.grid3}>
        <NumberField label="X (m)" value={shape.x} onBeginEdit={checkpoint} onValue={(x) => dispatch({ type: 'plan/update', id, patch: { x } })} />
        <NumberField label="Y (m)" value={shape.y} onBeginEdit={checkpoint} onValue={(y) => dispatch({ type: 'plan/update', id, patch: { y } })} />
        <NumberField
          label="Korona Ø (m)"
          value={shape.r * 2}
          onBeginEdit={checkpoint}
          onValue={(d) => {
            if (d > 0) dispatch({ type: 'plan/update', id, patch: { r: d / 2 } });
          }}
        />
      </div>
      <div className={p.grid2}>
        <Button onClick={() => dispatch({ type: 'plan/duplicate', id, newId: newId() })}>Duplikuj</Button>
        <Button variant="danger" onClick={() => dispatch({ type: 'plan/remove', id })}>Usuń</Button>
      </div>
    </Panel>
  );
}

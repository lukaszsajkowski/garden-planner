import { CATALOG, isPolyType } from '../domain/catalog';
import { useAppState } from '../state/store';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

export function PlantPanel() {
  const { ui } = useAppState();
  const tool = ui.tool;
  if (tool === 'select' || isPolyType(tool)) return null;
  return (
    <Panel title={`Sadzenie: ${CATALOG[tool].label}`}>
      <p className={p.text}>Klikaj na planie, aby posadzić. Średnicę korony i dokładną pozycję ustawisz po zaznaczeniu.</p>
    </Panel>
  );
}

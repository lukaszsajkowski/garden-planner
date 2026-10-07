import { isPoly } from '../domain/catalog';
import { selectSelected } from '../state/selectors';
import { useAppState } from '../state/store';
import { ElementsList } from './ElementsList';
import { InspectorPoint } from './InspectorPoint';
import { InspectorPoly } from './InspectorPoly';
import { SummaryPanel } from './SummaryPanel';

export function RightColumn() {
  const sel = selectSelected(useAppState());
  return (
    <>
      {!sel && <SummaryPanel />}
      {sel && isPoly(sel) && <InspectorPoly key={sel.id} shape={sel} />}
      {sel && !isPoly(sel) && <InspectorPoint key={sel.id} shape={sel} />}
      <ElementsList />
    </>
  );
}

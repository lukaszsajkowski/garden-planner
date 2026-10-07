import { screen, within } from '@testing-library/react';
import { samplePlan } from '../domain/sample';
import type { PointShape, PolyShape } from '../domain/types';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { RightColumn } from './RightColumn';

const sample = (ui = {}) => makeState({ plan: { shapes: samplePlan().shapes }, ui });
const shape = (s: ReturnType<typeof sample>, id: string) => s.doc.plan.shapes.find((x) => x.id === id);

describe('SummaryPanel', () => {
  it('shows plot, PBC and net areas for the sample plan', () => {
    renderWithStore(<RightColumn />, sample());
    const panel = within(screen.getByRole('region', { name: 'Podsumowanie' }));
    expect(panel.getByText('508 m²')).toBeInTheDocument();
    expect(panel.getByText('72%')).toBeInTheDocument();
    expect(panel.getByText('Trawnik').nextSibling).toHaveTextContent('338 m²');
    expect(panel.getByText('Krzew').nextSibling).toHaveTextContent('3 szt.');
    expect(panel.getByText(/to, co przykrywa dom albo kostka/)).toBeInTheDocument();
  });
  it('shows dashes for an empty plan', () => {
    renderWithStore(<RightColumn />, makeState());
    expect(within(screen.getByRole('region', { name: 'Podsumowanie' })).getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Plan jest pusty. Zacznij od narzędzia „Granica działki”.')).toBeInTheDocument();
  });
});

describe('InspectorPoly', () => {
  it('shows area, perimeter and vertices; edits a vertex with one history step', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    const insp = within(screen.getByRole('region', { name: 'Zaznaczony obszar' }));
    expect(insp.getByText('88,0 m²')).toBeInTheDocument();
    expect(insp.getByText('38,00 m')).toBeInTheDocument();
    expect(insp.queryByText(/Do zamówienia/)).toBeNull();
    const x1 = insp.getByRole('textbox', { name: 'Punkt 1 X' });
    expect(x1).toHaveValue('6');
    await user.clear(x1);
    await user.type(x1, '5');
    expect((shape(getState(), 'h1') as PolyShape).pts[0]).toEqual([5, 4]);
    expect(getState().doc.past).toHaveLength(1);
  });

  it('deletes vertices down to three', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    const insp = within(screen.getByRole('region', { name: 'Zaznaczony obszar' }));
    await user.click(insp.getByRole('button', { name: 'Usuń punkt 4' }));
    expect((shape(getState(), 'h1') as PolyShape).pts).toHaveLength(3);
    for (const n of [1, 2, 3]) expect(insp.getByRole('button', { name: `Usuń punkt ${n}` })).toBeDisabled();
  });

  it('changes type, name; shows 5% reserve for paving', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    const insp = within(screen.getByRole('region', { name: 'Zaznaczony obszar' }));
    await user.click(insp.getByRole('button', { name: 'Kostka brukowa' }));
    expect(shape(getState(), 'h1')?.type).toBe('paving');
    expect(insp.getByText(/Do zamówienia z zapasem 5%/)).toHaveTextContent('92,4 m²');
    const name = insp.getByLabelText('Nazwa');
    await user.clear(name);
    await user.type(name, 'Garaż');
    expect(shape(getState(), 'h1')?.name).toBe('Garaż');
  });

  it('duplicate, remove and deselect', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    await user.click(screen.getByRole('button', { name: 'Duplikuj' }));
    expect(getState().doc.plan.shapes).toHaveLength(16);
    expect(getState().ui.sel).not.toBe('h1');
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(getState().doc.plan.shapes).toHaveLength(15);
    expect(getState().ui.sel).toBeNull();
    expect(screen.getByRole('region', { name: 'Podsumowanie' })).toBeInTheDocument();
  });

  it('Odznacz returns to the summary', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    await user.click(screen.getByRole('button', { name: 'Odznacz' }));
    expect(getState().ui.sel).toBeNull();
  });
});

describe('InspectorPoint', () => {
  it('edits crown diameter and ignores zero or negative values', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 't1' }));
    const insp = within(screen.getByRole('region', { name: 'Zaznaczona roślina' }));
    const d = insp.getByLabelText('Korona Ø (m)');
    expect(d).toHaveValue('5,6');
    await user.clear(d);
    await user.type(d, '0');
    expect((shape(getState(), 't1') as PointShape).r).toBe(2.8);
    await user.clear(d);
    await user.type(d, '-2');
    expect((shape(getState(), 't1') as PointShape).r).toBe(2.8);
    await user.clear(d);
    await user.type(d, '4');
    expect((shape(getState(), 't1') as PointShape).r).toBe(2);
  });

  it('changing type keeps a custom radius', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 't1' }));
    await user.click(screen.getByRole('button', { name: 'Iglak' }));
    expect(shape(getState(), 't1')).toMatchObject({ type: 'conifer', r: 2.8 });
  });

  it('edits position', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 't1' }));
    const x = screen.getByLabelText('X (m)');
    await user.clear(x);
    await user.type(x, '7,5');
    expect((shape(getState(), 't1') as PointShape).x).toBe(7.5);
  });
});

describe('ElementsList', () => {
  it('lists newest first and selects on click', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ tool: 'grass' }));
    const list = within(screen.getByRole('region', { name: 'Elementy planu' }));
    const items = list.getAllByRole('button');
    expect(items).toHaveLength(15);
    expect(items[0]).toHaveTextContent('Krzew');
    expect(items[0]).toHaveTextContent('Ø 1,2 m');
    await user.click(list.getByRole('button', { name: /^Dom · Dom \/ budynek/ }));
    expect(getState().ui).toMatchObject({ sel: 'h1', tool: 'select' });
    expect(list.getByRole('button', { name: /^Dom · Dom \/ budynek/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

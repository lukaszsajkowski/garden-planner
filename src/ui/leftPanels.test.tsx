import { screen } from '@testing-library/react';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { DrawPanel } from './DrawPanel';
import { GridPanel } from './GridPanel';
import { PlantPanel } from './PlantPanel';
import { ToolsPanel } from './ToolsPanel';

describe('ToolsPanel', () => {
  it('lists tools and switches the active one', async () => {
    const { user, getState } = renderWithStore(<ToolsPanel />, makeState());
    expect(screen.getByRole('button', { name: 'Zaznacz i przesuń' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Zaznacz i przesuń', 'Granica działki', 'Trawnik', 'Kostka brukowa', 'Żwir', 'Rabata', 'Dom / budynek', 'Drzewo liściaste', 'Iglak', 'Krzew',
    ]);
    await user.click(screen.getByRole('button', { name: 'Trawnik' }));
    expect(getState().ui.tool).toBe('grass');
    expect(screen.getByRole('button', { name: 'Trawnik' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('DrawPanel', () => {
  it('is hidden for the select tool and for plants', () => {
    const { container } = renderWithStore(<><DrawPanel /></>, makeState());
    expect(container).toBeEmptyDOMElement();
    renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'tree' } }));
    expect(screen.queryByText(/Rysowanie/)).toBeNull();
  });

  it('inserts a rectangle from typed dimensions', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'grass', mode: 'rect' } }));
    expect(screen.getByRole('region', { name: 'Rysowanie: Trawnik' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Szerokość (m)'));
    await user.type(screen.getByLabelText('Szerokość (m)'), '2,5');
    await user.click(screen.getByRole('button', { name: 'Wstaw prostokąt' }));
    const s = getState();
    expect(s.doc.plan.shapes).toHaveLength(1);
    expect(s.doc.plan.shapes[0]).toMatchObject({ type: 'grass', pts: [[0, 0], [2.5, 0], [2.5, 8], [0, 8]] });
    expect(s.ui.tool).toBe('select');
  });

  it('ignores a rectangle with zero width', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'grass', mode: 'rect' } }));
    await user.clear(screen.getByLabelText('Szerokość (m)'));
    await user.type(screen.getByLabelText('Szerokość (m)'), '0');
    await user.click(screen.getByRole('button', { name: 'Wstaw prostokąt' }));
    expect(getState().doc.plan.shapes).toEqual([]);
  });

  it('builds a polygon from a start point, length and angle', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'bed' } }));
    expect(screen.getByText('Kliknij na planie pierwszy punkt')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Start X (m)'));
    await user.type(screen.getByLabelText('Start X (m)'), '2');
    await user.clear(screen.getByLabelText('Start Y (m)'));
    await user.type(screen.getByLabelText('Start Y (m)'), '8');
    await user.click(screen.getByRole('button', { name: 'Ustaw punkt startowy' }));
    expect(getState().ui.draft).toEqual([[2, 8]]);
    await user.type(screen.getByLabelText('Długość (m)'), '3');
    await user.clear(screen.getByLabelText('Kąt (°)'));
    await user.type(screen.getByLabelText('Kąt (°)'), '90');
    await user.click(screen.getByRole('button', { name: 'Dodaj odcinek' }));
    expect(getState().ui.draft).toEqual([[2, 8], [2, 5]]);
    expect(screen.getByText('Punkty: 2')).toBeInTheDocument();
  });

  it('a length that is not a number adds nothing', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'bed', draft: [[0, 0]] } }));
    await user.type(screen.getByLabelText('Długość (m)'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Dodaj odcinek' }));
    expect(getState().ui.draft).toEqual([[0, 0]]);
  });

  it('close/undo/cancel are disabled without a draft', () => {
    renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'bed' } }));
    expect(screen.getByRole('button', { name: 'Zamknij kształt' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cofnij punkt' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeDisabled();
  });

  it('closes a draft of 3+ points with the button', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'bed', draft: [[0, 0], [4, 0], [4, 3]] } }));
    await user.click(screen.getByRole('button', { name: 'Zamknij kształt' }));
    expect(getState().doc.plan.shapes[0]).toMatchObject({ type: 'bed', pts: [[0, 0], [4, 0], [4, 3]] });
    expect(getState().ui.tool).toBe('select');
  });

  it('switches between polygon and rectangle mode', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'house' } }));
    await user.click(screen.getByRole('button', { name: 'Prostokąt' }));
    expect(getState().ui.mode).toBe('rect');
    expect(screen.getByText('Przeciągnij na planie albo wpisz wymiary i wstaw dokładnie.')).toBeInTheDocument();
  });
});

describe('PlantPanel', () => {
  it('shows planting help for plant tools only', () => {
    renderWithStore(<PlantPanel />, makeState({ ui: { tool: 'conifer' } }));
    expect(screen.getByRole('region', { name: 'Sadzenie: Iglak' })).toBeInTheDocument();
    expect(screen.getByText(/Klikaj na planie, aby posadzić/)).toBeInTheDocument();
  });
});

describe('GridPanel', () => {
  it('changes snapping step and toggles', async () => {
    const { user, getState } = renderWithStore(<GridPanel />, makeState());
    await user.click(screen.getByRole('button', { name: '0,1 m' }));
    expect(getState().ui.step).toBe(0.1);
    expect(screen.getByRole('button', { name: '0,1 m' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Kąty co 15° przy rysowaniu' }));
    expect(getState().ui.angleSnap).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Nazwy i powierzchnie' }));
    expect(getState().ui.showLabels).toBe(false);
  });

  it('plot size ignores values outside 5–500 m', async () => {
    const { user, getState } = renderWithStore(<GridPanel />, makeState());
    const w = screen.getByLabelText('Szerokość (m)');
    await user.clear(w);
    await user.type(w, '600'); // po drodze 6 i 60 są poprawne, 600 jest ignorowane
    expect(getState().doc.plan.W).toBe(60);
    await user.clear(w);
    await user.type(w, '2');
    expect(getState().doc.plan.W).toBe(60);
    await user.clear(w);
    await user.type(w, '40');
    expect(getState().doc.plan.W).toBe(40);
  });
});

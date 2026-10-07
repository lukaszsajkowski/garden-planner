import { fireEvent, screen } from '@testing-library/react';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { BackgroundPanel } from './BackgroundPanel';

const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 20, aspect: 0.5, opacity: 0.6, visible: true };

describe('BackgroundPanel', () => {
  it('without a map offers loading it', () => {
    renderWithStore(<BackgroundPanel />, makeState());
    expect(screen.getByLabelText('Wczytaj mapkę (JPG, PNG)')).toBeInTheDocument();
    expect(screen.getByText('Masz PDF? Zrób zrzut ekranu albo zapisz stronę jako obraz.')).toBeInTheDocument();
  });

  it('toggles calibration and move modes', async () => {
    const { user, getState } = renderWithStore(<BackgroundPanel />, makeState({ plan: { bg } }));
    await user.click(screen.getByRole('button', { name: 'Kalibruj skalę' }));
    expect(getState().ui.bgMode).toBe('calib');
    expect(screen.getByText('Kliknij pierwszy punkt na mapce')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Przesuń mapkę' }));
    expect(getState().ui.bgMode).toBe('move');
    expect(screen.getByRole('button', { name: 'Przesuń mapkę' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies calibration', async () => {
    const { user, getState } = renderWithStore(<BackgroundPanel />, makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[0, 0], [10, 0]] } }));
    const apply = screen.getByRole('button', { name: 'Zastosuj skalę' });
    expect(apply).toBeDisabled();
    await user.type(screen.getByLabelText('Rzeczywista odległość (m)'), '25');
    await user.click(apply);
    const s = getState();
    expect(s.doc.plan.bg?.w).toBe(50);
    expect(s.doc.plan).toMatchObject({ W: 50, H: 25 });
    expect(s.ui.bgMode).toBeNull();
    expect(s.ui.notice?.msg).toBe('Skala ustawiona: mapka ma teraz 50,00 m szerokości. Możesz obrysować granice narzędziem „Granica działki”.');
  });

  it('calibration with two identical points changes nothing', async () => {
    const { user, getState } = renderWithStore(<BackgroundPanel />, makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[3, 3], [3, 3]], calibLen: '10' } }));
    await user.click(screen.getByRole('button', { name: 'Zastosuj skalę' }));
    expect(getState().doc.plan.bg).toEqual(bg);
    expect(getState().ui.bgMode).toBe('calib');
  });

  it('opacity, width, visibility and removal', async () => {
    const { user, getState } = renderWithStore(<BackgroundPanel />, makeState({ plan: { bg } }));
    fireEvent.change(screen.getByLabelText(/Widoczność mapki/), { target: { value: '30' } });
    expect(getState().doc.plan.bg?.opacity).toBe(0.3);
    expect(screen.getByText('Widoczność mapki: 30%', { exact: false })).toBeInTheDocument();

    const w = screen.getByLabelText('Szer. (m)');
    await user.clear(w);
    await user.type(w, '0');
    expect(getState().doc.plan.bg?.w).toBe(20);
    await user.clear(w);
    await user.type(w, '15');
    expect(getState().doc.plan.bg?.w).toBe(15);

    await user.click(screen.getByRole('button', { name: 'Ukryj' }));
    expect(getState().doc.plan.bg?.visible).toBe(false);
    expect(screen.getByRole('button', { name: 'Pokaż' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(getState().doc.plan.bg).toBeNull();
    expect(getState().ui.notice?.msg).toBe('Mapka usunięta z planu.');
  });
});

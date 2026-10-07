import { screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { samplePlan } from '../domain/sample';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { Header } from './Header';
import { Notice } from './Notice';

const fixture = readFileSync('tests/fixtures/prototype-sample.json', 'utf8');
const json = (text: string, name: string) => new File([text], name, { type: 'application/json' });
const setup = () =>
  renderWithStore(<><Header /><Notice /></>, makeState({ plan: { shapes: samplePlan().shapes } }));

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('Header', () => {
  it('shows the title and subtitle', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Planer ogrodu' })).toBeInTheDocument();
    expect(screen.getByText('Rysuj w metrach: granice działki, budynki, nawierzchnie i rośliny')).toBeInTheDocument();
  });

  it('Nowy plan can be undone', async () => {
    const { user, getState } = setup();
    expect(screen.getByRole('button', { name: 'Cofnij' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Nowy plan' }));
    expect(getState().doc.plan.shapes).toEqual([]);
    expect(getState().ui.tool).toBe('boundary');
    await user.click(screen.getByRole('button', { name: 'Cofnij' }));
    expect(getState().doc.plan.shapes).toHaveLength(15);
  });

  it('saves a JSON file and offers a download link', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Zapisz plik' }));
    expect(screen.getByRole('status')).toHaveTextContent('Plan zapisany. Otworzysz go później przyciskiem „Otwórz plik”.');
    const link = screen.getByRole('link', { name: /^Pobierz plan-ogrodu-\d{4}-\d{2}-\d{2}\.json$/ });
    expect(link).toHaveAttribute('href', 'blob:test');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Zamknij komunikat' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('opens a plan file; undo restores the previous plan', async () => {
    const { user, getState } = setup();
    await user.click(screen.getByRole('button', { name: 'Nowy plan' }));
    await user.upload(screen.getByLabelText('Otwórz plik'), json(fixture, 'plan.json'));
    expect(await screen.findByText('Wczytano „plan.json”: 15 elementów.')).toBeInTheDocument();
    expect(getState().doc.plan.shapes).toHaveLength(15);
    await user.click(screen.getByRole('button', { name: 'Cofnij' }));
    expect(getState().doc.plan.shapes).toEqual([]);
  });

  it('reports a broken file and keeps the plan', async () => {
    const { user, getState } = setup();
    await user.upload(screen.getByLabelText('Otwórz plik'), json('nie json', 'zly.json'));
    expect(await screen.findByText('Nie udało się wczytać pliku „zly.json”: to nie jest plik planu ogrodu.')).toBeInTheDocument();
    expect(getState().doc.plan.shapes).toHaveLength(15);
  });

  it('reports PNG export failure', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Eksport PNG' }));
    expect(await screen.findByText('Nie udało się utworzyć obrazu.')).toBeInTheDocument();
  });

  it('loads the sample plan', async () => {
    const { user, getState } = renderWithStore(<Header />, makeState({ plan: { W: 80 } }));
    await user.click(screen.getByRole('button', { name: 'Przykładowy plan' }));
    expect(getState().doc.plan).toMatchObject({ W: 30, H: 22 });
    expect(getState().doc.plan.shapes).toHaveLength(15);
  });
});

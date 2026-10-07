import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the full layout with the sample plan', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Planer ogrodu' })).toBeInTheDocument();
    for (const name of ['Narzędzia', 'Podkład: mapka działki', 'Przyciąganie do siatki', 'Podsumowanie', 'Elementy planu']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('group', { name: 'Plan ogrodu' })).toBeInTheDocument();
    expect(screen.getByText('Rabata bylinowa · Rabata')).toBeInTheDocument();
  });
});

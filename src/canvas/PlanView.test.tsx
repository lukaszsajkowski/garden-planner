import { screen } from '@testing-library/react';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { PlanView } from './PlanView';

describe('PlanView', () => {
  it('shows zoom, scale bar, coordinates and the tip', async () => {
    const { user, getState } = renderWithStore(<PlanView />, makeState());
    expect(screen.getByText('1 m = 28 px')).toBeInTheDocument();
    expect(screen.getByText('5 m')).toBeInTheDocument();
    expect(screen.getByText('Najedź na plan')).toBeInTheDocument();
    expect(screen.getByText('Wybierz narzędzie po lewej. Kliknij element na planie, aby go edytować.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Przybliż' }));
    expect(getState().ui.scale).toBe(36);
    expect(screen.getByText('1 m = 36 px')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Oddal' }));
    await user.click(screen.getByRole('button', { name: 'Oddal' }));
    expect(screen.getByText('1 m = 20 px')).toBeInTheDocument();
  });
});

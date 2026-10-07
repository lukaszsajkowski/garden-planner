import { render, screen } from '@testing-library/react';
import { STORAGE_KEY } from '../domain/catalog';
import { AppProvider, useAppState } from './store';

function Count() {
  const s = useAppState();
  return <p>elementy: {s.doc.plan.shapes.length}</p>;
}

describe('AppProvider', () => {
  it('starts with the sample plan when nothing is saved, and autosaves it', () => {
    render(<AppProvider><Count /></AppProvider>);
    expect(screen.getByText('elementy: 15')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).shapes).toHaveLength(15);
  });
  it('restores the autosaved plan', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ W: 30, H: 22, shapes: [{ id: 'a', type: 'tree', x: 1, y: 1, r: 1 }], bg: null }));
    render(<AppProvider><Count /></AppProvider>);
    expect(screen.getByText('elementy: 1')).toBeInTheDocument();
  });
});

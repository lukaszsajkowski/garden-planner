import { act, fireEvent, render, screen } from '@testing-library/react';
import { STORAGE_KEY } from '../domain/catalog';
import { AppProvider, AUTOSAVE_DELAY_MS, useAppDispatch, useAppState } from './store';

function Count() {
  const s = useAppState();
  return <p>elementy: {s.doc.plan.shapes.length}</p>;
}

function Widen() {
  const s = useAppState();
  const dispatch = useAppDispatch();
  return <button onClick={() => dispatch({ type: 'plan/setPlotSize', W: s.doc.plan.W + 1 })}>szerzej</button>;
}

const savedW = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!).W;

describe('AppProvider', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts with the sample plan when nothing is saved, and autosaves it', () => {
    render(<AppProvider><Count /></AppProvider>);
    expect(screen.getByText('elementy: 15')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).shapes).toHaveLength(15);
  });

  it('restores the autosaved plan', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ W: 30, H: 22, shapes: [{ id: 'a', type: 'tree', x: 1, y: 1, r: 1 }], bg: null }));
    render(<AppProvider><Count /></AppProvider>);
    expect(screen.getByText('elementy: 1')).toBeInTheDocument();
  });

  it('writes a burst of changes (e.g. a drag) to storage once', () => {
    render(<AppProvider><Widen /></AppProvider>);
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'szerzej' }));
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS / 10));
    }
    expect(setItem).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(savedW()).toBe(40);
    setItem.mockRestore();
  });

  it('saves a pending change immediately when the page is hidden', () => {
    render(<AppProvider><Widen /></AppProvider>);
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    fireEvent.click(screen.getByRole('button', { name: 'szerzej' }));
    expect(savedW()).toBe(30);
    fireEvent(window, new Event('pagehide'));
    expect(savedW()).toBe(31);
  });
});

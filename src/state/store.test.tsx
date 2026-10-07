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

describe('AppProvider: brak miejsca w localStorage', () => {
  const bg = { src: 'data:image/png;base64,' + 'A'.repeat(5000), x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };

  function NoticeText() {
    const s = useAppState();
    return <p data-testid="notice">{s.ui.notice?.msg ?? ''}</p>;
  }
  function Controls() {
    const s = useAppState();
    const dispatch = useAppDispatch();
    return (
      <>
        <button onClick={() => dispatch({ type: 'plan/setBackground', bg })}>mapka</button>
        <button onClick={() => dispatch({ type: 'plan/setBackground', bg: null })}>bez mapki</button>
        <button onClick={() => dispatch({ type: 'plan/setPlotSize', W: s.doc.plan.W + 1 })}>szerzej</button>
        <button onClick={() => dispatch({ type: 'ui/notify', notice: null })}>zamknij</button>
      </>
    );
  }

  let original: Storage['setItem'];
  beforeEach(() => {
    vi.useFakeTimers();
    original = Storage.prototype.setItem;
    // Plan bez mapki się mieści, z mapką nie.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (v.length > 4000) throw new DOMException('full', 'QuotaExceededError');
      original.call(this, k, v);
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const click = (name: string) => {
    fireEvent.click(screen.getByRole('button', { name }));
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
  };
  const notice = () => screen.getByTestId('notice').textContent;

  it('tells once that the map is not autosaved, and again after it fits and overflows anew', () => {
    render(<AppProvider><Controls /><NoticeText /></AppProvider>);
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    expect(notice()).toBe('');

    click('mapka');
    expect(notice()).toMatch(/Mapka nie mieści się w pamięci przeglądarki/);
    click('zamknij');
    click('szerzej');
    expect(notice()).toBe('');

    click('bez mapki');
    click('mapka');
    expect(notice()).toMatch(/Mapka nie mieści się/);
  });

  it('keeps the current message and appends the warning to it', () => {
    function NotifyThenMap() {
      const dispatch = useAppDispatch();
      return (
        <button onClick={() => { dispatch({ type: 'ui/notify', notice: { msg: 'Mapka wczytana.' } }); dispatch({ type: 'plan/setBackground', bg }); }}>wczytaj</button>
      );
    }
    render(<AppProvider><NotifyThenMap /><NoticeText /></AppProvider>);
    click('wczytaj');
    expect(notice()).toMatch(/^Mapka wczytana\. Mapka nie mieści się/);
  });

  it('warns when even the plan without the map does not fit', () => {
    vi.mocked(Storage.prototype.setItem).mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
    render(<AppProvider><NoticeText /></AppProvider>);
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    expect(notice()).toMatch(/Plan nie mieści się w pamięci przeglądarki/);
  });
});

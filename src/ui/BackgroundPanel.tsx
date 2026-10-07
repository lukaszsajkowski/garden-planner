import { calibInfo } from '../canvas/stageModel';
import { applyCalibration, newBackground } from '../domain/background';
import { fmtLen, parseNum } from '../domain/format';
import { readImageFile } from '../io/readImage';
import { useAppDispatch, useAppState } from '../state/store';
import { cx } from './cx';
import s from './panels.module.css';
import { Button, FileButton } from './primitives/Button';
import { NumberField, StrField } from './primitives/fields';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

const TITLE = 'Podkład: mapka działki';

export function BackgroundPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { ui } = state;
  const { bg, W, H } = state.doc.plan;
  const notify = (msg: string) => dispatch({ type: 'ui/notify', notice: { msg } });

  const onFile = async (file: File) => {
    try {
      const img = await readImageFile(file);
      dispatch({ type: 'plan/setBackground', bg: newBackground(img.src, img.aspect, W, H) });
      dispatch({ type: 'ui/setBgMode', mode: 'calib' });
      dispatch({ type: 'ui/setCalibLen', value: '' });
      notify('Mapka wczytana. Teraz ustaw skalę: kliknij na mapce dwa punkty o znanej odległości i wpisz ją po lewej.');
    } catch {
      notify('Nie udało się odczytać obrazu. Użyj pliku JPG lub PNG.');
    }
  };

  if (!bg) {
    return (
      <Panel title={TITLE}>
        <p className={p.text}>Wczytaj mapkę geodezyjną, zdjęcie lub widok z geoportalu i obrysuj na niej granice i dom.</p>
        <FileButton variant="outlineAccent" size="lg" label="Wczytaj mapkę (JPG, PNG)" accept="image/*" onFile={onFile} />
        <p className={p.hint}>Masz PDF? Zrób zrzut ekranu albo zapisz stronę jako obraz.</p>
      </Panel>
    );
  }

  const calibActive = ui.bgMode === 'calib';
  const real = parseNum(ui.calibLen);
  const apply = () => {
    const res = applyCalibration(bg, ui.calib, real, W, H);
    if (!res) return;
    dispatch({ type: 'plan/setBackground', bg: res.bg });
    dispatch({ type: 'plan/setPlotSize', W: res.W, H: res.H });
    dispatch({ type: 'ui/setBgMode', mode: null });
    notify(`Skala ustawiona: mapka ma teraz ${fmtLen(res.bg.w)} szerokości. Możesz obrysować granice narzędziem „Granica działki”.`);
  };
  const pct = Math.round(bg.opacity * 100);

  return (
    <Panel title={TITLE}>
      <div className={p.grid2}>
        <Button className={s.calibBtn} aria-pressed={calibActive} onClick={() => dispatch({ type: 'ui/toggleBgMode', mode: 'calib' })}>Kalibruj skalę</Button>
        <Button className={s.modeBtn} aria-pressed={ui.bgMode === 'move'} onClick={() => dispatch({ type: 'ui/toggleBgMode', mode: 'move' })}>Przesuń mapkę</Button>
      </div>
      {calibActive && (
        <div className={s.calibBlock}>
          <p className={s.calibText}>Kliknij na mapce dwa punkty, których odległość znasz (np. końce boku działki z opisanym wymiarem). Przybliż plan dla większej dokładności.</p>
          <p className={s.calibInfo}>{calibInfo(state)}</p>
          <StrField tone="calib" label="Rzeczywista odległość (m)" value={ui.calibLen} onChange={(value) => dispatch({ type: 'ui/setCalibLen', value })} />
          <div className={p.grid2}>
            <Button variant="calib" disabled={!(ui.calib.length === 2 && real > 0)} onClick={apply}>Zastosuj skalę</Button>
            <Button onClick={() => dispatch({ type: 'ui/setBgMode', mode: null })}>Zakończ</Button>
          </div>
        </div>
      )}
      <label className={p.field}>
        Widoczność mapki: {pct}%
        <input type="range" min={10} max={100} step={5} value={pct} className={s.range}
          onChange={(e) => dispatch({ type: 'plan/patchBackground', patch: { opacity: Number(e.target.value) / 100 } })} />
      </label>
      <div className={p.grid3}>
        <NumberField variant="compact" label="Szer. (m)" value={bg.w} onValue={(w) => { if (w > 0) dispatch({ type: 'plan/patchBackground', patch: { w } }); }} />
        <NumberField variant="compact" label="X (m)" value={bg.x} onValue={(x) => dispatch({ type: 'plan/patchBackground', patch: { x } })} />
        <NumberField variant="compact" label="Y (m)" value={bg.y} onValue={(y) => dispatch({ type: 'plan/patchBackground', patch: { y } })} />
      </div>
      <div className={cx(p.row)}>
        <Button onClick={() => dispatch({ type: 'plan/patchBackground', patch: { visible: !bg.visible } })}>{bg.visible ? 'Ukryj' : 'Pokaż'}</Button>
        <FileButton label="Zmień" accept="image/*" onFile={onFile} />
        <Button variant="danger" onClick={() => { dispatch({ type: 'plan/setBackground', bg: null }); notify('Mapka usunięta z planu.'); }}>Usuń</Button>
      </div>
    </Panel>
  );
}

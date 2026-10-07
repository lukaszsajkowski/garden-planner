import { makeDownload } from '../export/download';
import { renderPlanPng } from '../export/exportPng';
import { dateStamp } from '../domain/format';
import { newId } from '../domain/ids';
import { parsePlan, serializePlan } from '../domain/planFile';
import { readFileText } from '../io/readText';
import { canUndo } from '../state/selectors';
import { useAppDispatch, useAppState } from '../state/store';
import type { Notice } from '../state/uiReducer';
import s from './chrome.module.css';
import { DownloadIcon, FolderIcon, ImageIcon, LeafIcon } from './icons';
import { Button, FileButton } from './primitives/Button';

export function Header() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const plan = state.doc.plan;
  const notify = (msg: string, download?: Notice['download']) => dispatch({ type: 'ui/notify', notice: download ? { msg, download } : { msg } });

  const save = () => {
    const blob = new Blob([serializePlan(plan)], { type: 'application/json' });
    notify(
      'Plan zapisany' + (plan.bg ? ' razem z mapką' : '') + '. Otworzysz go później przyciskiem „Otwórz plik”.',
      makeDownload(blob, `plan-ogrodu-${dateStamp()}.json`),
    );
  };

  const open = async (file: File) => {
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      notify('Nie udało się odczytać pliku.');
      return;
    }
    try {
      const loaded = parsePlan(text, newId);
      dispatch({ type: 'plan/load', plan: loaded });
      notify(`Wczytano „${file.name}”: ${loaded.shapes.length} elementów${loaded.bg ? ' i mapka' : ''}.`);
    } catch (e) {
      notify(`Nie udało się wczytać pliku „${file.name}”: ${e instanceof Error ? e.message : 'błędny format'}.`);
    }
  };

  const exportImage = async () => {
    try {
      const blob = await renderPlanPng(plan);
      notify('Obraz planu gotowy do pobrania.', makeDownload(blob, `plan-ogrodu-${dateStamp()}.png`));
    } catch {
      notify('Nie udało się utworzyć obrazu.');
    }
  };

  return (
    <header className={s.header}>
      <div className={s.brand}>
        <LeafIcon />
        <div>
          <h1 className={s.title}>Planer ogrodu</h1>
          <p className={s.subtitle}>Rysuj w metrach: granice działki, budynki, nawierzchnie i rośliny</p>
        </div>
      </div>
      <div className={s.actions}>
        <Button size="lg" disabled={!canUndo(state)} onClick={() => dispatch({ type: 'plan/undo' })}>Cofnij</Button>
        <span className={s.sep} aria-hidden="true" />
        <FileButton size="lg" label={<><FolderIcon />Otwórz plik</>} accept=".json,application/json" onFile={open} />
        <Button size="lg" onClick={save}><DownloadIcon />Zapisz plik</Button>
        <Button size="lg" onClick={exportImage}><ImageIcon />Eksport PNG</Button>
        <span className={s.sep} aria-hidden="true" />
        <Button size="lg" onClick={() => dispatch({ type: 'plan/loadSample' })}>Przykładowy plan</Button>
        <Button size="lg" variant="primary" onClick={() => dispatch({ type: 'plan/clear' })}>Nowy plan</Button>
      </div>
    </header>
  );
}

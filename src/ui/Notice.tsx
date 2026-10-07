import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppState } from '../state/store';
import s from './chrome.module.css';
import { cx } from './cx';
import { Button } from './primitives/Button';
import p from './primitives/primitives.module.css';

export function Notice() {
  const { ui } = useAppState();
  const dispatch = useAppDispatch();
  const link = useRef<HTMLAnchorElement>(null);
  const url = ui.notice?.download?.url;
  useEffect(() => {
    if (url) link.current?.click();
  }, [url]);
  if (!ui.notice) return null;
  const dl = ui.notice.download;
  return (
    <div role="status" className={s.notice}>
      <span className={s.noticeMsg}>{ui.notice.msg}</span>
      {dl && (
        <a ref={link} href={dl.url} download={dl.name} className={cx(p.btn, p.md, p.primary, s.noticeLink)}>
          Pobierz {dl.name}
        </a>
      )}
      <Button variant="ghost" size="icon" aria-label="Zamknij komunikat" onClick={() => dispatch({ type: 'ui/notify', notice: null })}>×</Button>
    </div>
  );
}

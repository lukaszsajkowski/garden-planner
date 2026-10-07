import type { ReactNode } from 'react';
import { cx } from '../cx';
import s from './primitives.module.css';

export interface PanelProps {
  title: string;
  tone?: 'selection';
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, tone, action, children, className }: PanelProps) {
  const heading = <h2 className={cx(s.panelTitle, tone === 'selection' && s.panelTitleSelection)}>{title}</h2>;
  return (
    <section aria-label={title} className={cx(s.panel, className)}>
      {action ? <div className={s.panelHead}>{heading}{action}</div> : heading}
      {children}
    </section>
  );
}

export function GroupTitle({ children }: { children: ReactNode }) {
  return <h3 className={s.groupTitle}>{children}</h3>;
}

export function StatTile({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className={s.stat}>
      <div className={s.statLabel}>{label}</div>
      <div className={cx(s.statValue, small && s.statValueSm)}>{value}</div>
    </div>
  );
}

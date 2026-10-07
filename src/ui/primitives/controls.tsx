import type { ReactNode } from 'react';
import s from './primitives.module.css';

export function Chip({ pressed, onClick, children }: { pressed: boolean; onClick(): void; children: ReactNode }) {
  return (
    <button type="button" className={s.chip} aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

export function Toggle({ pressed, onToggle, label }: { pressed: boolean; onToggle(): void; label: string }) {
  return (
    <button type="button" className={s.toggle} aria-pressed={pressed} onClick={onToggle}>
      <span className={s.box} aria-hidden="true" />
      {label}
    </button>
  );
}

export interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange(v: T): void;
  columns: number;
}

export function Segmented<T extends string | number>({ options, value, onChange, columns }: SegmentedProps<T>) {
  return (
    <div className={s.segGroup} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" className={s.seg} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

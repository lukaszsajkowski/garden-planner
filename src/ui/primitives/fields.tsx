import { useState } from 'react';
import { fmtNum, parseNum } from '../../domain/format';
import { cx } from '../cx';
import s from './primitives.module.css';

export interface NumberFieldProps {
  label: string;
  value: number;
  onValue(n: number): void;
  onBeginEdit?(): void;
  variant?: 'normal' | 'compact' | 'row';
  hideLabel?: boolean;
}

export function NumberField({ label, value, onValue, onBeginEdit, variant = 'normal', hideLabel }: NumberFieldProps) {
  const [text, setText] = useState<string | null>(null);
  const input = (
    <input
      aria-label={hideLabel ? label : undefined}
      inputMode="decimal"
      className={cx(s.input, variant === 'compact' && s.inputCompact, variant === 'row' && s.inputRow)}
      value={text ?? fmtNum(value)}
      onFocus={() => onBeginEdit?.()}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        const n = parseNum(v);
        if (!Number.isNaN(n)) onValue(n);
      }}
      onBlur={() => setText(null)}
    />
  );
  if (hideLabel) return input;
  return (
    <label className={s.field}>
      {label}
      {input}
    </label>
  );
}

export interface StrFieldProps {
  label: string;
  value: string;
  onChange(v: string): void;
  variant?: 'normal' | 'compact';
  tone?: 'calib';
}

export function StrField({ label, value, onChange, variant = 'normal', tone }: StrFieldProps) {
  return (
    <label className={cx(s.field, tone === 'calib' && s.fieldCalib)}>
      {label}
      <input
        inputMode="decimal"
        className={cx(s.input, variant === 'compact' && s.inputCompact, tone === 'calib' && s.inputCalib)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export interface TextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange(v: string): void;
}

export function TextField({ label, value, placeholder, onChange }: TextFieldProps) {
  return (
    <label className={s.field}>
      {label}
      <input className={cx(s.input, s.inputText)} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

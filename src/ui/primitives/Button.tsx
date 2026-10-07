import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import s from './primitives.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outlineAccent' | 'outlineDraft' | 'calib' | 'danger' | 'ghost';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cx(s.btn, s[size], s[variant], className)} {...rest} />;
}

export interface FileButtonProps {
  label: ReactNode;
  accept: string;
  onFile(file: File): void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function FileButton({ label, accept, onFile, variant = 'secondary', size = 'md', className }: FileButtonProps) {
  return (
    <label className={cx(s.btn, s.fileBtn, s[size], s[variant], className)}>
      {label}
      <input
        type="file"
        accept={accept}
        className="vh"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </label>
  );
}

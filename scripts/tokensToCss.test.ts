import tokens from '../design/tokens.json';
import { tokensToCss } from './tokensToCss';

describe('tokensToCss', () => {
  const css = tokensToCss(tokens);

  it('emits color variables in kebab-case', () => {
    expect(css).toContain('--color-accent: #2F6B3F;');
    expect(css).toContain('--color-accent-selected: #E3EFE5;');
    expect(css).toContain('--color-text-muted: #56615B;');
  });

  it('flattens nested color groups', () => {
    expect(css).toContain('--color-grid-major: rgba(30,42,35,0.20);');
    expect(css).toContain('--color-grid-minor: rgba(30,42,35,0.07);');
  });

  it('emits radius, space, numeric sizes and fonts', () => {
    expect(css).toContain('--radius-xl: 10px;');
    expect(css).toContain('--space-16: 16px;');
    expect(css).toContain('--size-touch-primary: 44px;');
    expect(css).not.toContain('--size-focus-ring');
    expect(css).toContain("--font-mono: 'IBM Plex Mono', ui-monospace, monospace;");
  });

  it('wraps everything in :root', () => {
    expect(css).toMatch(/^\/\*.*\*\/\n:root \{\n/);
    expect(css.trimEnd().endsWith('}')).toBe(true);
  });
});

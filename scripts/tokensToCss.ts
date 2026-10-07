interface TokensInput {
  color: Record<string, unknown>;
  radius: Record<string, number>;
  space: Record<string, number>;
  size: Record<string, unknown>;
  font: { sans: { family: string }; mono: { family: string } };
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

export function tokensToCss(t: TokensInput): string {
  const lines: string[] = [];
  const colors = (obj: Record<string, unknown>, prefix: string) => {
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && 'value' in v) {
        lines.push(`  --color-${prefix}${kebab(k)}: ${(v as { value: string }).value};`);
      } else if (v && typeof v === 'object') {
        colors(v as Record<string, unknown>, `${prefix}${kebab(k)}-`);
      }
    }
  };
  colors(t.color, '');
  for (const [k, v] of Object.entries(t.radius)) lines.push(`  --radius-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(t.space)) lines.push(`  --space-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(t.size)) {
    if (typeof v === 'number') lines.push(`  --size-${kebab(k)}: ${v}px;`);
  }
  lines.push(`  --font-sans: ${t.font.sans.family};`, `  --font-mono: ${t.font.mono.family};`);
  return `/* Wygenerowane z design/tokens.json przez scripts/tokens-to-css.ts. Nie edytuj ręcznie. */\n:root {\n${lines.join('\n')}\n}\n`;
}

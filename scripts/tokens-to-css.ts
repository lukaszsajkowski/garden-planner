import { readFileSync, writeFileSync } from 'node:fs';
import { tokensToCss } from './tokensToCss';

const tokens = JSON.parse(readFileSync('design/tokens.json', 'utf8'));
writeFileSync('src/design/tokens.css', tokensToCss(tokens));
console.log('src/design/tokens.css zaktualizowany');

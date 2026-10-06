# Planer ogrodu: plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przepisać prototyp „Planer ogrodu” na utrzymywalną aplikację Vite + React + TypeScript z tymi samymi funkcjami, wyglądem i formatem pliku, pokrytą testami.

**Architecture:** Czysta domena w `src/domain/` (geometria, powierzchnie netto, przyciąganie, plik) bez Reacta. Stan w jednym reducerze głównym, który składa `planReducer` (z historią cofania) i `uiReducer`. Plan rysowany jest w SVG z modelu widoku (`buildStageModel`). Zdarzenia wskaźnika tłumaczą czyste funkcje (`pointer.ts`) na akcje. Panele UI czytają selektory i wysyłają akcje. Wygląd pochodzi z `design/tokens.json` przez zmienne CSS.

**Tech Stack:** Vite, React, TypeScript (strict), CSS Modules, Vitest + Testing Library (jsdom), Playwright (Chromium), tsx (skrypt tokenów).

**Spec:** `docs/superpowers/specs/2026-10-05-planer-ogrodu-design.md`. Wymagania z identyfikatorami F-x.y są w `docs/prd.md`. Design jest w `design/tokens.json`, `design/components.md` i `design/screens.md`. Referencją zachowań jest prototyp `docs/reference/prototype.dc.html`.

## Global Constraints

- TypeScript `strict: true`. Nie używamy `any`. Dane z zewnątrz (plik, localStorage) mają typ `unknown` i przechodzą walidację.
- `src/domain/` nie importuje Reacta, DOM-u ani `localStorage`.
- Model planu zmienia wyłącznie `planReducer`. Stan widoku zmienia wyłącznie `uiReducer`. Oba łączy `rootReducer`.
- Kolory, czcionki, promienie i rozmiary pochodzą z `design/tokens.json`. W CSS używamy `var(--color-…)` itd., a w TS `color('…')` / `material`. W komponentach nie wpisujemy heksów.
- Wszystkie teksty interfejsu są po polsku, dosłownie według `design/screens.md` (łącznie z cudzysłowami „…”).
- Liczby wyświetla wyłącznie `format.ts`: przecinek dziesiętny, `fmtLen` → „12,30 m”, `fmtArea` → „508 m²” / „48,8 m²”. Liczby na ekranie mają czcionkę mono.
- Jednostką jest metr. Początek układu w lewym górnym rogu, Y rośnie w dół. Kąt „0° w prawo, 90° w górę”.
- Format pliku: `{ app: 'planer-ogrodu', version: 1, savedAt, W, H, shapes, bg }`. Klucz autozapisu: `planer-ogrodu-v1`.
- Limity: obszar rysunku 5–500 m, historia 80 kroków, raster powierzchni 0,2 m, zoom `[8,12,16,20,28,36,48,64,80]` (domyślnie 28).
- Brak żądań sieciowych poza Google Fonts.
- Dostępność: natywne `<button>`, `<a>` i `<input>`, etykieta przy każdym polu, `aria-pressed` na przełącznikach, `aria-label` na przyciskach z samą ikoną.
- Każdy commit kończy się linią `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Tekst, który nie jest liczbą** („12.5 m”, „1 000”, „-”, puste pole) wpisany w dowolne pole liczbowe nie zmienia modelu, a po opuszczeniu pola wraca ostatnia poprawna wartość. Testy: Task 2 (`parseNum`), Task 9 (`NumberField`).
2. **Zero lub wartość ujemna tam, gdzie liczba musi być dodatnia, albo obszar spoza 5–500** (Korona Ø 0 lub −2, Szer. mapki 0, obszar rysunku 600 lub 2) jest ignorowana. Testy: Task 12 (GridPanel), Task 13 (InspectorPoint), Task 14 (BackgroundPanel).
3. **Kalibracja z dwoma punktami w tym samym miejscu albo z odległością 0** nic nie robi: nie powstają NaN ani Infinity, mapka zostaje bez zmian. Testy: Task 14.
4. **Plik z częściowo uszkodzonymi elementami** (współrzędne jako tekst, typ `"toString"`, obszar z 2 punktami) wczytuje się bez tych elementów i bez wyjątku. Testy: Task 6.
5. **„Cofnij” po „Nowy plan” i po „Otwórz plik”** przywraca poprzedni plan. Testy: Task 8 (rootReducer), Task 15 (Header).

---

## Struktura plików

```
package.json, tsconfig.json, vite.config.ts, index.html, .gitignore, playwright.config.ts
scripts/
  tokensToCss.ts          tokens.json → tekst CSS (czysta funkcja)
  tokensToCss.test.ts
  tokens-to-css.ts        CLI: zapisuje src/design/tokens.css (plik generowany, w .gitignore)
src/
  main.tsx, App.tsx, App.module.css, global.css, vite-env.d.ts
  design/tokens.ts        typowany dostęp do design/tokens.json
  test/setup.ts           jest-dom + czyszczenie localStorage
  test/factories.ts       makeState()
  test/renderWithStore.tsx
  domain/
    types.ts catalog.ts format.ts ids.ts geometry.ts snapping.ts
    sample.ts netAreas.ts planFile.ts background.ts
  state/
    history.ts planReducer.ts uiReducer.ts rootReducer.ts selectors.ts
    persistence.ts store.tsx
  canvas/
    materialStyle.ts coords.ts hitTest.ts stageModel.ts pointer.ts
    usePointerTools.ts patterns.tsx PlanStage.tsx PlanView.tsx canvas.module.css
  export/
    download.ts exportPng.ts
  io/
    readImage.ts readText.ts
  ui/
    cx.ts icons.tsx
    primitives/ Button.tsx fields.tsx controls.tsx layout.tsx primitives.module.css
    panels.module.css chrome.module.css
    Header.tsx Notice.tsx ToolsPanel.tsx DrawPanel.tsx PlantPanel.tsx
    BackgroundPanel.tsx GridPanel.tsx SummaryPanel.tsx InspectorPoly.tsx
    InspectorPoint.tsx ElementsList.tsx RightColumn.tsx
tests/
  fixtures/prototype-sample.json
  e2e/planer.spec.ts
```

Odstępstwa od listy plików w specyfikacji (bez zmiany architektury):
- `src/io/` zawiera wczytywanie obrazu i tekstu z `File` (wejście/wyjście przeglądarki).
- `src/domain/background.ts` zawiera matematykę kalibracji.
- `uiState.ts` nazywa się `uiReducer.ts`, a reducer główny jest w `rootReducer.ts`.

---

### Task 1: Szkielet projektu i tokeny

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/vite-env.d.ts`, `src/main.tsx`, `src/App.tsx`, `src/global.css`, `src/test/setup.ts`, `src/design/tokens.ts`, `scripts/tokensToCss.ts`, `scripts/tokens-to-css.ts`
- Test: `scripts/tokensToCss.test.ts`, `src/design/tokens.test.ts`

**Interfaces:**
- Consumes: `design/tokens.json` (istnieje).
- Produces: `tokensToCss(t): string`. `src/design/tokens.ts` eksportuje `tokens`, `color(name: ColorName): string`, `material`, `canvasTokens`, `exportTokens`. Zmienne CSS: `--color-<kebab>` (np. `--color-accent-selected`, `--color-grid-major`), `--radius-<k>`, `--space-<k>`, `--size-<kebab>`, `--font-sans`, `--font-mono`. Skrypty npm: `dev`, `build`, `typecheck`, `test`, `e2e`, `tokens`.

- [ ] **Step 1: Utwórz `package.json` i zainstaluj zależności**

```json
{
  "name": "planer-ogrodu",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "tokens": "tsx scripts/tokens-to-css.ts",
    "predev": "npm run tokens",
    "dev": "vite",
    "prebuild": "npm run tokens",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "pretypecheck": "npm run tokens",
    "typecheck": "tsc --noEmit",
    "pretest": "npm run tokens",
    "test": "vitest run",
    "pree2e": "npm run tokens",
    "e2e": "playwright test"
  }
}
```

Run:
```bash
npm i react react-dom
npm i -D vite @vitejs/plugin-react typescript vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test tsx @types/react @types/react-dom @types/node
```
Expected: instalacja bez błędów, powstaje `package-lock.json`.

- [ ] **Step 2: Pliki konfiguracyjne**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["src", "scripts", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
```

`.gitignore`:
```
node_modules
dist
src/design/tokens.css
test-results
playwright-report
```

`index.html`:
```html
<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planer ogrodu</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* brak localStorage w środowisku */
  }
});
```

- [ ] **Step 3: Napisz test generatora CSS (failing)**

`scripts/tokensToCss.test.ts`:
```ts
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
```

Run: `npx vitest run scripts/tokensToCss.test.ts`
Expected: FAIL, „Failed to resolve import ./tokensToCss”.

- [ ] **Step 4: Zaimplementuj generator i CLI**

`scripts/tokensToCss.ts`:
```ts
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
```

`scripts/tokens-to-css.ts`:
```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { tokensToCss } from './tokensToCss';

const tokens = JSON.parse(readFileSync('design/tokens.json', 'utf8'));
writeFileSync('src/design/tokens.css', tokensToCss(tokens));
console.log('src/design/tokens.css zaktualizowany');
```

Run: `npx vitest run scripts/tokensToCss.test.ts`
Expected: PASS (4 testy).

- [ ] **Step 5: Test dostępu do tokenów w TS (failing)**

`src/design/tokens.test.ts`:
```ts
import { color, material, canvasTokens } from './tokens';

describe('tokens', () => {
  it('reads color values by name', () => {
    expect(color('accent')).toBe('#2F6B3F');
    expect(color('selection')).toBe('#C2561A');
  });
  it('exposes material and canvas groups', () => {
    expect(material.grass.solid).toBe('#A8CF85');
    expect(canvasTokens.zoomSteps).toEqual([8, 12, 16, 20, 28, 36, 48, 64, 80]);
  });
});
```

Run: `npx vitest run src/design/tokens.test.ts`
Expected: FAIL (brak modułu `./tokens`).

- [ ] **Step 6: Zaimplementuj `src/design/tokens.ts`**

```ts
import raw from '../../design/tokens.json';

export const tokens = raw;

type ColorMap = typeof raw.color;
export type ColorName = {
  [K in keyof ColorMap]: ColorMap[K] extends { value: string } ? K : never;
}[keyof ColorMap];

export function color(name: ColorName): string {
  return (raw.color[name] as { value: string }).value;
}

export const material = raw.material;
export const canvasTokens = raw.canvas;
export const exportTokens = raw.export;
```

Run: `npx vitest run src/design/tokens.test.ts`
Expected: PASS.

- [ ] **Step 7: Punkt wejścia aplikacji**

`src/global.css`:
```css
* { box-sizing: border-box; }
body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); }
button, input { font-family: inherit; }
button { cursor: pointer; }
button:disabled { opacity: 0.45; cursor: not-allowed; }
button:focus-visible, a:focus-visible, input:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }
a { color: var(--color-accent); }
a:hover { color: var(--color-accent-hover); }
input[type=range] { accent-color: var(--color-accent); }
.vh { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); border: 0; opacity: 0; }
```

`src/App.tsx` (tymczasowy, Task 16 go zastąpi):
```tsx
export function App() {
  return <h1>Planer ogrodu</h1>;
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/tokens.css';
import './global.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 8: Sprawdź cały zestaw**

Run: `npm test && npm run typecheck && npm run build`
Expected: testy PASS. `tsc` bez błędów. `vite build` tworzy `dist/`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: szkielet Vite + React + TS, generator tokenów CSS

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Typy, katalog, formatowanie, identyfikatory

**Files:**
- Create: `src/domain/types.ts`, `src/domain/catalog.ts`, `src/domain/format.ts`, `src/domain/ids.ts`
- Test: `src/domain/catalog.test.ts`, `src/domain/format.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `Pt = [number, number]`, `PolyType`, `PointType`, `ShapeType`, `PolyShape`, `PointShape`, `Shape`, `Background`, `Plan` (dokładnie jak w spec §3.1).
  - `catalog.ts`: `CATALOG: Record<ShapeType, TypeInfo>`, `TypeInfo { label; kind: 'poly'|'point'; z; r? }`, `ORDER_POLY`, `ORDER_POINT`, `ZOOMS`, `DEFAULT_ZOOM = 28`, `HISTORY_LIMIT = 80`, `STORAGE_KEY = 'planer-ogrodu-v1'`, `PLOT_MIN = 5`, `PLOT_MAX = 500`, `DEFAULT_PLOT = { W: 30, H: 22 }`, `isPolyType(t): t is PolyType`, `isPoly(s): s is PolyShape`, `defaultRadius(t: PointType): number`, `isShapeType(v: unknown): v is ShapeType`.
  - `format.ts`: `round2`, `fmtNum`, `fmtLen`, `fmtArea`, `parseNum`, `dateStamp(d?: Date)`.
  - `ids.ts`: `newId(): string`.

- [ ] **Step 1: Napisz testy (failing)**

`src/domain/format.test.ts`:
```ts
import { round2, fmtNum, fmtLen, fmtArea, parseNum, dateStamp } from './format';

describe('round2', () => {
  it('rounds to 2 decimals', () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(2.5)).toBe(2.5);
  });
  it('never returns negative zero', () => {
    expect(Object.is(round2(-0.001), 0)).toBe(true);
  });
});

describe('fmtNum / fmtLen / fmtArea', () => {
  it('uses decimal comma', () => {
    expect(fmtNum(2.5)).toBe('2,5');
    expect(fmtNum(3)).toBe('3');
    expect(fmtNum(1.234)).toBe('1,23');
  });
  it('formats lengths with 2 decimals and unit', () => {
    expect(fmtLen(12.3)).toBe('12,30 m');
    expect(fmtLen(0)).toBe('0,00 m');
  });
  it('formats areas: no decimals from 100 m², else one decimal', () => {
    expect(fmtArea(508.25)).toBe('508 m²');
    expect(fmtArea(100)).toBe('100 m²');
    expect(fmtArea(48.8)).toBe('48,8 m²');
    expect(fmtArea(6)).toBe('6,0 m²');
  });
});

describe('parseNum', () => {
  it('accepts comma and dot, trims spaces', () => {
    expect(parseNum('2,5')).toBe(2.5);
    expect(parseNum(' 3 ')).toBe(3);
    expect(parseNum('-1,25')).toBe(-1.25);
    expect(parseNum('4.75')).toBe(4.75);
  });
  it('returns NaN for anything that is not a plain number', () => {
    for (const s of ['', '-', '.', 'abc', '12.5 m', '1 000', 'Infinity', '1,2,3']) {
      expect(parseNum(s)).toBeNaN();
    }
  });
});

describe('dateStamp', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(dateStamp(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(dateStamp(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});
```

`src/domain/catalog.test.ts`:
```ts
import { CATALOG, ORDER_POLY, ORDER_POINT, isPoly, isPolyType, defaultRadius, isShapeType } from './catalog';
import { newId } from './ids';

describe('catalog', () => {
  it('has z-order from PRD 6.1', () => {
    expect(CATALOG.boundary.z).toBe(0);
    expect(CATALOG.grass.z).toBe(1);
    expect(CATALOG.gravel.z).toBe(2);
    expect(CATALOG.paving.z).toBe(2);
    expect(CATALOG.bed.z).toBe(3);
    expect(CATALOG.house.z).toBe(4);
    expect([CATALOG.shrub.z, CATALOG.conifer.z, CATALOG.tree.z]).toEqual([5, 6, 7]);
  });
  it('lists tools in UI order', () => {
    expect(ORDER_POLY).toEqual(['boundary', 'grass', 'paving', 'gravel', 'bed', 'house']);
    expect(ORDER_POINT).toEqual(['tree', 'conifer', 'shrub']);
  });
  it('has Polish labels and default radii', () => {
    expect(CATALOG.paving.label).toBe('Kostka brukowa');
    expect(CATALOG.house.label).toBe('Dom / budynek');
    expect(defaultRadius('shrub')).toBe(0.6);
    expect(defaultRadius('conifer')).toBe(1);
    expect(defaultRadius('tree')).toBe(2.5);
  });
  it('narrows shapes and types', () => {
    expect(isPolyType('bed')).toBe(true);
    expect(isPolyType('tree')).toBe(false);
    expect(isPoly({ id: 'a', type: 'grass', pts: [[0, 0], [1, 0], [1, 1]] })).toBe(true);
    expect(isPoly({ id: 'b', type: 'tree', x: 0, y: 0, r: 1 })).toBe(false);
  });
  it('isShapeType rejects inherited object keys', () => {
    expect(isShapeType('grass')).toBe(true);
    expect(isShapeType('toString')).toBe(false);
    expect(isShapeType(5)).toBe(false);
  });
  it('newId returns unique string ids', () => {
    const a = newId(), b = newId();
    expect(a).toMatch(/^e[0-9a-z]+$/);
    expect(a).not.toBe(b);
  });
});
```

Run: `npx vitest run src/domain`
Expected: FAIL (brak modułów).

- [ ] **Step 2: Zaimplementuj**

`src/domain/types.ts`:
```ts
export type Pt = [number, number];
export type PolyType = 'boundary' | 'grass' | 'gravel' | 'paving' | 'bed' | 'house';
export type PointType = 'shrub' | 'conifer' | 'tree';
export type ShapeType = PolyType | PointType;

export interface PolyShape { id: string; type: PolyType; name?: string; pts: Pt[] }
export interface PointShape { id: string; type: PointType; name?: string; x: number; y: number; r: number }
export type Shape = PolyShape | PointShape;

export interface Background { src: string; x: number; y: number; w: number; aspect: number; opacity: number; visible: boolean }
export interface Plan { W: number; H: number; shapes: Shape[]; bg: Background | null }
```

`src/domain/catalog.ts`:
```ts
import type { PointType, PolyShape, PolyType, Shape, ShapeType } from './types';

export interface TypeInfo { label: string; kind: 'poly' | 'point'; z: number; r?: number }

export const CATALOG: Record<ShapeType, TypeInfo> = {
  boundary: { label: 'Granica działki', kind: 'poly', z: 0 },
  grass: { label: 'Trawnik', kind: 'poly', z: 1 },
  gravel: { label: 'Żwir', kind: 'poly', z: 2 },
  paving: { label: 'Kostka brukowa', kind: 'poly', z: 2 },
  bed: { label: 'Rabata', kind: 'poly', z: 3 },
  house: { label: 'Dom / budynek', kind: 'poly', z: 4 },
  shrub: { label: 'Krzew', kind: 'point', z: 5, r: 0.6 },
  conifer: { label: 'Iglak', kind: 'point', z: 6, r: 1.0 },
  tree: { label: 'Drzewo liściaste', kind: 'point', z: 7, r: 2.5 },
};

export const ORDER_POLY: PolyType[] = ['boundary', 'grass', 'paving', 'gravel', 'bed', 'house'];
export const ORDER_POINT: PointType[] = ['tree', 'conifer', 'shrub'];
export const ZOOMS = [8, 12, 16, 20, 28, 36, 48, 64, 80];
export const DEFAULT_ZOOM = 28;
export const HISTORY_LIMIT = 80;
export const STORAGE_KEY = 'planer-ogrodu-v1';
export const PLOT_MIN = 5;
export const PLOT_MAX = 500;
export const DEFAULT_PLOT = { W: 30, H: 22 };

export function isShapeType(v: unknown): v is ShapeType {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(CATALOG, v);
}
export function isPolyType(t: ShapeType): t is PolyType {
  return CATALOG[t].kind === 'poly';
}
export function isPoly(s: Shape): s is PolyShape {
  return isPolyType(s.type);
}
export function defaultRadius(t: PointType): number {
  return CATALOG[t].r!;
}
```

`src/domain/format.ts`:
```ts
export function round2(v: number): number {
  const r = Math.round(v * 100) / 100;
  return r === 0 ? 0 : r;
}
export function fmtNum(v: number): string {
  return String(round2(v)).replace('.', ',');
}
export function fmtLen(v: number): string {
  return v.toFixed(2).replace('.', ',') + ' m';
}
export function fmtArea(a: number): string {
  return (a >= 100 ? a.toFixed(0) : a.toFixed(1)).replace('.', ',') + ' m²';
}
export function parseNum(str: string): number {
  const t = String(str).trim().replace(',', '.');
  if (t === '' || t === '-' || t === '.') return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}
export function dateStamp(d: Date = new Date()): string {
  const p = (n: number) => (n < 10 ? '0' : '') + n;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
```

`src/domain/ids.ts`:
```ts
let counter = Date.now();

export function newId(): string {
  counter += 1;
  return 'e' + counter.toString(36);
}
```

- [ ] **Step 3: Uruchom testy**

Run: `npx vitest run src/domain`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/domain
git commit -m "feat(domain): typy, katalog elementów, formatowanie liczb

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Geometria

**Files:**
- Create: `src/domain/geometry.ts`
- Test: `src/domain/geometry.test.ts`

**Interfaces:**
- Consumes: `Pt` (Task 2).
- Produces: `BBox = [x0, y0, x1, y1]`, `dist(a,b)`, `area(pts)`, `perimeter(pts)`, `bbox(pts): BBox`, `centroid(pts): Pt`, `pointInPolygon(p, pts): boolean`, `segmentDistance(p, a, b): { d: number; q: Pt }`, `rectPoints(a, b): Pt[]`, `ptsAttr(pts): string` (format SVG `"x,y x,y"`).

- [ ] **Step 1: Napisz testy (failing)**

`src/domain/geometry.test.ts`:
```ts
import { area, bbox, centroid, dist, perimeter, pointInPolygon, ptsAttr, rectPoints, segmentDistance } from './geometry';
import type { Pt } from './types';

const square: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
const lShape: Pt[] = [[0, 0], [4, 0], [4, 1], [1, 1], [1, 3], [0, 3]];

describe('geometry', () => {
  it('dist', () => {
    expect(dist([0, 0], [3, 4])).toBe(5);
  });
  it('area is orientation-independent', () => {
    expect(area(square)).toBe(100);
    expect(area([...square].reverse())).toBe(100);
    expect(area(lShape)).toBe(6);
  });
  it('perimeter is closed', () => {
    expect(perimeter(square)).toBe(40);
    expect(perimeter(lShape)).toBe(14);
  });
  it('bbox', () => {
    expect(bbox(lShape)).toEqual([0, 0, 4, 3]);
  });
  it('centroid of square and degenerate polygon', () => {
    expect(centroid(square)).toEqual([5, 5]);
    expect(centroid([[0, 0], [2, 0], [4, 0]])).toEqual([2, 0]);
  });
  it('pointInPolygon handles concave shapes', () => {
    expect(pointInPolygon([0.5, 2], lShape)).toBe(true);
    expect(pointInPolygon([2, 0.5], lShape)).toBe(true);
    expect(pointInPolygon([2, 2], lShape)).toBe(false);
    expect(pointInPolygon([11, 5], square)).toBe(false);
  });
  it('segmentDistance clamps to the segment', () => {
    expect(segmentDistance([5, 3], [0, 0], [10, 0])).toEqual({ d: 3, q: [5, 0] });
    expect(segmentDistance([12, 0], [0, 0], [10, 0])).toEqual({ d: 2, q: [10, 0] });
    expect(segmentDistance([3, 4], [0, 0], [0, 0])).toEqual({ d: 5, q: [0, 0] });
  });
  it('rectPoints normalises corners clockwise from top-left', () => {
    expect(rectPoints([4, 5], [1, 2])).toEqual([[1, 2], [4, 2], [4, 5], [1, 5]]);
  });
  it('ptsAttr', () => {
    expect(ptsAttr([[0, 0], [1.5, 2]])).toBe('0,0 1.5,2');
  });
});
```

Run: `npx vitest run src/domain/geometry.test.ts`
Expected: FAIL.

- [ ] **Step 2: Zaimplementuj `src/domain/geometry.ts`**

```ts
import type { Pt } from './types';

export type BBox = [number, number, number, number];

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function area(p: Pt[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    a += p[i][0] * q[1] - q[0] * p[i][1];
  }
  return Math.abs(a) / 2;
}

export function perimeter(p: Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) s += dist(p[i], p[(i + 1) % p.length]);
  return s;
}

export function bbox(p: Pt[]): BBox {
  const b: BBox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const q of p) {
    b[0] = Math.min(b[0], q[0]);
    b[1] = Math.min(b[1], q[1]);
    b[2] = Math.max(b[2], q[0]);
    b[3] = Math.max(b[3], q[1]);
  }
  return b;
}

export function centroid(p: Pt[]): Pt {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    const f = p[i][0] * q[1] - q[0] * p[i][1];
    a += f;
    cx += (p[i][0] + q[0]) * f;
    cy += (p[i][1] + q[1]) * f;
  }
  if (Math.abs(a) < 1e-9) {
    const b = bbox(p);
    return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export function pointInPolygon(pt: Pt, p: Pt[]): boolean {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function segmentDistance(p: Pt, a: Pt, b: Pt): { d: number; q: Pt } {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  const q: Pt = [a[0] + t * dx, a[1] + t * dy];
  return { d: dist(p, q), q };
}

export function rectPoints(a: Pt, b: Pt): Pt[] {
  const x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]);
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}

export function ptsAttr(p: Pt[]): string {
  return p.map((q) => q[0] + ',' + q[1]).join(' ');
}
```

- [ ] **Step 3: Uruchom testy**

Run: `npx vitest run src/domain/geometry.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/domain/geometry.ts src/domain/geometry.test.ts
git commit -m "feat(domain): geometria wielokątów

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Przyciąganie i odcinki z długości i kąta

**Files:**
- Create: `src/domain/snapping.ts`
- Test: `src/domain/snapping.test.ts`

**Interfaces:**
- Consumes: `round2` (Task 2), `dist` (Task 3), `Pt`.
- Produces: `snapValue(v, step)`, `snapPoint(p, step): Pt`, `draftPoint(raw, last: Pt | null, opts: { step: number; angleSnap: boolean }): Pt`, `pointFromSegment(last, len, deg): Pt`, `displayAngle(last, hover): number`.

- [ ] **Step 1: Napisz testy (failing)**

`src/domain/snapping.test.ts`:
```ts
import { displayAngle, draftPoint, pointFromSegment, snapPoint, snapValue } from './snapping';

describe('snapValue / snapPoint', () => {
  it('snaps to step', () => {
    expect(snapValue(1.26, 0.5)).toBe(1.5);
    expect(snapValue(1.26, 0.1)).toBe(1.3);
    expect(snapValue(1.26, 1)).toBe(1);
  });
  it('step 0 only rounds to centimetres', () => {
    expect(snapValue(1.234, 0)).toBe(1.23);
  });
  it('snapPoint', () => {
    expect(snapPoint([1.26, 3.74], 0.5)).toEqual([1.5, 3.5]);
  });
});

describe('draftPoint', () => {
  it('without a previous point it just snaps', () => {
    expect(draftPoint([1.26, 1.74], null, { step: 0.5, angleSnap: true })).toEqual([1.5, 1.5]);
  });
  it('without angle snap it ignores the previous point', () => {
    expect(draftPoint([10.2, 0.9], [0, 0], { step: 0.5, angleSnap: false })).toEqual([10, 1]);
  });
  it('angle snap rounds direction to 15° and length to step', () => {
    expect(draftPoint([10, 0.9], [0, 0], { step: 0.5, angleSnap: true })).toEqual([10, 0]);
  });
  it('angle snap with step 0 keeps length', () => {
    expect(draftPoint([7, 7.3], [0, 0], { step: 0, angleSnap: true })).toEqual([7.15, 7.15]);
  });
});

describe('pointFromSegment (0° right, 90° up, Y grows down)', () => {
  it.each([
    [0, [5, 0]],
    [90, [0, -5]],
    [180, [-5, 0]],
    [270, [0, 5]],
  ] as const)('%i°', (deg, expected) => {
    expect(pointFromSegment([0, 0], 5, deg)).toEqual(expected);
  });
  it('from an arbitrary point', () => {
    expect(pointFromSegment([1, 1], 2, 45)).toEqual([2.41, -0.41]);
  });
});

describe('displayAngle', () => {
  it('uses the same convention and 0–359 range', () => {
    expect(displayAngle([0, 0], [1, 0])).toBe(0);
    expect(displayAngle([0, 0], [1, -1])).toBe(45);
    expect(displayAngle([0, 0], [-1, 0])).toBe(180);
    expect(displayAngle([0, 0], [0, 1])).toBe(270);
  });
});
```

Run: `npx vitest run src/domain/snapping.test.ts`
Expected: FAIL.

- [ ] **Step 2: Zaimplementuj `src/domain/snapping.ts`**

```ts
import { round2 } from './format';
import { dist } from './geometry';
import type { Pt } from './types';

export function snapValue(v: number, step: number): number {
  return step ? round2(Math.round(v / step) * step) : round2(v);
}

export function snapPoint(p: Pt, step: number): Pt {
  return [snapValue(p[0], step), snapValue(p[1], step)];
}

export function draftPoint(raw: Pt, last: Pt | null, opts: { step: number; angleSnap: boolean }): Pt {
  if (!last || !opts.angleSnap) return snapPoint(raw, opts.step);
  const q = Math.PI / 12;
  const a = Math.round(Math.atan2(raw[1] - last[1], raw[0] - last[0]) / q) * q;
  let len = dist(raw, last);
  if (opts.step) len = Math.round(len / opts.step) * opts.step;
  return [round2(last[0] + len * Math.cos(a)), round2(last[1] + len * Math.sin(a))];
}

export function pointFromSegment(last: Pt, len: number, deg: number): Pt {
  const rad = (deg * Math.PI) / 180;
  return [round2(last[0] + len * Math.cos(rad)), round2(last[1] - len * Math.sin(rad))];
}

export function displayAngle(last: Pt, hover: Pt): number {
  let ang = (Math.atan2(-(hover[1] - last[1]), hover[0] - last[0]) * 180) / Math.PI;
  if (ang < 0) ang += 360;
  return Math.round(ang) || 0; // || 0 zamienia -0 na 0
}
```

- [ ] **Step 3: Uruchom testy**

Run: `npx vitest run src/domain/snapping.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/domain/snapping.ts src/domain/snapping.test.ts
git commit -m "feat(domain): przyciąganie do siatki i kątów, odcinek z długości i kąta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: Plan przykładowy, powierzchnie netto, podsumowanie

**Files:**
- Create: `src/domain/sample.ts`, `src/domain/netAreas.ts`
- Test: `src/domain/netAreas.test.ts`

**Interfaces:**
- Consumes: `CATALOG`, `ORDER_POLY`, `ORDER_POINT`, `isPoly` (Task 2), `area`, `bbox`, `pointInPolygon` (Task 3), `fmtArea` (Task 2).
- Produces:
  - `samplePlan(): Plan`: plan referencyjny z PRD §6.8, W 30, H 22, `bg: null`, 15 elementów, zawsze nowe obiekty.
  - `AreaType = Exclude<PolyType, 'boundary'>`, `NetAreas = Partial<Record<AreaType, number>> & { free: number }`.
  - `netAreas(shapes): NetAreas`.
  - `Summary { plot: number; net: NetAreas; pbc: number | null; counts: Partial<Record<PointType, number>> }`, `summarize(shapes): Summary`.
  - `SummaryRow { key: string; label: string; value: string }`, `summaryRows(s: Summary): SummaryRow[]`.

- [ ] **Step 1: Plan przykładowy**

`src/domain/sample.ts` (dane 1:1 z prototypu, `docs/reference/prototype.dc.html` linie 492–510):
```ts
import type { Plan } from './types';

export function samplePlan(): Plan {
  return {
    W: 30,
    H: 22,
    bg: null,
    shapes: [
      { id: 'b1', type: 'boundary', pts: [[1, 1.5], [27.5, 1], [28, 20.5], [1, 20]] },
      { id: 'g1', type: 'grass', pts: [[1, 1.5], [27.5, 1], [28, 20.5], [1, 20]] },
      { id: 'p1', type: 'paving', name: 'Podjazd', pts: [[17, 1.2], [21, 1.12], [21, 8], [17, 8]] },
      { id: 'p2', type: 'paving', name: 'Taras', pts: [[8, 12], [14, 12], [14, 15.5], [8, 15.5]] },
      { id: 'v1', type: 'gravel', name: 'Ścieżka', pts: [[14, 14], [20, 14], [20, 15], [14, 15]] },
      { id: 'h1', type: 'house', name: 'Dom', pts: [[6, 4], [17, 4], [17, 12], [6, 12]] },
      { id: 'd1', type: 'bed', name: 'Rabata bylinowa', pts: [[20, 15.5], [26.8, 15.5], [26.9, 19.6], [20, 19.6]] },
      { id: 't1', type: 'tree', name: 'Klon', x: 4.5, y: 16, r: 2.8 },
      { id: 't2', type: 'tree', name: 'Jabłoń', x: 24, y: 7, r: 2.2 },
      { id: 'c1', type: 'conifer', x: 2.4, y: 4, r: 1 },
      { id: 'c2', type: 'conifer', x: 2.4, y: 6.5, r: 1 },
      { id: 'c3', type: 'conifer', x: 2.4, y: 9, r: 1 },
      { id: 's1', type: 'shrub', x: 18.5, y: 12.6, r: 0.6 },
      { id: 's2', type: 'shrub', x: 20, y: 12.9, r: 0.6 },
      { id: 's3', type: 'shrub', x: 21.5, y: 12.5, r: 0.6 },
    ],
  };
}
```

- [ ] **Step 2: Napisz testy (failing)**

`src/domain/netAreas.test.ts`:
```ts
import { netAreas, summarize, summaryRows } from './netAreas';
import { samplePlan } from './sample';
import type { Shape } from './types';

const rect = (id: string, type: 'boundary' | 'grass' | 'house' | 'paving', x0: number, y0: number, x1: number, y1: number): Shape =>
  ({ id, type, pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] });

describe('netAreas — reference values from the prototype (PRD 6.8)', () => {
  const net = netAreas(samplePlan().shapes);
  it.each([
    ['grass', 338.44],
    ['paving', 48.8],
    ['gravel', 6],
    ['bed', 27.2],
    ['house', 88],
  ] as const)('%s = %f m²', (k, v) => {
    expect(net[k]).toBeCloseTo(v, 2);
  });
  it('nothing left unassigned', () => {
    expect(net.free).toBeLessThan(0.05);
  });
});

describe('netAreas — rules', () => {
  it('higher layer covers lower one inside the boundary', () => {
    const net = netAreas([rect('b', 'boundary', 0, 0, 10, 10), rect('g', 'grass', 0, 0, 10, 10), rect('h', 'house', 0, 0, 5, 10)]);
    expect(net.grass).toBeCloseTo(50, 1);
    expect(net.house).toBeCloseTo(50, 1);
    expect(net.free).toBeCloseTo(0, 5);
  });
  it('area outside the boundary is ignored, empty part counts as free', () => {
    const net = netAreas([rect('b', 'boundary', 0, 0, 10, 10), rect('g', 'grass', 5, 0, 15, 10)]);
    expect(net.grass).toBeCloseTo(50, 1);
    expect(net.free).toBeCloseTo(50, 1);
  });
  it('without a boundary it uses the bbox of all areas', () => {
    const net = netAreas([rect('g', 'grass', 0, 0, 10, 10)]);
    expect(net.grass).toBeCloseTo(100, 1);
  });
  it('empty plan', () => {
    expect(netAreas([])).toEqual({ free: 0 });
  });
});

describe('summarize / summaryRows', () => {
  it('sample plan', () => {
    const s = summarize(samplePlan().shapes);
    expect(s.plot).toBeCloseTo(508.25, 6);
    expect(s.pbc).toBe(72);
    expect(s.counts).toEqual({ tree: 2, conifer: 3, shrub: 3 });
    expect(summaryRows(s)).toEqual([
      { key: 'grass', label: 'Trawnik', value: '338 m²' },
      { key: 'paving', label: 'Kostka brukowa', value: '48,8 m²' },
      { key: 'gravel', label: 'Żwir', value: '6,0 m²' },
      { key: 'bed', label: 'Rabata', value: '27,2 m²' },
      { key: 'house', label: 'Dom / budynek', value: '88,0 m²' },
      { key: 'tree', label: 'Drzewo liściaste', value: '2 szt.' },
      { key: 'conifer', label: 'Iglak', value: '3 szt.' },
      { key: 'shrub', label: 'Krzew', value: '3 szt.' },
    ]);
  });
  it('shows unassigned area only when there is a plot', () => {
    const withPlot = summarize([rect('b', 'boundary', 0, 0, 10, 10), rect('g', 'grass', 0, 0, 5, 10)]);
    expect(summaryRows(withPlot).map((r) => r.label)).toEqual(['Trawnik', 'Niezagospodarowane']);
    expect(withPlot.pbc).toBe(50);
  });
  it('no plot → pbc null', () => {
    expect(summarize([rect('g', 'grass', 0, 0, 5, 5)]).pbc).toBeNull();
  });
});
```

Run: `npx vitest run src/domain/netAreas.test.ts`
Expected: FAIL (brak `./netAreas`).

- [ ] **Step 3: Zaimplementuj `src/domain/netAreas.ts`**

Algorytm odwzorowuje prototyp (linie 845–871). Kolejność pętli i krok co 0,2 m muszą zostać takie same, bo od nich zależą wartości referencyjne.

```ts
import { CATALOG, ORDER_POINT, ORDER_POLY, isPoly } from './catalog';
import { fmtArea } from './format';
import { area, bbox, pointInPolygon, type BBox } from './geometry';
import type { PointType, PolyShape, PolyType, Pt, Shape } from './types';

export type AreaType = Exclude<PolyType, 'boundary'>;
export type NetAreas = Partial<Record<AreaType, number>> & { free: number };

const RES = 0.2;

export function netAreas(shapes: Shape[]): NetAreas {
  const bnds: PolyShape[] = [];
  const polys: { sh: PolyShape; i: number; b: BBox }[] = [];
  shapes.forEach((sh, i) => {
    if (!isPoly(sh) || sh.pts.length < 3) return;
    if (sh.type === 'boundary') bnds.push(sh);
    else polys.push({ sh, i, b: bbox(sh.pts) });
  });
  polys.sort((a, b) => CATALOG[b.sh.type].z - CATALOG[a.sh.type].z || b.i - a.i);

  const out: NetAreas = { free: 0 };
  const boxes = bnds.length ? bnds.map((b) => bbox(b.pts)) : polys.map((p) => p.b);
  if (!boxes.length) return out;
  const B: BBox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    B[0] = Math.min(B[0], b[0]);
    B[1] = Math.min(B[1], b[1]);
    B[2] = Math.max(B[2], b[2]);
    B[3] = Math.max(B[3], b[3]);
  }
  const cell = RES * RES;
  for (let x = B[0] + RES / 2; x < B[2]; x += RES) {
    for (let y = B[1] + RES / 2; y < B[3]; y += RES) {
      const p: Pt = [x, y];
      if (bnds.length && !bnds.some((b) => pointInPolygon(p, b.pts))) continue;
      const hit = polys.find((q) => x >= q.b[0] && x <= q.b[2] && y >= q.b[1] && y <= q.b[3] && pointInPolygon(p, q.sh.pts));
      if (hit) {
        const t = hit.sh.type as AreaType;
        out[t] = (out[t] ?? 0) + cell;
      } else {
        out.free += cell;
      }
    }
  }
  return out;
}

export interface Summary {
  plot: number;
  net: NetAreas;
  pbc: number | null;
  counts: Partial<Record<PointType, number>>;
}

export function summarize(shapes: Shape[]): Summary {
  const net = netAreas(shapes);
  let plot = 0;
  const counts: Partial<Record<PointType, number>> = {};
  for (const sh of shapes) {
    if (isPoly(sh)) {
      if (sh.type === 'boundary') plot += area(sh.pts);
    } else {
      counts[sh.type] = (counts[sh.type] ?? 0) + 1;
    }
  }
  const pbc = plot ? Math.round((((net.grass ?? 0) + (net.bed ?? 0)) / plot) * 100) : null;
  return { plot, net, pbc, counts };
}

export interface SummaryRow { key: string; label: string; value: string }

export function summaryRows(s: Summary): SummaryRow[] {
  const rows: SummaryRow[] = [];
  for (const k of ORDER_POLY) {
    if (k === 'boundary') continue;
    const v = s.net[k] ?? 0;
    if (v > 0.001) rows.push({ key: k, label: CATALOG[k].label, value: fmtArea(v) });
  }
  if (s.plot && s.net.free > 0.05) rows.push({ key: 'free', label: 'Niezagospodarowane', value: fmtArea(s.net.free) });
  for (const k of ORDER_POINT) {
    const n = s.counts[k];
    if (n) rows.push({ key: k, label: CATALOG[k].label, value: `${n} szt.` });
  }
  return rows;
}
```

- [ ] **Step 4: Uruchom testy**

Run: `npx vitest run src/domain/netAreas.test.ts`
Expected: PASS. Jeśli wartość referencyjna się nie zgadza, porównaj pętlę z prototypem: start od `B[0] + RES/2`, warunek `<`, kolejność `polys` malejąco po (z, indeks).

- [ ] **Step 5: Commit**

```bash
git add src/domain/sample.ts src/domain/netAreas.ts src/domain/netAreas.test.ts
git commit -m "feat(domain): powierzchnie netto, PBC i podsumowanie planu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Plik planu (zapis, odczyt, walidacja)

**Files:**
- Create: `src/domain/planFile.ts`, `tests/fixtures/prototype-sample.json`
- Test: `src/domain/planFile.test.ts`

**Interfaces:**
- Consumes: `CATALOG`, `isShapeType`, `isPolyType`, `defaultRadius`, `PLOT_MIN`, `PLOT_MAX`, `DEFAULT_PLOT` (Task 2), `samplePlan` (Task 5).
- Produces: `PlanFileError extends Error`, `serializePlan(plan: Plan, now?: Date): string`, `parsePlan(text: string, newId: () => string): Plan`, `validatePlan(data: unknown, newId: () => string): Plan`.

- [ ] **Step 1: Fixture (plik w formacie zapisu prototypu)**

`tests/fixtures/prototype-sample.json`:
```json
{"app":"planer-ogrodu","version":1,"savedAt":"2026-10-05T10:00:00.000Z","W":30,"H":22,"shapes":[{"id":"b1","type":"boundary","pts":[[1,1.5],[27.5,1],[28,20.5],[1,20]]},{"id":"g1","type":"grass","pts":[[1,1.5],[27.5,1],[28,20.5],[1,20]]},{"id":"p1","type":"paving","name":"Podjazd","pts":[[17,1.2],[21,1.12],[21,8],[17,8]]},{"id":"p2","type":"paving","name":"Taras","pts":[[8,12],[14,12],[14,15.5],[8,15.5]]},{"id":"v1","type":"gravel","name":"Ścieżka","pts":[[14,14],[20,14],[20,15],[14,15]]},{"id":"h1","type":"house","name":"Dom","pts":[[6,4],[17,4],[17,12],[6,12]]},{"id":"d1","type":"bed","name":"Rabata bylinowa","pts":[[20,15.5],[26.8,15.5],[26.9,19.6],[20,19.6]]},{"id":"t1","type":"tree","name":"Klon","x":4.5,"y":16,"r":2.8},{"id":"t2","type":"tree","name":"Jabłoń","x":24,"y":7,"r":2.2},{"id":"c1","type":"conifer","x":2.4,"y":4,"r":1},{"id":"c2","type":"conifer","x":2.4,"y":6.5,"r":1},{"id":"c3","type":"conifer","x":2.4,"y":9,"r":1},{"id":"s1","type":"shrub","x":18.5,"y":12.6,"r":0.6},{"id":"s2","type":"shrub","x":20,"y":12.9,"r":0.6},{"id":"s3","type":"shrub","x":21.5,"y":12.5,"r":0.6}],"bg":null}
```

- [ ] **Step 2: Napisz testy (failing)**

`src/domain/planFile.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { PlanFileError, parsePlan, serializePlan, validatePlan } from './planFile';
import { samplePlan } from './sample';

let n = 0;
const ids = () => `new${++n}`;
const fixture = readFileSync('tests/fixtures/prototype-sample.json', 'utf8');
const PNG = 'data:image/png;base64,AAAA';

describe('parsePlan', () => {
  beforeEach(() => { n = 0; });

  it('reads a file saved by the prototype', () => {
    expect(parsePlan(fixture, ids)).toEqual(samplePlan());
  });

  it('round-trips through serializePlan', () => {
    const plan = { ...samplePlan(), bg: { src: PNG, x: 1, y: 2, w: 20, aspect: 0.5, opacity: 0.6, visible: false } };
    expect(parsePlan(serializePlan(plan), ids)).toEqual(plan);
  });

  it('serializePlan writes the header fields', () => {
    const data = JSON.parse(serializePlan(samplePlan(), new Date('2026-10-05T10:00:00Z')));
    expect(data).toMatchObject({ app: 'planer-ogrodu', version: 1, savedAt: '2026-10-05T10:00:00.000Z', W: 30, H: 22, bg: null });
  });

  it.each(['nie json', '{}', '{"shapes":"x"}', 'null', '[]'])('rejects %s with a Polish message', (text) => {
    expect(() => parsePlan(text, ids)).toThrow(PlanFileError);
    expect(() => parsePlan(text, ids)).toThrow('to nie jest plik planu ogrodu');
  });

  it('accepts newer versions as v1', () => {
    const plan = parsePlan(JSON.stringify({ version: 2, shapes: [], extra: true }), ids);
    expect(plan).toEqual({ W: 30, H: 22, shapes: [], bg: null });
  });
});

describe('validatePlan — repairs and drops bad entries', () => {
  beforeEach(() => { n = 0; });
  const one = (shape: unknown) => validatePlan({ shapes: [shape] }, ids).shapes;

  it('drops unknown types, including inherited object keys', () => {
    expect(one({ id: 'a', type: 'pond', pts: [[0, 0], [1, 0], [1, 1]] })).toEqual([]);
    expect(one({ id: 'a', type: 'toString', x: 1, y: 1 })).toEqual([]);
    expect(one(null)).toEqual([]);
    expect(one('grass')).toEqual([]);
  });
  it('gives a new id when id is not a string', () => {
    expect(one({ id: 7, type: 'tree', x: 1, y: 2, r: 1 })).toEqual([{ id: 'new1', type: 'tree', x: 1, y: 2, r: 1 }]);
  });
  it('trims names to 80 chars and ignores non-string names', () => {
    expect(one({ id: 'a', type: 'tree', name: 'x'.repeat(100), x: 0, y: 0, r: 1 })[0].name).toHaveLength(80);
    expect(one({ id: 'a', type: 'tree', name: 5, x: 0, y: 0, r: 1 })[0]).not.toHaveProperty('name');
  });
  it('keeps only numeric points and drops polygons with fewer than 3', () => {
    expect(one({ id: 'a', type: 'grass', pts: [[0, 0], ['5', 0], [1, 0], [1, 1], [2]] })).toEqual([
      { id: 'a', type: 'grass', pts: [[0, 0], [1, 0], [1, 1]] },
    ]);
    expect(one({ id: 'a', type: 'grass', pts: [[0, 0], [1, '1'], [1, 0]] })).toEqual([]);
    expect(one({ id: 'a', type: 'grass' })).toEqual([]);
  });
  it('plants need numeric x/y; bad radius falls back to default', () => {
    expect(one({ id: 'a', type: 'shrub', x: '1', y: 1 })).toEqual([]);
    expect(one({ id: 'a', type: 'shrub', x: 1, y: 1, r: -2 })).toEqual([{ id: 'a', type: 'shrub', x: 1, y: 1, r: 0.6 }]);
    expect(one({ id: 'a', type: 'conifer', x: 1, y: 1 })).toEqual([{ id: 'a', type: 'conifer', x: 1, y: 1, r: 1 }]);
  });
  it('clamps plot size', () => {
    expect(validatePlan({ shapes: [], W: 1000, H: 2 }, ids)).toMatchObject({ W: 500, H: 5 });
    expect(validatePlan({ shapes: [], W: 'x' }, ids)).toMatchObject({ W: 30, H: 22 });
  });
  it('validates the background', () => {
    const bg = (b: unknown) => validatePlan({ shapes: [], bg: b }, ids).bg;
    expect(bg({ src: 'https://example.com/a.png', w: 10, aspect: 1 })).toBeNull();
    expect(bg({ src: PNG, w: 0, aspect: 1 })).toBeNull();
    expect(bg({ src: PNG, w: 10, aspect: 0 })).toBeNull();
    expect(bg({ src: PNG, w: 10, aspect: 1, opacity: 2 })).toEqual({ src: PNG, x: 0, y: 0, w: 10, aspect: 1, opacity: 1, visible: true });
    expect(bg({ src: PNG, w: 10, aspect: 1, opacity: 0, x: 3, y: 4, visible: false })).toEqual({ src: PNG, x: 3, y: 4, w: 10, aspect: 1, opacity: 0.1, visible: false });
  });
});
```

Run: `npx vitest run src/domain/planFile.test.ts`
Expected: FAIL (brak `./planFile`).

- [ ] **Step 3: Zaimplementuj `src/domain/planFile.ts`**

```ts
import { DEFAULT_PLOT, PLOT_MAX, PLOT_MIN, defaultRadius, isPolyType, isShapeType } from './catalog';
import type { Background, Plan, Pt, Shape } from './types';

export class PlanFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanFileError';
  }
}

const NOT_A_PLAN = 'to nie jest plik planu ogrodu';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function serializePlan(plan: Plan, now: Date = new Date()): string {
  return JSON.stringify({ app: 'planer-ogrodu', version: 1, savedAt: now.toISOString(), W: plan.W, H: plan.H, shapes: plan.shapes, bg: plan.bg });
}

export function parsePlan(text: string, newId: () => string): Plan {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new PlanFileError(NOT_A_PLAN);
  }
  return validatePlan(data, newId);
}

export function validatePlan(data: unknown, newId: () => string): Plan {
  if (!data || typeof data !== 'object' || !Array.isArray((data as { shapes?: unknown }).shapes)) {
    throw new PlanFileError(NOT_A_PLAN);
  }
  const d = data as Record<string, unknown>;
  const shapes: Shape[] = [];
  for (const raw of d.shapes as unknown[]) {
    const s = validateShape(raw, newId);
    if (s) shapes.push(s);
  }
  return {
    W: isNum(d.W) ? clamp(d.W, PLOT_MIN, PLOT_MAX) : DEFAULT_PLOT.W,
    H: isNum(d.H) ? clamp(d.H, PLOT_MIN, PLOT_MAX) : DEFAULT_PLOT.H,
    shapes,
    bg: validateBackground(d.bg),
  };
}

function validateShape(raw: unknown, newId: () => string): Shape | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const type = r.type;
  if (!isShapeType(type)) return null;
  const id = typeof r.id === 'string' ? r.id : newId();
  let shape: Shape;
  if (isPolyType(type)) {
    if (!Array.isArray(r.pts)) return null;
    const pts: Pt[] = (r.pts as unknown[])
      .filter((p): p is [number, number] => Array.isArray(p) && isNum(p[0]) && isNum(p[1]))
      .map((p) => [p[0], p[1]]);
    if (pts.length < 3) return null;
    shape = { id, type, pts };
  } else {
    if (!isNum(r.x) || !isNum(r.y)) return null;
    shape = { id, type, x: r.x, y: r.y, r: isNum(r.r) && r.r > 0 ? r.r : defaultRadius(type) };
  }
  if (typeof r.name === 'string') shape.name = r.name.slice(0, 80);
  return shape;
}

function validateBackground(raw: unknown): Background | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.src !== 'string' || !b.src.startsWith('data:image/')) return null;
  if (!isNum(b.w) || b.w <= 0 || !isNum(b.aspect) || b.aspect <= 0) return null;
  return {
    src: b.src,
    x: isNum(b.x) ? b.x : 0,
    y: isNum(b.y) ? b.y : 0,
    w: b.w,
    aspect: b.aspect,
    opacity: isNum(b.opacity) ? clamp(b.opacity, 0.1, 1) : 0.6,
    visible: b.visible !== false,
  };
}
```

Uwaga do testu „name”: `samplePlan()` ustawia `name` przed `pts`, a `validateShape` po nich. `toEqual` nie porównuje kolejności kluczy, więc to nie ma znaczenia.

- [ ] **Step 4: Uruchom testy**

Run: `npx vitest run src/domain/planFile.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/planFile.ts src/domain/planFile.test.ts tests/fixtures/prototype-sample.json
git commit -m "feat(domain): zapis i walidacja pliku planu zgodna z prototypem

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Reducer planu z historią cofania

**Files:**
- Create: `src/state/history.ts`, `src/state/planReducer.ts`
- Test: `src/state/planReducer.test.ts`

**Interfaces:**
- Consumes: `CATALOG`, `HISTORY_LIMIT`, `PLOT_MIN`, `PLOT_MAX`, `defaultRadius`, `isPoly` (Task 2), `round2` (Task 2), `samplePlan` (Task 5).
- Produces:
  - `pushPast(past: Shape[][], shapes: Shape[]): Shape[][]`
  - `DocState { plan: Plan; past: Shape[][] }`
  - `ShapePatch { name?: string; pts?: Pt[]; x?: number; y?: number; r?: number }`
  - `PlanAction` (wszystkie typy z prefiksem `plan/`): `add {shape, keepTool?}`, `update {id, patch}`, `replace {id, shape}`, `remove {id}`, `duplicate {id, newId}`, `setType {id, shapeType}`, `moveVertex {id, index, pt}`, `insertVertex {id, after, pt}`, `deleteVertex {id, index}`, `setPlotSize {W?, H?}`, `setBackground {bg}`, `patchBackground {patch}`, `load {plan}`, `loadSample`, `clear`, `checkpoint`, `undo`
  - `planReducer(s: DocState, a: PlanAction): DocState`. Przy braku zmiany zwraca **ten sam obiekt** `s`.
- Zasady historii (spec §4.1, PRD F-7): migawka `shapes` jest odkładana przed zmianą przez `add`, `remove`, `duplicate`, `setType`, `insertVertex`, `deleteVertex`, `load`, `loadSample`, `clear` i `checkpoint`. Bez zapisu działają `update`, `replace`, `moveVertex` (te poprzedza `checkpoint` wysłany przez UI), `setPlotSize`, `setBackground` i `patchBackground`.

- [ ] **Step 1: Napisz testy (failing)**

`src/state/planReducer.test.ts`:
```ts
import { samplePlan } from '../domain/sample';
import type { PointShape, PolyShape, Shape } from '../domain/types';
import { pushPast } from './history';
import { planReducer, type DocState } from './planReducer';

const poly: PolyShape = { id: 'a', type: 'grass', pts: [[0, 0], [4, 0], [4, 3], [0, 3]] };
const tree: PointShape = { id: 't', type: 'tree', x: 5, y: 5, r: 2.5 };
const doc = (shapes: Shape[] = [poly, tree]): DocState => ({ plan: { W: 30, H: 22, shapes, bg: null }, past: [] });
const find = (s: DocState, id: string) => s.plan.shapes.find((x) => x.id === id);

describe('history', () => {
  it('keeps at most 80 snapshots, dropping the oldest', () => {
    let past: Shape[][] = [];
    for (let i = 0; i < 85; i++) past = pushPast(past, [{ ...tree, id: 's' + i }]);
    expect(past).toHaveLength(80);
    expect(past[0][0].id).toBe('s5');
  });
});

describe('planReducer', () => {
  it('add appends and records history', () => {
    const s = planReducer(doc([]), { type: 'plan/add', shape: tree });
    expect(s.plan.shapes).toEqual([tree]);
    expect(s.past).toEqual([[]]);
  });

  it('update and replace do not record', () => {
    let s = planReducer(doc(), { type: 'plan/update', id: 'a', patch: { name: 'Przód' } });
    expect(find(s, 'a')?.name).toBe('Przód');
    s = planReducer(s, { type: 'plan/replace', id: 't', shape: { ...tree, x: 9 } });
    expect((find(s, 't') as PointShape).x).toBe(9);
    expect(s.past).toEqual([]);
  });

  it('unknown id returns the same state object', () => {
    const s0 = doc();
    expect(planReducer(s0, { type: 'plan/update', id: 'nope', patch: { name: 'x' } })).toBe(s0);
    expect(planReducer(s0, { type: 'plan/remove', id: 'nope' })).toBe(s0);
  });

  it('remove records', () => {
    const s = planReducer(doc(), { type: 'plan/remove', id: 'a' });
    expect(s.plan.shapes).toEqual([tree]);
    expect(s.past).toHaveLength(1);
  });

  it('duplicate offsets by +1 m and records', () => {
    let s = planReducer(doc(), { type: 'plan/duplicate', id: 'a', newId: 'a2' });
    expect(find(s, 'a2')).toEqual({ id: 'a2', type: 'grass', pts: [[1, 1], [5, 1], [5, 4], [1, 4]] });
    s = planReducer(s, { type: 'plan/duplicate', id: 't', newId: 't2' });
    expect(find(s, 't2')).toEqual({ ...tree, id: 't2', x: 6, y: 6 });
    expect(s.past).toHaveLength(2);
  });

  it('setType stays within kind; default radius follows the new type', () => {
    const s0 = doc();
    expect(planReducer(s0, { type: 'plan/setType', id: 'a', shapeType: 'tree' })).toBe(s0);
    let s = planReducer(s0, { type: 'plan/setType', id: 't', shapeType: 'shrub' });
    expect(find(s, 't')).toMatchObject({ type: 'shrub', r: 0.6 });
    s = planReducer(doc([{ ...tree, r: 3 }]), { type: 'plan/setType', id: 't', shapeType: 'conifer' });
    expect(find(s, 't')).toMatchObject({ type: 'conifer', r: 3 });
    s = planReducer(s0, { type: 'plan/setType', id: 'a', shapeType: 'paving' });
    expect(find(s, 'a')?.type).toBe('paving');
    expect(s.past).toHaveLength(1);
  });

  it('vertex operations', () => {
    let s = planReducer(doc(), { type: 'plan/moveVertex', id: 'a', index: 0, pt: [1, 1] });
    expect((find(s, 'a') as PolyShape).pts[0]).toEqual([1, 1]);
    expect(s.past).toHaveLength(0);
    s = planReducer(s, { type: 'plan/insertVertex', id: 'a', after: 0, pt: [2, 0] });
    expect((find(s, 'a') as PolyShape).pts).toEqual([[1, 1], [2, 0], [4, 0], [4, 3], [0, 3]]);
    expect(s.past).toHaveLength(1);
    s = planReducer(s, { type: 'plan/deleteVertex', id: 'a', index: 1 });
    s = planReducer(s, { type: 'plan/deleteVertex', id: 'a', index: 0 });
    expect((find(s, 'a') as PolyShape).pts).toHaveLength(3);
    const s3 = planReducer(s, { type: 'plan/deleteVertex', id: 'a', index: 0 });
    expect(s3).toBe(s);
  });

  it('setPlotSize ignores values outside 5–500', () => {
    const s0 = doc();
    expect(planReducer(s0, { type: 'plan/setPlotSize', W: 600 })).toBe(s0);
    expect(planReducer(s0, { type: 'plan/setPlotSize', H: 2 })).toBe(s0);
    const s = planReducer(s0, { type: 'plan/setPlotSize', W: 40 });
    expect(s.plan).toMatchObject({ W: 40, H: 22 });
    expect(s.past).toEqual([]);
  });

  it('background set/patch is not in history', () => {
    const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };
    let s = planReducer(doc(), { type: 'plan/setBackground', bg });
    s = planReducer(s, { type: 'plan/patchBackground', patch: { opacity: 0.3 } });
    expect(s.plan.bg?.opacity).toBe(0.3);
    expect(s.past).toEqual([]);
    const noBg = doc();
    expect(planReducer(noBg, { type: 'plan/patchBackground', patch: { x: 1 } })).toBe(noBg);
  });

  it('load, loadSample and clear record and can be undone', () => {
    const s0 = doc();
    let s = planReducer(s0, { type: 'plan/clear' });
    expect(s.plan.shapes).toEqual([]);
    s = planReducer(s, { type: 'plan/undo' });
    expect(s.plan.shapes).toEqual(s0.plan.shapes);

    s = planReducer(s0, { type: 'plan/load', plan: { W: 40, H: 40, shapes: [tree], bg: null } });
    expect(s.plan).toMatchObject({ W: 40, shapes: [tree] });
    s = planReducer(s, { type: 'plan/undo' });
    expect(s.plan.shapes).toEqual(s0.plan.shapes);

    s = planReducer({ ...s0, plan: { ...s0.plan, W: 50 } }, { type: 'plan/loadSample' });
    expect(s.plan.shapes).toEqual(samplePlan().shapes);
    expect(s.plan.W).toBe(30);
    expect(s.past).toHaveLength(1);
  });

  it('clear keeps background and plot size', () => {
    const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };
    const s = planReducer({ plan: { W: 44, H: 33, shapes: [tree], bg }, past: [] }, { type: 'plan/clear' });
    expect(s.plan).toEqual({ W: 44, H: 33, shapes: [], bg });
  });

  it('checkpoint + undo restores the state before a drag', () => {
    let s = planReducer(doc(), { type: 'plan/checkpoint' });
    s = planReducer(s, { type: 'plan/replace', id: 't', shape: { ...tree, x: 1 } });
    s = planReducer(s, { type: 'plan/replace', id: 't', shape: { ...tree, x: 2 } });
    s = planReducer(s, { type: 'plan/undo' });
    expect((find(s, 't') as PointShape).x).toBe(5);
    expect(s.past).toEqual([]);
  });

  it('undo with empty history is a no-op', () => {
    const s0 = doc();
    expect(planReducer(s0, { type: 'plan/undo' })).toBe(s0);
  });
});
```

Run: `npx vitest run src/state/planReducer.test.ts`
Expected: FAIL.

- [ ] **Step 2: Zaimplementuj**

`src/state/history.ts`:
```ts
import { HISTORY_LIMIT } from '../domain/catalog';
import type { Shape } from '../domain/types';

export function pushPast(past: Shape[][], shapes: Shape[]): Shape[][] {
  const next = past.concat([shapes]);
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}
```

`src/state/planReducer.ts`:
```ts
import { CATALOG, PLOT_MAX, PLOT_MIN, defaultRadius, isPoly } from '../domain/catalog';
import { round2 } from '../domain/format';
import { samplePlan } from '../domain/sample';
import type { Background, Plan, PointType, PolyType, Pt, Shape, ShapeType } from '../domain/types';
import { pushPast } from './history';

export interface DocState { plan: Plan; past: Shape[][] }
export interface ShapePatch { name?: string; pts?: Pt[]; x?: number; y?: number; r?: number }

export type PlanAction =
  | { type: 'plan/add'; shape: Shape; keepTool?: boolean }
  | { type: 'plan/update'; id: string; patch: ShapePatch }
  | { type: 'plan/replace'; id: string; shape: Shape }
  | { type: 'plan/remove'; id: string }
  | { type: 'plan/duplicate'; id: string; newId: string }
  | { type: 'plan/setType'; id: string; shapeType: ShapeType }
  | { type: 'plan/moveVertex'; id: string; index: number; pt: Pt }
  | { type: 'plan/insertVertex'; id: string; after: number; pt: Pt }
  | { type: 'plan/deleteVertex'; id: string; index: number }
  | { type: 'plan/setPlotSize'; W?: number; H?: number }
  | { type: 'plan/setBackground'; bg: Background | null }
  | { type: 'plan/patchBackground'; patch: Partial<Background> }
  | { type: 'plan/load'; plan: Plan }
  | { type: 'plan/loadSample' }
  | { type: 'plan/clear' }
  | { type: 'plan/checkpoint' }
  | { type: 'plan/undo' };

function setShapes(s: DocState, shapes: Shape[], record: boolean): DocState {
  return { plan: { ...s.plan, shapes }, past: record ? pushPast(s.past, s.plan.shapes) : s.past };
}
function swap(s: DocState, id: string, next: Shape, record: boolean): DocState {
  return setShapes(s, s.plan.shapes.map((x) => (x.id === id ? next : x)), record);
}
const find = (s: DocState, id: string) => s.plan.shapes.find((x) => x.id === id);
const inPlotRange = (v: number) => v >= PLOT_MIN && v <= PLOT_MAX;

export function planReducer(s: DocState, a: PlanAction): DocState {
  switch (a.type) {
    case 'plan/add':
      return setShapes(s, [...s.plan.shapes, a.shape], true);
    case 'plan/update': {
      const x = find(s, a.id);
      return x ? swap(s, a.id, { ...x, ...a.patch } as Shape, false) : s;
    }
    case 'plan/replace':
      return find(s, a.id) ? swap(s, a.id, a.shape, false) : s;
    case 'plan/remove':
      return find(s, a.id) ? setShapes(s, s.plan.shapes.filter((x) => x.id !== a.id), true) : s;
    case 'plan/duplicate': {
      const x = find(s, a.id);
      if (!x) return s;
      const copy: Shape = isPoly(x)
        ? { ...x, id: a.newId, pts: x.pts.map((q): Pt => [round2(q[0] + 1), round2(q[1] + 1)]) }
        : { ...x, id: a.newId, x: round2(x.x + 1), y: round2(x.y + 1) };
      return setShapes(s, [...s.plan.shapes, copy], true);
    }
    case 'plan/setType': {
      const x = find(s, a.id);
      if (!x || x.type === a.shapeType || CATALOG[x.type].kind !== CATALOG[a.shapeType].kind) return s;
      const next: Shape = isPoly(x)
        ? { ...x, type: a.shapeType as PolyType }
        : {
            ...x,
            type: a.shapeType as PointType,
            r: Math.abs(x.r - defaultRadius(x.type)) < 1e-6 ? defaultRadius(a.shapeType as PointType) : x.r,
          };
      return swap(s, a.id, next, true);
    }
    case 'plan/moveVertex': {
      const x = find(s, a.id);
      if (!x || !isPoly(x) || a.index < 0 || a.index >= x.pts.length) return s;
      const pts = x.pts.slice();
      pts[a.index] = a.pt;
      return swap(s, a.id, { ...x, pts }, false);
    }
    case 'plan/insertVertex': {
      const x = find(s, a.id);
      if (!x || !isPoly(x)) return s;
      const pts = x.pts.slice();
      pts.splice(a.after + 1, 0, a.pt);
      return swap(s, a.id, { ...x, pts }, true);
    }
    case 'plan/deleteVertex': {
      const x = find(s, a.id);
      if (!x || !isPoly(x) || x.pts.length <= 3) return s;
      return swap(s, a.id, { ...x, pts: x.pts.filter((_, j) => j !== a.index) }, true);
    }
    case 'plan/setPlotSize': {
      const W = a.W !== undefined && inPlotRange(a.W) ? a.W : s.plan.W;
      const H = a.H !== undefined && inPlotRange(a.H) ? a.H : s.plan.H;
      if (W === s.plan.W && H === s.plan.H) return s;
      return { ...s, plan: { ...s.plan, W, H } };
    }
    case 'plan/setBackground':
      return { ...s, plan: { ...s.plan, bg: a.bg } };
    case 'plan/patchBackground':
      return s.plan.bg ? { ...s, plan: { ...s.plan, bg: { ...s.plan.bg, ...a.patch } } } : s;
    case 'plan/load':
      return { plan: a.plan, past: pushPast(s.past, s.plan.shapes) };
    case 'plan/loadSample': {
      const sp = samplePlan();
      return { plan: { ...s.plan, shapes: sp.shapes, W: sp.W, H: sp.H }, past: pushPast(s.past, s.plan.shapes) };
    }
    case 'plan/clear':
      return setShapes(s, [], true);
    case 'plan/checkpoint':
      return { ...s, past: pushPast(s.past, s.plan.shapes) };
    case 'plan/undo':
      if (!s.past.length) return s;
      return { plan: { ...s.plan, shapes: s.past[s.past.length - 1] }, past: s.past.slice(0, -1) };
  }
}
```

- [ ] **Step 3: Uruchom testy**

Run: `npx vitest run src/state/planReducer.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/state/history.ts src/state/planReducer.ts src/state/planReducer.test.ts
git commit -m "feat(state): reducer planu z historią cofania (80 kroków)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Stan widoku, reducer główny, selektory, autozapis, provider

**Files:**
- Create: `src/state/uiReducer.ts`, `src/state/rootReducer.ts`, `src/state/selectors.ts`, `src/state/persistence.ts`, `src/state/store.tsx`, `src/test/factories.ts`, `src/test/renderWithStore.tsx`
- Test: `src/state/uiReducer.test.ts`, `src/state/rootReducer.test.ts`, `src/state/persistence.test.ts`, `src/state/store.test.tsx`

**Interfaces:**
- Consumes: `DocState`, `PlanAction`, `planReducer` (Task 7), `ZOOMS`, `DEFAULT_ZOOM`, `STORAGE_KEY` (Task 2), `parsePlan` (Task 6), `samplePlan` (Task 5), `summarize`, `Summary` (Task 5), `newId` (Task 2).
- Produces:
  - `Tool = 'select' | ShapeType`, `BgMode = null | 'calib' | 'move'`, `DrawInputKey = 'startX'|'startY'|'segLen'|'segAng'|'rectW'|'rectH'`, `Notice { msg: string; download?: { url: string; name: string } }`, `UiState` (pola wg spec §4.2), `initialUi`, `UiAction` (prefiks `ui/`): `setTool {tool}`, `setMode {mode}`, `draftSet {pts}`, `draftAdd {pt}`, `draftPop`, `rectStart {pt|null}`, `hover {pt|null}`, `select {id|null}`, `pickElement {id}`, `zoom {dir: 1|-1}`, `setStep {step}`, `toggle {key: 'angleSnap'|'showDims'|'showLabels'}`, `setBgMode {mode: BgMode}`, `toggleBgMode {mode: 'calib'|'move'}`, `calibClick {pt}`, `setCalibLen {value}`, `setDrawInput {key, value}`, `notify {notice: Notice|null}`, `uiReducer(s, a)`.
  - `AppState { doc: DocState; ui: UiState }`, `AppAction = PlanAction | UiAction`, `rootReducer(s, a)`, `isPlanAction(a)`.
  - `selectSummary(s): Summary` (memo po referencji `shapes`), `selectSelected(s): Shape | null`, `canUndo(s): boolean`.
  - `getStorage(): Storage | null`, `loadSaved(storage): Plan | null`, `savePlan(storage, plan): void`.
  - `AppProvider({ children, initial? })`, `useAppState()`, `useAppDispatch()`, `initAppState(storage)`.
  - Testowe: `makeState({ plan?, ui?, past? }): AppState`, `renderWithStore(node, initial) → RTL utils + { getState(): AppState; user }`.

- [ ] **Step 1: Napisz testy (failing)**

`src/state/uiReducer.test.ts`:
```ts
import { initialUi, uiReducer, type UiState } from './uiReducer';

const ui = (o: Partial<UiState> = {}): UiState => ({ ...initialUi, ...o });

describe('uiReducer', () => {
  it('has prototype defaults', () => {
    expect(initialUi).toMatchObject({ tool: 'select', mode: 'poly', scale: 28, step: 0.5, angleSnap: false, showDims: true, showLabels: true });
    expect(initialUi.drawInputs).toEqual({ startX: '0', startY: '0', segLen: '', segAng: '0', rectW: '10', rectH: '8' });
  });
  it('setTool clears drawing state and keeps selection only for select', () => {
    const s0 = ui({ sel: 'a', draft: [[0, 0]], rectStart: [1, 1], bgMode: 'calib', calib: [[1, 1]] });
    expect(uiReducer(s0, { type: 'ui/setTool', tool: 'grass' })).toMatchObject({ tool: 'grass', sel: null, draft: [], rectStart: null, bgMode: null, calib: [] });
    expect(uiReducer(s0, { type: 'ui/setTool', tool: 'select' }).sel).toBe('a');
  });
  it('setMode clears the other mode state', () => {
    expect(uiReducer(ui({ draft: [[0, 0]] }), { type: 'ui/setMode', mode: 'rect' })).toMatchObject({ mode: 'rect', draft: [] });
    expect(uiReducer(ui({ mode: 'rect', rectStart: [1, 1] }), { type: 'ui/setMode', mode: 'poly' })).toMatchObject({ mode: 'poly', rectStart: null });
  });
  it('draft actions', () => {
    let s = uiReducer(ui(), { type: 'ui/draftSet', pts: [[1, 1]] });
    s = uiReducer(s, { type: 'ui/draftAdd', pt: [2, 2] });
    expect(s.draft).toEqual([[1, 1], [2, 2]]);
    expect(uiReducer(s, { type: 'ui/draftPop' }).draft).toEqual([[1, 1]]);
  });
  it('zoom steps through ZOOMS and clamps', () => {
    expect(uiReducer(ui(), { type: 'ui/zoom', dir: 1 }).scale).toBe(36);
    expect(uiReducer(ui(), { type: 'ui/zoom', dir: -1 }).scale).toBe(20);
    expect(uiReducer(ui({ scale: 80 }), { type: 'ui/zoom', dir: 1 }).scale).toBe(80);
    expect(uiReducer(ui({ scale: 8 }), { type: 'ui/zoom', dir: -1 }).scale).toBe(8);
  });
  it('toggle flips a boolean', () => {
    expect(uiReducer(ui(), { type: 'ui/toggle', key: 'angleSnap' }).angleSnap).toBe(true);
    expect(uiReducer(ui(), { type: 'ui/toggle', key: 'showDims' }).showDims).toBe(false);
  });
  it('bg modes are exclusive and reset tool/selection', () => {
    const s0 = ui({ tool: 'grass', sel: 'a', draft: [[0, 0]] });
    const s = uiReducer(s0, { type: 'ui/toggleBgMode', mode: 'calib' });
    expect(s).toMatchObject({ bgMode: 'calib', tool: 'select', sel: null, draft: [], calib: [] });
    expect(uiReducer(s, { type: 'ui/toggleBgMode', mode: 'move' }).bgMode).toBe('move');
    expect(uiReducer(s, { type: 'ui/toggleBgMode', mode: 'calib' }).bgMode).toBeNull();
  });
  it('calibClick keeps at most two points; third starts over', () => {
    let s = uiReducer(ui(), { type: 'ui/calibClick', pt: [1, 1] });
    s = uiReducer(s, { type: 'ui/calibClick', pt: [2, 2] });
    expect(s.calib).toEqual([[1, 1], [2, 2]]);
    expect(uiReducer(s, { type: 'ui/calibClick', pt: [3, 3] }).calib).toEqual([[3, 3]]);
  });
  it('pickElement selects and switches to select tool', () => {
    expect(uiReducer(ui({ tool: 'tree', draft: [[0, 0]] }), { type: 'ui/pickElement', id: 'x' })).toMatchObject({ sel: 'x', tool: 'select', draft: [] });
  });
  it('setDrawInput, setCalibLen, notify', () => {
    let s = uiReducer(ui(), { type: 'ui/setDrawInput', key: 'segLen', value: '3,5' });
    s = uiReducer(s, { type: 'ui/setCalibLen', value: '10' });
    s = uiReducer(s, { type: 'ui/notify', notice: { msg: 'ok' } });
    expect(s.drawInputs.segLen).toBe('3,5');
    expect(s.calibLen).toBe('10');
    expect(s.notice).toEqual({ msg: 'ok' });
  });
});
```

`src/state/rootReducer.test.ts`:
```ts
import { samplePlan } from '../domain/sample';
import type { PointShape } from '../domain/types';
import { makeState } from '../test/factories';
import { rootReducer } from './rootReducer';
import { canUndo, selectSelected, selectSummary } from './selectors';

const tree: PointShape = { id: 't', type: 'tree', x: 5, y: 5, r: 2.5 };

describe('rootReducer', () => {
  it('add selects the new shape and returns to select tool unless keepTool', () => {
    let s = rootReducer(makeState({ ui: { tool: 'grass', draft: [[0, 0]] } }), {
      type: 'plan/add', shape: { id: 'g', type: 'grass', pts: [[0, 0], [1, 0], [1, 1]] },
    });
    expect(s.ui).toMatchObject({ sel: 'g', tool: 'select', draft: [] });
    s = rootReducer(makeState({ ui: { tool: 'tree' } }), { type: 'plan/add', shape: tree, keepTool: true });
    expect(s.ui).toMatchObject({ sel: 't', tool: 'tree' });
  });
  it('duplicate selects the copy', () => {
    const s = rootReducer(makeState({ plan: { shapes: [tree] } }), { type: 'plan/duplicate', id: 't', newId: 't2' });
    expect(s.ui.sel).toBe('t2');
  });
  it('remove and undo clear the selection', () => {
    let s = rootReducer(makeState({ plan: { shapes: [tree] }, ui: { sel: 't' } }), { type: 'plan/remove', id: 't' });
    expect(s.ui.sel).toBeNull();
    s = rootReducer({ ...s, ui: { ...s.ui, sel: 'x' } }, { type: 'plan/undo' });
    expect(s.ui.sel).toBeNull();
    expect(s.doc.plan.shapes).toEqual([tree]);
  });
  it('clear switches to boundary/polygon and can be undone', () => {
    const s0 = makeState({ plan: { shapes: samplePlan().shapes }, ui: { mode: 'rect', sel: 'h1' } });
    let s = rootReducer(s0, { type: 'plan/clear' });
    expect(s.ui).toMatchObject({ tool: 'boundary', mode: 'poly', sel: null });
    expect(canUndo(s)).toBe(true);
    s = rootReducer(s, { type: 'plan/undo' });
    expect(s.doc.plan.shapes).toEqual(samplePlan().shapes);
  });
  it('load resets tool, draft and background mode', () => {
    const s = rootReducer(makeState({ ui: { tool: 'grass', draft: [[1, 1]], bgMode: 'calib', sel: 'x' } }), {
      type: 'plan/load', plan: { W: 30, H: 22, shapes: [tree], bg: null },
    });
    expect(s.ui).toMatchObject({ tool: 'select', draft: [], bgMode: null, sel: null });
  });
  it('removing the background leaves background modes', () => {
    const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };
    const s = rootReducer(makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[1, 1]] } }), { type: 'plan/setBackground', bg: null });
    expect(s.ui).toMatchObject({ bgMode: null, calib: [] });
  });
  it('no-op actions return the same state', () => {
    const s0 = makeState();
    expect(rootReducer(s0, { type: 'plan/undo' })).toBe(s0);
  });
  it('ui actions go to uiReducer', () => {
    expect(rootReducer(makeState(), { type: 'ui/setStep', step: 1 }).ui.step).toBe(1);
  });
});

describe('selectors', () => {
  it('selectSummary is memoised by shapes identity', () => {
    const s = makeState({ plan: { shapes: samplePlan().shapes } });
    expect(selectSummary(s)).toBe(selectSummary({ ...s, ui: { ...s.ui, hover: [1, 1] } }));
    expect(selectSummary(s).pbc).toBe(72);
  });
  it('selectSelected', () => {
    const s = makeState({ plan: { shapes: [tree] }, ui: { sel: 't' } });
    expect(selectSelected(s)).toBe(tree);
    expect(selectSelected({ ...s, ui: { ...s.ui, sel: 'zz' } })).toBeNull();
  });
});
```

`src/state/persistence.test.ts`:
```ts
import { STORAGE_KEY } from '../domain/catalog';
import { samplePlan } from '../domain/sample';
import { loadSaved, savePlan } from './persistence';

function fakeStorage(limit = Infinity): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k); },
    setItem: (k, v) => {
      if (v.length > limit) throw new DOMException('full', 'QuotaExceededError');
      m.set(k, v);
    },
  };
}
const bg = { src: 'data:image/png;base64,' + 'A'.repeat(5000), x: 0, y: 0, w: 10, aspect: 1, opacity: 0.6, visible: true };

describe('persistence', () => {
  it('saves and loads a plan', () => {
    const st = fakeStorage();
    savePlan(st, samplePlan());
    expect(JSON.parse(st.getItem(STORAGE_KEY)!)).toHaveProperty('shapes');
    expect(loadSaved(st)).toEqual(samplePlan());
  });
  it('drops the background when storage is full', () => {
    const st = fakeStorage(4000);
    savePlan(st, { ...samplePlan(), bg });
    expect(loadSaved(st)).toEqual(samplePlan());
  });
  it('silently gives up when even the plan does not fit', () => {
    const st = fakeStorage(10);
    expect(() => savePlan(st, samplePlan())).not.toThrow();
    expect(loadSaved(st)).toBeNull();
  });
  it('returns null for missing, corrupt or absent storage', () => {
    expect(loadSaved(fakeStorage())).toBeNull();
    const st = fakeStorage();
    st.setItem(STORAGE_KEY, '{oops');
    expect(loadSaved(st)).toBeNull();
    expect(loadSaved(null)).toBeNull();
    expect(() => savePlan(null, samplePlan())).not.toThrow();
  });
});
```

`src/state/store.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { STORAGE_KEY } from '../domain/catalog';
import { AppProvider, useAppState } from './store';

function Count() {
  const s = useAppState();
  return <p>elementy: {s.doc.plan.shapes.length}</p>;
}

describe('AppProvider', () => {
  it('starts with the sample plan when nothing is saved, and autosaves it', () => {
    render(<AppProvider><Count /></AppProvider>);
    expect(screen.getByText('elementy: 15')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).shapes).toHaveLength(15);
  });
  it('restores the autosaved plan', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ W: 30, H: 22, shapes: [{ id: 'a', type: 'tree', x: 1, y: 1, r: 1 }], bg: null }));
    render(<AppProvider><Count /></AppProvider>);
    expect(screen.getByText('elementy: 1')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/state`
Expected: FAIL (brakujące moduły).

- [ ] **Step 2: Zaimplementuj `uiReducer.ts`**

```ts
import { DEFAULT_ZOOM, ZOOMS } from '../domain/catalog';
import type { Pt, ShapeType } from '../domain/types';

export type Tool = 'select' | ShapeType;
export type BgMode = null | 'calib' | 'move';
export type DrawInputKey = 'startX' | 'startY' | 'segLen' | 'segAng' | 'rectW' | 'rectH';
export interface Notice { msg: string; download?: { url: string; name: string } }

export interface UiState {
  tool: Tool;
  mode: 'poly' | 'rect';
  draft: Pt[];
  rectStart: Pt | null;
  hover: Pt | null;
  sel: string | null;
  scale: number;
  step: number;
  angleSnap: boolean;
  showDims: boolean;
  showLabels: boolean;
  bgMode: BgMode;
  calib: Pt[];
  calibLen: string;
  drawInputs: Record<DrawInputKey, string>;
  notice: Notice | null;
}

export const initialUi: UiState = {
  tool: 'select', mode: 'poly', draft: [], rectStart: null, hover: null, sel: null,
  scale: DEFAULT_ZOOM, step: 0.5, angleSnap: false, showDims: true, showLabels: true,
  bgMode: null, calib: [], calibLen: '',
  drawInputs: { startX: '0', startY: '0', segLen: '', segAng: '0', rectW: '10', rectH: '8' },
  notice: null,
};

export type UiAction =
  | { type: 'ui/setTool'; tool: Tool }
  | { type: 'ui/setMode'; mode: 'poly' | 'rect' }
  | { type: 'ui/draftSet'; pts: Pt[] }
  | { type: 'ui/draftAdd'; pt: Pt }
  | { type: 'ui/draftPop' }
  | { type: 'ui/rectStart'; pt: Pt | null }
  | { type: 'ui/hover'; pt: Pt | null }
  | { type: 'ui/select'; id: string | null }
  | { type: 'ui/pickElement'; id: string }
  | { type: 'ui/zoom'; dir: 1 | -1 }
  | { type: 'ui/setStep'; step: number }
  | { type: 'ui/toggle'; key: 'angleSnap' | 'showDims' | 'showLabels' }
  | { type: 'ui/setBgMode'; mode: BgMode }
  | { type: 'ui/toggleBgMode'; mode: 'calib' | 'move' }
  | { type: 'ui/calibClick'; pt: Pt }
  | { type: 'ui/setCalibLen'; value: string }
  | { type: 'ui/setDrawInput'; key: DrawInputKey; value: string }
  | { type: 'ui/notify'; notice: Notice | null };

export function uiReducer(s: UiState, a: UiAction): UiState {
  switch (a.type) {
    case 'ui/setTool':
      return { ...s, tool: a.tool, draft: [], rectStart: null, sel: a.tool === 'select' ? s.sel : null, bgMode: null, calib: [] };
    case 'ui/setMode':
      return a.mode === 'poly' ? { ...s, mode: 'poly', rectStart: null } : { ...s, mode: 'rect', draft: [] };
    case 'ui/draftSet':
      return { ...s, draft: a.pts };
    case 'ui/draftAdd':
      return { ...s, draft: [...s.draft, a.pt] };
    case 'ui/draftPop':
      return { ...s, draft: s.draft.slice(0, -1) };
    case 'ui/rectStart':
      return { ...s, rectStart: a.pt };
    case 'ui/hover':
      return { ...s, hover: a.pt };
    case 'ui/select':
      return { ...s, sel: a.id };
    case 'ui/pickElement':
      return { ...s, sel: a.id, tool: 'select', draft: [], rectStart: null };
    case 'ui/zoom': {
      const i = ZOOMS.indexOf(s.scale);
      const next = Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? 4 : i) + a.dir));
      return { ...s, scale: ZOOMS[next] };
    }
    case 'ui/setStep':
      return { ...s, step: a.step };
    case 'ui/toggle': {
      const next = { ...s };
      next[a.key] = !s[a.key];
      return next;
    }
    case 'ui/setBgMode':
      return a.mode === null
        ? { ...s, bgMode: null, calib: [] }
        : { ...s, bgMode: a.mode, calib: [], tool: 'select', sel: null, draft: [], rectStart: null };
    case 'ui/toggleBgMode':
      return uiReducer(s, { type: 'ui/setBgMode', mode: s.bgMode === a.mode ? null : a.mode });
    case 'ui/calibClick':
      return { ...s, calib: s.calib.length >= 2 ? [a.pt] : [...s.calib, a.pt] };
    case 'ui/setCalibLen':
      return { ...s, calibLen: a.value };
    case 'ui/setDrawInput':
      return { ...s, drawInputs: { ...s.drawInputs, [a.key]: a.value } };
    case 'ui/notify':
      return { ...s, notice: a.notice };
  }
}
```

- [ ] **Step 3: Zaimplementuj `rootReducer.ts` i `selectors.ts`**

`src/state/rootReducer.ts`:
```ts
import { planReducer, type DocState, type PlanAction } from './planReducer';
import { uiReducer, type UiAction, type UiState } from './uiReducer';

export interface AppState { doc: DocState; ui: UiState }
export type AppAction = PlanAction | UiAction;

export function isPlanAction(a: AppAction): a is PlanAction {
  return a.type.startsWith('plan/');
}

function uiAfterPlan(ui: UiState, a: PlanAction): UiState {
  switch (a.type) {
    case 'plan/add':
      return { ...ui, sel: a.shape.id, draft: [], rectStart: null, tool: a.keepTool ? ui.tool : 'select' };
    case 'plan/duplicate':
      return { ...ui, sel: a.newId, tool: 'select' };
    case 'plan/remove':
    case 'plan/undo':
      return { ...ui, sel: null };
    case 'plan/load':
      return { ...ui, sel: null, draft: [], rectStart: null, tool: 'select', bgMode: null, calib: [] };
    case 'plan/loadSample':
      return { ...ui, sel: null, draft: [], rectStart: null, tool: 'select' };
    case 'plan/clear':
      return { ...ui, sel: null, draft: [], rectStart: null, tool: 'boundary', mode: 'poly' };
    case 'plan/setBackground':
      return a.bg ? ui : { ...ui, bgMode: null, calib: [] };
    default:
      return ui;
  }
}

export function rootReducer(s: AppState, a: AppAction): AppState {
  if (isPlanAction(a)) {
    const doc = planReducer(s.doc, a);
    return doc === s.doc ? s : { doc, ui: uiAfterPlan(s.ui, a) };
  }
  const ui = uiReducer(s.ui, a);
  return ui === s.ui ? s : { ...s, ui };
}
```

`src/state/selectors.ts`:
```ts
import { summarize, type Summary } from '../domain/netAreas';
import type { Shape } from '../domain/types';
import type { AppState } from './rootReducer';

const summaryCache = new WeakMap<Shape[], Summary>();

export function selectSummary(s: AppState): Summary {
  const shapes = s.doc.plan.shapes;
  let v = summaryCache.get(shapes);
  if (!v) {
    v = summarize(shapes);
    summaryCache.set(shapes, v);
  }
  return v;
}

export function selectSelected(s: AppState): Shape | null {
  const id = s.ui.sel;
  return id ? s.doc.plan.shapes.find((x) => x.id === id) ?? null : null;
}

export function canUndo(s: AppState): boolean {
  return s.doc.past.length > 0;
}
```

- [ ] **Step 4: Zaimplementuj `persistence.ts` i `store.tsx`**

`src/state/persistence.ts`:
```ts
import { STORAGE_KEY } from '../domain/catalog';
import { newId } from '../domain/ids';
import { parsePlan } from '../domain/planFile';
import type { Plan } from '../domain/types';

export function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSaved(storage: Storage | null): Plan | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? parsePlan(raw, newId) : null;
  } catch {
    return null;
  }
}

export function savePlan(storage: Storage | null, plan: Plan): void {
  if (!storage) return;
  const data = { shapes: plan.shapes, W: plan.W, H: plan.H, bg: plan.bg };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, bg: null }));
    } catch {
      /* brak miejsca: autozapis pomijamy (PRD F-9.4) */
    }
  }
}
```

`src/state/store.tsx`:
```tsx
import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { samplePlan } from '../domain/sample';
import { getStorage, loadSaved, savePlan } from './persistence';
import { rootReducer, type AppAction, type AppState } from './rootReducer';
import { initialUi } from './uiReducer';

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<AppAction> | null>(null);

export function initAppState(storage: Storage | null): AppState {
  return { doc: { plan: loadSaved(storage) ?? samplePlan(), past: [] }, ui: initialUi };
}

export function AppProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(rootReducer, initial, (i: AppState | undefined) => i ?? initAppState(getStorage()));
  const plan = state.doc.plan;
  useEffect(() => {
    savePlan(getStorage(), plan);
  }, [plan]);
  return (
    <DispatchCtx.Provider value={dispatch}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </DispatchCtx.Provider>
  );
}

export function useAppState(): AppState {
  const s = useContext(StateCtx);
  if (!s) throw new Error('useAppState użyty poza AppProvider');
  return s;
}

export function useAppDispatch(): Dispatch<AppAction> {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error('useAppDispatch użyty poza AppProvider');
  return d;
}
```

- [ ] **Step 5: Pomocniki testowe**

`src/test/factories.ts`:
```ts
import type { Plan, Shape } from '../domain/types';
import type { AppState } from '../state/rootReducer';
import { initialUi, type UiState } from '../state/uiReducer';

export function makeState(p: { plan?: Partial<Plan>; ui?: Partial<UiState>; past?: Shape[][] } = {}): AppState {
  return {
    doc: { plan: { W: 30, H: 22, shapes: [], bg: null, ...p.plan }, past: p.past ?? [] },
    ui: { ...initialUi, ...p.ui },
  };
}
```

`src/test/renderWithStore.tsx`:
```tsx
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import type { AppState } from '../state/rootReducer';
import { AppProvider, useAppState } from '../state/store';

export function renderWithStore(node: ReactElement, initial: AppState) {
  const ref = { current: initial };
  function Probe() {
    ref.current = useAppState();
    return null;
  }
  const user = userEvent.setup();
  const utils = render(
    <AppProvider initial={initial}>
      {node}
      <Probe />
    </AppProvider>,
  );
  return { ...utils, user, getState: () => ref.current };
}
```

- [ ] **Step 6: Uruchom testy i typecheck**

Run: `npx vitest run src/state && npm run typecheck`
Expected: PASS, brak błędów typów.

- [ ] **Step 7: Commit**

```bash
git add src/state src/test
git commit -m "feat(state): stan widoku, reducer główny, selektory, autozapis i provider

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Prymitywy UI

**Files:**
- Create: `src/ui/cx.ts`, `src/ui/icons.tsx`, `src/ui/primitives/Button.tsx`, `src/ui/primitives/fields.tsx`, `src/ui/primitives/controls.tsx`, `src/ui/primitives/layout.tsx`, `src/ui/primitives/primitives.module.css`
- Test: `src/ui/primitives/primitives.test.tsx`

**Interfaces:**
- Consumes: `fmtNum`, `parseNum` (Task 2), zmienne CSS (Task 1).
- Produces:
  - `cx(...c: (string | false | null | undefined)[]): string`
  - `Button(props: ButtonHTMLAttributes & { variant?: 'primary'|'secondary'|'outlineAccent'|'outlineDraft'|'calib'|'danger'|'ghost'; size?: 'lg'|'md'|'sm'|'icon' })` (domyślnie `secondary`, `md`, `type="button"`)
  - `FileButton({ label, accept, onFile(file: File), variant?, size?, className? })`
  - `NumberField({ label, value: number, onValue(n), onBeginEdit?(), variant?: 'normal'|'compact'|'row', hideLabel? })`
  - `StrField({ label, value: string, onChange(v), variant?: 'normal'|'compact', tone?: 'calib' })`
  - `TextField({ label, value, placeholder?, onChange(v) })`
  - `Chip({ pressed, onClick, children })`, `Toggle({ pressed, onToggle, label })`, `Segmented<T extends string | number>({ options: { value: T; label: string }[]; value: T; onChange(v: T); columns: number })`
  - `Panel({ title, tone?: 'selection', action?, children, className? })`: `<section aria-label={title}>`, czyli landmark `region` o nazwie z tytułu. `GroupTitle({ children })`, `StatTile({ label, value, small? })`
  - Klasy pomocnicze z `primitives.module.css`: `grid2`, `grid3`, `row`, `text`, `hint`, `monoInfo`
  - Ikony: `LeafIcon`, `CursorIcon`, `FolderIcon`, `DownloadIcon`, `ImageIcon` (wszystkie z `aria-hidden`)

- [ ] **Step 1: Napisz testy (failing)**

`src/ui/primitives/primitives.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { FileButton } from './Button';
import { Segmented, Toggle } from './controls';
import { NumberField } from './fields';
import { Panel } from './layout';

function Harness({ onBegin = () => {} }: { onBegin?: () => void }) {
  const [v, setV] = useState(2.5);
  return (
    <>
      <NumberField label="Szerokość (m)" value={v} onValue={setV} onBeginEdit={onBegin} />
      <output>{v}</output>
    </>
  );
}

describe('NumberField', () => {
  it('shows the value with a decimal comma and accepts comma input', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Szerokość (m)');
    expect(input).toHaveValue('2,5');
    await user.clear(input);
    await user.type(input, '3,75');
    expect(screen.getByRole('status')).toHaveTextContent('3.75');
  });

  it('ignores text that is not a number and restores the value on blur', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Szerokość (m)');
    await user.clear(input);
    await user.type(input, '12.5 m');
    expect(screen.getByRole('status')).toHaveTextContent('12.5');
    await user.clear(input);
    await user.type(input, 'abc');
    expect(input).toHaveValue('abc');
    await user.tab();
    expect(input).toHaveValue('12,5');
  });

  it('calls onBeginEdit on focus', async () => {
    const user = userEvent.setup();
    const onBegin = vi.fn();
    render(<Harness onBegin={onBegin} />);
    await user.click(screen.getByLabelText('Szerokość (m)'));
    expect(onBegin).toHaveBeenCalledTimes(1);
  });

  it('hideLabel uses aria-label instead of a visible label', () => {
    render(<NumberField label="Punkt 1 X" value={1} onValue={() => {}} hideLabel />);
    expect(screen.getByRole('textbox', { name: 'Punkt 1 X' })).toBeInTheDocument();
    expect(screen.queryByText('Punkt 1 X')).toBeNull();
  });
});

describe('FileButton', () => {
  it('passes the chosen file and resets the input', async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(<FileButton label="Otwórz plik" accept=".json" onFile={onFile} />);
    const input = screen.getByLabelText('Otwórz plik') as HTMLInputElement;
    const file = new File(['{}'], 'plan.json', { type: 'application/json' });
    await user.upload(input, file);
    expect(onFile).toHaveBeenCalledWith(file);
    expect(input.value).toBe('');
  });
});

describe('Toggle and Segmented', () => {
  it('Toggle exposes aria-pressed', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Toggle pressed label="Wymiary granicy działki" onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: 'Wymiary granicy działki' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await user.click(btn);
    expect(onToggle).toHaveBeenCalled();
  });

  it('Segmented marks the current option and reports changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented options={[{ value: 1, label: '1 m' }, { value: 0.5, label: '0,5 m' }]} value={0.5} onChange={onChange} columns={2} />);
    expect(screen.getByRole('button', { name: '0,5 m' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1 m' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: '1 m' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe('Panel', () => {
  it('is a named region with a heading', () => {
    render(<Panel title="Narzędzia"><p>x</p></Panel>);
    expect(screen.getByRole('region', { name: 'Narzędzia' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Narzędzia' })).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/ui/primitives`
Expected: FAIL (brak modułów).

- [ ] **Step 2: Style prymitywów**

`src/ui/primitives/primitives.module.css`:
```css
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-lg); background: var(--color-surface); color: var(--color-text); text-decoration: none; }
.lg { min-height: var(--size-touch-primary); padding: 0 16px; font-size: 14px; }
.md { min-height: var(--size-touch-panel); padding: 0 10px; font-size: 13px; }
.sm { min-height: var(--size-touch-compact); padding: 0 10px; font-size: 12px; border-radius: var(--radius-md); }
.icon { width: 40px; height: 40px; padding: 0; font-size: 18px; }
.primary { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-on-accent); font-weight: 500; }
.secondary { }
.outlineAccent { border-color: var(--color-accent); color: var(--color-accent); font-weight: 500; }
.outlineDraft { border-color: var(--color-draft); color: var(--color-draft); font-weight: 500; }
.calib { background: var(--color-calib); border-color: var(--color-calib); color: var(--color-on-accent); font-weight: 500; }
.danger { border-color: var(--color-danger); color: var(--color-danger); }
.ghost { border-color: transparent; background: transparent; }
.fileBtn { position: relative; cursor: pointer; box-sizing: border-box; }
.fileBtn:hover { background: var(--color-surface-muted); }
.fileBtn:focus-within { outline: 2px solid var(--color-accent); outline-offset: 1px; }

.field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--color-text-muted); }
.input { height: var(--size-field); width: 100%; padding: 0 8px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font-family: var(--font-mono); font-size: 13px; }
.inputCompact { height: var(--size-field-compact); padding: 0 6px; font-size: 12px; }
.inputRow { height: var(--size-vertex-row); padding: 0 6px; font-size: 12px; }
.inputText { font-family: var(--font-sans); font-size: 14px; }
.fieldCalib { color: var(--color-calib-label); }
.inputCalib { border-color: var(--color-calib-border); }

.chip { min-height: var(--size-touch-compact); padding: 0 10px; border: 1px solid var(--color-border); border-radius: var(--radius-pill); background: var(--color-surface); color: var(--color-text); font-size: 12px; }
.segGroup { display: grid; gap: 4px; }
.seg { min-height: var(--size-touch-panel); padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font-size: 12px; }
.chip[aria-pressed="true"], .seg[aria-pressed="true"] { background: var(--color-accent-selected); border-color: var(--color-accent); }
.toggle { display: flex; align-items: center; gap: 10px; min-height: var(--size-touch-panel); padding: 0 4px; border: 0; background: transparent; color: var(--color-text); font-size: 13px; text-align: left; }
.box { width: var(--size-checkbox); height: var(--size-checkbox); flex: none; border: 2px solid var(--color-accent); border-radius: var(--radius-sm); background: var(--color-surface); }
.toggle[aria-pressed="true"] .box { background: var(--color-accent); }

.panel { display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); }
.panelHead { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.panelTitle { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-muted); }
.panelTitleSelection { color: var(--color-selection); }
.groupTitle { margin: 8px 0 2px; font-size: 12px; font-weight: 500; color: var(--color-text-muted); }
.stat { padding: 10px; border-radius: var(--radius-lg); background: var(--color-surface-muted); }
.statLabel { font-size: 12px; color: var(--color-text-muted); }
.statValue { font-family: var(--font-mono); font-size: 18px; font-weight: 500; }
.statValueSm { font-size: 17px; }

.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
.row > * { flex: 1 1 auto; }
.text { margin: 0; font-size: 13px; line-height: 1.45; color: var(--color-text-secondary); }
.hint { margin: 0; font-size: 11px; line-height: 1.4; color: var(--color-text-muted); }
.monoInfo { margin: 0; font-family: var(--font-mono); font-size: 12px; }
```

- [ ] **Step 3: Zaimplementuj komponenty**

`src/ui/cx.ts`:
```ts
export const cx = (...c: (string | false | null | undefined)[]): string => c.filter(Boolean).join(' ');
```

`src/ui/icons.tsx`:
```tsx
import type { ReactNode } from 'react';

function Icon({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const LeafIcon = () => (
  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20c0-8 6-14 16-16-1 10-7 16-15 16" />
    <path d="M4 20l9-9" />
  </svg>
);
export const CursorIcon = () => <Icon size={22}><path d="M5 3l14 8-6 2-2 6z" /></Icon>;
export const FolderIcon = () => <Icon><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Icon>;
export const DownloadIcon = () => <Icon><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></Icon>;
export const ImageIcon = () => <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /></Icon>;
```

`src/ui/primitives/Button.tsx`:
```tsx
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
```

`src/ui/primitives/fields.tsx`:
```tsx
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
```

`src/ui/primitives/controls.tsx`:
```tsx
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
```

`src/ui/primitives/layout.tsx`:
```tsx
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
```

- [ ] **Step 4: Uruchom testy**

Run: `npx vitest run src/ui/primitives && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat(ui): prymitywy (przyciski, pola liczbowe, przełączniki, panele)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Model widoku planu i renderowanie SVG

**Files:**
- Create: `src/canvas/materialStyle.ts`, `src/canvas/coords.ts`, `src/canvas/hitTest.ts`, `src/canvas/stageModel.ts`, `src/canvas/patterns.tsx`, `src/canvas/PlanStage.tsx`, `src/canvas/canvas.module.css`
- Test: `src/canvas/hitTest.test.ts`, `src/canvas/stageModel.test.ts`, `src/canvas/PlanStage.test.tsx`

**Interfaces:**
- Consumes: `material`, `canvasTokens`, `color` (Task 1), domena (Tasks 2–5), `AppState`, `selectSelected` (Task 8), `makeState` (Task 8).
- Produces:
  - `polyStyle(t: PolyType): { fill; stroke; sw; dash; solid; toolDash }`, `pointStyle(t: PointType): { fill; stroke; centerDot }`. Wypełnienie wzorem ma postać `url(#pat-<nazwa>)`.
  - `toMeters(clientX, clientY, rect: { left; top }, scale): Pt`, stałe `HIT_PX`, `VERTEX_PX`, `CLOSE_PX`, `EDGE_INSERT_PX`.
  - `hitTest(shapes, raw, scale): Shape | null`.
  - `StageModel` (pola niżej), `buildStageModel(s: AppState): StageModel`, `isPolyTool(s): boolean`, `tickStep(scale): 2|5|10`, `draftInfo(s): string`, `calibInfo(s): string`, `stageTip(s): string`, `coordsText(hover: Pt | null): string`.
  - `Patterns()`: `<defs>` z wzorami `pat-grass`, `pat-paving`, `pat-gravel`, `pat-bed`, `pat-house`.
  - `PlanStage({ model, handlers })`, gdzie `handlers` to obiekt z `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerLeave` i `onDoubleClick` dla `<div>`.

- [ ] **Step 1: Napisz testy (failing)**

`src/canvas/hitTest.test.ts`:
```ts
import { samplePlan } from '../domain/sample';
import type { Shape } from '../domain/types';
import { hitTest } from './hitTest';

const shapes = samplePlan().shapes;
const hit = (x: number, y: number, list: Shape[] = shapes) => hitTest(list, [x, y], 28)?.id ?? null;

describe('hitTest (PRD F-4.1)', () => {
  it('plants win over areas', () => expect(hit(24, 7)).toBe('t2'));
  it('topmost area wins', () => expect(hit(11.5, 8)).toBe('h1'));
  it('boundary is hit near its edge', () => expect(hit(10, 1.25)).toBe('b1'));
  it('inside boundary but away from the edge hits the area below', () => expect(hit(12, 18)).toBe('g1'));
  it('outside everything', () => expect(hit(29, 21.5)).toBeNull());
  it('later shape wins on the same layer', () => {
    const a: Shape = { id: 'a', type: 'paving', pts: [[0, 0], [4, 0], [4, 4], [0, 4]] };
    const b: Shape = { id: 'b', type: 'gravel', pts: [[0, 0], [4, 0], [4, 4], [0, 4]] };
    expect(hit(2, 2, [a, b])).toBe('b');
    expect(hit(2, 2, [b, a])).toBe('a');
  });
  it('small plants are clickable within 8 px', () => {
    const s: Shape = { id: 's', type: 'shrub', x: 5, y: 5, r: 0.1 };
    expect(hit(5.25, 5, [s])).toBe('s');
  });
});
```

`src/canvas/stageModel.test.ts`:
```ts
import { samplePlan } from '../domain/sample';
import { makeState } from '../test/factories';
import { buildStageModel, calibInfo, coordsText, draftInfo, stageTip, tickStep } from './stageModel';

const sample = () => makeState({ plan: { shapes: samplePlan().shapes } });
const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 20, aspect: 0.5, opacity: 0.6, visible: true };

describe('buildStageModel — sample plan', () => {
  const m = buildStageModel(sample());

  it('sizes the stage in px', () => {
    expect(m).toMatchObject({ W: 30, H: 22, scale: 28, widthPx: 840, heightPx: 616, cursor: 'default' });
  });
  it('orders shapes by layer', () => {
    expect(m.polys.map((p) => p.key)).toEqual(['g1', 'p1', 'p2', 'v1', 'd1', 'h1']);
    expect(m.bounds.map((p) => p.key)).toEqual(['b1']);
    expect(m.points.map((p) => p.key)).toEqual(['s1', 's2', 's3', 'c1', 'c2', 'c3', 't1', 't2']);
    expect(m.polys[0].fill).toBe('url(#pat-grass)');
  });
  it('puts a centre dot on trees and conifers only', () => {
    expect(m.points.find((p) => p.key === 's1')?.dotR).toBe(0);
    expect(m.points.find((p) => p.key === 't1')?.dotR).toBe(0.15);
  });
  it('labels areas big enough on screen and named plants', () => {
    expect(m.labels.map((l) => l.title)).toEqual(['Działka', 'Trawnik', 'Podjazd', 'Taras', 'Rabata bylinowa', 'Dom', 'Klon', 'Jabłoń']);
    expect(m.labels[0]).toMatchObject({ anchor: 'corner', x: 28, y: 42, sub: '508 m²' });
    expect(m.labels.find((l) => l.title === 'Klon')?.sub).toBe('Ø 5,6 m');
  });
  it('shows boundary dimensions', () => {
    expect(m.edgeLabels.map((e) => [e.text, e.tone])).toEqual([
      ['26,50 m', 'boundary'], ['19,51 m', 'boundary'], ['27,00 m', 'boundary'], ['18,50 m', 'boundary'],
    ]);
  });
  it('ruler ticks every 5 m at 28 px/m', () => {
    expect(m.ticksX.map((t) => t.label)).toEqual(['0', '5', '10', '15', '20', '25', '30']);
    expect(m.ticksY.map((t) => t.label)).toEqual(['0', '5', '10', '15', '20']);
  });
});

describe('buildStageModel — toggles and states', () => {
  it('hides labels and dimensions when switched off', () => {
    const s = sample();
    const m = buildStageModel({ ...s, ui: { ...s.ui, showLabels: false, showDims: false } });
    expect(m.labels).toEqual([]);
    expect(m.edgeLabels).toEqual([]);
  });
  it('selected polygon: outline, vertex handles, edge lengths', () => {
    const s = sample();
    const m = buildStageModel({ ...s, ui: { ...s.ui, sel: 'h1' } });
    expect(m.selection).toEqual({ kind: 'poly', points: '6,4 17,4 17,12 6,12' });
    expect(m.handles.map((h) => h.kind)).toEqual(['vertex', 'vertex', 'vertex', 'vertex']);
    expect(m.edgeLabels.filter((e) => e.tone === 'selection').map((e) => e.text)).toEqual(['11,00 m', '8,00 m', '11,00 m', '8,00 m']);
  });
  it('selected plant: dashed circle and centre handle', () => {
    const s = sample();
    const m = buildStageModel({ ...s, ui: { ...s.ui, sel: 't1' } });
    expect(m.selection).toEqual({ kind: 'point', cx: 4.5, cy: 16, r: 2.8 });
    expect(m.handles).toEqual([{ key: 'hc', x: 126, y: 448, kind: 'pointCenter' }]);
  });
  it('polygon draft with hover', () => {
    const s = makeState({ ui: { tool: 'grass', draft: [[0, 0], [4, 0]], hover: [4, 3] } });
    const m = buildStageModel(s);
    expect(m.draftLine).toBe('0,0 4,0 4,3');
    expect(m.handles.map((h) => h.kind)).toEqual(['draftFirst', 'draft']);
    expect(m.edgeLabels.map((e) => e.text)).toEqual(['4,00 m', '3,00 m']);
    expect(m.cursor).toBe('crosshair');
    expect(draftInfo(s)).toBe('Punkty: 2 · odcinek 3,00 m · 270°');
  });
  it('first draft point becomes closable from 3 points', () => {
    const m = buildStageModel(makeState({ ui: { tool: 'grass', draft: [[0, 0], [4, 0], [4, 3]] } }));
    expect(m.handles[0].kind).toBe('draftClosable');
  });
  it('rectangle preview shows two sides', () => {
    const m = buildStageModel(makeState({ ui: { tool: 'house', mode: 'rect', rectStart: [1, 1], hover: [5, 4] } }));
    expect(m.draftRect).toBe('1,1 5,1 5,4 1,4');
    expect(m.edgeLabels.map((e) => e.text)).toEqual(['4,00 m', '3,00 m']);
  });
  it('small polygons get no label', () => {
    const m = buildStageModel(makeState({ plan: { shapes: [{ id: 'x', type: 'bed', pts: [[0, 0], [1, 0], [1, 1], [0, 1]] }] } }));
    expect(m.labels).toEqual([]);
  });
  it('background image and calibration overlay', () => {
    const s = makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[1, 1]], hover: [6, 1] } });
    const m = buildStageModel(s);
    expect(m.bg).toEqual({ src: bg.src, left: 0, top: 0, width: 560, height: 280, opacity: 0.6 });
    expect(m.calibLine).toBe('1,1 6,1');
    expect(m.handles.map((h) => h.kind)).toEqual(['calib']);
    expect(m.edgeLabels).toEqual([{ key: 'kal', x: 98, y: 28, text: '5,00 m', tone: 'calib' }]);
    expect(calibInfo(s)).toBe('Teraz drugi punkt · 5,00 m w obecnej skali');
    expect(m.cursor).toBe('crosshair');
  });
  it('hidden background is not rendered; move mode cursor', () => {
    const m = buildStageModel(makeState({ plan: { bg: { ...bg, visible: false } }, ui: { bgMode: 'move' } }));
    expect(m.bg).toBeNull();
    expect(m.cursor).toBe('move');
  });
});

describe('texts', () => {
  it('tickStep', () => {
    expect([tickStep(48), tickStep(28), tickStep(12)]).toEqual([2, 5, 10]);
  });
  it('coordsText', () => {
    expect(coordsText([1.5, 2])).toBe('X 1,50 m   Y 2,00 m');
    expect(coordsText(null)).toBe('Najedź na plan');
  });
  it('calibInfo', () => {
    expect(calibInfo(makeState({ plan: { bg }, ui: { bgMode: 'calib' } }))).toBe('Kliknij pierwszy punkt na mapce');
    expect(calibInfo(makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[0, 0], [0, 2]] } }))).toBe('Odcinek na mapce: 2,00 m w obecnej skali');
  });
  it('draftInfo without draft', () => {
    expect(draftInfo(makeState({ ui: { tool: 'grass' } }))).toBe('Kliknij na planie pierwszy punkt');
  });
  it.each([
    [{ plan: { bg }, ui: { bgMode: 'calib' as const } }, 'Kalibracja: kliknij dwa punkty na mapce o znanej odległości, wpisz ją po lewej i zastosuj.'],
    [{ plan: { bg }, ui: { bgMode: 'move' as const } }, 'Przeciągnij, aby przesunąć mapkę pod planem.'],
    [{ ui: { tool: 'grass' as const, draft: [[0, 0], [1, 0], [1, 1]] as [number, number][] } }, 'Kliknij pierwszy (niebieski) punkt albo kliknij dwukrotnie, aby zamknąć kształt.'],
    [{ ui: { tool: 'grass' as const } }, 'Klikaj kolejne narożniki. Długość i kąt możesz też wpisać po lewej.'],
    [{ ui: { tool: 'grass' as const, mode: 'rect' as const } }, 'Przeciągnij, aby narysować prostokąt.'],
    [{ ui: { tool: 'tree' as const } }, 'Kliknij, aby posadzić. Narzędzie zostaje aktywne, możesz sadzić dalej.'],
    [{ plan: { shapes: samplePlan().shapes }, ui: { sel: 'h1' } }, 'Przeciągnij element, aby go przesunąć. Kwadratowe uchwyty przesuwają narożniki.'],
    [{}, 'Wybierz narzędzie po lewej. Kliknij element na planie, aby go edytować.'],
  ])('stageTip %#', (o, text) => {
    expect(stageTip(makeState(o))).toBe(text);
  });
});
```

`src/canvas/PlanStage.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { samplePlan } from '../domain/sample';
import { makeState } from '../test/factories';
import { PlanStage } from './PlanStage';
import { buildStageModel } from './stageModel';

const noop = () => {};
const handlers = { onPointerDown: noop, onPointerMove: noop, onPointerUp: noop, onPointerLeave: noop, onDoubleClick: noop };

describe('PlanStage', () => {
  it('renders an accessible stage with labels, dimensions and patterns', () => {
    const { container } = render(<PlanStage model={buildStageModel(makeState({ plan: { shapes: samplePlan().shapes } }))} handlers={handlers} />);
    const stage = screen.getByRole('group', { name: 'Plan ogrodu' });
    expect(stage).toHaveStyle({ width: '840px', height: '616px' });
    expect(screen.getByText('Rabata bylinowa')).toBeInTheDocument();
    expect(screen.getByText('26,50 m')).toBeInTheDocument();
    expect(container.querySelectorAll('polygon')).toHaveLength(7);
    expect(container.querySelector('pattern#pat-grass')).not.toBeNull();
  });
});
```

Run: `npx vitest run src/canvas`
Expected: FAIL (brak modułów).

- [ ] **Step 2: Zaimplementuj `materialStyle.ts`, `coords.ts`, `hitTest.ts`**

`src/canvas/materialStyle.ts`:
```ts
import { material } from '../design/tokens';
import type { PointType, PolyType } from '../domain/types';

export interface PolyStyle { fill: string; stroke: string; sw: number; dash: string; solid: string; toolDash: string }
export interface PointStyle { fill: string; stroke: string; centerDot: boolean }

type RawPoly = { fill: string; stroke: string; strokeWidth: number; dash?: string; toolDash?: string; solid?: string };
type RawPoint = { fill: string; stroke: string; centerDot: boolean };

export function polyStyle(t: PolyType): PolyStyle {
  const m = material[t] as unknown as RawPoly;
  const fill = m.fill.startsWith('pattern:') ? `url(#pat-${m.fill.slice('pattern:'.length)})` : m.fill;
  return { fill, stroke: m.stroke, sw: m.strokeWidth, dash: m.dash ?? 'none', solid: m.solid ?? 'transparent', toolDash: m.toolDash ?? 'none' };
}

export function pointStyle(t: PointType): PointStyle {
  const m = material[t] as unknown as RawPoint;
  return { fill: m.fill, stroke: m.stroke, centerDot: m.centerDot };
}
```

`src/canvas/coords.ts`:
```ts
import { canvasTokens } from '../design/tokens';
import type { Pt } from '../domain/types';

export const HIT_PX = canvasTokens.hitPx;
export const VERTEX_PX = canvasTokens.vertexGrabPx;
export const CLOSE_PX = canvasTokens.closeDraftPx;
export const EDGE_INSERT_PX = canvasTokens.edgeInsertPx;

export function toMeters(clientX: number, clientY: number, rect: { left: number; top: number }, scale: number): Pt {
  return [(clientX - rect.left) / scale, (clientY - rect.top) / scale];
}
```

`src/canvas/hitTest.ts`:
```ts
import { CATALOG, isPoly } from '../domain/catalog';
import { dist, pointInPolygon, segmentDistance } from '../domain/geometry';
import type { Pt, Shape } from '../domain/types';
import { HIT_PX } from './coords';

export function hitTest(shapes: Shape[], raw: Pt, scale: number): Shape | null {
  const thr = HIT_PX / scale;
  const list = shapes
    .map((sh, i) => ({ sh, i }))
    .sort((a, b) => CATALOG[b.sh.type].z - CATALOG[a.sh.type].z || b.i - a.i)
    .map((o) => o.sh);
  for (const sh of list) {
    if (!isPoly(sh) && dist([sh.x, sh.y], raw) <= Math.max(sh.r * 0.75, thr)) return sh;
  }
  for (const sh of list) {
    if (isPoly(sh) && sh.type === 'boundary' && sh.pts.some((p, k) => segmentDistance(raw, p, sh.pts[(k + 1) % sh.pts.length]).d <= thr)) return sh;
  }
  for (const sh of list) {
    if (isPoly(sh) && sh.type !== 'boundary' && pointInPolygon(raw, sh.pts)) return sh;
  }
  return null;
}
```

- [ ] **Step 3: Zaimplementuj `stageModel.ts`**

```ts
import { canvasTokens } from '../design/tokens';
import { CATALOG, isPoly, isPolyType } from '../domain/catalog';
import { fmtArea, fmtLen, fmtNum } from '../domain/format';
import { area, bbox, centroid, dist, ptsAttr, rectPoints } from '../domain/geometry';
import { displayAngle } from '../domain/snapping';
import type { Pt } from '../domain/types';
import type { AppState } from '../state/rootReducer';
import { selectSelected } from '../state/selectors';
import { pointStyle, polyStyle } from './materialStyle';

export type EdgeTone = 'boundary' | 'selection' | 'draft' | 'calib';
export type HandleKind = 'vertex' | 'pointCenter' | 'draft' | 'draftFirst' | 'draftClosable' | 'calib';
export interface PolyItem { key: string; points: string; fill: string; stroke: string; sw: number; dash: string }
export interface PointItem { key: string; cx: number; cy: number; r: number; fill: string; stroke: string; dotR: number }
export interface LabelItem { key: string; x: number; y: number; anchor: 'center' | 'corner'; title: string; sub: string }
export interface EdgeLabel { key: string; x: number; y: number; text: string; tone: EdgeTone }
export interface HandleItem { key: string; x: number; y: number; kind: HandleKind }
export interface Tick { key: string; pos: number; label: string }
export type SelectionOverlay = { kind: 'poly'; points: string } | { kind: 'point'; cx: number; cy: number; r: number } | null;
export interface BgItem { src: string; left: number; top: number; width: number; height: number; opacity: number }

export interface StageModel {
  W: number;
  H: number;
  scale: number;
  widthPx: number;
  heightPx: number;
  cursor: 'default' | 'crosshair' | 'move';
  bg: BgItem | null;
  polys: PolyItem[];
  bounds: PolyItem[];
  points: PointItem[];
  selection: SelectionOverlay;
  draftLine: string | null;
  draftRect: string | null;
  calibLine: string | null;
  labels: LabelItem[];
  edgeLabels: EdgeLabel[];
  handles: HandleItem[];
  ticksX: Tick[];
  ticksY: Tick[];
}

const [LABEL_MIN_W, LABEL_MIN_H] = canvasTokens.labelMinBoxPx;
const EDGE_MIN = canvasTokens.edgeLabelMinPx;

export function tickStep(scale: number): 2 | 5 | 10 {
  return scale >= 40 ? 2 : scale >= 16 ? 5 : 10;
}

export function isPolyTool(s: AppState): boolean {
  return s.ui.tool !== 'select' && isPolyType(s.ui.tool);
}

function edgesOf(pts: Pt[], closed: boolean, prefix: string, tone: EdgeTone, sc: number): EdgeLabel[] {
  const out: EdgeLabel[] = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], len = dist(a, b);
    if (len * sc < EDGE_MIN) continue;
    out.push({ key: prefix + i, x: ((a[0] + b[0]) / 2) * sc, y: ((a[1] + b[1]) / 2) * sc, text: fmtLen(len), tone });
  }
  return out;
}

function calibPoints(s: AppState): Pt[] {
  const { calib, hover } = s.ui;
  return calib.length === 1 && hover ? [...calib, hover] : calib;
}

export function buildStageModel(s: AppState): StageModel {
  const { ui } = s;
  const { W, H, shapes, bg } = s.doc.plan;
  const sc = ui.scale;
  const sel = selectSelected(s);
  const ordered = shapes
    .map((sh, i) => ({ sh, i }))
    .sort((a, b) => CATALOG[a.sh.type].z - CATALOG[b.sh.type].z || a.i - b.i)
    .map((o) => o.sh);

  const polys: PolyItem[] = [], bounds: PolyItem[] = [], points: PointItem[] = [];
  const labels: LabelItem[] = [], edgeLabels: EdgeLabel[] = [], handles: HandleItem[] = [];

  for (const sh of ordered) {
    if (isPoly(sh)) {
      const st = polyStyle(sh.type);
      const item: PolyItem = { key: sh.id, points: ptsAttr(sh.pts), fill: st.fill, stroke: st.stroke, sw: st.sw, dash: st.dash };
      (sh.type === 'boundary' ? bounds : polys).push(item);
      if (!ui.showLabels || sh.pts.length < 3) continue;
      if (sh.type === 'boundary') {
        const tl = sh.pts.reduce((m, p) => (p[0] + p[1] < m[0] + m[1] ? p : m));
        labels.push({ key: 'l' + sh.id, x: tl[0] * sc, y: tl[1] * sc, anchor: 'corner', title: sh.name || 'Działka', sub: fmtArea(area(sh.pts)) });
      } else {
        const b = bbox(sh.pts);
        if ((b[2] - b[0]) * sc >= LABEL_MIN_W && (b[3] - b[1]) * sc >= LABEL_MIN_H) {
          const c = centroid(sh.pts);
          labels.push({ key: 'l' + sh.id, x: c[0] * sc, y: c[1] * sc, anchor: 'center', title: sh.name || CATALOG[sh.type].label, sub: fmtArea(area(sh.pts)) });
        }
      }
    } else {
      const st = pointStyle(sh.type);
      points.push({ key: sh.id, cx: sh.x, cy: sh.y, r: sh.r, fill: st.fill, stroke: st.stroke, dotR: st.centerDot ? Math.min(0.15, sh.r * 0.2) : 0 });
      if (ui.showLabels && sh.name) {
        labels.push({ key: 'l' + sh.id, x: sh.x * sc, y: sh.y * sc, anchor: 'center', title: sh.name, sub: 'Ø ' + fmtNum(sh.r * 2) + ' m' });
      }
    }
  }

  let selection: SelectionOverlay = null;
  if (sel) {
    if (isPoly(sel)) {
      selection = { kind: 'poly', points: ptsAttr(sel.pts) };
      sel.pts.forEach((p, i) => handles.push({ key: 'h' + i, x: p[0] * sc, y: p[1] * sc, kind: 'vertex' }));
      edgeLabels.push(...edgesOf(sel.pts, true, 'e', 'selection', sc));
    } else {
      selection = { kind: 'point', cx: sel.x, cy: sel.y, r: sel.r };
      handles.push({ key: 'hc', x: sel.x * sc, y: sel.y * sc, kind: 'pointCenter' });
    }
  }
  if (ui.showDims) {
    for (const sh of shapes) {
      if (isPoly(sh) && sh.type === 'boundary' && sh.id !== sel?.id) edgeLabels.push(...edgesOf(sh.pts, true, 'b' + sh.id + '-', 'boundary', sc));
    }
  }

  let draftLine: string | null = null, draftRect: string | null = null;
  if (isPolyTool(s) && ui.mode === 'poly' && ui.draft.length) {
    const dp = ui.hover ? [...ui.draft, ui.hover] : ui.draft;
    draftLine = ptsAttr(dp);
    ui.draft.forEach((p, i) =>
      handles.push({ key: 'd' + i, x: p[0] * sc, y: p[1] * sc, kind: i > 0 ? 'draft' : ui.draft.length >= 3 ? 'draftClosable' : 'draftFirst' }),
    );
    edgeLabels.push(...edgesOf(dp, false, 'd', 'draft', sc));
  }
  if (isPolyTool(s) && ui.mode === 'rect' && ui.rectStart && ui.hover) {
    const rp = rectPoints(ui.rectStart, ui.hover);
    draftRect = ptsAttr(rp);
    edgeLabels.push(...edgesOf(rp, true, 'r', 'draft', sc).slice(0, 2));
  }

  const calibActive = !!bg && ui.bgMode === 'calib';
  let calibLine: string | null = null;
  if (calibActive && ui.calib.length) {
    const cl = calibPoints(s);
    calibLine = ptsAttr(cl);
    ui.calib.forEach((p, i) => handles.push({ key: 'k' + i, x: p[0] * sc, y: p[1] * sc, kind: 'calib' }));
    if (cl.length === 2) {
      edgeLabels.push({ key: 'kal', x: ((cl[0][0] + cl[1][0]) / 2) * sc, y: ((cl[0][1] + cl[1][1]) / 2) * sc, text: fmtLen(dist(cl[0], cl[1])), tone: 'calib' });
    }
  }

  const step = tickStep(sc);
  const ticksX: Tick[] = [], ticksY: Tick[] = [];
  for (let v = 0; v <= W + 1e-9; v += step) ticksX.push({ key: 'x' + v, pos: v * sc, label: String(v) });
  for (let v = 0; v <= H + 1e-9; v += step) ticksY.push({ key: 'y' + v, pos: v * sc, label: String(v) });

  return {
    W, H, scale: sc, widthPx: W * sc, heightPx: H * sc,
    cursor: bg && ui.bgMode === 'move' ? 'move' : calibActive || ui.tool !== 'select' ? 'crosshair' : 'default',
    bg: bg && bg.visible ? { src: bg.src, left: bg.x * sc, top: bg.y * sc, width: bg.w * sc, height: bg.w * bg.aspect * sc, opacity: bg.opacity } : null,
    polys, bounds, points, selection, draftLine, draftRect, calibLine, labels, edgeLabels, handles, ticksX, ticksY,
  };
}

export function draftInfo(s: AppState): string {
  const { draft, hover } = s.ui;
  if (!draft.length) return 'Kliknij na planie pierwszy punkt';
  let out = 'Punkty: ' + draft.length;
  if (hover) {
    const l = draft[draft.length - 1];
    out += ' · odcinek ' + fmtLen(dist(l, hover)) + ' · ' + displayAngle(l, hover) + '°';
  }
  return out;
}

export function calibInfo(s: AppState): string {
  const cl = calibPoints(s);
  if (cl.length < 2) return 'Kliknij pierwszy punkt na mapce';
  const d = fmtLen(dist(cl[0], cl[1]));
  return (s.ui.calib.length === 2 ? 'Odcinek na mapce: ' : 'Teraz drugi punkt · ') + d + ' w obecnej skali';
}

export function stageTip(s: AppState): string {
  const { ui } = s;
  const bg = s.doc.plan.bg;
  if (bg && ui.bgMode === 'calib') return 'Kalibracja: kliknij dwa punkty na mapce o znanej odległości, wpisz ją po lewej i zastosuj.';
  if (bg && ui.bgMode === 'move') return 'Przeciągnij, aby przesunąć mapkę pod planem.';
  if (isPolyTool(s) && ui.mode === 'poly') {
    return ui.draft.length >= 3
      ? 'Kliknij pierwszy (niebieski) punkt albo kliknij dwukrotnie, aby zamknąć kształt.'
      : 'Klikaj kolejne narożniki. Długość i kąt możesz też wpisać po lewej.';
  }
  if (isPolyTool(s)) return 'Przeciągnij, aby narysować prostokąt.';
  if (ui.tool !== 'select') return 'Kliknij, aby posadzić. Narzędzie zostaje aktywne, możesz sadzić dalej.';
  if (selectSelected(s)) return 'Przeciągnij element, aby go przesunąć. Kwadratowe uchwyty przesuwają narożniki.';
  return 'Wybierz narzędzie po lewej. Kliknij element na planie, aby go edytować.';
}

export function coordsText(hover: Pt | null): string {
  return hover ? `X ${fmtLen(hover[0])}   Y ${fmtLen(hover[1])}` : 'Najedź na plan';
}
```

- [ ] **Step 4: Zaimplementuj `patterns.tsx`, `canvas.module.css`, `PlanStage.tsx`**

`src/canvas/patterns.tsx`:
```tsx
import { material } from '../design/tokens';

const NAMES = ['grass', 'paving', 'gravel', 'bed', 'house'] as const;
type RawPattern = { size: number[]; svg: string; transform?: string };

export function Patterns() {
  return (
    <defs>
      {NAMES.map((k) => {
        const p = material[k].pattern as RawPattern;
        return (
          <pattern
            key={k}
            id={`pat-${k}`}
            patternUnits="userSpaceOnUse"
            width={p.size[0]}
            height={p.size[1]}
            patternTransform={p.transform}
            // Treść wzoru pochodzi z design/tokens.json (statyczne dane projektu), nie od użytkownika.
            dangerouslySetInnerHTML={{ __html: p.svg }}
          />
        );
      })}
    </defs>
  );
}
```

`src/canvas/canvas.module.css`:
```css
.stage {
  position: relative; touch-action: none; user-select: none;
  background-color: var(--color-stage);
  background-image:
    linear-gradient(to right, var(--color-grid-major) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-grid-major) 1px, transparent 1px),
    linear-gradient(to right, var(--color-grid-minor) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-grid-minor) 1px, transparent 1px);
  box-shadow: 0 0 0 1px var(--color-stage-ring);
}
.layer { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.bgImg { position: absolute; max-width: none; pointer-events: none; user-select: none; }
.tickX, .tickY { position: absolute; font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted); pointer-events: none; }
.tickX { top: -22px; transform: translateX(-50%); }
.tickY { left: -40px; width: 34px; text-align: right; transform: translateY(-50%); }
.label { position: absolute; padding: 2px 6px; border-radius: 4px; background: var(--color-label-bg); text-align: center; white-space: nowrap; line-height: 1.25; pointer-events: none; }
.labelCenter { transform: translate(-50%, -50%); }
.labelCorner { transform: translate(4px, calc(-100% - 4px)); }
.labelTitle { font-size: 12px; font-weight: 600; color: var(--color-text); }
.labelSub { font-family: var(--font-mono); font-size: 11px; color: var(--color-text-secondary); }
.edge { position: absolute; transform: translate(-50%, -50%); padding: 1px 5px; border-radius: 3px; color: var(--color-on-accent); font-family: var(--font-mono); font-size: 11px; white-space: nowrap; pointer-events: none; }
.toneBoundary { background: var(--color-danger); }
.toneSelection { background: var(--color-selection); }
.toneDraft { background: var(--color-draft); }
.toneCalib { background: var(--color-calib); }
.handle { position: absolute; transform: translate(-50%, -50%); border: 2px solid; pointer-events: none; }
.hVertex { width: 12px; height: 12px; background: var(--color-surface); border-color: var(--color-selection); border-radius: 2px; }
.hPointCenter { width: 10px; height: 10px; background: var(--color-selection); border-color: var(--color-surface); border-radius: 50%; }
.hDraft { width: 10px; height: 10px; background: var(--color-surface); border-color: var(--color-draft); border-radius: 50%; }
.hDraftFirst { width: 14px; height: 14px; background: var(--color-surface); border-color: var(--color-draft); border-radius: 50%; }
.hDraftClosable { width: 14px; height: 14px; background: var(--color-draft); border-color: var(--color-draft); border-radius: 50%; }
.hCalib { width: 12px; height: 12px; background: var(--color-calib); border-color: var(--color-surface); border-radius: 50%; }

.view { flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 8px 12px; border-bottom: 1px solid var(--color-border); }
.zoom { display: flex; align-items: center; gap: 4px; }
.zoomLabel { min-width: 76px; text-align: center; font-family: var(--font-mono); font-size: 12px; color: var(--color-text-secondary); }
.scaleBar { display: flex; flex-direction: column; gap: 2px; font-family: var(--font-mono); font-size: 11px; color: var(--color-text-secondary); }
.bar { height: 6px; border: 1.5px solid var(--color-text); border-top: 0; }
.coords { margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--color-text-secondary); white-space: pre; }
.well { height: 640px; overflow: auto; background: var(--color-stage-well); }
.pad { width: max-content; padding: 34px 32px 32px 46px; }
.tip { margin: 0; padding: 10px 12px; border-top: 1px solid var(--color-border); font-size: 13px; color: var(--color-text-secondary); }
```

`src/canvas/PlanStage.tsx`:
```tsx
import type { MouseEventHandler, PointerEventHandler } from 'react';
import { color } from '../design/tokens';
import { cx } from '../ui/cx';
import s from './canvas.module.css';
import { Patterns } from './patterns';
import type { EdgeTone, HandleKind, StageModel } from './stageModel';

export interface StageHandlers {
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerLeave: PointerEventHandler<HTMLDivElement>;
  onDoubleClick: MouseEventHandler<HTMLDivElement>;
}

const TONE: Record<EdgeTone, string> = { boundary: s.toneBoundary, selection: s.toneSelection, draft: s.toneDraft, calib: s.toneCalib };
const HANDLE: Record<HandleKind, string> = {
  vertex: s.hVertex, pointCenter: s.hPointCenter, draft: s.hDraft, draftFirst: s.hDraftFirst, draftClosable: s.hDraftClosable, calib: s.hCalib,
};
const NS = 'non-scaling-stroke';

export function PlanStage({ model: m, handlers }: { model: StageModel; handlers: StageHandlers }) {
  const major = 5 * m.scale, minor = m.scale;
  return (
    <div
      role="group"
      aria-label="Plan ogrodu"
      className={s.stage}
      style={{
        width: m.widthPx,
        height: m.heightPx,
        cursor: m.cursor,
        backgroundSize: `${major}px ${major}px, ${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`,
      }}
      {...handlers}
    >
      {m.bg && (
        <img
          src={m.bg.src}
          alt=""
          draggable={false}
          className={s.bgImg}
          style={{ left: m.bg.left, top: m.bg.top, width: m.bg.width, height: m.bg.height, opacity: m.bg.opacity }}
        />
      )}
      {m.ticksX.map((t) => <span key={t.key} className={s.tickX} style={{ left: t.pos }}>{t.label}</span>)}
      {m.ticksY.map((t) => <span key={t.key} className={s.tickY} style={{ top: t.pos }}>{t.label}</span>)}

      <svg className={s.layer} viewBox={`0 0 ${m.W} ${m.H}`} preserveAspectRatio="none" aria-hidden="true">
        <Patterns />
        {m.polys.map((p) => (
          <polygon key={p.key} points={p.points} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} strokeDasharray={p.dash} strokeLinejoin="round" vectorEffect={NS} />
        ))}
        {m.points.map((p) => (
          <g key={p.key}>
            <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} stroke={p.stroke} strokeWidth={1.5} vectorEffect={NS} />
            {p.dotR > 0 && <circle cx={p.cx} cy={p.cy} r={p.dotR} fill={p.stroke} />}
          </g>
        ))}
        {m.bounds.map((p) => (
          <polygon key={p.key} points={p.points} fill="none" stroke={p.stroke} strokeWidth={p.sw} strokeDasharray={p.dash} strokeLinejoin="round" vectorEffect={NS} />
        ))}
        {m.selection?.kind === 'poly' && (
          <polygon points={m.selection.points} fill={color('selectionFill')} stroke={color('selection')} strokeWidth={2} vectorEffect={NS} />
        )}
        {m.selection?.kind === 'point' && (
          <circle cx={m.selection.cx} cy={m.selection.cy} r={m.selection.r} fill="none" stroke={color('selection')} strokeWidth={2} strokeDasharray="5 3" vectorEffect={NS} />
        )}
        {m.draftLine && (
          <polyline points={m.draftLine} fill={color('draftFill')} stroke={color('draft')} strokeWidth={2} strokeDasharray="6 4" vectorEffect={NS} />
        )}
        {m.draftRect && (
          <polygon points={m.draftRect} fill={color('draftRectFill')} stroke={color('draft')} strokeWidth={2} strokeDasharray="6 4" vectorEffect={NS} />
        )}
        {m.calibLine && (
          <polyline points={m.calibLine} fill="none" stroke={color('calib')} strokeWidth={2} strokeDasharray="6 4" vectorEffect={NS} />
        )}
      </svg>

      {m.labels.map((l) => (
        <div key={l.key} className={cx(s.label, l.anchor === 'center' ? s.labelCenter : s.labelCorner)} style={{ left: l.x, top: l.y }}>
          <div className={s.labelTitle}>{l.title}</div>
          <div className={s.labelSub}>{l.sub}</div>
        </div>
      ))}
      {m.edgeLabels.map((e) => (
        <span key={e.key} className={cx(s.edge, TONE[e.tone])} style={{ left: e.x, top: e.y }}>{e.text}</span>
      ))}
      {m.handles.map((h) => (
        <span key={h.key} className={cx(s.handle, HANDLE[h.kind])} style={{ left: h.x, top: h.y }} />
      ))}
    </div>
  );
}
```

Sprawdzenie liczby `polygon` w teście: 6 obszarów + 1 granica = 7 (bez zaznaczenia i szkicu). Wzory w `<defs>` nie zawierają `polygon`.

- [ ] **Step 5: Uruchom testy**

Run: `npx vitest run src/canvas && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/canvas
git commit -m "feat(canvas): model widoku planu, trafienia i renderowanie SVG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Obsługa wskaźnika i widok planu

**Files:**
- Create: `src/canvas/pointer.ts`, `src/canvas/usePointerTools.ts`, `src/canvas/PlanView.tsx`
- Test: `src/canvas/pointer.test.ts`, `src/canvas/PlanView.test.tsx`

**Interfaces:**
- Consumes: `AppState`, `AppAction` (Task 8), `selectSelected` (Task 8), `hitTest`, `VERTEX_PX`, `CLOSE_PX`, `EDGE_INSERT_PX`, `toMeters` (Task 10), `isPolyTool`, `buildStageModel`, `stageTip`, `coordsText`, `tickStep`, `PlanStage` (Task 10), `snapPoint`, `draftPoint` (Task 4), `rectPoints`, `segmentDistance`, `dist` (Task 3), `defaultRadius`, `isPoly`, `isPolyType` (Task 2), `newId` (Task 2), `Button` (Task 9).
- Produces:
  - `Drag = { kind: 'bg'; start: Pt; orig: { x: number; y: number } } | { kind: 'vertex'; id: string; index: number; pushed: boolean } | { kind: 'move'; id: string; start: Pt; orig: Shape; pushed: boolean }`
  - `PointerResult { actions: AppAction[]; drag: Drag | null; capture: boolean }`
  - `pointerDown(s, raw, newId): PointerResult`, `pointerMove(s, raw, drag): PointerResult`, `pointerUp(s, raw, newId): AppAction[]`, `doubleClick(s, raw, newId): AppAction[]`, `finishDraftActions(s, newId): AppAction[]`
  - `usePointerTools(): StageHandlers`
  - `PlanView()`: sekcja planu z paskiem narzędzi, przewijanym obszarem i podpowiedzią.

- [ ] **Step 1: Napisz testy (failing)**

`src/canvas/pointer.test.ts`:
```ts
import { samplePlan } from '../domain/sample';
import type { PolyShape } from '../domain/types';
import { makeState } from '../test/factories';
import { doubleClick, pointerDown, pointerMove, pointerUp, type Drag } from './pointer';

const ids = () => 'n1';
const sample = (ui = {}) => makeState({ plan: { shapes: samplePlan().shapes }, ui });
const bg = { src: 'data:image/png;base64,A', x: 2, y: 3, w: 20, aspect: 0.5, opacity: 0.6, visible: true };
const house = samplePlan().shapes.find((x) => x.id === 'h1') as PolyShape;

describe('select tool', () => {
  it('click on a shape selects it and starts a move drag', () => {
    const r = pointerDown(sample(), [11.5, 8], ids);
    expect(r.actions).toEqual([{ type: 'ui/select', id: 'h1' }]);
    expect(r.drag).toEqual({ kind: 'move', id: 'h1', start: [11.5, 8], orig: house, pushed: false });
    expect(r.capture).toBe(true);
  });
  it('click on empty space clears selection', () => {
    const r = pointerDown(sample({ sel: 'h1' }), [29, 21.5], ids);
    expect(r.actions).toEqual([{ type: 'ui/select', id: null }]);
    expect(r.drag).toBeNull();
  });
  it('grabbing a vertex of the selected polygon starts a vertex drag', () => {
    const r = pointerDown(sample({ sel: 'h1' }), [6.1, 4.1], ids);
    expect(r.drag).toEqual({ kind: 'vertex', id: 'h1', index: 0, pushed: false });
    expect(r.actions).toEqual([]);
  });
  it('moving pushes history once and moves by snapped delta', () => {
    const drag: Drag = { kind: 'move', id: 'h1', start: [11.5, 8], orig: house, pushed: false };
    const r1 = pointerMove(sample(), [13.7, 8.2], drag);
    expect(r1.actions[0]).toEqual({ type: 'plan/checkpoint' });
    expect(r1.actions[1]).toEqual({ type: 'plan/replace', id: 'h1', shape: { ...house, pts: [[8, 4], [19, 4], [19, 12], [8, 12]] } });
    expect(r1.drag).toMatchObject({ pushed: true });
    const r2 = pointerMove(sample(), [14, 8], r1.drag);
    expect(r2.actions.some((a) => a.type === 'plan/checkpoint')).toBe(false);
  });
  it('vertex drag moves one snapped vertex', () => {
    const drag: Drag = { kind: 'vertex', id: 'h1', index: 2, pushed: true };
    const r = pointerMove(sample(), [18.2, 13.9], drag);
    expect(r.actions[0]).toEqual({ type: 'plan/moveVertex', id: 'h1', index: 2, pt: [18, 14] });
  });
  it('double-click near an edge of the selected polygon inserts a vertex', () => {
    expect(doubleClick(sample({ sel: 'h1' }), [10.2, 4.1], ids)).toEqual([{ type: 'plan/insertVertex', id: 'h1', after: 0, pt: [10, 4] }]);
    expect(doubleClick(sample({ sel: 'h1' }), [10, 8], ids)).toEqual([]);
  });
});

describe('drawing areas', () => {
  it('click adds a snapped draft point', () => {
    const r = pointerDown(makeState({ ui: { tool: 'grass' } }), [1.26, 1.74], ids);
    expect(r.actions).toEqual([{ type: 'ui/draftAdd', pt: [1.5, 1.5] }]);
  });
  it('a point within 5 mm of the previous one is ignored', () => {
    const r = pointerDown(makeState({ ui: { tool: 'grass', draft: [[1, 1]] } }), [1.1, 1.1], ids);
    expect(r.actions).toEqual([]);
  });
  it('clicking the first point closes the shape when there are 3+ points', () => {
    const draft: [number, number][] = [[1, 1], [5, 1], [5, 4]];
    const r = pointerDown(makeState({ ui: { tool: 'bed', draft } }), [1.1, 1.05], ids);
    expect(r.actions).toEqual([{ type: 'plan/add', shape: { id: 'n1', type: 'bed', pts: draft } }]);
  });
  it('double-click closes the draft', () => {
    const draft: [number, number][] = [[1, 1], [5, 1], [5, 4]];
    expect(doubleClick(makeState({ ui: { tool: 'bed', draft } }), [5, 4], ids)).toEqual([
      { type: 'plan/add', shape: { id: 'n1', type: 'bed', pts: draft } },
    ]);
    expect(doubleClick(makeState({ ui: { tool: 'bed', draft: [[1, 1]] } }), [5, 4], ids)).toEqual([]);
  });
  it('hover while drawing uses angle snap', () => {
    const r = pointerMove(makeState({ ui: { tool: 'grass', draft: [[0, 0]], angleSnap: true } }), [10, 0.9], null);
    expect(r.actions).toEqual([{ type: 'ui/hover', pt: [10, 0] }]);
  });
  it('rectangle: press sets the start, release adds the rectangle', () => {
    const s = makeState({ ui: { tool: 'house', mode: 'rect' } });
    const down = pointerDown(s, [1.1, 0.9], ids);
    expect(down.actions).toEqual([{ type: 'ui/rectStart', pt: [1, 1] }, { type: 'ui/hover', pt: [1, 1] }]);
    const up = pointerUp(makeState({ ui: { tool: 'house', mode: 'rect', rectStart: [1, 1] } }), [4.1, 3.2], ids);
    expect(up).toEqual([
      { type: 'ui/rectStart', pt: null },
      { type: 'plan/add', shape: { id: 'n1', type: 'house', pts: [[1, 1], [4, 1], [4, 3], [1, 3]] } },
    ]);
  });
  it('a rectangle thinner than 0.1 m is cancelled', () => {
    const up = pointerUp(makeState({ ui: { tool: 'house', mode: 'rect', rectStart: [1, 1] } }), [4, 1], ids);
    expect(up).toEqual([{ type: 'ui/rectStart', pt: null }]);
  });
});

describe('plants', () => {
  it('click plants with the default radius and keeps the tool', () => {
    const r = pointerDown(makeState({ ui: { tool: 'conifer' } }), [3.3, 4.6], ids);
    expect(r.actions).toEqual([{ type: 'plan/add', shape: { id: 'n1', type: 'conifer', x: 3.5, y: 4.5, r: 1 }, keepTool: true }]);
  });
});

describe('background', () => {
  it('calibration click records a point rounded to mm', () => {
    const r = pointerDown(makeState({ plan: { bg }, ui: { bgMode: 'calib' } }), [1.23456, 2.34567], ids);
    expect(r.actions).toEqual([{ type: 'ui/calibClick', pt: [1.235, 2.346] }]);
  });
  it('move mode drags the background', () => {
    const s = makeState({ plan: { bg }, ui: { bgMode: 'move' } });
    const down = pointerDown(s, [5, 5], ids);
    expect(down.drag).toEqual({ kind: 'bg', start: [5, 5], orig: { x: 2, y: 3 } });
    const mv = pointerMove(s, [6.5, 4], down.drag);
    expect(mv.actions[0]).toEqual({ type: 'plan/patchBackground', patch: { x: 3.5, y: 2 } });
  });
});
```

`src/canvas/PlanView.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { PlanView } from './PlanView';

describe('PlanView', () => {
  it('shows zoom, scale bar, coordinates and the tip', async () => {
    const { user, getState } = renderWithStore(<PlanView />, makeState());
    expect(screen.getByText('1 m = 28 px')).toBeInTheDocument();
    expect(screen.getByText('5 m')).toBeInTheDocument();
    expect(screen.getByText('Najedź na plan')).toBeInTheDocument();
    expect(screen.getByText('Wybierz narzędzie po lewej. Kliknij element na planie, aby go edytować.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Przybliż' }));
    expect(getState().ui.scale).toBe(36);
    expect(screen.getByText('1 m = 36 px')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Oddal' }));
    await user.click(screen.getByRole('button', { name: 'Oddal' }));
    expect(screen.getByText('1 m = 20 px')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/canvas/pointer.test.ts src/canvas/PlanView.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Zaimplementuj `pointer.ts`**

```ts
import { defaultRadius, isPoly, isPolyType } from '../domain/catalog';
import { round2 } from '../domain/format';
import { dist, rectPoints, segmentDistance } from '../domain/geometry';
import { draftPoint, snapPoint } from '../domain/snapping';
import type { Pt, Shape } from '../domain/types';
import type { AppAction, AppState } from '../state/rootReducer';
import { selectSelected } from '../state/selectors';
import { CLOSE_PX, EDGE_INSERT_PX, VERTEX_PX } from './coords';
import { hitTest } from './hitTest';
import { isPolyTool } from './stageModel';

export type Drag =
  | { kind: 'bg'; start: Pt; orig: { x: number; y: number } }
  | { kind: 'vertex'; id: string; index: number; pushed: boolean }
  | { kind: 'move'; id: string; start: Pt; orig: Shape; pushed: boolean };

export interface PointerResult { actions: AppAction[]; drag: Drag | null; capture: boolean }

const round3 = (v: number) => Math.round(v * 1000) / 1000;
const only = (actions: AppAction[]): PointerResult => ({ actions, drag: null, capture: false });

export function finishDraftActions(s: AppState, newId: () => string): AppAction[] {
  const { draft, tool } = s.ui;
  if (draft.length < 3 || tool === 'select' || !isPolyType(tool)) return [];
  return [{ type: 'plan/add', shape: { id: newId(), type: tool, pts: draft.slice() } }];
}

export function pointerDown(s: AppState, raw: Pt, newId: () => string): PointerResult {
  const { ui } = s;
  const bg = s.doc.plan.bg;
  if (bg && ui.bgMode === 'calib') return only([{ type: 'ui/calibClick', pt: [round3(raw[0]), round3(raw[1])] }]);
  if (bg && ui.bgMode === 'move') return { actions: [], drag: { kind: 'bg', start: raw, orig: { x: bg.x, y: bg.y } }, capture: true };

  if (ui.tool === 'select') {
    const sel = selectSelected(s);
    if (sel && isPoly(sel)) {
      const i = sel.pts.findIndex((p) => dist(p, raw) <= VERTEX_PX / ui.scale);
      if (i >= 0) return { actions: [], drag: { kind: 'vertex', id: sel.id, index: i, pushed: false }, capture: true };
    }
    const hit = hitTest(s.doc.plan.shapes, raw, ui.scale);
    if (!hit) return only([{ type: 'ui/select', id: null }]);
    return { actions: [{ type: 'ui/select', id: hit.id }], drag: { kind: 'move', id: hit.id, start: raw, orig: hit, pushed: false }, capture: true };
  }

  const tool = ui.tool;
  if (!isPolyType(tool)) {
    const p = snapPoint(raw, ui.step);
    return only([{ type: 'plan/add', shape: { id: newId(), type: tool, x: p[0], y: p[1], r: defaultRadius(tool) }, keepTool: true }]);
  }
  if (ui.mode === 'rect') {
    const p = snapPoint(raw, ui.step);
    return { actions: [{ type: 'ui/rectStart', pt: p }, { type: 'ui/hover', pt: p }], drag: null, capture: true };
  }
  const d = ui.draft;
  if (d.length >= 3 && dist(d[0], raw) <= CLOSE_PX / ui.scale) return only(finishDraftActions(s, newId));
  const last = d.length ? d[d.length - 1] : null;
  const np = draftPoint(raw, last, { step: ui.step, angleSnap: ui.angleSnap });
  if (last && dist(last, np) < 0.005) return only([]);
  return only([{ type: 'ui/draftAdd', pt: np }]);
}

export function pointerMove(s: AppState, raw: Pt, drag: Drag | null): PointerResult {
  const { ui } = s;
  if (drag && drag.kind === 'bg') {
    const patch = { x: round2(drag.orig.x + raw[0] - drag.start[0]), y: round2(drag.orig.y + raw[1] - drag.start[1]) };
    return { actions: [{ type: 'plan/patchBackground', patch }, { type: 'ui/hover', pt: raw }], drag, capture: false };
  }
  if (ui.bgMode === 'calib') return { actions: [{ type: 'ui/hover', pt: raw }], drag, capture: false };
  if (drag) {
    const actions: AppAction[] = [];
    let next: Drag = drag;
    if (!drag.pushed) {
      actions.push({ type: 'plan/checkpoint' });
      next = { ...drag, pushed: true };
    }
    if (drag.kind === 'vertex') {
      actions.push({ type: 'plan/moveVertex', id: drag.id, index: drag.index, pt: snapPoint(raw, ui.step) });
    } else {
      let dx = raw[0] - drag.start[0], dy = raw[1] - drag.start[1];
      if (ui.step) {
        dx = Math.round(dx / ui.step) * ui.step;
        dy = Math.round(dy / ui.step) * ui.step;
      }
      const o = drag.orig;
      const shape: Shape = isPoly(o)
        ? { ...o, pts: o.pts.map((q): Pt => [round2(q[0] + dx), round2(q[1] + dy)]) }
        : { ...o, x: round2(o.x + dx), y: round2(o.y + dy) };
      actions.push({ type: 'plan/replace', id: drag.id, shape });
    }
    actions.push({ type: 'ui/hover', pt: snapPoint(raw, ui.step) });
    return { actions, drag: next, capture: false };
  }
  const drawing = isPolyTool(s) && ui.mode === 'poly';
  const last = ui.draft.length ? ui.draft[ui.draft.length - 1] : null;
  const pt = drawing ? draftPoint(raw, last, { step: ui.step, angleSnap: ui.angleSnap }) : snapPoint(raw, ui.step);
  return { actions: [{ type: 'ui/hover', pt }], drag: null, capture: false };
}

export function pointerUp(s: AppState, raw: Pt, newId: () => string): AppAction[] {
  const { ui } = s;
  if (!ui.rectStart) return [];
  const a = ui.rectStart, b = snapPoint(raw, ui.step);
  const actions: AppAction[] = [{ type: 'ui/rectStart', pt: null }];
  const tool = ui.tool;
  if (tool !== 'select' && isPolyType(tool) && Math.abs(b[0] - a[0]) >= 0.1 && Math.abs(b[1] - a[1]) >= 0.1) {
    actions.push({ type: 'plan/add', shape: { id: newId(), type: tool, pts: rectPoints(a, b) } });
  }
  return actions;
}

export function doubleClick(s: AppState, raw: Pt, newId: () => string): AppAction[] {
  const { ui } = s;
  if (isPolyTool(s) && ui.mode === 'poly') return finishDraftActions(s, newId);
  const sel = selectSelected(s);
  if (ui.tool !== 'select' || !sel || !isPoly(sel)) return [];
  let best: { d: number; i: number; q: Pt } | null = null;
  for (let i = 0; i < sel.pts.length; i++) {
    const r = segmentDistance(raw, sel.pts[i], sel.pts[(i + 1) % sel.pts.length]);
    if (!best || r.d < best.d) best = { d: r.d, i, q: r.q };
  }
  if (!best || best.d > EDGE_INSERT_PX / ui.scale) return [];
  return [{ type: 'plan/insertVertex', id: sel.id, after: best.i, pt: snapPoint(best.q, ui.step) }];
}
```

Uwagi do testów:
- Kliknięcie [6.1, 4.1] jest 0,14 m (4 px) od wierzchołka [6, 4], czyli w progu 9 px.
- Dwuklik [10.2, 4.1] jest 0,1 m (2,8 px) od krawędzi 0 (górnej), a rzut [10.2, 4] po przyciągnięciu do 0,5 m daje [10, 4].
- Przy przesuwaniu: dx 2,2 → 2, dy 0,2 → 0.

- [ ] **Step 3: Zaimplementuj `usePointerTools.ts`**

```ts
import { useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { newId } from '../domain/ids';
import type { Pt } from '../domain/types';
import type { AppAction } from '../state/rootReducer';
import { useAppDispatch, useAppState } from '../state/store';
import { toMeters } from './coords';
import type { StageHandlers } from './PlanStage';
import { doubleClick, pointerDown, pointerMove, pointerUp, type Drag } from './pointer';

export function usePointerTools(): StageHandlers {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const stateRef = useRef(state);
  stateRef.current = state;
  const drag = useRef<Drag | null>(null);

  const run = (actions: AppAction[]) => actions.forEach(dispatch);
  const at = (e: MouseEvent<HTMLDivElement>): Pt =>
    toMeters(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), stateRef.current.ui.scale);

  return {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      if (e.button !== 0) return;
      const r = pointerDown(stateRef.current, at(e), newId);
      drag.current = r.drag;
      if (r.capture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* przeglądarka bez pointer capture */
        }
      }
      run(r.actions);
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      const r = pointerMove(stateRef.current, at(e), drag.current);
      drag.current = r.drag;
      run(r.actions);
    },
    onPointerUp(e: PointerEvent<HTMLDivElement>) {
      const actions = pointerUp(stateRef.current, at(e), newId);
      drag.current = null;
      run(actions);
    },
    onPointerLeave() {
      if (!drag.current && !stateRef.current.ui.rectStart) dispatch({ type: 'ui/hover', pt: null });
    },
    onDoubleClick(e: MouseEvent<HTMLDivElement>) {
      run(doubleClick(stateRef.current, at(e), newId));
    },
  };
}
```

- [ ] **Step 4: Zaimplementuj `PlanView.tsx`**

```tsx
import { useAppDispatch, useAppState } from '../state/store';
import { Button } from '../ui/primitives/Button';
import s from './canvas.module.css';
import { PlanStage } from './PlanStage';
import { buildStageModel, coordsText, stageTip, tickStep } from './stageModel';
import { usePointerTools } from './usePointerTools';

export function PlanView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const handlers = usePointerTools();
  const model = buildStageModel(state);
  const bar = tickStep(model.scale);
  return (
    <section className={s.view} aria-label="Plan">
      <div className={s.toolbar}>
        <div className={s.zoom}>
          <Button size="icon" aria-label="Oddal" onClick={() => dispatch({ type: 'ui/zoom', dir: -1 })}>−</Button>
          <span className={s.zoomLabel}>1 m = {model.scale} px</span>
          <Button size="icon" aria-label="Przybliż" onClick={() => dispatch({ type: 'ui/zoom', dir: 1 })}>+</Button>
        </div>
        <div className={s.scaleBar}>
          <div className={s.bar} style={{ width: bar * model.scale }} />
          <span>{bar} m</span>
        </div>
        <span className={s.coords}>{coordsText(state.ui.hover)}</span>
      </div>
      <div className={s.well}>
        <div className={s.pad}>
          <PlanStage model={model} handlers={handlers} />
        </div>
      </div>
      <p className={s.tip}>{stageTip(state)}</p>
    </section>
  );
}
```

Uwaga: `1 m = {model.scale} px` daje w DOM kilka węzłów tekstowych. `getByText('1 m = 28 px')` dopasowuje cały tekst elementu, więc test przechodzi.

- [ ] **Step 5: Uruchom testy**

Run: `npx vitest run src/canvas && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/canvas
git commit -m "feat(canvas): rysowanie, zaznaczanie, przesuwanie i kalibracja wskaźnikiem

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 12: Lewa kolumna (Narzędzia, Rysowanie, Sadzenie, Siatka)

**Files:**
- Create: `src/ui/panels.module.css`, `src/ui/ToolsPanel.tsx`, `src/ui/DrawPanel.tsx`, `src/ui/PlantPanel.tsx`, `src/ui/GridPanel.tsx`
- Test: `src/ui/leftPanels.test.tsx`

**Interfaces:**
- Consumes: `useAppState`, `useAppDispatch` (Task 8), `DrawInputKey`, `Tool` (Task 8), `CATALOG`, `ORDER_POLY`, `ORDER_POINT`, `isPolyType`, `round2`, `parseNum`, `newId` (Task 2), `rectPoints` (Task 3), `pointFromSegment` (Task 4), `polyStyle`, `pointStyle`, `draftInfo` (Task 10), `finishDraftActions` (Task 11), prymitywy (Task 9), `makeState`, `renderWithStore` (Task 8).
- Produces: komponenty `ToolsPanel`, `DrawPanel` (zwraca `null`, gdy narzędziem nie jest obszar), `PlantPanel` (zwraca `null`, gdy narzędziem nie jest roślina), `GridPanel`. Klasy `panels.module.css` używane też w Task 13–14.

- [ ] **Step 1: Napisz testy (failing)**

`src/ui/leftPanels.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { DrawPanel } from './DrawPanel';
import { GridPanel } from './GridPanel';
import { PlantPanel } from './PlantPanel';
import { ToolsPanel } from './ToolsPanel';

describe('ToolsPanel', () => {
  it('lists tools and switches the active one', async () => {
    const { user, getState } = renderWithStore(<ToolsPanel />, makeState());
    expect(screen.getByRole('button', { name: 'Zaznacz i przesuń' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Zaznacz i przesuń', 'Granica działki', 'Trawnik', 'Kostka brukowa', 'Żwir', 'Rabata', 'Dom / budynek', 'Drzewo liściaste', 'Iglak', 'Krzew',
    ]);
    await user.click(screen.getByRole('button', { name: 'Trawnik' }));
    expect(getState().ui.tool).toBe('grass');
    expect(screen.getByRole('button', { name: 'Trawnik' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('DrawPanel', () => {
  it('is hidden for the select tool and for plants', () => {
    const { container } = renderWithStore(<><DrawPanel /></>, makeState());
    expect(container).toBeEmptyDOMElement();
    renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'tree' } }));
    expect(screen.queryByText(/Rysowanie/)).toBeNull();
  });

  it('inserts a rectangle from typed dimensions', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'grass', mode: 'rect' } }));
    expect(screen.getByRole('region', { name: 'Rysowanie: Trawnik' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Szerokość (m)'));
    await user.type(screen.getByLabelText('Szerokość (m)'), '2,5');
    await user.click(screen.getByRole('button', { name: 'Wstaw prostokąt' }));
    const s = getState();
    expect(s.doc.plan.shapes).toHaveLength(1);
    expect(s.doc.plan.shapes[0]).toMatchObject({ type: 'grass', pts: [[0, 0], [2.5, 0], [2.5, 8], [0, 8]] });
    expect(s.ui.tool).toBe('select');
  });

  it('ignores a rectangle with zero width', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'grass', mode: 'rect' } }));
    await user.clear(screen.getByLabelText('Szerokość (m)'));
    await user.type(screen.getByLabelText('Szerokość (m)'), '0');
    await user.click(screen.getByRole('button', { name: 'Wstaw prostokąt' }));
    expect(getState().doc.plan.shapes).toEqual([]);
  });

  it('builds a polygon from a start point, length and angle', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'bed' } }));
    expect(screen.getByText('Kliknij na planie pierwszy punkt')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Start X (m)'));
    await user.type(screen.getByLabelText('Start X (m)'), '2');
    await user.clear(screen.getByLabelText('Start Y (m)'));
    await user.type(screen.getByLabelText('Start Y (m)'), '8');
    await user.click(screen.getByRole('button', { name: 'Ustaw punkt startowy' }));
    expect(getState().ui.draft).toEqual([[2, 8]]);
    await user.type(screen.getByLabelText('Długość (m)'), '3');
    await user.clear(screen.getByLabelText('Kąt (°)'));
    await user.type(screen.getByLabelText('Kąt (°)'), '90');
    await user.click(screen.getByRole('button', { name: 'Dodaj odcinek' }));
    expect(getState().ui.draft).toEqual([[2, 8], [2, 5]]);
    expect(screen.getByText('Punkty: 2')).toBeInTheDocument();
  });

  it('a length that is not a number adds nothing', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'bed', draft: [[0, 0]] } }));
    await user.type(screen.getByLabelText('Długość (m)'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Dodaj odcinek' }));
    expect(getState().ui.draft).toEqual([[0, 0]]);
  });

  it('close/undo/cancel are disabled without a draft', () => {
    renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'bed' } }));
    expect(screen.getByRole('button', { name: 'Zamknij kształt' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cofnij punkt' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Anuluj' })).toBeDisabled();
  });

  it('closes a draft of 3+ points with the button', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'bed', draft: [[0, 0], [4, 0], [4, 3]] } }));
    await user.click(screen.getByRole('button', { name: 'Zamknij kształt' }));
    expect(getState().doc.plan.shapes[0]).toMatchObject({ type: 'bed', pts: [[0, 0], [4, 0], [4, 3]] });
    expect(getState().ui.tool).toBe('select');
  });

  it('switches between polygon and rectangle mode', async () => {
    const { user, getState } = renderWithStore(<DrawPanel />, makeState({ ui: { tool: 'house' } }));
    await user.click(screen.getByRole('button', { name: 'Prostokąt' }));
    expect(getState().ui.mode).toBe('rect');
    expect(screen.getByText('Przeciągnij na planie albo wpisz wymiary i wstaw dokładnie.')).toBeInTheDocument();
  });
});

describe('PlantPanel', () => {
  it('shows planting help for plant tools only', () => {
    renderWithStore(<PlantPanel />, makeState({ ui: { tool: 'conifer' } }));
    expect(screen.getByRole('region', { name: 'Sadzenie: Iglak' })).toBeInTheDocument();
    expect(screen.getByText(/Klikaj na planie, aby posadzić/)).toBeInTheDocument();
  });
});

describe('GridPanel', () => {
  it('changes snapping step and toggles', async () => {
    const { user, getState } = renderWithStore(<GridPanel />, makeState());
    await user.click(screen.getByRole('button', { name: '0,1 m' }));
    expect(getState().ui.step).toBe(0.1);
    expect(screen.getByRole('button', { name: '0,1 m' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Kąty co 15° przy rysowaniu' }));
    expect(getState().ui.angleSnap).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Nazwy i powierzchnie' }));
    expect(getState().ui.showLabels).toBe(false);
  });

  it('plot size ignores values outside 5–500 m', async () => {
    const { user, getState } = renderWithStore(<GridPanel />, makeState());
    const w = screen.getByLabelText('Szerokość (m)');
    await user.clear(w);
    await user.type(w, '600'); // po drodze 6 i 60 są poprawne, 600 jest ignorowane
    expect(getState().doc.plan.W).toBe(60);
    await user.clear(w);
    await user.type(w, '2');
    expect(getState().doc.plan.W).toBe(60);
    await user.clear(w);
    await user.type(w, '40');
    expect(getState().doc.plan.W).toBe(40);
  });
});
```

Run: `npx vitest run src/ui/leftPanels.test.tsx`
Expected: FAIL (brak modułów).

- [ ] **Step 2: Style paneli**

`src/ui/panels.module.css`:
```css
.stack4 { display: flex; flex-direction: column; gap: 4px; }
.stack6 { display: flex; flex-direction: column; gap: 6px; }
.stack8 { display: flex; flex-direction: column; gap: 8px; }
.toolBtn { display: flex; align-items: center; gap: 10px; min-height: var(--size-touch-primary); padding: 0 10px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); color: var(--color-text); font-size: 14px; text-align: left; }
.toolBtn[aria-pressed="true"] { background: var(--color-accent-selected); border-color: var(--color-accent); font-weight: 600; }
.draftInfo { color: var(--color-draft); }
.subTitle { margin: 6px 0 0; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-muted); }
.calibBlock { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: var(--radius-lg); background: var(--color-calib-soft); }
.calibText { margin: 0; font-size: 13px; line-height: 1.45; color: var(--color-calib-text); }
.calibInfo { margin: 0; font-family: var(--font-mono); font-size: 12px; color: var(--color-calib); }
.modeBtn[aria-pressed="true"] { background: var(--color-accent-selected); border-color: var(--color-accent); }
.calibBtn[aria-pressed="true"] { background: var(--color-calib-soft); border-color: var(--color-calib); }
.range { width: 100%; height: 28px; }
.summaryRow { display: flex; justify-content: space-between; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--color-divider); font-size: 13px; }
.mono { font-family: var(--font-mono); }
.footnote { margin: 0; font-size: 12px; line-height: 1.45; color: var(--color-text-muted); }
.empty { margin: 0; font-size: 13px; color: var(--color-text-muted); }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.reserve { margin: 0; font-size: 13px; color: var(--color-text-secondary); }
.reserve strong { font-family: var(--font-mono); font-weight: 500; }
.vertexRow { display: grid; grid-template-columns: 22px minmax(0, 1fr) minmax(0, 1fr) 36px; gap: 4px; align-items: center; }
.vertexNum { font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted); }
.vertexDel { height: var(--size-vertex-row); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-danger); font-size: 15px; }
.edgeRow { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--color-divider-soft); font-family: var(--font-mono); font-size: 12px; }
.edgeNum { color: var(--color-text-muted); }
.elItem { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: var(--size-touch-panel); padding: 0 8px; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font-size: 13px; text-align: left; }
.elItem[aria-pressed="true"] { background: var(--color-selection-soft); border-color: var(--color-selection); }
.elSub { font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted); }
```

- [ ] **Step 3: Zaimplementuj panele**

`src/ui/ToolsPanel.tsx`:
```tsx
import { pointStyle, polyStyle } from '../canvas/materialStyle';
import { CATALOG, ORDER_POINT, ORDER_POLY, isPolyType } from '../domain/catalog';
import type { ReactElement } from 'react';
import type { ShapeType } from '../domain/types';
import type { Tool } from '../state/uiReducer';
import { useAppDispatch, useAppState } from '../state/store';
import { CursorIcon } from './icons';
import s from './panels.module.css';
import { GroupTitle, Panel } from './primitives/layout';

function Swatch({ type }: { type: ShapeType }) {
  let fill: string, stroke: string, dash = 'none', rx = 0.45;
  if (isPolyType(type)) {
    const st = polyStyle(type);
    fill = st.fill;
    stroke = st.stroke;
    dash = st.toolDash;
    rx = 0.08;
  } else {
    const st = pointStyle(type);
    fill = st.fill;
    stroke = st.stroke;
  }
  return (
    <svg width={22} height={22} viewBox="0 0 1 1" aria-hidden="true">
      <rect x={0.05} y={0.05} width={0.9} height={0.9} rx={rx} fill={fill} stroke={stroke} strokeWidth={1.5} strokeDasharray={dash} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ToolsPanel() {
  const { ui } = useAppState();
  const dispatch = useAppDispatch();
  const btn = (tool: Tool, icon: ReactElement, label: string) => (
    <button key={tool} type="button" className={s.toolBtn} aria-pressed={ui.tool === tool} onClick={() => dispatch({ type: 'ui/setTool', tool })}>
      {icon}
      {label}
    </button>
  );
  return (
    <Panel title="Narzędzia">
      <div className={s.stack6}>
        {btn('select', <CursorIcon />, 'Zaznacz i przesuń')}
        <GroupTitle>Obszary</GroupTitle>
        {ORDER_POLY.map((t) => btn(t, <Swatch type={t} />, CATALOG[t].label))}
        <GroupTitle>Rośliny</GroupTitle>
        {ORDER_POINT.map((t) => btn(t, <Swatch type={t} />, CATALOG[t].label))}
      </div>
    </Panel>
  );
}
```

`src/ui/DrawPanel.tsx`:
```tsx
import { finishDraftActions } from '../canvas/pointer';
import { draftInfo } from '../canvas/stageModel';
import { CATALOG, isPolyType } from '../domain/catalog';
import { parseNum, round2 } from '../domain/format';
import { rectPoints } from '../domain/geometry';
import { newId } from '../domain/ids';
import { pointFromSegment } from '../domain/snapping';
import { useAppDispatch, useAppState } from '../state/store';
import type { DrawInputKey } from '../state/uiReducer';
import { cx } from './cx';
import s from './panels.module.css';
import { Button } from './primitives/Button';
import { Segmented } from './primitives/controls';
import { StrField } from './primitives/fields';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

export function DrawPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { ui } = state;
  const tool = ui.tool;
  if (tool === 'select' || !isPolyType(tool)) return null;

  const field = (key: DrawInputKey) => ({
    value: ui.drawInputs[key],
    onChange: (value: string) => dispatch({ type: 'ui/setDrawInput', key, value }),
  });
  const num = (key: DrawInputKey) => parseNum(ui.drawInputs[key]);

  const addStart = () => {
    const x = num('startX'), y = num('startY');
    if (Number.isNaN(x) || Number.isNaN(y)) return;
    dispatch({ type: 'ui/draftSet', pts: [[round2(x), round2(y)]] });
  };
  const addSegment = () => {
    const len = num('segLen'), ang = num('segAng');
    if (!ui.draft.length || Number.isNaN(len) || len <= 0 || Number.isNaN(ang)) return;
    dispatch({ type: 'ui/draftAdd', pt: pointFromSegment(ui.draft[ui.draft.length - 1], len, ang) });
  };
  const insertRect = () => {
    const x = num('startX'), y = num('startY'), w = num('rectW'), h = num('rectH');
    if (Number.isNaN(x) || Number.isNaN(y) || !(w > 0) || !(h > 0)) return;
    dispatch({ type: 'plan/add', shape: { id: newId(), type: tool, pts: rectPoints([round2(x), round2(y)], [round2(x + w), round2(y + h)]) } });
  };

  return (
    <Panel title={`Rysowanie: ${CATALOG[tool].label}`}>
      <Segmented<'poly' | 'rect'>
        options={[{ value: 'poly', label: 'Wielokąt' }, { value: 'rect', label: 'Prostokąt' }]}
        value={ui.mode}
        onChange={(mode) => dispatch({ type: 'ui/setMode', mode })}
        columns={2}
      />
      {ui.mode === 'poly' ? (
        <>
          <p className={p.text}>Klikaj kolejne narożniki. Zamknij kształt klikając pierwszy punkt, dwuklikiem albo przyciskiem.</p>
          <p className={cx(p.monoInfo, s.draftInfo)}>{draftInfo(state)}</p>
          {ui.draft.length === 0 ? (
            <div className={s.stack8}>
              <div className={p.grid2}>
                <StrField label="Start X (m)" {...field('startX')} />
                <StrField label="Start Y (m)" {...field('startY')} />
              </div>
              <Button onClick={addStart}>Ustaw punkt startowy</Button>
            </div>
          ) : (
            <div className={s.stack8}>
              <div className={p.grid2}>
                <StrField label="Długość (m)" {...field('segLen')} />
                <StrField label="Kąt (°)" {...field('segAng')} />
              </div>
              <p className={p.hint}>0° w prawo, 90° w górę, 180° w lewo, 270° w dół</p>
              <Button variant="outlineDraft" onClick={addSegment}>Dodaj odcinek</Button>
            </div>
          )}
          <div className={p.row}>
            <Button variant="primary" disabled={ui.draft.length < 3} onClick={() => finishDraftActions(state, newId).forEach(dispatch)}>Zamknij kształt</Button>
            <Button disabled={!ui.draft.length} onClick={() => dispatch({ type: 'ui/draftPop' })}>Cofnij punkt</Button>
            <Button disabled={!ui.draft.length} onClick={() => dispatch({ type: 'ui/draftSet', pts: [] })}>Anuluj</Button>
          </div>
        </>
      ) : (
        <>
          <p className={p.text}>Przeciągnij na planie albo wpisz wymiary i wstaw dokładnie.</p>
          <div className={p.grid2}>
            <StrField label="X (m)" {...field('startX')} />
            <StrField label="Y (m)" {...field('startY')} />
            <StrField label="Szerokość (m)" {...field('rectW')} />
            <StrField label="Głębokość (m)" {...field('rectH')} />
          </div>
          <Button variant="primary" onClick={insertRect}>Wstaw prostokąt</Button>
        </>
      )}
    </Panel>
  );
}
```

`src/ui/PlantPanel.tsx`:
```tsx
import { CATALOG, isPolyType } from '../domain/catalog';
import { useAppState } from '../state/store';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

export function PlantPanel() {
  const { ui } = useAppState();
  const tool = ui.tool;
  if (tool === 'select' || isPolyType(tool)) return null;
  return (
    <Panel title={`Sadzenie: ${CATALOG[tool].label}`}>
      <p className={p.text}>Klikaj na planie, aby posadzić. Średnicę korony i dokładną pozycję ustawisz po zaznaczeniu.</p>
    </Panel>
  );
}
```

`src/ui/GridPanel.tsx`:
```tsx
import { useAppDispatch, useAppState } from '../state/store';
import s from './panels.module.css';
import { Segmented, Toggle } from './primitives/controls';
import { NumberField } from './primitives/fields';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

const STEPS = [
  { value: 1, label: '1 m' },
  { value: 0.5, label: '0,5 m' },
  { value: 0.1, label: '0,1 m' },
  { value: 0, label: 'Wył.' },
];
const TOGGLES = [
  ['angleSnap', 'Kąty co 15° przy rysowaniu'],
  ['showDims', 'Wymiary granicy działki'],
  ['showLabels', 'Nazwy i powierzchnie'],
] as const;

export function GridPanel() {
  const { ui, doc } = useAppState();
  const dispatch = useAppDispatch();
  return (
    <Panel title="Przyciąganie do siatki">
      <Segmented<number> options={STEPS} value={ui.step} onChange={(step) => dispatch({ type: 'ui/setStep', step })} columns={4} />
      <div className={s.stack4}>
        {TOGGLES.map(([key, label]) => (
          <Toggle key={key} pressed={ui[key]} label={label} onToggle={() => dispatch({ type: 'ui/toggle', key })} />
        ))}
      </div>
      <h2 className={s.subTitle}>Obszar rysunku</h2>
      <div className={p.grid2}>
        <NumberField label="Szerokość (m)" value={doc.plan.W} onValue={(W) => dispatch({ type: 'plan/setPlotSize', W })} />
        <NumberField label="Głębokość (m)" value={doc.plan.H} onValue={(H) => dispatch({ type: 'plan/setPlotSize', H })} />
      </div>
    </Panel>
  );
}
```

- [ ] **Step 4: Uruchom testy**

Run: `npx vitest run src/ui/leftPanels.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat(ui): panele narzędzi, rysowania, sadzenia i siatki

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Prawa kolumna (Podsumowanie, Inspektory, Elementy planu)

**Files:**
- Create: `src/ui/SummaryPanel.tsx`, `src/ui/InspectorPoly.tsx`, `src/ui/InspectorPoint.tsx`, `src/ui/ElementsList.tsx`, `src/ui/RightColumn.tsx`
- Test: `src/ui/rightPanels.test.tsx`

**Interfaces:**
- Consumes: `selectSummary`, `selectSelected` (Task 8), `summaryRows` (Task 5), `area`, `perimeter`, `dist` (Task 3), `fmtArea`, `fmtLen`, `fmtNum`, `CATALOG`, `ORDER_POLY`, `ORDER_POINT`, `isPoly`, `newId` (Task 2), prymitywy (Task 9), `panels.module.css` (Task 12).
- Produces: `SummaryPanel`, `InspectorPoly({ shape: PolyShape })`, `InspectorPoint({ shape: PointShape })`, `ElementsList`, `RightColumn`. Inspektor dostaje `key={shape.id}`, więc pola resetują się przy zmianie zaznaczenia.

- [ ] **Step 1: Napisz testy (failing)**

`src/ui/rightPanels.test.tsx`:
```tsx
import { screen, within } from '@testing-library/react';
import { samplePlan } from '../domain/sample';
import type { PointShape, PolyShape } from '../domain/types';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { RightColumn } from './RightColumn';

const sample = (ui = {}) => makeState({ plan: { shapes: samplePlan().shapes }, ui });
const shape = (s: ReturnType<typeof sample>, id: string) => s.doc.plan.shapes.find((x) => x.id === id);

describe('SummaryPanel', () => {
  it('shows plot, PBC and net areas for the sample plan', () => {
    renderWithStore(<RightColumn />, sample());
    const panel = within(screen.getByRole('region', { name: 'Podsumowanie' }));
    expect(panel.getByText('508 m²')).toBeInTheDocument();
    expect(panel.getByText('72%')).toBeInTheDocument();
    expect(panel.getByText('Trawnik').nextSibling).toHaveTextContent('338 m²');
    expect(panel.getByText('Krzew').nextSibling).toHaveTextContent('3 szt.');
    expect(panel.getByText(/to, co przykrywa dom albo kostka/)).toBeInTheDocument();
  });
  it('shows dashes for an empty plan', () => {
    renderWithStore(<RightColumn />, makeState());
    expect(within(screen.getByRole('region', { name: 'Podsumowanie' })).getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Plan jest pusty. Zacznij od narzędzia „Granica działki”.')).toBeInTheDocument();
  });
});

describe('InspectorPoly', () => {
  it('shows area, perimeter and vertices; edits a vertex with one history step', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    const insp = within(screen.getByRole('region', { name: 'Zaznaczony obszar' }));
    expect(insp.getByText('88,0 m²')).toBeInTheDocument();
    expect(insp.getByText('38,00 m')).toBeInTheDocument();
    expect(insp.queryByText(/Do zamówienia/)).toBeNull();
    const x1 = insp.getByRole('textbox', { name: 'Punkt 1 X' });
    expect(x1).toHaveValue('6');
    await user.clear(x1);
    await user.type(x1, '5');
    expect((shape(getState(), 'h1') as PolyShape).pts[0]).toEqual([5, 4]);
    expect(getState().doc.past).toHaveLength(1);
  });

  it('deletes vertices down to three', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    const insp = within(screen.getByRole('region', { name: 'Zaznaczony obszar' }));
    await user.click(insp.getByRole('button', { name: 'Usuń punkt 4' }));
    expect((shape(getState(), 'h1') as PolyShape).pts).toHaveLength(3);
    for (const n of [1, 2, 3]) expect(insp.getByRole('button', { name: `Usuń punkt ${n}` })).toBeDisabled();
  });

  it('changes type, name; shows 5% reserve for paving', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    const insp = within(screen.getByRole('region', { name: 'Zaznaczony obszar' }));
    await user.click(insp.getByRole('button', { name: 'Kostka brukowa' }));
    expect(shape(getState(), 'h1')?.type).toBe('paving');
    expect(insp.getByText(/Do zamówienia z zapasem 5%/)).toHaveTextContent('92,4 m²');
    const name = insp.getByLabelText('Nazwa');
    await user.clear(name);
    await user.type(name, 'Garaż');
    expect(shape(getState(), 'h1')?.name).toBe('Garaż');
  });

  it('duplicate, remove and deselect', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    await user.click(screen.getByRole('button', { name: 'Duplikuj' }));
    expect(getState().doc.plan.shapes).toHaveLength(16);
    expect(getState().ui.sel).not.toBe('h1');
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(getState().doc.plan.shapes).toHaveLength(15);
    expect(getState().ui.sel).toBeNull();
    expect(screen.getByRole('region', { name: 'Podsumowanie' })).toBeInTheDocument();
  });

  it('Odznacz returns to the summary', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 'h1' }));
    await user.click(screen.getByRole('button', { name: 'Odznacz' }));
    expect(getState().ui.sel).toBeNull();
  });
});

describe('InspectorPoint', () => {
  it('edits crown diameter and ignores zero or negative values', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 't1' }));
    const insp = within(screen.getByRole('region', { name: 'Zaznaczona roślina' }));
    const d = insp.getByLabelText('Korona Ø (m)');
    expect(d).toHaveValue('5,6');
    await user.clear(d);
    await user.type(d, '0');
    expect((shape(getState(), 't1') as PointShape).r).toBe(2.8);
    await user.clear(d);
    await user.type(d, '-2');
    expect((shape(getState(), 't1') as PointShape).r).toBe(2.8);
    await user.clear(d);
    await user.type(d, '4');
    expect((shape(getState(), 't1') as PointShape).r).toBe(2);
  });

  it('changing type keeps a custom radius', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 't1' }));
    await user.click(screen.getByRole('button', { name: 'Iglak' }));
    expect(shape(getState(), 't1')).toMatchObject({ type: 'conifer', r: 2.8 });
  });

  it('edits position', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ sel: 't1' }));
    const x = screen.getByLabelText('X (m)');
    await user.clear(x);
    await user.type(x, '7,5');
    expect((shape(getState(), 't1') as PointShape).x).toBe(7.5);
  });
});

describe('ElementsList', () => {
  it('lists newest first and selects on click', async () => {
    const { user, getState } = renderWithStore(<RightColumn />, sample({ tool: 'grass' }));
    const list = within(screen.getByRole('region', { name: 'Elementy planu' }));
    const items = list.getAllByRole('button');
    expect(items).toHaveLength(15);
    expect(items[0]).toHaveTextContent('Krzew');
    expect(items[0]).toHaveTextContent('Ø 1,2 m');
    await user.click(list.getByRole('button', { name: /^Dom · Dom \/ budynek/ }));
    expect(getState().ui).toMatchObject({ sel: 'h1', tool: 'select' });
    expect(list.getByRole('button', { name: /^Dom · Dom \/ budynek/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
```

Run: `npx vitest run src/ui/rightPanels.test.tsx`
Expected: FAIL (brak modułów).

- [ ] **Step 2: Zaimplementuj panele**

`src/ui/SummaryPanel.tsx`:
```tsx
import { fmtArea } from '../domain/format';
import { summaryRows } from '../domain/netAreas';
import { selectSummary } from '../state/selectors';
import { useAppState } from '../state/store';
import s from './panels.module.css';
import { Panel, StatTile } from './primitives/layout';
import p from './primitives/primitives.module.css';

export function SummaryPanel() {
  const sum = selectSummary(useAppState());
  return (
    <Panel title="Podsumowanie">
      <div className={p.grid2}>
        <StatTile label="Działka" value={sum.plot ? fmtArea(sum.plot) : '—'} />
        <StatTile label="Biologicznie czynna" value={sum.pbc === null ? '—' : `${sum.pbc}%`} />
      </div>
      <div>
        {summaryRows(sum).map((r) => (
          <div key={r.key} className={s.summaryRow}>
            <span>{r.label}</span>
            <span className={s.mono}>{r.value}</span>
          </div>
        ))}
      </div>
      <p className={s.footnote}>Powierzchnie liczone są tak, jak widać je na planie: to, co przykrywa dom albo kostka, nie wlicza się do trawnika.</p>
    </Panel>
  );
}
```

`src/ui/InspectorPoly.tsx`:
```tsx
import { CATALOG, ORDER_POLY } from '../domain/catalog';
import { fmtArea, fmtLen } from '../domain/format';
import { area, dist, perimeter } from '../domain/geometry';
import { newId } from '../domain/ids';
import type { PolyShape } from '../domain/types';
import { useAppDispatch } from '../state/store';
import s from './panels.module.css';
import { Button } from './primitives/Button';
import { Chip } from './primitives/controls';
import { NumberField, TextField } from './primitives/fields';
import { GroupTitle, Panel, StatTile } from './primitives/layout';
import p from './primitives/primitives.module.css';

const WITH_RESERVE = new Set(['paving', 'gravel', 'grass']);

export function InspectorPoly({ shape }: { shape: PolyShape }) {
  const dispatch = useAppDispatch();
  const { id, pts } = shape;
  const a = area(pts);
  const checkpoint = () => dispatch({ type: 'plan/checkpoint' });
  return (
    <Panel
      title="Zaznaczony obszar"
      tone="selection"
      action={<Button size="sm" onClick={() => dispatch({ type: 'ui/select', id: null })}>Odznacz</Button>}
    >
      <TextField
        label="Nazwa"
        value={shape.name ?? ''}
        placeholder={CATALOG[shape.type].label}
        onChange={(name) => dispatch({ type: 'plan/update', id, patch: { name } })}
      />
      <div className={s.chips}>
        {ORDER_POLY.map((k) => (
          <Chip key={k} pressed={k === shape.type} onClick={() => dispatch({ type: 'plan/setType', id, shapeType: k })}>
            {CATALOG[k].label}
          </Chip>
        ))}
      </div>
      <div className={p.grid2}>
        <StatTile small label="Powierzchnia" value={fmtArea(a)} />
        <StatTile small label="Obwód" value={fmtLen(perimeter(pts))} />
      </div>
      {WITH_RESERVE.has(shape.type) && (
        <p className={s.reserve}>Do zamówienia z zapasem 5%: <strong>{fmtArea(a * 1.05)}</strong></p>
      )}
      <div>
        <GroupTitle>Wierzchołki (m) · przeciągnij na planie lub wpisz</GroupTitle>
        <div className={s.stack4}>
          {pts.map((pt, i) => (
            <div key={i} className={s.vertexRow}>
              <span className={s.vertexNum}>{i + 1}</span>
              <NumberField hideLabel variant="row" label={`Punkt ${i + 1} X`} value={pt[0]} onBeginEdit={checkpoint}
                onValue={(x) => dispatch({ type: 'plan/moveVertex', id, index: i, pt: [x, pt[1]] })} />
              <NumberField hideLabel variant="row" label={`Punkt ${i + 1} Y`} value={pt[1]} onBeginEdit={checkpoint}
                onValue={(y) => dispatch({ type: 'plan/moveVertex', id, index: i, pt: [pt[0], y] })} />
              <button type="button" className={s.vertexDel} aria-label={`Usuń punkt ${i + 1}`} disabled={pts.length <= 3}
                onClick={() => dispatch({ type: 'plan/deleteVertex', id, index: i })}>×</button>
            </div>
          ))}
        </div>
        <p className={p.hint}>Dwuklik na krawędzi dodaje nowy wierzchołek.</p>
      </div>
      <div>
        <GroupTitle>Długości boków</GroupTitle>
        {pts.map((pt, i) => {
          const j = (i + 1) % pts.length;
          return (
            <div key={i} className={s.edgeRow}>
              <span className={s.edgeNum}>{i + 1}–{j + 1}</span>
              <span>{fmtLen(dist(pt, pts[j]))}</span>
            </div>
          );
        })}
      </div>
      <div className={p.grid2}>
        <Button onClick={() => dispatch({ type: 'plan/duplicate', id, newId: newId() })}>Duplikuj</Button>
        <Button variant="danger" onClick={() => dispatch({ type: 'plan/remove', id })}>Usuń</Button>
      </div>
    </Panel>
  );
}
```

`src/ui/InspectorPoint.tsx`:
```tsx
import { CATALOG, ORDER_POINT } from '../domain/catalog';
import { newId } from '../domain/ids';
import type { PointShape } from '../domain/types';
import { useAppDispatch } from '../state/store';
import s from './panels.module.css';
import { Button } from './primitives/Button';
import { Chip } from './primitives/controls';
import { NumberField, TextField } from './primitives/fields';
import { Panel } from './primitives/layout';
import p from './primitives/primitives.module.css';

export function InspectorPoint({ shape }: { shape: PointShape }) {
  const dispatch = useAppDispatch();
  const { id } = shape;
  const checkpoint = () => dispatch({ type: 'plan/checkpoint' });
  return (
    <Panel
      title="Zaznaczona roślina"
      tone="selection"
      action={<Button size="sm" onClick={() => dispatch({ type: 'ui/select', id: null })}>Odznacz</Button>}
    >
      <TextField
        label="Nazwa / gatunek"
        value={shape.name ?? ''}
        placeholder={CATALOG[shape.type].label}
        onChange={(name) => dispatch({ type: 'plan/update', id, patch: { name } })}
      />
      <div className={s.chips}>
        {ORDER_POINT.map((k) => (
          <Chip key={k} pressed={k === shape.type} onClick={() => dispatch({ type: 'plan/setType', id, shapeType: k })}>
            {CATALOG[k].label}
          </Chip>
        ))}
      </div>
      <div className={p.grid3}>
        <NumberField label="X (m)" value={shape.x} onBeginEdit={checkpoint} onValue={(x) => dispatch({ type: 'plan/update', id, patch: { x } })} />
        <NumberField label="Y (m)" value={shape.y} onBeginEdit={checkpoint} onValue={(y) => dispatch({ type: 'plan/update', id, patch: { y } })} />
        <NumberField
          label="Korona Ø (m)"
          value={shape.r * 2}
          onBeginEdit={checkpoint}
          onValue={(d) => {
            if (d > 0) dispatch({ type: 'plan/update', id, patch: { r: d / 2 } });
          }}
        />
      </div>
      <div className={p.grid2}>
        <Button onClick={() => dispatch({ type: 'plan/duplicate', id, newId: newId() })}>Duplikuj</Button>
        <Button variant="danger" onClick={() => dispatch({ type: 'plan/remove', id })}>Usuń</Button>
      </div>
    </Panel>
  );
}
```

`src/ui/ElementsList.tsx`:
```tsx
import { CATALOG, isPoly } from '../domain/catalog';
import { fmtArea, fmtNum } from '../domain/format';
import { area } from '../domain/geometry';
import { useAppDispatch, useAppState } from '../state/store';
import s from './panels.module.css';
import { Panel } from './primitives/layout';

export function ElementsList() {
  const { doc, ui } = useAppState();
  const dispatch = useAppDispatch();
  const shapes = doc.plan.shapes;
  return (
    <Panel title="Elementy planu">
      {shapes.length === 0 ? (
        <p className={s.empty}>Plan jest pusty. Zacznij od narzędzia „Granica działki”.</p>
      ) : (
        <div className={s.stack4}>
          {[...shapes].reverse().map((sh) => {
            const label = CATALOG[sh.type].label;
            return (
              <button key={sh.id} type="button" className={s.elItem} aria-pressed={ui.sel === sh.id}
                onClick={() => dispatch({ type: 'ui/pickElement', id: sh.id })}>
                <span>{sh.name ? `${sh.name} · ${label}` : label}</span>
                <span className={s.elSub}>{isPoly(sh) ? fmtArea(area(sh.pts)) : `Ø ${fmtNum(sh.r * 2)} m`}</span>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
```

`src/ui/RightColumn.tsx`:
```tsx
import { isPoly } from '../domain/catalog';
import { selectSelected } from '../state/selectors';
import { useAppState } from '../state/store';
import { ElementsList } from './ElementsList';
import { InspectorPoint } from './InspectorPoint';
import { InspectorPoly } from './InspectorPoly';
import { SummaryPanel } from './SummaryPanel';

export function RightColumn() {
  const sel = selectSelected(useAppState());
  return (
    <>
      {!sel && <SummaryPanel />}
      {sel && isPoly(sel) && <InspectorPoly key={sel.id} shape={sel} />}
      {sel && !isPoly(sel) && <InspectorPoint key={sel.id} shape={sel} />}
      <ElementsList />
    </>
  );
}
```

- [ ] **Step 3: Uruchom testy**

Run: `npx vitest run src/ui/rightPanels.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/ui
git commit -m "feat(ui): podsumowanie, inspektory obszaru i rośliny, lista elementów

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Podkład: wczytanie mapki, kalibracja, ustawienia

**Files:**
- Create: `src/domain/background.ts`, `src/io/readImage.ts`, `src/ui/BackgroundPanel.tsx`
- Test: `src/domain/background.test.ts`, `src/ui/BackgroundPanel.test.tsx`

**Interfaces:**
- Consumes: `dist` (Task 3), `round2`, `fmtLen`, `parseNum`, `PLOT_MAX` (Task 2), `calibInfo` (Task 10), prymitywy (Task 9), `panels.module.css` (Task 12).
- Produces: `fitBackgroundWidth(W, H, aspect): number`, `newBackground(src, aspect, W, H): Background`, `applyCalibration(bg, calib: Pt[], real: number, W, H): { bg: Background; W: number; H: number } | null`, `readImageFile(file: File): Promise<{ src: string; aspect: number }>`, `BackgroundPanel`.

- [ ] **Step 1: Napisz testy (failing)**

`src/domain/background.test.ts`:
```ts
import { applyCalibration, fitBackgroundWidth, newBackground } from './background';

const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 20, aspect: 0.5, opacity: 0.6, visible: true };

describe('background', () => {
  it('fits the image into the drawing area', () => {
    expect(fitBackgroundWidth(30, 22, 0.5)).toBe(30);
    expect(fitBackgroundWidth(30, 22, 1)).toBe(22);
    expect(fitBackgroundWidth(30, 22, 3)).toBe(7.333);
    expect(newBackground('data:image/png;base64,A', 1, 30, 22)).toEqual({ src: 'data:image/png;base64,A', x: 0, y: 0, w: 22, aspect: 1, opacity: 0.6, visible: true });
  });

  it('scales around the first point and grows the drawing area', () => {
    const r = applyCalibration(bg, [[0, 0], [10, 0]], 25, 30, 22);
    expect(r).toEqual({ bg: { ...bg, w: 50, x: 0, y: 0 }, W: 50, H: 25 });
  });

  it('keeps the first point fixed, clamping position at 0', () => {
    const r = applyCalibration({ ...bg, x: 2, y: 2 }, [[4, 2], [6, 2]], 1, 30, 22);
    expect(r?.bg).toMatchObject({ w: 10, x: 3, y: 2 });
    const r2 = applyCalibration(bg, [[4, 2], [6, 2]], 4, 30, 22);
    expect(r2?.bg).toMatchObject({ w: 40, x: 0, y: 0 });
  });

  it('caps the drawing area at 500 m', () => {
    const r = applyCalibration(bg, [[0, 0], [1, 0]], 100, 30, 22);
    expect(r?.W).toBe(500);
    expect(r?.H).toBe(500);
  });

  it('returns null for degenerate input instead of NaN/Infinity', () => {
    expect(applyCalibration(bg, [[3, 3], [3, 3]], 10, 30, 22)).toBeNull();
    expect(applyCalibration(bg, [[0, 0], [1, 0]], 0, 30, 22)).toBeNull();
    expect(applyCalibration(bg, [[0, 0], [1, 0]], NaN, 30, 22)).toBeNull();
    expect(applyCalibration(bg, [[0, 0]], 10, 30, 22)).toBeNull();
  });
});
```

`src/ui/BackgroundPanel.test.tsx`:
```tsx
import { fireEvent, screen } from '@testing-library/react';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { BackgroundPanel } from './BackgroundPanel';

const bg = { src: 'data:image/png;base64,A', x: 0, y: 0, w: 20, aspect: 0.5, opacity: 0.6, visible: true };

describe('BackgroundPanel', () => {
  it('without a map offers loading it', () => {
    renderWithStore(<BackgroundPanel />, makeState());
    expect(screen.getByLabelText('Wczytaj mapkę (JPG, PNG)')).toBeInTheDocument();
    expect(screen.getByText('Masz PDF? Zrób zrzut ekranu albo zapisz stronę jako obraz.')).toBeInTheDocument();
  });

  it('toggles calibration and move modes', async () => {
    const { user, getState } = renderWithStore(<BackgroundPanel />, makeState({ plan: { bg } }));
    await user.click(screen.getByRole('button', { name: 'Kalibruj skalę' }));
    expect(getState().ui.bgMode).toBe('calib');
    expect(screen.getByText('Kliknij pierwszy punkt na mapce')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Przesuń mapkę' }));
    expect(getState().ui.bgMode).toBe('move');
    expect(screen.getByRole('button', { name: 'Przesuń mapkę' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies calibration', async () => {
    const { user, getState } = renderWithStore(<BackgroundPanel />, makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[0, 0], [10, 0]] } }));
    const apply = screen.getByRole('button', { name: 'Zastosuj skalę' });
    expect(apply).toBeDisabled();
    await user.type(screen.getByLabelText('Rzeczywista odległość (m)'), '25');
    await user.click(apply);
    const s = getState();
    expect(s.doc.plan.bg?.w).toBe(50);
    expect(s.doc.plan).toMatchObject({ W: 50, H: 25 });
    expect(s.ui.bgMode).toBeNull();
    expect(s.ui.notice?.msg).toBe('Skala ustawiona: mapka ma teraz 50,00 m szerokości. Możesz obrysować granice narzędziem „Granica działki”.');
  });

  it('calibration with two identical points changes nothing', async () => {
    const { user, getState } = renderWithStore(<BackgroundPanel />, makeState({ plan: { bg }, ui: { bgMode: 'calib', calib: [[3, 3], [3, 3]], calibLen: '10' } }));
    await user.click(screen.getByRole('button', { name: 'Zastosuj skalę' }));
    expect(getState().doc.plan.bg).toEqual(bg);
    expect(getState().ui.bgMode).toBe('calib');
  });

  it('opacity, width, visibility and removal', async () => {
    const { user, getState } = renderWithStore(<BackgroundPanel />, makeState({ plan: { bg } }));
    fireEvent.change(screen.getByLabelText(/Widoczność mapki/), { target: { value: '30' } });
    expect(getState().doc.plan.bg?.opacity).toBe(0.3);
    expect(screen.getByText('Widoczność mapki: 30%', { exact: false })).toBeInTheDocument();

    const w = screen.getByLabelText('Szer. (m)');
    await user.clear(w);
    await user.type(w, '0');
    expect(getState().doc.plan.bg?.w).toBe(20);
    await user.clear(w);
    await user.type(w, '15');
    expect(getState().doc.plan.bg?.w).toBe(15);

    await user.click(screen.getByRole('button', { name: 'Ukryj' }));
    expect(getState().doc.plan.bg?.visible).toBe(false);
    expect(screen.getByRole('button', { name: 'Pokaż' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(getState().doc.plan.bg).toBeNull();
    expect(getState().ui.notice?.msg).toBe('Mapka usunięta z planu.');
  });
});
```

Run: `npx vitest run src/domain/background.test.ts src/ui/BackgroundPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Zaimplementuj `src/domain/background.ts`**

```ts
import { PLOT_MAX } from './catalog';
import { round2 } from './format';
import { dist } from './geometry';
import type { Background, Pt } from './types';

export function fitBackgroundWidth(W: number, H: number, aspect: number): number {
  let bw = W;
  if (bw * aspect > H) bw = H / aspect;
  return Math.round(bw * 1000) / 1000;
}

export function newBackground(src: string, aspect: number, W: number, H: number): Background {
  return { src, x: 0, y: 0, w: fitBackgroundWidth(W, H, aspect), aspect, opacity: 0.6, visible: true };
}

export function applyCalibration(bg: Background, calib: Pt[], real: number, W: number, H: number): { bg: Background; W: number; H: number } | null {
  if (calib.length < 2 || !(real > 0)) return null;
  const [p, q] = calib;
  const measured = dist(p, q);
  if (measured < 1e-6) return null;
  const f = real / measured;
  const nb: Background = {
    ...bg,
    w: Math.round(bg.w * f * 10000) / 10000,
    x: Math.max(0, round2(p[0] - (p[0] - bg.x) * f)),
    y: Math.max(0, round2(p[1] - (p[1] - bg.y) * f)),
  };
  return {
    bg: nb,
    W: Math.min(PLOT_MAX, Math.max(W, Math.ceil(nb.x + nb.w))),
    H: Math.min(PLOT_MAX, Math.max(H, Math.ceil(nb.y + nb.w * nb.aspect))),
  };
}
```

Kontrola testu „keeps the first point fixed”: bg x=2, punkty (4,2)–(6,2) to 2 m na mapce, rzeczywiście 1 m, więc f = 0,5. w = 20·0,5 = 10. x = 4 − (4−2)·0,5 = 3. y = 2 − (2−2)·0,5 = 2.

- [ ] **Step 3: Zaimplementuj `src/io/readImage.ts`**

```ts
const MAX_SIDE = 2400;
const MAX_BYTES = 1_500_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('read'));
    fr.readAsDataURL(file);
  });
}

function decode(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });
}

/** Wczytuje obraz; duże pliki pomniejsza do 2400 px i zapisuje jako JPEG 0,86 na białym tle (PRD F-6.1). */
export async function readImageFile(file: File): Promise<{ src: string; aspect: number }> {
  const dataUrl = await readAsDataUrl(file);
  const img = await decode(dataUrl);
  const nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh) throw new Error('decode');
  const k = Math.min(1, MAX_SIDE / Math.max(nw, nh));
  let src = dataUrl;
  if (k < 1 || file.size > MAX_BYTES) {
    try {
      const c = document.createElement('canvas');
      c.width = Math.round(nw * k);
      c.height = Math.round(nh * k);
      const g = c.getContext('2d');
      if (g) {
        g.fillStyle = '#FFFFFF';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        src = c.toDataURL('image/jpeg', 0.86);
      }
    } catch {
      /* zostaje oryginał */
    }
  }
  return { src, aspect: nh / nw };
}
```

(`#FFFFFF` to tło pliku JPEG, a nie kolor interfejsu. Prototyp robi tak samo.)

- [ ] **Step 4: Zaimplementuj `src/ui/BackgroundPanel.tsx`**

```tsx
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
```

- [ ] **Step 5: Uruchom testy**

Run: `npx vitest run src/domain/background.test.ts src/ui/BackgroundPanel.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/background.ts src/domain/background.test.ts src/io src/ui/BackgroundPanel.tsx src/ui/BackgroundPanel.test.tsx
git commit -m "feat: podkład z mapką, kalibracja skali i ustawienia mapki

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Pliki, eksport PNG, nagłówek i komunikaty

**Files:**
- Create: `src/io/readText.ts`, `src/export/download.ts`, `src/export/exportPng.ts`, `src/ui/chrome.module.css`, `src/ui/Header.tsx`, `src/ui/Notice.tsx`
- Test: `src/export/exportPng.test.ts`, `src/ui/Header.test.tsx`

**Interfaces:**
- Consumes: `serializePlan`, `parsePlan` (Task 6), `newId`, `dateStamp`, `fmtArea`, `fmtLen`, `CATALOG`, `isPoly` (Task 2), geometria (Task 3), `polyStyle`, `pointStyle` (Task 10), `tokens`, `color`, `exportTokens`, `canvasTokens` (Task 1), `canUndo` (Task 8), `Notice` type (Task 8), prymitywy i ikony (Task 9).
- Produces: `readFileText(file): Promise<string>`, `makeDownload(blob, name): { url; name }`, `exportScale(W, H): number`, `drawPlan(g, plan, img, S, width, height, date?): void`, `renderPlanPng(plan): Promise<Blob>`, komponenty `Header` i `Notice`.

- [ ] **Step 1: Napisz testy (failing)**

`src/export/exportPng.test.ts`:
```ts
import { samplePlan } from '../domain/sample';
import { drawPlan, exportScale } from './exportPng';

function fakeCtx() {
  const texts: string[] = [];
  const target: Record<string | symbol, unknown> = {};
  const ctx = new Proxy(target, {
    get(t, k) {
      if (k === 'fillText') return (s: string) => texts.push(s);
      if (k === 'measureText') return (s: string) => ({ width: s.length * 7 });
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, texts };
}

describe('exportScale', () => {
  it('targets ~6000 px on the long side within 10–60 px/m', () => {
    expect(exportScale(30, 22)).toBe(60);
    expect(exportScale(200, 100)).toBe(30);
    expect(exportScale(500, 10)).toBe(12);
  });
});

describe('drawPlan', () => {
  it('draws labels, boundary dimensions, footer and scale bar', () => {
    const { ctx, texts } = fakeCtx();
    drawPlan(ctx, samplePlan(), null, 60, 1912, 1462, '2026-10-05');
    expect(texts).toContain('Plan ogrodu · działka 508 m² · 2026-10-05');
    expect(texts).toContain('26,50 m');
    expect(texts).toContain('Dom');
    expect(texts).toContain('88,0 m²');
    expect(texts).toContain('Klon');
    expect(texts).toContain('5 m');
    expect(texts).toContain('30');
  });
  it('omits the plot area in the footer when there is no boundary', () => {
    const { ctx, texts } = fakeCtx();
    drawPlan(ctx, { W: 10, H: 10, shapes: [], bg: null }, null, 60, 712, 742, '2026-10-05');
    expect(texts).toContain('Plan ogrodu · 2026-10-05');
  });
});
```

`src/ui/Header.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { samplePlan } from '../domain/sample';
import { makeState } from '../test/factories';
import { renderWithStore } from '../test/renderWithStore';
import { Header } from './Header';
import { Notice } from './Notice';

const fixture = readFileSync('tests/fixtures/prototype-sample.json', 'utf8');
const json = (text: string, name: string) => new File([text], name, { type: 'application/json' });
const setup = () =>
  renderWithStore(<><Header /><Notice /></>, makeState({ plan: { shapes: samplePlan().shapes } }));

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('Header', () => {
  it('shows the title and subtitle', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Planer ogrodu' })).toBeInTheDocument();
    expect(screen.getByText('Rysuj w metrach: granice działki, budynki, nawierzchnie i rośliny')).toBeInTheDocument();
  });

  it('Nowy plan can be undone', async () => {
    const { user, getState } = setup();
    expect(screen.getByRole('button', { name: 'Cofnij' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Nowy plan' }));
    expect(getState().doc.plan.shapes).toEqual([]);
    expect(getState().ui.tool).toBe('boundary');
    await user.click(screen.getByRole('button', { name: 'Cofnij' }));
    expect(getState().doc.plan.shapes).toHaveLength(15);
  });

  it('saves a JSON file and offers a download link', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Zapisz plik' }));
    expect(screen.getByRole('status')).toHaveTextContent('Plan zapisany. Otworzysz go później przyciskiem „Otwórz plik”.');
    const link = screen.getByRole('link', { name: /^Pobierz plan-ogrodu-\d{4}-\d{2}-\d{2}\.json$/ });
    expect(link).toHaveAttribute('href', 'blob:test');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Zamknij komunikat' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('opens a plan file; undo restores the previous plan', async () => {
    const { user, getState } = setup();
    await user.click(screen.getByRole('button', { name: 'Nowy plan' }));
    await user.upload(screen.getByLabelText('Otwórz plik'), json(fixture, 'plan.json'));
    expect(await screen.findByText('Wczytano „plan.json”: 15 elementów.')).toBeInTheDocument();
    expect(getState().doc.plan.shapes).toHaveLength(15);
    await user.click(screen.getByRole('button', { name: 'Cofnij' }));
    expect(getState().doc.plan.shapes).toEqual([]);
  });

  it('reports a broken file and keeps the plan', async () => {
    const { user, getState } = setup();
    await user.upload(screen.getByLabelText('Otwórz plik'), json('nie json', 'zly.json'));
    expect(await screen.findByText('Nie udało się wczytać pliku „zly.json”: to nie jest plik planu ogrodu.')).toBeInTheDocument();
    expect(getState().doc.plan.shapes).toHaveLength(15);
  });

  it('reports PNG export failure', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Eksport PNG' }));
    expect(await screen.findByText('Nie udało się utworzyć obrazu.')).toBeInTheDocument();
  });

  it('loads the sample plan', async () => {
    const { user, getState } = renderWithStore(<Header />, makeState({ plan: { W: 80 } }));
    await user.click(screen.getByRole('button', { name: 'Przykładowy plan' }));
    expect(getState().doc.plan).toMatchObject({ W: 30, H: 22 });
    expect(getState().doc.plan.shapes).toHaveLength(15);
  });
});
```

Run: `npx vitest run src/export src/ui/Header.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Zaimplementuj I/O i eksport**

`src/io/readText.ts`:
```ts
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('read'));
    fr.readAsText(file);
  });
}
```

`src/export/download.ts`:
```ts
let lastUrl: string | null = null;

/** Tworzy URL do pobrania; poprzedni zwalnia po 30 s (link w komunikacie może jeszcze być kliknięty). */
export function makeDownload(blob: Blob, name: string): { url: string; name: string } {
  if (lastUrl) {
    const old = lastUrl;
    setTimeout(() => {
      try {
        URL.revokeObjectURL(old);
      } catch {
        /* już zwolniony */
      }
    }, 30_000);
  }
  lastUrl = URL.createObjectURL(blob);
  return { url: lastUrl, name };
}
```

`src/export/exportPng.ts` (port prototypu, linie 634–701):
```ts
import { pointStyle, polyStyle } from '../canvas/materialStyle';
import { canvasTokens, color, exportTokens, tokens } from '../design/tokens';
import { CATALOG, isPoly } from '../domain/catalog';
import { dateStamp, fmtArea, fmtLen } from '../domain/format';
import { area, bbox, centroid, dist } from '../domain/geometry';
import type { Plan, Pt } from '../domain/types';

export function exportScale(W: number, H: number): number {
  const p = exportTokens.pxPerMeter;
  return Math.max(p.min, Math.min(p.max, Math.floor(p.targetLongSidePx / Math.max(W, H))));
}

const gridMinor = tokens.color.grid.minor.value;
const gridMajor = tokens.color.grid.major.value.replace(/[\d.]+\)$/, `${exportTokens.gridMajorAlpha})`);
const [LABEL_MIN_W, LABEL_MIN_H] = canvasTokens.labelMinBoxPx;

export function drawPlan(g: CanvasRenderingContext2D, plan: Plan, img: HTMLImageElement | null, S: number, width: number, height: number, date: string = dateStamp()): void {
  const pad = exportTokens.margin;
  const { W, H, shapes, bg } = plan;
  const ink = color('text');

  const path = (pts: Pt[]) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p[0] * S, p[1] * S) : g.moveTo(p[0] * S, p[1] * S)));
    g.closePath();
  };
  const tag = (text: string, sub: string, x: number, y: number) => {
    g.font = exportTokens.fontLabel;
    const w1 = g.measureText(text).width;
    g.font = exportTokens.fontSub;
    const w2 = sub ? g.measureText(sub).width : 0;
    const w = Math.max(w1, w2) + 12, h = sub ? 36 : 20;
    g.fillStyle = color('labelBg');
    g.fillRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = exportTokens.fontLabel;
    g.fillText(text, x, sub ? y - 8 : y);
    if (sub) {
      g.font = exportTokens.fontSub;
      g.fillStyle = color('textSecondary');
      g.fillText(sub, x, y + 9);
    }
  };

  g.fillStyle = color('stage');
  g.fillRect(0, 0, width, height);
  g.save();
  g.translate(pad, pad);

  g.lineWidth = 1;
  for (let x = 0; x <= W; x++) {
    g.strokeStyle = x % 5 ? gridMinor : gridMajor;
    g.beginPath();
    g.moveTo(x * S + 0.5, 0);
    g.lineTo(x * S + 0.5, H * S);
    g.stroke();
  }
  for (let y = 0; y <= H; y++) {
    g.strokeStyle = y % 5 ? gridMinor : gridMajor;
    g.beginPath();
    g.moveTo(0, y * S + 0.5);
    g.lineTo(W * S, y * S + 0.5);
    g.stroke();
  }
  g.fillStyle = color('textMuted');
  g.font = '11px monospace';
  g.textAlign = 'center';
  g.textBaseline = 'bottom';
  for (let x = 0; x <= W; x += 5) g.fillText(String(x), x * S, -6);
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  for (let y = 0; y <= H; y += 5) g.fillText(String(y), -8, y * S);

  if (img && bg) {
    g.globalAlpha = bg.opacity;
    g.drawImage(img, bg.x * S, bg.y * S, bg.w * S, bg.w * bg.aspect * S);
    g.globalAlpha = 1;
  }

  const ordered = shapes
    .map((sh, i) => ({ sh, i }))
    .sort((a, b) => CATALOG[a.sh.type].z - CATALOG[b.sh.type].z || a.i - b.i)
    .map((o) => o.sh);
  g.lineJoin = 'round';
  for (const sh of ordered) {
    if (isPoly(sh)) {
      if (sh.type === 'boundary') continue;
      const st = polyStyle(sh.type);
      path(sh.pts);
      g.fillStyle = st.solid;
      g.fill();
      g.strokeStyle = st.stroke;
      g.lineWidth = st.sw;
      g.stroke();
    } else {
      const st = pointStyle(sh.type);
      g.beginPath();
      g.arc(sh.x * S, sh.y * S, sh.r * S, 0, Math.PI * 2);
      g.fillStyle = st.fill;
      g.fill();
      g.strokeStyle = st.stroke;
      g.lineWidth = 1.5;
      g.stroke();
    }
  }

  const bst = polyStyle('boundary');
  const dash = bst.dash.split(' ').map(Number);
  for (const sh of shapes) {
    if (!isPoly(sh) || sh.type !== 'boundary') continue;
    path(sh.pts);
    g.setLineDash(dash);
    g.strokeStyle = bst.stroke;
    g.lineWidth = bst.sw;
    g.stroke();
    g.setLineDash([]);
    for (let i = 0; i < sh.pts.length; i++) {
      const a = sh.pts[i], b = sh.pts[(i + 1) % sh.pts.length], len = dist(a, b);
      if (len * S < canvasTokens.edgeLabelMinPx) continue;
      g.font = '11px monospace';
      const txt = fmtLen(len), w = g.measureText(txt).width + 10;
      const mx = ((a[0] + b[0]) / 2) * S, my = ((a[1] + b[1]) / 2) * S;
      g.fillStyle = color('danger');
      g.fillRect(mx - w / 2, my - 9, w, 18);
      g.fillStyle = color('onAccent');
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(txt, mx, my);
    }
  }

  for (const sh of ordered) {
    if (isPoly(sh)) {
      if (sh.type === 'boundary') continue;
      const b = bbox(sh.pts);
      if ((b[2] - b[0]) * S < LABEL_MIN_W || (b[3] - b[1]) * S < LABEL_MIN_H) continue;
      const c = centroid(sh.pts);
      tag(sh.name || CATALOG[sh.type].label, fmtArea(area(sh.pts)), c[0] * S, c[1] * S);
    } else if (sh.name) {
      tag(sh.name, '', sh.x * S, sh.y * S);
    }
  }
  g.restore();

  let plot = 0;
  for (const sh of shapes) if (isPoly(sh) && sh.type === 'boundary') plot += area(sh.pts);
  const by = height - 26;
  g.fillStyle = ink;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = exportTokens.fontFooter;
  g.fillText('Plan ogrodu' + (plot ? ' · działka ' + fmtArea(plot) : '') + ' · ' + date, pad, by);
  const bar = exportTokens.scaleBarM * S, bx = width - pad - bar;
  g.strokeStyle = ink;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(bx, by - 6);
  g.lineTo(bx, by + 2);
  g.lineTo(bx + bar, by + 2);
  g.lineTo(bx + bar, by - 6);
  g.stroke();
  g.font = exportTokens.fontSub;
  g.textAlign = 'right';
  g.fillText(`${exportTokens.scaleBarM} m`, bx - 8, by);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

export async function renderPlanPng(plan: Plan): Promise<Blob> {
  const S = exportScale(plan.W, plan.H), pad = exportTokens.margin;
  const c = document.createElement('canvas');
  c.width = Math.round(plan.W * S) + pad * 2;
  c.height = Math.round(plan.H * S) + pad * 2 + exportTokens.footerHeight;
  const g = c.getContext('2d');
  if (!g) throw new Error('Brak kontekstu 2D');
  const img = plan.bg && plan.bg.visible ? await loadImage(plan.bg.src) : null;
  drawPlan(g, plan, img, S, c.width, c.height);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}
```

- [ ] **Step 3: Zaimplementuj `chrome.module.css`, `Notice.tsx`, `Header.tsx`**

`src/ui/chrome.module.css`:
```css
.header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; background: var(--color-surface); border-bottom: 1px solid var(--color-border); }
.brand { display: flex; align-items: center; gap: 12px; }
.title { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
.subtitle { margin: 0; font-size: 13px; color: var(--color-text-muted); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.sep { width: 1px; height: 28px; background: var(--color-border); }
.notice { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 16px 16px 0; padding: 10px 14px; border: 1px solid var(--color-notice-border); border-radius: var(--radius-xl); background: var(--color-notice); font-size: 14px; color: var(--color-text); }
.noticeMsg { flex: 1 1 260px; }
.noticeLink { color: var(--color-on-accent); }
.noticeLink:hover { color: var(--color-on-accent); }
```

`src/ui/Notice.tsx`:
```tsx
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
```

`src/ui/Header.tsx`:
```tsx
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
```

- [ ] **Step 4: Uruchom testy**

Run: `npx vitest run src/export src/ui/Header.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/io src/export src/ui
git commit -m "feat: zapis i odczyt pliku, eksport PNG, nagłówek i komunikaty

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Złożenie aplikacji i testy end-to-end

**Files:**
- Modify: `src/App.tsx` (zastępuje wersję tymczasową z Task 1)
- Create: `src/App.module.css`, `playwright.config.ts`, `tests/e2e/planer.spec.ts`
- Test: `src/App.test.tsx`, `tests/e2e/planer.spec.ts`

**Interfaces:**
- Consumes: wszystkie komponenty (Tasks 9–15), `AppProvider` (Task 8).
- Produces: działająca aplikacja (`npm run dev`, `npm run build`) i zestaw e2e (`npm run e2e`).

- [ ] **Step 1: Test złożenia (failing)**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the full layout with the sample plan', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Planer ogrodu' })).toBeInTheDocument();
    for (const name of ['Narzędzia', 'Podkład: mapka działki', 'Przyciąganie do siatki', 'Podsumowanie', 'Elementy planu']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('group', { name: 'Plan ogrodu' })).toBeInTheDocument();
    expect(screen.getByText('Rabata bylinowa · Rabata')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (tymczasowy `App` nie ma tych regionów).

- [ ] **Step 2: Zaimplementuj `App.tsx` i `App.module.css`**

`src/App.module.css`:
```css
.app { min-height: 100vh; display: flex; flex-direction: column; }
.main { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 16px; padding: 16px; }
.left { flex: 1 1 240px; max-width: 100%; display: flex; flex-direction: column; gap: 12px; }
.right { flex: 1 1 280px; max-width: 100%; display: flex; flex-direction: column; gap: 12px; }
```

`src/App.tsx`:
```tsx
import s from './App.module.css';
import { PlanView } from './canvas/PlanView';
import { AppProvider } from './state/store';
import { BackgroundPanel } from './ui/BackgroundPanel';
import { DrawPanel } from './ui/DrawPanel';
import { GridPanel } from './ui/GridPanel';
import { Header } from './ui/Header';
import { Notice } from './ui/Notice';
import { PlantPanel } from './ui/PlantPanel';
import { RightColumn } from './ui/RightColumn';
import { ToolsPanel } from './ui/ToolsPanel';

export function App() {
  return (
    <AppProvider>
      <div className={s.app}>
        <Header />
        <Notice />
        <main className={s.main}>
          <aside className={s.left}>
            <ToolsPanel />
            <DrawPanel />
            <PlantPanel />
            <BackgroundPanel />
            <GridPanel />
          </aside>
          <PlanView />
          <aside className={s.right}>
            <RightColumn />
          </aside>
        </main>
      </div>
    </AppProvider>
  );
}
```

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 3: Konfiguracja Playwright i testy e2e**

Run: `npx playwright install chromium`

`playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:5173', viewport: { width: 1440, height: 1000 }, browserName: 'chromium' },
  webServer: { command: 'npx vite --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
});
```

`tests/e2e/planer.spec.ts`:
```ts
import { expect, test, type Page } from '@playwright/test';

const SCALE = 28;
const PNG_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function stageBox(page: Page) {
  const box = await page.getByRole('group', { name: 'Plan ogrodu' }).boundingBox();
  if (!box) throw new Error('Brak planu na stronie');
  return box;
}
async function clickAt(page: Page, x: number, y: number) {
  const b = await stageBox(page);
  await page.mouse.click(b.x + x * SCALE, b.y + y * SCALE);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('rysowanie granicy działki kliknięciami', async ({ page }) => {
  await page.getByRole('button', { name: 'Nowy plan' }).click();
  for (const [x, y] of [[2, 2], [12, 2], [12, 10], [2, 10]]) await clickAt(page, x, y);
  await clickAt(page, 2, 2);
  const insp = page.getByRole('region', { name: 'Zaznaczony obszar' });
  await expect(insp.getByText('80,0 m²')).toBeVisible();
  await insp.getByRole('button', { name: 'Odznacz' }).click();
  await expect(page.getByRole('region', { name: 'Podsumowanie' }).getByText('80,0 m²')).toBeVisible();
});

test('kalibracja mapki po dwóch punktach', async ({ page }) => {
  await page.getByLabel('Wczytaj mapkę (JPG, PNG)').setInputFiles({ name: 'mapa.png', mimeType: 'image/png', buffer: Buffer.from(PNG_1x1, 'base64') });
  await expect(page.getByText('Mapka wczytana.', { exact: false })).toBeVisible();
  await clickAt(page, 1, 2);
  await clickAt(page, 21, 2);
  await page.getByLabel('Rzeczywista odległość (m)').fill('40');
  await page.getByRole('button', { name: 'Zastosuj skalę' }).click();
  await expect(page.getByText('Skala ustawiona', { exact: false })).toBeVisible();
  const width = Number((await page.getByLabel('Szer. (m)').inputValue()).replace(',', '.'));
  expect(width).toBeGreaterThan(43.5);
  expect(width).toBeLessThan(44.5);
});

test('zapis i ponowne otwarcie pliku', async ({ page }) => {
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Zapisz plik' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^plan-ogrodu-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();
  await page.getByRole('button', { name: 'Nowy plan' }).click();
  const list = page.getByRole('region', { name: 'Elementy planu' });
  await expect(list.getByText('Plan jest pusty.', { exact: false })).toBeVisible();
  await page.getByLabel('Otwórz plik').setInputFiles(path);
  await expect(page.getByText(/Wczytano „.+”: 15 elementów\./)).toBeVisible();
  await expect(list.getByRole('button')).toHaveCount(15);
});

test('eksport PNG pobiera obraz', async ({ page }) => {
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksport PNG' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^plan-ogrodu-\d{4}-\d{2}-\d{2}\.png$/);
});

test('przesunięcie domu i cofnięcie', async ({ page }) => {
  const b = await stageBox(page);
  await page.mouse.move(b.x + 11.5 * SCALE, b.y + 8 * SCALE);
  await page.mouse.down();
  await page.mouse.move(b.x + 13.5 * SCALE, b.y + 8 * SCALE, { steps: 5 });
  await page.mouse.up();
  const insp = page.getByRole('region', { name: 'Zaznaczony obszar' });
  await expect(insp.getByRole('textbox', { name: 'Punkt 1 X' })).toHaveValue('8');
  await page.getByRole('button', { name: 'Cofnij' }).click();
  await page.getByRole('region', { name: 'Elementy planu' }).getByRole('button', { name: /^Dom · Dom \/ budynek/ }).click();
  await expect(insp.getByRole('textbox', { name: 'Punkt 1 X' })).toHaveValue('6');
});
```

Uwagi do kalibracji: obraz 1×1 ma aspect 1, więc startowa szerokość mapki to min(30, 22/1) = 22 m. Punkty są 20 m od siebie, a rzeczywista odległość to 40 m, czyli f = 2 i w ≈ 44 m. Tolerancja ±0,5 m pokrywa zaokrąglenie współrzędnych kursora do pikseli.

Run: `npm run e2e`
Expected: 5 passed.

- [ ] **Step 4: Pełna weryfikacja**

Run: `npm run typecheck && npm test && npm run build && npm run e2e`
Expected: wszystko PASS, `dist/` zbudowany.

Ręcznie (`npm run dev`, otwórz http://localhost:5173) sprawdź obok prototypu `docs/reference/prototype.dc.html`, czy:
- układ, kolory i czcionki są takie same,
- etykiety i wymiary są w tych samych miejscach,
- plan przykładowy ma te same liczby w podsumowaniu.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: złożenie aplikacji i testy end-to-end

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Pokrycie wymagań (PRD → zadania)

| Wymaganie | Zadanie |
|---|---|
| F-1.1, F-1.2 kolejność warstw i narzędzi | 2, 10, 12 |
| F-2.1–F-2.6 rysowanie obszarów | 4, 10, 11, 12 |
| F-3.1 sadzenie | 11 |
| F-4.1–F-4.8 zaznaczanie i edycja | 7, 9, 10, 11, 13 |
| F-5.1–F-5.7 siatka, przyciąganie, widok | 4, 8, 10, 11, 12 |
| F-6.1–F-6.5 podkład | 11, 14 |
| F-7.1–F-7.3 historia | 7, 8, 15 |
| F-8.1–F-8.5 podsumowanie | 5, 13 |
| F-9.1–F-9.5 pliki i trwałość | 6, 8, 15, 16 |
| F-10.1–F-10.2 komunikaty i podpowiedzi | 10, 15 |
| NF-1 wydajność (memoizacja powierzchni) | 8 |
| NF-3 dostępność | 9–16 |
| NF-5 odporność | 6, 8, 14, 15 |
| NF-6 jakość | 1, 16 |

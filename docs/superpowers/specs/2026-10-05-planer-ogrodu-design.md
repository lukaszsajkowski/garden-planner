# Planer ogrodu: specyfikacja techniczna

| | |
|---|---|
| Data | 2026-10-05 |
| Wymagania | `docs/prd.md` (identyfikatory F-x.y, NF-x) |
| Design | `design/tokens.json`, `design/components.md`, `design/screens.md` |
| Prototyp referencyjny | `docs/reference/prototype.dc.html` (linie podane przy zachowaniach) |

## 1. Ustalenia

- **Cel:** narzędzie dla siebie i rodziny. Funkcje i wygląd 1:1 z prototypem, przepisane na utrzymywalny kod z testami. Nowe funkcje są poza zakresem (PRD §4).
- **Stos:** Vite, TypeScript (strict), React 18+, SVG do planu, Canvas 2D do eksportu PNG, Vitest + Testing Library, Playwright.
- **Bez backendu.** Statyczny build działa offline.
- **Design jako pliki w repo** (`design/`), bez osobnego układu mobilnego. Kolumny zawijają się jak w prototypie.

## 2. Struktura

```
src/
  domain/              czysty TS: bez Reacta, DOM i localStorage
    types.ts
    catalog.ts
    geometry.ts
    netAreas.ts
    snapping.ts
    planFile.ts
    format.ts
    sample.ts
  state/
    planReducer.ts
    history.ts
    uiReducer.ts
    selectors.ts
    persistence.ts
    store.tsx          PlanProvider: useReducer + kontekst, autozapis
  canvas/
    PlanStage.tsx
    patterns.tsx
    usePointerTools.ts
    hitTest.ts
    coords.ts          piksele <-> metry
  export/
    exportPng.ts
    download.ts        Blob -> URL, auto-klik, zwalnianie URL po 30 s
  ui/
    primitives/        Button, FileButton, Field, NumberField, Chip, Toggle,
                       Segmented, Panel, StatTile
    Header.tsx  Notice.tsx  ToolsPanel.tsx  DrawPanel.tsx  PlantPanel.tsx
    BackgroundPanel.tsx  GridPanel.tsx  SummaryPanel.tsx
    InspectorPoly.tsx  InspectorPoint.tsx  ElementsList.tsx  StageToolbar.tsx
  design/tokens.ts     import z design/tokens.json + typy
  App.tsx  main.tsx  global.css
tests/e2e/             Playwright
tests/fixtures/        prototype-sample.json (plik zapisany przez prototyp)
```

**Zasady:**
1. `domain/` jest jedynym źródłem obliczeń: wszystko, co widać w podsumowaniu, inspektorze, etykietach i PNG.
2. Model planu zmienia wyłącznie `planReducer`. Stan widoku zmienia `uiReducer`.
3. `canvas/` tłumaczy zdarzenia wskaźnika na akcje. Nie liczy powierzchni i nie zna formatu pliku.
4. Komponenty `ui/` dostają dane z selektorów i wysyłają akcje. Nie zawierają geometrii.

## 3. Domena

### 3.1 Typy (`types.ts`)

```ts
export type Pt = readonly [x: number, y: number]            // metry
export type PolyType  = 'boundary'|'grass'|'gravel'|'paving'|'bed'|'house'
export type PointType = 'shrub'|'conifer'|'tree'
export type ShapeType = PolyType | PointType
export interface PolyShape  { id: string; type: PolyType;  name?: string; pts: Pt[] }
export interface PointShape { id: string; type: PointType; name?: string; x: number; y: number; r: number }
export type Shape = PolyShape | PointShape
export interface Background { src: string; x: number; y: number; w: number; aspect: number; opacity: number; visible: boolean }
export interface Plan { W: number; H: number; shapes: Shape[]; bg: Background | null }
```

`aspect` = wysokość / szerokość obrazu. Wysokość mapki w metrach = `w * aspect`.

### 3.2 Katalog (`catalog.ts`)

`CATALOG: Record<ShapeType, { label; kind: 'poly'|'point'; z; r? }>` według tabeli z PRD §6.1. Style wizualne (fill, stroke, dash, solid) są w `design/tokens.json → material`, nie w katalogu. Stałe `ORDER_POLY`, `ORDER_POINT`, `ZOOMS = [8,12,16,20,28,36,48,64,80]`, `HISTORY_LIMIT = 80`, `STORAGE_KEY = 'planer-ogrodu-v1'`.

### 3.3 Geometria (`geometry.ts`)

`dist`, `area` (wzór Gaussa, wartość bezwzględna), `perimeter` (zamknięty), `bbox → [x0,y0,x1,y1]`, `centroid` (gdy |A| < 1e-9, środek bbox), `pointInPolygon` (ray casting), `segmentDistance(p,a,b) → {d, q}`, `rectPoints(a,b)` (4 punkty: lewy-górny, prawy-górny, prawy-dolny, lewy-dolny), `round2`.

### 3.4 Powierzchnie netto (`netAreas.ts`)

`netAreas(shapes) → Partial<Record<PolyType|'free', number>>`. Algorytm 1:1 z prototypem (linie 845–871):
1. Granice idą do `bnds`, pozostałe obszary (≥ 3 pkt) do `polys` z bbox. `polys` sortujemy malejąco po (z, indeks).
2. Zakres B to suma bbox granic, a gdy granic nie ma, suma bbox obszarów. Pusty zakres daje `{free: 0}`.
3. Dla środków komórek co 0,2 m w B: komórka spoza wszystkich granic (o ile jakieś istnieją) jest pomijana. Pierwszy obszar z `polys`, który zawiera punkt (najpierw szybki test bbox), dostaje 0,04 m². Gdy żaden nie zawiera punktu, 0,04 m² trafia do `free`.

`summary(shapes)` → `{ plot, net, pbc: number|null, counts }` (PRD §6.8). Selektor memoizuje wynik po referencji `shapes`.

### 3.5 Przyciąganie (`snapping.ts`)

- `snapValue(v, step)`: `step ? round2(round(v/step)*step) : round2(v)`.
- `snapPoint(p, step)`.
- `draftPoint(raw, last, {step, angleSnap})`: przy `angleSnap` kąt atan2 jest zaokrąglany do π/12, a długość do kroku (jeśli krok ≠ 0). Wynik zaokrąglamy do 0,01.
- `pointFromSegment(last, len, deg)`: `[last.x + len·cos, last.y − len·sin]`, bo oś Y planu rośnie w dół.
- `displayAngle(last, hover)`: stopnie 0–360 w tej samej konwencji, zaokrąglone.

### 3.6 Plik (`planFile.ts`)

- `serializePlan(plan, now) → string`: `{app:'planer-ogrodu', version:1, savedAt: ISO, W, H, shapes, bg}`.
- `parsePlan(text, newId) → Plan`, rzuca `PlanFileError` z polskim komunikatem:
  - JSON niepoprawny albo brak tablicy `shapes`: „to nie jest plik planu ogrodu”.
  - Element z nieznanym typem jest pomijany. `id` niebędące stringiem dostaje nowe id. `name` jest przycinane do 80 znaków.
  - Obszar: zostają tylko punkty `[num, num]`, a przy mniej niż 3 punktach obszar jest pomijany.
  - Roślina: brak liczbowego `x/y` oznacza pominięcie. `r ≤ 0` lub brak `r` daje promień domyślny.
  - `W/H`: clamp 5–500, domyślnie 30/22.
  - `bg` przyjmujemy tylko gdy `src` zaczyna się od `data:image/`, `w > 0` i `aspect > 0`. Krycie clamp 0,1–1 (domyślnie 0,6), `visible` domyślnie true.
- Tej samej funkcji używa odczyt autozapisu.
- `version > 1`: plik czytamy jak v1 (pola nieznane ignorujemy). Miejsce na przyszłe migracje to `migrations: Record<number, fn>`.

### 3.7 Formatowanie (`format.ts`)

`fmtNum` (round2, przecinek), `fmtLen` („12,30 m”), `fmtArea` (≥ 100 bez miejsc po przecinku, inaczej 1 miejsce, „ m²”), `parseNum` (trim, `,` na `.`; puste, „-”, „.” albo nieskończone dają NaN), `dateStamp` (RRRR-MM-DD, czas lokalny).

## 4. Stan

### 4.1 Plan i historia

```ts
type PlanState = { plan: Plan; past: Shape[][] }   // past: migawki shapes
```

Akcje `planReducer`: `add`, `update(id, patch)`, `replace(id, shape)`, `remove`, `duplicate`, `setType`, `moveVertex`, `insertVertex`, `deleteVertex`, `setPlotSize`, `setBackground(patch|null)`, `load(plan)`, `loadSample`, `clear`, `checkpoint`, `undo`.

Historia (`history.ts`):
- Akcja z flagą `record: true` odkłada aktualne `shapes` do `past` (limit 80, najstarsze wypadają) przed zmianą.
- Przeciąganie: `checkpoint` przy pierwszym ruchu, potem `replace` bez zapisu.
- Pola inspektora: `checkpoint` przy `focus`, potem `update` bez zapisu.
- `undo` przywraca `shapes`. `store.tsx` składa `planReducer` i `uiReducer` w jeden reducer główny, więc akcje `undo`, `load`, `loadSample`, `clear` i `remove` w tym samym kroku czyszczą też `sel` i szkic po stronie UI.
- `W`, `H` i `bg` nie wchodzą do historii (PRD F-7.3).

Zmiana typu rośliny (`setType`): gdy `|r − default(old)| < 1e-6`, ustawiamy `r = default(new)`.

### 4.2 UI (`uiReducer`)

```ts
{ tool: 'select'|ShapeType; mode: 'poly'|'rect'; draft: Pt[]; rectStart: Pt|null;
  hover: Pt|null; sel: string|null; scale: number; step: 0|0.1|0.5|1;
  angleSnap: boolean; showDims: boolean; showLabels: boolean;
  bgMode: null|'calib'|'move'; calib: Pt[]; calibLen: string;
  drawInputs: { startX; startY; segLen; segAng; rectW; rectH };   // stringi
  notice: { msg: string; download?: { url; name } } | null }
```

- `setTool(k)` czyści szkic, prostokąt, `bgMode` i `calib`. Zaznaczenie zostaje tylko przy `select`.
- Edycja pól liczbowych w trakcie wpisywania: lokalny stan w `NumberField` (tekst do `blur`). Zastępuje on mapę `edits` z prototypu.

### 4.3 Trwałość (`persistence.ts`)

- `load()`: `parsePlan(localStorage[KEY])`. Wyjątek albo brak danych daje `null` i aplikacja ładuje `sample()`.
- `save(plan)` po każdej zmianie `shapes | W | H | bg` (efekt w `PlanProvider`). Przy `QuotaExceededError` ponawiamy z `bg: null`, a dalsze błędy połykamy.

## 5. Plan (canvas)

- `PlanStage`: kontener `W·scale × H·scale` px z tłem-siatką (CSS gradient: główna co 5 m, pomocnicza co 1 m). W nim:
  1. `<img>` mapki
  2. jeden `<svg viewBox="0 0 W H">`: kształty, granice, obrys zaznaczenia, szkic, kalibracja. Grubość linii przez `vector-effect: non-scaling-stroke`, wzory materiałów w `<defs>` z `patternUnits=userSpaceOnUse`.
  3. warstwa HTML z etykietami, wymiarami i uchwytami (w px, aby tekst się nie skalował).
- Kolejność rysowania: obszary (bez granic) i rośliny według z, potem granice, zaznaczenie, szkic, kalibracja, etykiety, wymiary, uchwyty.
- `coords.ts`: `toMeters(e, rect, scale)`. Stała `HIT_PX = 8`, `VERTEX_PX = 9`, `CLOSE_PX = 10`, `EDGE_INSERT_PX = 10`.
- `usePointerTools`: maszyna stanów wg (bgMode, tool, mode) z PRD §6.2–6.6, pointer capture na `pointerdown`, `touch-action: none`. Stan przeciągania trzymamy w `useRef` (nie w stanie Reacta), aby nie renderować przy każdym ruchu niczego poza kształtem.
- `hitTest(shapes, raw, scale)` według F-4.1.

## 6. Eksport PNG (`exportPng.ts`)

`renderPlanPng(plan, opts) → Promise<Blob>`: Canvas 2D według PRD F-9.3 i prototypu (linie 634–701). Kolory jednolite bierzemy z `tokens.material.*.solid`. Rośliny mają kolory z tokenów z kanałem alfa. Gdy obrazu mapki nie da się wczytać, rysujemy bez niej. Pobieranie przez `download.ts` z komunikatem „Obraz planu gotowy do pobrania.”

## 7. Design w kodzie

- `design/tokens.json` jest jedynym źródłem kolorów, czcionek, rozmiarów i progów. `src/design/tokens.ts` importuje JSON (Vite) i eksportuje typowane stałe.
- `global.css` definiuje zmienne CSS z tokenów (`--color-accent` itd.) przez mały skrypt `scripts/tokens-to-css.ts` uruchamiany przed `dev` i `build`. Komponenty używają CSS Modules i zmiennych, bez kolorów wpisanych w kod.
- Wzory SVG materiałów generuje `patterns.tsx` z `tokens.material.*.pattern`.
- Komponenty, stany i teksty według `design/components.md` i `design/screens.md`.

## 8. Błędy

| Sytuacja | Zachowanie |
|---|---|
| Plik nie jest JSON-em lub nie ma `shapes` | komunikat F-9.2, plan bez zmian |
| Nieudany odczyt pliku | „Nie udało się odczytać pliku.” |
| Obrazu nie da się zdekodować | „Nie udało się odczytać obrazu. Użyj pliku JPG lub PNG.” |
| `toBlob` zwraca null lub rzuca | „Nie udało się utworzyć obrazu.” |
| localStorage pełny lub niedostępny | cicho: zapis bez mapki albo brak autozapisu |
| Niepoprawna liczba w polu | model bez zmian, tekst zostaje do `blur` |
| Średnica ≤ 0, obszar poza 5–500, < 3 wierzchołki | zmiana ignorowana, przycisk usuwania punktu nieaktywny |

## 9. Testy

- **Jednostkowe (Vitest), `domain/`:**
  - geometria (kwadrat, trójkąt, wielokąt wklęsły, wielokąt zdegenerowany)
  - `netAreas` na planie przykładowym: wartości z PRD §6.8 dokładnie, bo raster jest deterministyczny
  - `netAreas` bez granicy
  - przyciąganie (kroki, kąty 15°, krok 0)
  - `pointFromSegment` dla 0/90/180/270°
  - `parsePlan`: fixture z prototypu, każdy przypadek odrzucenia lub naprawy
  - formatowanie (przecinek, progi 100 m²)
- **Jednostkowe, `state/`:** każda akcja, limit historii 80, jeden krok na przeciągnięcie, `setType` z domyślnym promieniem, `clear` zachowuje `bg/W/H`.
- **Komponentowe (Testing Library):**
  - NumberField (przecinek, NaN, blur)
  - InspectorPoly (edycja wierzchołka, blokada usuwania przy 3 punktach)
  - DrawPanel (wstaw prostokąt z wymiarów, dodaj odcinek)
  - SummaryPanel (wiersze i PBC dla planu przykładowego)
- **E2E (Playwright):**
  1. Nowy plan: narysuj granicę 4 kliknięciami, zamknij klikiem w pierwszy punkt, sprawdź pole działki.
  2. Wczytaj mapkę z fixture, skalibruj 2 punktami i odległością 10 m, sprawdź szerokość mapki.
  3. Zapisz plik, otwórz go ponownie i sprawdź, że lista elementów jest identyczna.
  4. Eksport PNG daje pobranie pliku `.png`.
  5. Przeciągnięcie elementu, Cofnij i powrót do pozycji.
- **Kryterium gotowości:** `npm run typecheck && npm test && npm run e2e` przechodzą, a każdy identyfikator F-x.y z PRD ma co najmniej jeden test.

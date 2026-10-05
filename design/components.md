# Komponenty

Nazwy tokenów odnoszą się do `design/tokens.json` (`color.accent` zapisujemy krótko jako `accent`). Interfejs nie ma cieni, gradientów ani emoji. Ikony są liniowe (SVG, stroke 1,8, zaokrąglone końce, `currentColor`), a te obok tekstu dostają `aria-hidden`.

## Zasady wspólne

- **Focus:** `outline: 2px solid accent; outline-offset: 1px` dla `button:focus-visible`, `input:focus` i FileButton (`:focus-within`).
- **Disabled:** `opacity: .45; cursor: not-allowed`. Element jest prawdziwym `disabled`, a nie tylko wyglądem.
- **Przełączniki:** każdy przycisk o stanie wł./wył. ma `aria-pressed="true|false"`.
- **Wybrany** (narzędzie, segment, chip): tło `accentSelected`, obramowanie `accent`. W narzędziach dodatkowo waga 600.
- **Zaznaczony element planu** (lista): tło `selectionSoft`, obramowanie `selection`.
- **Liczby** zawsze w `font.mono`.

## Button

| Wariant | Tło | Obramowanie | Tekst | Użycie |
|---|---|---|---|---|
| `primary` | `accent` | `accent` | `onAccent`, 500 | Nowy plan, Zamknij kształt, Wstaw prostokąt |
| `secondary` | `surface` | `borderStrong` | `text` | Cofnij, Zapisz plik, Eksport PNG, Duplikuj, Anuluj |
| `outlineAccent` | `surface` | `accent` | `accent`, 500 | Wczytaj mapkę |
| `outlineDraft` | `surface` | `draft` | `draft`, 500 | Dodaj odcinek |
| `calib` | `calib` | `calib` | `onAccent`, 500 | Zastosuj skalę |
| `danger` | `surface` | `danger` | `danger` | Usuń (element, mapkę) |
| `ghost` | przezroczyste | brak | `text` | × w komunikacie |
| `icon` | `surface` | `borderStrong` | `text`, 18 px | − / + zoomu (`aria-label` wymagany) |

Rozmiary: `lg` 44 px wysokości, padding 0 16, font 14, radius `lg`. Używany w nagłówku. `md` ma 40 px i font 13 (panele). `sm` ma 36 px, padding 0 10, font 12, radius `md` (Odznacz). Ikona przed tekstem: 18 px, gap 8. Przyciski równej szerokości w siatce 2 lub 3 kolumn z gap 6, przy zawijaniu `flex: 1 1 auto`.

## FileButton

Element `<label>` stylizowany jak Button (`secondary`, `outlineAccent` albo `md`), z ukrytym wizualnie `<input type="file">` w środku (klasa `vh`, nie `display:none`, aby input zostawał w kolejności Tab). Hover ma tło `surfaceMuted`, a focus jest widoczny na labelu. Po odczycie pliku `input.value` jest czyszczone, żeby ten sam plik dało się wybrać ponownie.

## Field / NumberField

- Etykieta nad polem w jednym `<label>` (kolumna, gap 4, `fieldLabel`).
- Pole: wysokość `field` 38 (`fieldCompact` 36, wiersz wierzchołka 34), padding 0 8, obramowanie `borderStrong`, radius `md`, font mono 13 (12 w wariantach kompaktowych), kolor `text`.
- `NumberField`: `inputmode="decimal"`. Wpisywany tekst trzyma lokalnie, a każdą poprawną liczbę (`parseNum`) od razu przekazuje do `onValue`. Na `blur` porzuca tekst i pokazuje wartość z modelu. `onFocus` wywołuje opcjonalny `onBeginEdit` (punkt historii). Wartość niepoprawna nie wywołuje `onValue`, a pole nie dostaje stylu błędu (tak jak w prototypie).
- `TextField` (nazwa): font sans 14, placeholder = etykieta typu.

## ToolButton

Wiersz 44 px: miniatura 22 × 22 i etykieta 14 px, padding 0 10, gap 10, radius `lg`, wyrównanie do lewej. Miniatura to kwadrat 0,9 × 0,9 w `viewBox 0 0 1 1` z wypełnieniem i obrysem materiału (dla granicy dash `3 2`). Rośliny mają `rx 0.45` (koło), obszary `rx 0.08`. Narzędzie „Zaznacz i przesuń” ma ikonę kursora.

## Segmented

Siatka równych przycisków (2 albo 4 kolumny, gap 4–6), wysokość 40, font 12–13, radius `md`/`lg`. Każdy segment ma `aria-pressed`. Używany dla trybu Wielokąt/Prostokąt, kroku siatki (1 m / 0,5 m / 0,1 m / Wył.) oraz Kalibruj skalę / Przesuń mapkę (każdy z tych dwóch to osobny przełącznik, który może być wyłączony). Aktywna kalibracja ma tło `calibSoft` i obramowanie `calib`.

## Toggle (pole wyboru)

Przycisk bez tła i obramowania, 40 px. Kwadrat 18 × 18 z obramowaniem 2 px `accent` i radius `sm`, wypełniony `accent`, gdy włączony. Obok etykieta 13 px. Ma `aria-pressed`.

## Chip

Pigułka 36 px, padding 0 10, radius `pill`, font 12, `aria-pressed`. Zawija się w rzędzie z gap 4. Służy do zmiany typu zaznaczonego elementu.

## Panel

`<section>`: tło `surface`, obramowanie `border`, radius `xl`, padding 14, kolumna z gap 6–12. Nagłówek `<h2>` w stylu `sectionTitle`, podgrupy `<h3>` w stylu `groupTitle`. Panel inspektora ma nagłówek w kolorze `selection` i przycisk „Odznacz” (`sm`) po prawej.

Wariant **CalibBlock** (wewnątrz panelu Podkład): tło `calibSoft`, radius `lg`, padding 10, tekst `calibText`, info mono `calib`, etykiety pól `calibLabel`, obramowanie pól `calibBorder`.

## StatTile

Tło `surfaceMuted`, radius `lg`, padding 10. Etykieta 12 `textMuted`, wartość `statValue` (`statValueSm` w inspektorze). Zawsze w siatce 2 kolumn z gap 8.

## SummaryRow / EdgeRow

`SummaryRow`: wiersz flex space-between, padding 7 0, dolna linia `divider`, font 13, wartość mono. `EdgeRow`: padding 4 0, linia `dividerSoft`, mono 12, numer „i–j” w kolorze `textMuted`.

## VertexRow

Siatka `22px 1fr 1fr 36px`, gap 4. Numer (mono 11, `textMuted`), pola X i Y (`NumberField`, 34 px, `aria-label` „Punkt n X/Y”) oraz przycisk × (34 px, kolor `danger`, `aria-label` „Usuń punkt n”), który jest nieaktywny przy 3 wierzchołkach.

## ElementListItem

Przycisk na całą szerokość, 40 px, padding 0 8, radius `md`, obramowanie `divider`. Po lewej „Nazwa · Typ” (13), po prawej mono 11 `textMuted` (powierzchnia albo „Ø d m”). Ma `aria-pressed`, gdy element jest zaznaczony.

## Notice

`role="status"`, margines 16 16 0, padding 10 14, tło `notice`, obramowanie `noticeBorder`, radius `xl`, font 14. Zawiera tekst (flex 1 1 260 px), opcjonalny link pobierania (wygląd primary, 40 px, atrybut `download`, treść „Pobierz {nazwa}”) i przycisk × (40 × 40, ghost, `aria-label` „Zamknij komunikat”).

## StageToolbar

Pasek nad planem: padding 8 12, dolna linia `border`, zawijanie z gap 12.
- Zoom: przycisk −, etykieta „1 m = N px” (mono 12, min. szer. 76, wyśrodkowana) i przycisk +. Przyciski 40 × 40 z `aria-label` „Oddal” / „Przybliż”.
- ScaleBar: kreska w kształcie litery U (1,5 px `text`, bez górnej krawędzi, wys. 6) o szerokości `barM · scale` i podpisem mono 11 „N m”.
- Współrzędne kursora po prawej, mono 12.

## Plan: elementy rysowane

- **Linijki:** opisy mono 11 `textMuted`. Oś X 22 px nad planem, wyśrodkowana. Oś Y 40 px w lewo, szer. 34, do prawej.
- **Etykieta obszaru lub rośliny:** tło `labelBg`, radius 4, padding 2 6, tytuł `stageLabel`, podtytuł `stageLabelSub`, bez zawijania, wyśrodkowana na centroidzie. Etykieta działki jest zakotwiczona nad narożnikiem najbliższym (0,0), przesunięta o 4 px.
- **Wymiar krawędzi:** pigułka mono 11, biały tekst, padding 1 5, radius 3, tło w kolorze roli (`danger` dla granicy, `selection`, `draft`, `calib`), wyśrodkowana w połowie odcinka.
- **Uchwyty:** według `canvas.handle`, obramowanie 2 px, wyśrodkowane na punkcie.
- **Kursor:** `default` dla zaznaczania, `crosshair` dla rysowania i kalibracji, `move` przy przesuwaniu mapki.

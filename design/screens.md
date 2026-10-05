# Ekran i stany

Aplikacja ma jeden ekran. Teksty poniżej są ostateczne (po polsku, 1:1 z prototypem). `{…}` oznacza wartość wstawianą. Nazwy komponentów i tokenów pochodzą z `components.md` i `tokens.json`.

## 1. Układ

```
┌ Header ─────────────────────────────────────────────────────────────────┐
│ [logo] Planer ogrodu                 Cofnij │ Otwórz plik  Zapisz plik   │
│        Rysuj w metrach: …                      Eksport PNG │ Przykładowy │
│                                                plan  [Nowy plan]         │
├─────────────────────────────────────────────────────────────────────────┤
│ Notice (opcjonalny)                                                     │
├──────────────┬──────────────────────────────────────────┬───────────────┤
│ Lewa kolumna │ Plan                                     │ Prawa kolumna │
│ 1 1 240px    │ 999 1 560px                              │ 1 1 280px     │
│              │ ┌ StageToolbar ────────────────────────┐ │               │
│ Narzędzia    │ │ − 1 m = 28 px +  ⊔ 5 m   X … Y …     │ │ Podsumowanie  │
│ [Rysowanie / │ ├──────────────────────────────────────┤ │  albo         │
│  Sadzenie]   │ │ obszar przewijany, wys. 640          │ │ Inspektor     │
│ Podkład      │ │  linijki + plan W·scale × H·scale    │ │               │
│ Siatka       │ ├──────────────────────────────────────┤ │ Elementy      │
│ Obszar rys.  │ │ podpowiedź (stopka)                  │ │ planu         │
└──────────────┴──────────────────────────────────────────┴───────────────┘
```

- `main`: flex z zawijaniem, gap 16, padding 16, `align-items: flex-start`. Na wąskim ekranie kolumny układają się jedna pod drugą w kolejności: lewa, plan, prawa. Osobnego układu mobilnego nie ma (PRD §4).
- Nagłówek: tło `surface`, dolna linia `border`. Grupy przycisków rozdzielają pionowe separatory 1 × 28 `border`.
- Logo to liść (inline SVG, stroke `accent`). Tytuł: „Planer ogrodu”. Podtytuł: „Rysuj w metrach: granice działki, budynki, nawierzchnie i rośliny”.

## 2. Lewa kolumna

### 2.1 Narzędzia (zawsze widoczne)

„Narzędzia”: najpierw „Zaznacz i przesuń”, potem grupa „Obszary” (Granica działki, Trawnik, Kostka brukowa, Żwir, Rabata, Dom / budynek) i grupa „Rośliny” (Drzewo liściaste, Iglak, Krzew).

### 2.2 Rysowanie: {typ} (gdy narzędziem jest obszar)

Segmented: Wielokąt | Prostokąt.

**Wielokąt**
- Opis: „Klikaj kolejne narożniki. Zamknij kształt klikając pierwszy punkt, dwuklikiem albo przyciskiem.”
- Info (mono 12, `draft`): „Kliknij na planie pierwszy punkt” albo „Punkty: {n} · odcinek {d} · {α}°”.
- **Szkic pusty:** pola „Start X (m)” i „Start Y (m)”, przycisk „Ustaw punkt startowy”.
- **Szkic z punktami:** pola „Długość (m)” i „Kąt (°)”, podpowiedź „0° w prawo, 90° w górę, 180° w lewo, 270° w dół”, przycisk outlineDraft „Dodaj odcinek”.
- Przyciski: [Zamknij kształt] (primary, nieaktywny przy < 3 pkt), Cofnij punkt, Anuluj (oba nieaktywne przy pustym szkicu).

**Prostokąt**
- Opis: „Przeciągnij na planie albo wpisz wymiary i wstaw dokładnie.”
- Pola X (m), Y (m), Szerokość (m), Głębokość (m) w siatce 2 × 2 i przycisk [Wstaw prostokąt].

### 2.3 Sadzenie: {typ} (gdy narzędziem jest roślina)

„Klikaj na planie, aby posadzić. Średnicę korony i dokładną pozycję ustawisz po zaznaczeniu.”

### 2.4 Podkład: mapka działki

- **Brak mapki:**
  - Opis: „Wczytaj mapkę geodezyjną, zdjęcie lub widok z geoportalu i obrysuj na niej granice i dom.”
  - FileButton outlineAccent „Wczytaj mapkę (JPG, PNG)”.
  - Podpowiedź: „Masz PDF? Zrób zrzut ekranu albo zapisz stronę jako obraz.”
- **Mapka jest:**
  - Przełączniki „Kalibruj skalę” i „Przesuń mapkę”.
  - Gdy kalibracja jest aktywna, CalibBlock:
    - „Kliknij na mapce dwa punkty, których odległość znasz (np. końce boku działki z opisanym wymiarem). Przybliż plan dla większej dokładności.”
    - info: „Kliknij pierwszy punkt na mapce” / „Teraz drugi punkt · {d} w obecnej skali” / „Odcinek na mapce: {d} w obecnej skali”
    - pole „Rzeczywista odległość (m)”
    - [Zastosuj skalę] (calib, nieaktywny bez 2 punktów i odległości > 0) i „Zakończ”
  - Suwak „Widoczność mapki: {n}%” (10–100, krok 5).
  - Pola Szer. (m), X (m), Y (m) w 3 kolumnach.
  - Przyciski „Ukryj”/„Pokaż”, FileButton „Zmień”, danger „Usuń”.

### 2.5 Przyciąganie do siatki

- Segmented: 1 m, 0,5 m, 0,1 m, Wył.
- Toggle: „Kąty co 15° przy rysowaniu”, „Wymiary granicy działki”, „Nazwy i powierzchnie”.
- Podsekcja „Obszar rysunku”: pola Szerokość (m) i Głębokość (m).

## 3. Plan

### 3.1 Warstwy (od dołu)

1. tło białe i siatka (co 1 m `grid.minor`, co 5 m `grid.major`)
2. mapka (krycie wg ustawienia, bez zdarzeń)
3. obszary według z
4. rośliny według z (koło korony, kropka w środku dla drzew i iglaków)
5. granice działki (przerywane)
6. obrys zaznaczenia (obszar: wypełnienie `selectionFill`, linia 2 px; roślina: okrąg przerywany 5 3)
7. szkic (polilinia i prostokąt w kolorze `draft`, przerywane 6 4)
8. odcinek kalibracji (`calib`, przerywany 6 4)
9. etykiety, wymiary, uchwyty (HTML nad SVG)

### 3.2 Stany planu i ich elementy

| Stan | Kursor | Co widać dodatkowo |
|---|---|---|
| Zaznacz, nic nie zaznaczone | default | wymiary granic (jeśli wł.) |
| Zaznaczony obszar | default | obrys zaznaczenia, kwadratowe uchwyty wierzchołków, wymiary wszystkich boków w kolorze `selection` (zamiast wymiarów granicy dla tego elementu) |
| Zaznaczona roślina | default | przerywany okrąg, okrągły uchwyt środka `selection` |
| Rysowanie wielokąta | crosshair | punkty szkicu, linia do kursora, wymiary odcinków `draft`, pierwszy punkt 14 px (wypełniony `draft`, gdy można zamknąć) |
| Rysowanie prostokąta | crosshair | podgląd prostokąta i wymiary dwóch pierwszych boków |
| Sadzenie | crosshair | brak |
| Kalibracja | crosshair | punkty `calib`, odcinek do kursora, wymiar `calib` |
| Przesuwanie mapki | move | brak |

### 3.3 Podpowiedź w stopce (priorytet od góry)

1. Kalibracja: „Kalibracja: kliknij dwa punkty na mapce o znanej odległości, wpisz ją po lewej i zastosuj.”
2. Przesuwanie mapki: „Przeciągnij, aby przesunąć mapkę pod planem.”
3. Wielokąt, ≥ 3 punkty: „Kliknij pierwszy (niebieski) punkt albo kliknij dwukrotnie, aby zamknąć kształt.”
4. Wielokąt, < 3 punkty: „Klikaj kolejne narożniki. Długość i kąt możesz też wpisać po lewej.”
5. Prostokąt: „Przeciągnij, aby narysować prostokąt.”
6. Roślina: „Kliknij, aby posadzić. Narzędzie zostaje aktywne, możesz sadzić dalej.”
7. Coś zaznaczone: „Przeciągnij element, aby go przesunąć. Kwadratowe uchwyty przesuwają narożniki.”
8. Domyślnie: „Wybierz narzędzie po lewej. Kliknij element na planie, aby go edytować.”

Pozycja kursora: „X {x}   Y {y}” (trzy spacje) albo „Najedź na plan”. Plan ma `aria-label` „Plan ogrodu”.

## 4. Prawa kolumna

### 4.1 Podsumowanie (nic nie zaznaczone)

- StatTile: „Działka” (powierzchnia albo „—”) i „Biologicznie czynna” (procent albo „—”).
- SummaryRow według PRD F-8.3.
- Przypis: „Powierzchnie liczone są tak, jak widać je na planie: to, co przykrywa dom albo kostka, nie wlicza się do trawnika.”

### 4.2 Zaznaczony obszar

- Nagłówek „Zaznaczony obszar” i przycisk „Odznacz”.
- Pole „Nazwa”.
- Chipy typów obszarów.
- StatTile „Powierzchnia” i „Obwód”.
- Dla trawnika, kostki i żwiru: „Do zamówienia z zapasem 5%: **{pow.}**”.
- „Wierzchołki (m) · przeciągnij na planie lub wpisz”: lista VertexRow i podpowiedź „Dwuklik na krawędzi dodaje nowy wierzchołek.”
- „Długości boków”: lista EdgeRow.
- Przyciski Duplikuj i danger Usuń.

### 4.3 Zaznaczona roślina

- Nagłówek „Zaznaczona roślina” i przycisk „Odznacz”.
- Pole „Nazwa / gatunek”.
- Chipy typów roślin.
- Pola X (m), Y (m), „Korona Ø (m)” w 3 kolumnach.
- Przyciski Duplikuj i Usuń.

### 4.4 Elementy planu (zawsze)

Lista ElementListItem od najnowszego. Gdy plan jest pusty: „Plan jest pusty. Zacznij od narzędzia „Granica działki”.”

## 5. Komunikaty (Notice)

| Zdarzenie | Tekst | Link |
|---|---|---|
| Zapis pliku | „Plan zapisany[ razem z mapką]. Otworzysz go później przyciskiem „Otwórz plik”.” | Pobierz plan-ogrodu-{data}.json |
| Eksport PNG | „Obraz planu gotowy do pobrania.” | Pobierz plan-ogrodu-{data}.png |
| Otwarcie pliku | „Wczytano „{plik}”: {n} elementów[ i mapka].” | |
| Błąd pliku | „Nie udało się wczytać pliku „{plik}”: {powód}.” | |
| Błąd odczytu | „Nie udało się odczytać pliku.” | |
| Mapka wczytana | „Mapka wczytana. Teraz ustaw skalę: kliknij na mapce dwa punkty o znanej odległości i wpisz ją po lewej.” | |
| Zły obraz | „Nie udało się odczytać obrazu. Użyj pliku JPG lub PNG.” | |
| Skala ustawiona | „Skala ustawiona: mapka ma teraz {w} szerokości. Możesz obrysować granice narzędziem „Granica działki”.” | |
| Mapka usunięta | „Mapka usunięta z planu.” | |
| Błąd PNG | „Nie udało się utworzyć obrazu.” | |

Pobieranie rusza automatycznie. Link w komunikacie jest zapasem na wypadek, gdyby przeglądarka zablokowała pobranie.

## 6. Stany startowe

- **Pierwsze uruchomienie** (brak autozapisu): przykładowy plan, narzędzie „Zaznacz i przesuń”, zoom 28, krok 0,5 m, wymiary i etykiety włączone.
- **Kolejne uruchomienie:** plan z autozapisu (elementy, obszar, mapka). Narzędzie, zoom i przełączniki wracają do domyślnych.
- **Po „Nowy plan”:** pusta lista, narzędzie „Granica działki” w trybie wielokąta, mapka i obszar rysunku bez zmian.

## 7. Eksport PNG: wygląd

Białe tło i siatka (główna α .18), opisy osi co 5 m, mapka (jeśli widoczna), obszary w kolorach `solid` z obrysem materiału, rośliny, granice przerywane 8 5 z pigułkami wymiarów `danger`, etykiety obszarów (gdy mają co najmniej 70 × 36 px) i nazwanych roślin. W stopce po lewej „Plan ogrodu · działka {pow.} · {data}” (600 15 px), po prawej podziałka 5 m z podpisem „5 m”.

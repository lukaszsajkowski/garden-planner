# PRD: Planer ogrodu

| | |
|---|---|
| Status | Zatwierdzony do specyfikacji |
| Data | 2026-10-05 |
| Źródło | Prototyp na canvasie „Planer ogrodu” (https://claude.ai/artifact/NBz2MV5DsZHGgVw7jWKtE8), kopia: `docs/reference/prototype.dc.html` |
| Spec techniczny | `docs/superpowers/specs/2026-10-05-planer-ogrodu-design.md` |
| Design | `design/tokens.json`, `design/components.md`, `design/screens.md` |

## 1. Problem i cel

Chcemy rozplanować własny ogród w prawdziwej skali: obrysować działkę z mapki geodezyjnej, rozmieścić dom, nawierzchnie, rabaty i rośliny, a potem znać powierzchnie (ile kostki, ile trawnika, jaki procent powierzchni biologicznie czynnej). Prototyp robi to dobrze, ale jest jednym plikiem HTML, bez testów i trudnym do rozwijania.

**Cel:** zbudować utrzymywalną aplikację o funkcjach i wyglądzie 1:1 z prototypem, z czystym podziałem na domenę, stan i UI oraz testami, które pilnują obliczeń.

## 2. Użytkownik

Właściciel działki i jego rodzina. Jeden użytkownik naraz, na komputerze (mysz/touchpad), po polsku. Nie jest projektantem ani geodetą. Zna wymiary z mapki albo z taśmy mierniczej.

## 3. Miary sukcesu

- Plan zapisany w prototypie otwiera się w aplikacji bez utraty danych.
- Dla przykładowego planu podsumowanie pokazuje te same liczby co prototyp (tabela w §6.8).
- Każda funkcja z §6 ma kryterium akceptacji pokryte testem (jednostkowym, komponentowym lub e2e).
- Narysowanie działki z mapki (wczytaj, kalibruj, obrysuj) zajmuje osobie znającej prototyp nie więcej czasu niż w prototypie.

## 4. Zakres

**W zakresie:** wszystkie funkcje prototypu (§6), ten sam wygląd i teksty, plik JSON zgodny z prototypem.

**Poza zakresem (później):** nowe typy obiektów (ogrodzenie, oczko wodne, warzywnik, meble, linie instalacji), katalog roślin, warstwy, blokowanie, obrót, redo, skróty klawiszowe, kopiuj/wklej, warianty i etapy planu, PDF w skali, lista zakupów i kosztorys, układ mobilny i obsługa dotykowa, konta, chmura, udostępnianie.

## 5. Założenia i ograniczenia

- Aplikacja statyczna (Vite + TypeScript + React), bez backendu i bez telemetrii. Po zbudowaniu działa offline.
- Dane zostają w przeglądarce (localStorage) i w plikach, które użytkownik zapisuje.
- Jednostką jest metr. Układ: początek w lewym górnym rogu, X w prawo, Y w dół.
- Interfejs tylko po polsku. Liczby z przecinkiem dziesiętnym, przy wpisywaniu akceptowane są przecinek i kropka.

## 6. Wymagania funkcjonalne

Identyfikatory (F-x.y) są używane w planie implementacji i w nazwach testów.

### 6.1 Typy elementów

| Typ | Etykieta | Rodzaj | Warstwa (z) | Domyślnie |
|---|---|---|---|---|
| `boundary` | Granica działki | obszar | 0 | linia przerywana, bez wypełnienia |
| `grass` | Trawnik | obszar | 1 | |
| `gravel` | Żwir | obszar | 2 | |
| `paving` | Kostka brukowa | obszar | 2 | |
| `bed` | Rabata | obszar | 3 | |
| `house` | Dom / budynek | obszar | 4 | |
| `shrub` | Krzew | roślina | 5 | r = 0,6 m |
| `conifer` | Iglak | roślina | 6 | r = 1,0 m |
| `tree` | Drzewo liściaste | roślina | 7 | r = 2,5 m |

- **F-1.1** Elementy rysowane są od najniższej warstwy. Przy tej samej warstwie decyduje kolejność dodania (późniejszy wyżej).
- **F-1.2** Kolejność w panelu narzędzi: obszary `boundary, grass, paving, gravel, bed, house`; rośliny `tree, conifer, shrub`.

### 6.2 Rysowanie obszarów

- **F-2.1 Wielokąt klikami.** Każde kliknięcie dodaje narożnik (z przyciąganiem, §6.5). Kształt zamyka: kliknięcie pierwszego punktu (w promieniu 10 px, gdy są co najmniej 3 punkty), dwuklik albo przycisk „Zamknij kształt”. Punkt odległy od poprzedniego o mniej niż 5 mm jest ignorowany.
- **F-2.2 Wielokąt z wymiarów.** Gdy szkic jest pusty: pola „Start X/Y (m)” i przycisk „Ustaw punkt startowy”. Gdy w szkicu jest punkt: pola „Długość (m)” i „Kąt (°)” (0° w prawo, 90° w górę, 180° w lewo, 270° w dół) i przycisk „Dodaj odcinek”.
- **F-2.3 Szkic.** Przyciski „Cofnij punkt” i „Anuluj” są nieaktywne przy pustym szkicu, „Zamknij kształt” przy mniej niż 3 punktach. Podgląd pokazuje linię do kursora, długości odcinków i informację „Punkty: n · odcinek X m · α°”. Pierwszy punkt jest większy i wypełniony, gdy da się nim zamknąć kształt.
- **F-2.4 Prostokąt przeciąganiem.** Przeciągnięcie rysuje prostokąt wyrównany do osi. Krótszy bok poniżej 0,1 m anuluje rysowanie.
- **F-2.5 Prostokąt z wymiarów.** Pola X, Y, Szerokość, Głębokość (domyślnie 0, 0, 10, 8) i przycisk „Wstaw prostokąt”.
- **F-2.6** Po zamknięciu obszaru narzędzie przełącza się na „Zaznacz i przesuń”, a nowy element jest zaznaczony.

### 6.3 Sadzenie roślin

- **F-3.1** Przy narzędziu rośliny każde kliknięcie sadzi roślinę w miejscu kursora (z przyciąganiem), z domyślnym promieniem. Narzędzie pozostaje aktywne, a nowa roślina jest zaznaczona.

### 6.4 Zaznaczanie i edycja

- **F-4.1 Trafienie.** Kolejność: rośliny (odległość od środka ≤ max(0,75·r, 8 px)), potem krawędź granicy działki (≤ 8 px), potem wnętrza pozostałych obszarów. W każdej grupie wygrywa element najwyżej w warstwach. Kliknięcie w puste miejsce odznacza.
- **F-4.2 Przesuwanie** zaznaczonego elementu przeciąganiem, z krokiem przyciągania, liczone od miejsca chwycenia.
- **F-4.3 Wierzchołki.** Zaznaczony obszar pokazuje kwadratowe uchwyty. Przeciągnięcie uchwytu (≤ 9 px) przesuwa wierzchołek z przyciąganiem. Dwuklik na krawędzi (≤ 10 px) wstawia nowy wierzchołek.
- **F-4.4 Inspektor obszaru:** nazwa (placeholder = etykieta typu), chipy zmiany typu (tylko obszary), powierzchnia, obwód, „Do zamówienia z zapasem 5%” (dla trawnika, kostki i żwiru), lista wierzchołków z polami X/Y i przyciskiem usuwania (nieaktywnym przy 3 punktach), długości boków „i–j”, przyciski Duplikuj i Usuń.
- **F-4.5 Inspektor rośliny:** nazwa/gatunek, chipy typu (tylko rośliny), pola X, Y, „Korona Ø (m)” (> 0), Duplikuj, Usuń. Zmiana typu rośliny z domyślnym promieniem ustawia domyślny promień nowego typu. Promień zmieniony ręcznie zostaje.
- **F-4.6 Duplikuj** tworzy kopię przesuniętą o (+1 m, +1 m) i ją zaznacza.
- **F-4.7 Lista „Elementy planu”** pokazuje elementy od najnowszego: „Nazwa · Typ” lub sam typ, a obok powierzchnię albo „Ø d m”. Kliknięcie zaznacza element i włącza narzędzie wyboru. Pusty plan: „Plan jest pusty. Zacznij od narzędzia „Granica działki”.”
- **F-4.8 Pola liczbowe** przyjmują przecinek lub kropkę. Poprawna wartość zmienia element od razu. Wpisany tekst zostaje w polu do jego opuszczenia, po czym pole pokazuje wartość z modelu. Wartość niepoprawna nie zmienia modelu.

### 6.5 Siatka, przyciąganie, widok

- **F-5.1** Krok przyciągania: 1 m / 0,5 m (domyślnie) / 0,1 m / Wył. Bez kroku współrzędne są zaokrąglane do 0,01 m.
- **F-5.2** „Kąty co 15° przy rysowaniu” (domyślnie wył.): w wielokącie klikanym kierunek odcinka jest zaokrąglany do 15°, a długość do kroku.
- **F-5.3** „Wymiary granicy działki” (domyślnie wł.): długości boków granicy na planie. Etykieta pojawia się tylko dla boków dłuższych niż 44 px na ekranie.
- **F-5.4** „Nazwy i powierzchnie” (domyślnie wł.): etykiety obszarów w centroidzie (tylko gdy obrys ma na ekranie co najmniej 70×36 px), etykieta działki przy narożniku najbliższym (0,0), etykiety nazwanych roślin.
- **F-5.5** Zoom: stopnie 8, 12, 16, 20, 28 (domyślnie), 36, 48, 64, 80 px/m. Wskaźnik „1 m = N px”. Podziałka 2 m przy ≥ 40 px/m, 5 m przy ≥ 16 px/m, w pozostałych przypadkach 10 m (tak samo opisane są linijki).
- **F-5.6** Siatka: linia pomocnicza co 1 m, główna co 5 m. Pozycja kursora: „X 0,00 m   Y 0,00 m” albo „Najedź na plan”.
- **F-5.7** Obszar rysunku: szerokość i głębokość od 5 do 500 m (domyślnie 30 × 22).

### 6.6 Podkład (mapka działki)

- **F-6.1** Wczytanie obrazu (image/*). Obraz dłuższy niż 2400 px albo większy niż 1,5 MB jest pomniejszany do 2400 px i zapisywany jako JPEG 0,86 na białym tle. Mapka jest dopasowywana do obszaru rysunku od (0,0), z kryciem 60%. Od razu włącza się tryb kalibracji.
- **F-6.2 Kalibracja.** Użytkownik klika dwa punkty (trzecie kliknięcie zaczyna od nowa) i wpisuje „Rzeczywistą odległość (m)”. „Zastosuj skalę” (aktywny przy 2 punktach i odległości > 0) skaluje mapkę o f = rzeczywista / zmierzona względem pierwszego punktu. Ujemne X/Y są przycinane do 0. Obszar rysunku powiększa się, aby mapka się zmieściła (maksymalnie 500 m).
- **F-6.3** „Przesuń mapkę”: przeciąganie przesuwa mapkę. Kalibracja i przesuwanie wyłączają się wzajemnie. Oba tryby czyszczą zaznaczenie i szkic oraz włączają narzędzie wyboru.
- **F-6.4** Widoczność (krycie) 10–100% co 5. Pola Szer. / X / Y (m). Przyciski Ukryj/Pokaż, Zmień, Usuń.
- **F-6.5** Mapka jest pod wszystkimi elementami i nie przechwytuje kliknięć.

### 6.7 Historia

- **F-7.1** „Cofnij” cofa ostatnią zmianę elementów planu (do 80 kroków). Przycisk jest nieaktywny, gdy historia jest pusta.
- **F-7.2** Krok zapisuje się raz na: dodanie, usunięcie, duplikat, zmianę typu, wstawienie lub usunięcie wierzchołka, przeciągnięcie (przy pierwszym ruchu), wejście w pole liczbowe inspektora, otwarcie pliku, przykładowy plan i nowy plan.
- **F-7.3** Historia nie obejmuje: mapki, rozmiaru obszaru rysunku, zoomu, narzędzia i przełączników. Zmiana nazwy nie tworzy osobnego kroku.

### 6.8 Podsumowanie

Gdy nic nie jest zaznaczone, prawa kolumna pokazuje podsumowanie.

- **F-8.1** Kafelki: „Działka” (suma pól wszystkich granic) i „Biologicznie czynna” = round((trawnik + rabata) / działka · 100)% albo „—”.
- **F-8.2 Powierzchnie netto** liczone rastrem 0,2 × 0,2 m (środki komórek). Uwzględniane są komórki wewnątrz dowolnej granicy, a bez granicy wszystkie w obrysie (bbox) obszarów. Komórka należy do najwyższego obszaru, który ją zawiera, a gdy żaden jej nie zawiera, liczy się jako niezagospodarowana.
- **F-8.3** Wiersze w kolejności trawnik, kostka, żwir, rabata, dom, pokazywane tylko gdy > 0,001 m². „Niezagospodarowane”, gdy jest działka i wartość > 0,05 m². Liczba sztuk drzew, iglaków i krzewów („n szt.”).
- **F-8.4 Wartości referencyjne dla „Przykładowego planu”** (z prototypu):

| Pozycja | Wartość dokładna | Wyświetlane |
|---|---|---|
| Działka | 508,25 m² | 508 m² |
| Trawnik (netto) | 338,44 m² | 338 m² |
| Kostka brukowa (netto) | 48,80 m² | 48,8 m² |
| Żwir (netto) | 6,00 m² | 6,0 m² |
| Rabata (netto) | 27,20 m² | 27,2 m² |
| Dom / budynek (netto) | 88,00 m² | 88,0 m² |
| Niezagospodarowane | 0 | (ukryte) |
| Biologicznie czynna | | 72% |
| Drzewo liściaste / Iglak / Krzew | | 2 / 3 / 3 szt. |

- **F-8.5** Format: powierzchnia ≥ 100 m² bez miejsc po przecinku, poniżej jedno miejsce; długość dwa miejsca, „ m”.

### 6.9 Pliki i trwałość

- **F-9.1 Zapisz plik:** `plan-ogrodu-RRRR-MM-DD.json` w formacie `{ app: "planer-ogrodu", version: 1, savedAt, W, H, shapes, bg }`. Pobieranie rusza samo, a pasek komunikatu ma dodatkowo link „Pobierz …”.
- **F-9.2 Otwórz plik:** walidacja wg §5 specyfikacji technicznej. Sukces: „Wczytano „nazwa”: n elementów [i mapka].” Błąd: „Nie udało się wczytać pliku „nazwa”: powód.” Plan pozostaje wtedy bez zmian.
- **F-9.3 Eksport PNG:** `plan-ogrodu-RRRR-MM-DD.png`. Skala S = clamp(floor(6000 / max(W,H)), 10, 60) px/m, margines 56 px. Na obrazie: siatka, opisy osi co 5 m, mapka (jeśli widoczna), obszary w kolorach jednolitych, rośliny, granica z wymiarami, etykiety, a w stopce „Plan ogrodu · działka X m² · data” i podziałka 5 m.
- **F-9.4 Autozapis** W, H, shapes i bg do localStorage (`planer-ogrodu-v1`) po każdej zmianie. Gdy brakuje miejsca, zapis idzie bez mapki. Przy starcie plan jest odtwarzany z autozapisu, a gdy go brak, ładowany jest przykładowy plan.
- **F-9.5** „Przykładowy plan” wczytuje plan referencyjny (§6.8) i ustawia obszar 30 × 22. „Nowy plan” czyści elementy i włącza narzędzie „Granica działki” w trybie wielokąta. Mapka i rozmiar obszaru zostają.

### 6.10 Komunikaty i podpowiedzi

- **F-10.1** Jeden pasek komunikatu (`role="status"`) pod nagłówkiem, z przyciskiem zamknięcia. Nowy komunikat zastępuje poprzedni.
- **F-10.2** Stopka planu pokazuje podpowiedź zależną od kontekstu (teksty w `design/screens.md`).

## 7. Wymagania niefunkcjonalne

- **NF-1 Wydajność:** płynne przeciąganie przy planie do 200 elementów. Powierzchnie netto liczone są tylko po zmianie elementów (memoizacja), nie przy ruchu kursora.
- **NF-2 Przeglądarki:** aktualne Chrome, Firefox, Safari na komputerze.
- **NF-3 Dostępność:** natywne przyciski, linki i pola, każde pole z etykietą, `aria-pressed` na przełącznikach, `aria-label` na przyciskach z samą ikoną, widoczny focus (2 px, akcent), kontrast tekstu ≥ 4,5:1, cele kliknięcia ≥ 40 px (akcje główne 44 px).
- **NF-4 Prywatność:** brak żądań sieciowych poza czcionkami Google Fonts. Do wydania czcionki można dołączyć lokalnie.
- **NF-5 Odporność:** brak localStorage nie blokuje aplikacji. Błędne dane wejściowe nigdy nie psują planu.
- **NF-6 Jakość:** TypeScript strict, testy domeny i reducera w CI (lokalnie `npm test`), e2e w Playwright.

## 8. Ryzyka i otwarte kwestie

- Raster 0,2 m daje błąd przy wąskich pasach (np. ścieżka 0,3 m). To świadoma zgodność z prototypem. Dokładne operacje na wielokątach to temat na później.
- Mapka w data URL powiększa plik JSON i może przepełnić localStorage. Mamy fallback (zapis bez mapki), ale użytkownik nie jest o tym informowany, tak jak w prototypie.

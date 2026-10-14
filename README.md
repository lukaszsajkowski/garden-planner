# Planer ogrodu

Statyczna aplikacja do planowania ogrodu.

[Otwórz planer ogrodu](https://lukaszsajkowski.github.io/garden-planner/)

Plany są zapisywane lokalnie w przeglądarce (localStorage). Można je również
zapisywać i otwierać jako pliki JSON oraz eksportować do PNG. Dane planów nie
są wysyłane na serwer.

## Uruchomienie lokalne

Wymagany Node.js 22 i npm.

```sh
npm ci
npm run dev
```

Aplikacja działa pod adresem `http://localhost:5173/garden-planner/`.

## Weryfikacja

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run e2e
```

Testy E2E budują aplikację i sprawdzają produkcyjny build pod `/garden-planner/`.

## GitHub Pages

W ustawieniach repozytorium **Settings → Pages → Build and deployment → Source**
wybierz **GitHub Actions** (jednorazowo przed pierwszym wdrożeniem).

Push na `main` uruchamia CI: sprawdzenie typów, testy jednostkowe, testy E2E
i build. Dopiero po powodzeniu całego zadania `test` zadanie `deploy` publikuje
artefakt `dist` na GitHub Pages. Pull requesty uruchamiają sprawdzenia bez
publikowania. Nieudane CI blokuje wdrożenie i pozostawia poprzednią wersję strony.

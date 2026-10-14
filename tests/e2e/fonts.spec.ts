import { expect, test } from '@playwright/test';

test.describe('NF-4: Lokalne czcionki i prywatność', () => {
  test('brak zewnętrznych żądań sieciowych poza własnym hostem', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.protocol !== 'data:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        externalRequests.push(req.url());
      }
    });

    await page.goto('./');
    await page.waitForLoadState('networkidle');

    // Interakcja z aplikacją nie wywołuje żadnych żądań sieciowych
    await page.getByRole('button', { name: 'Nowy plan' }).click();
    await page.getByRole('button', { name: 'Przykładowy plan' }).click();

    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Eksport PNG' }).click();
    await downloading;

    expect(externalRequests).toEqual([]);
  });

  test('lokalne czcionki IBM Plex Sans i Mono obsługują polskie znaki', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const fontsStatus = await page.evaluate(async () => {
      const polishText = 'Zażółć gęślą jaźń 123,45 m²';
      await Promise.all([
        document.fonts.load("400 14px 'IBM Plex Sans'", polishText),
        document.fonts.load("500 14px 'IBM Plex Sans'", polishText),
        document.fonts.load("600 14px 'IBM Plex Sans'", polishText),
        document.fonts.load("400 12px 'IBM Plex Mono'", polishText),
        document.fonts.load("500 12px 'IBM Plex Mono'", polishText),
      ]);
      return {
        sans400: document.fonts.check("400 14px 'IBM Plex Sans'", polishText),
        sans500: document.fonts.check("500 14px 'IBM Plex Sans'", polishText),
        sans600: document.fonts.check("600 14px 'IBM Plex Sans'", polishText),
        mono400: document.fonts.check("400 12px 'IBM Plex Mono'", polishText),
        mono500: document.fonts.check("500 12px 'IBM Plex Mono'", polishText),
        count: Array.from(document.fonts).length,
      };
    });

    expect(fontsStatus.sans400).toBe(true);
    expect(fontsStatus.sans500).toBe(true);
    expect(fontsStatus.sans600).toBe(true);
    expect(fontsStatus.mono400).toBe(true);
    expect(fontsStatus.mono500).toBe(true);
    expect(fontsStatus.count).toBe(10);
  });

  test('aplikacja działa w trybie offline po pierwszym wczytaniu', async ({ page, context }) => {
    await page.goto('./');
    await page.waitForLoadState('networkidle');

    // Odłączenie sieci
    await context.setOffline(true);

    // Zmiana stanu aplikacji offline
    await page.getByRole('button', { name: 'Nowy plan' }).click();
    const list = page.getByRole('region', { name: 'Elementy planu' });
    await expect(list.getByText('Plan jest pusty.', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: 'Przykładowy plan' }).click();
    await expect(list.getByRole('button')).toHaveCount(15);

    // Eksport PNG działa w trybie offline
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Eksport PNG' }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/^plan-ogrodu-\d{4}-\d{2}-\d{2}\.png$/);
  });
});

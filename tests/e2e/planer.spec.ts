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
  // Sama granica: „Działka” i „Niezagospodarowane” mają po 80 m², sprawdzamy kafelek działki.
  const summary = page.getByRole('region', { name: 'Podsumowanie' });
  await expect(summary.getByText('Działka', { exact: true }).locator('..')).toContainText('80,0 m²');
  await expect(summary.getByText('Niezagospodarowane').locator('..')).toContainText('80,0 m²');
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

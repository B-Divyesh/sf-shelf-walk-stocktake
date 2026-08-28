import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { parseCsv } from '../../src/csv';

const csv = `sku,name,barcode,location,expected
N-001,Hex nuts,8901111111111,Aisle 2 / Bay 1 / Shelf A,12
B-010,Box tape,8902222222222,Aisle 2 / Bay 1 / Shelf B,6
W-100,Washers,8903333333333,Aisle 10 / Bay 4 / Shelf C,20`;

test('imports, counts in shelf order, records variance and reaches export', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Walk the shelf');
  await page.locator('#csv-file').setInputFiles({ name: 'shelf.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.locator('.location-stamp')).toContainText('Aisle 2 / Bay 1 / Shelf A');
  await page.locator('#counted').fill('10');
  await page.locator('#reason').selectOption('Damaged');
  await page.getByRole('button', { name: /Save & next shelf/ }).click();
  await expect(page.locator('.location-stamp')).toContainText('Shelf B');
  await page.locator('#item-search').fill('8903333333333');
  await page.locator('.search-results [role="option"]').click();
  await expect(page.locator('.location-stamp')).toContainText('Aisle 10');
  await page.locator('#counted').fill('20');
  await page.getByRole('button', { name: /Save & next shelf/ }).click();
  await page.getByRole('button', { name: /Review/ }).first().click();
  await expect(page.getByText('1 still uncounted')).toBeVisible();
  await expect(page.locator('.summary-strip')).toContainText('1');
  await page.getByRole('button', { name: /Finish/ }).click();
  await expect(page.getByRole('button', { name: 'Export 1 variances' })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export 1 variances' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const output = await readFile(path!, 'utf8');
  const variance = parseCsv(output)[1];
  expect(variance.slice(4, 7)).toEqual(['12', '10', '-2']);
  expect(output).toContain(',12,10,-2,');
  expect(output).not.toContain("'-2");
});

test('landing page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  expect(results.violations.filter((v) => ['serious','critical'].includes(v.impact ?? ''))).toEqual([]);
});

test('count and legal pages pass the accessibility smoke check', async ({ page }) => {
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles({ name: 'shelf.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  const countResults = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  expect(countResults.violations.filter((v) => ['serious','critical'].includes(v.impact ?? ''))).toEqual([]);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const darkResults = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  expect(darkResults.violations.filter((v) => ['serious','critical'].includes(v.impact ?? ''))).toEqual([]);
  await page.goto('/privacy/');
  const legalResults = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  expect(legalResults.violations.filter((v) => ['serious','critical'].includes(v.impact ?? ''))).toEqual([]);
});

test('scanner fallback is keyboard-contained, restores focus, and respects reduced motion', async ({ page }) => {
  await page.addInitScript(() => { delete (window as Window & { BarcodeDetector?: unknown }).BarcodeDetector; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles({ name: 'shelf.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });

  const scan = page.getByRole('button', { name: 'Scan barcode' });
  await scan.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Scan a barcode' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Barcode', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close scanner' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Find item' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close scanner' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(scan).toBeFocused();
  await expect(scan).toHaveCSS('transition-duration', '0s');
});

test('reopens the cached app offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, { timeout: 15_000 });
  const cached = await page.evaluate(async () => {
    const cacheName = (await caches.keys()).find((name) => name.startsWith('shelf-walk-v'));
    if (!cacheName) return { paths: [], appBytes: 0 };
    const cache = await caches.open(cacheName);
    const paths = (await cache.keys()).map((request) => new URL(request.url).pathname);
    const appPath = paths.find((path) => path.startsWith('/assets/app-'));
    const appResponse = appPath ? await cache.match(appPath) : undefined;
    return { paths, appBytes: appResponse ? (await appResponse.arrayBuffer()).byteLength : 0 };
  });
  expect(cached.paths.some((path) => path.startsWith('/assets/app-'))).toBe(true);
  expect(cached.appBytes).toBeGreaterThan(20_000);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Walk the shelf');
  expect(errors).toEqual([]);
});

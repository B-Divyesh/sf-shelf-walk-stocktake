import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { parseCsv } from '../../src/csv';

const csv = `sku,name,barcode,location,expected
N-001,Hex nuts,8901111111111,Aisle 2 / Bay 1 / Shelf A,12
B-010,Box tape,8902222222222,Aisle 2 / Bay 1 / Shelf B,6
W-100,Washers,8903333333333,Aisle 10 / Bay 4 / Shelf C,20`;

function importCsv(rowCount: number, targetBytes?: number): string {
  const header = 'sku,name,barcode,location,expected';
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const sequence = String(index + 1).padStart(5, '0');
    return `CAP-${sequence},,89000000${sequence},Aisle 01 / Bay 01 / Shelf ${String((index % 26) + 1).padStart(2, '0')},1`;
  });
  const unpadded = [header, ...rows].join('\n');
  if (!targetBytes) return unpadded;

  const padding = targetBytes - Buffer.byteLength(unpadded);
  if (padding < 0) throw new Error('Requested CSV size is smaller than its rows.');
  const paddingPerRow = Math.floor(padding / rowCount);
  const extraPadding = padding % rowCount;
  return [header, ...rows.map((row, index) => row.replace(',,', `,${'x'.repeat(paddingPerRow + (index === 0 ? extraPadding : 0))},`))].join('\n');
}

test('imports, counts in shelf order, records variance and reaches export', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Count stock in one');
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
  await expect(page.getByText(/Buy Pro|₹799/)).toHaveCount(0);

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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Count stock in one local stockroom.');
  await expect(page.getByText('For wholesalers, workshops, and retailers who need a shelf-ordered count without an ERP.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toHaveAttribute('href', '/demo/');
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
  await page.goto('/demo/');
  const demoResults = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  expect(demoResults.violations.filter((v) => ['serious','critical'].includes(v.impact ?? ''))).toEqual([]);
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

test('manual scanner controls find a barcode and close without navigating', async ({ page }) => {
  await page.addInitScript(() => { delete (window as Window & { BarcodeDetector?: unknown }).BarcodeDetector; });
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles({ name: 'shelf.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });

  const scan = page.getByRole('button', { name: 'Scan barcode' });
  await scan.click();
  const dialog = page.getByRole('dialog', { name: 'Scan a barcode' });
  await dialog.getByRole('textbox', { name: 'Barcode', exact: true }).fill('8903333333333');
  await dialog.getByRole('button', { name: 'Find item' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.location-stamp')).toContainText('Aisle 10 / Bay 4 / Shelf C');

  await scan.click();
  await page.getByRole('button', { name: 'Close scanner' }).click();
  await expect(dialog).toBeHidden();
  await expect(scan).toBeFocused();
});

test('manual scanner remains usable when camera permission is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'BarcodeDetector', { configurable: true, value: class {} });
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Denied', 'NotAllowedError'))
    });
  });
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles({ name: 'shelf.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: 'Scan barcode' }).click();
  const dialog = page.getByRole('dialog', { name: 'Scan a barcode' });
  await expect(dialog.getByRole('status')).toContainText('Camera access was blocked or unavailable');
  await dialog.getByRole('textbox', { name: 'Barcode', exact: true }).fill('8902222222222');
  await dialog.getByRole('button', { name: 'Find item' }).click();
  await expect(page.locator('.location-stamp')).toContainText('Aisle 2 / Bay 1 / Shelf B');
});

test('keyboard import focus is visible, skip focus reaches main, and mobile links meet target size', async ({ page }) => {
  await page.goto('/');
  const picker = page.locator('.file-picker');
  await page.locator('#csv-file').focus();
  await expect(picker).toHaveCSS('outline-width', '3px');
  await page.getByRole('link', { name: 'Skip to stocktake' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  for (const link of [page.locator('.brand'), page.locator('.site-footer a').first(), page.locator('.site-footer a').nth(1)]) {
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
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
    const appPath = paths.find((path) => path.startsWith('/assets/main-'));
    const appResponse = appPath ? await cache.match(appPath) : undefined;
    return { paths, appBytes: appResponse ? (await appResponse.arrayBuffer()).byteLength : 0 };
  });
  expect(cached.paths.some((path) => path.startsWith('/assets/main-'))).toBe(true);
  expect(cached.appBytes).toBeGreaterThan(20_000);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Count stock in one');
  expect(errors).toEqual([]);
});

test('announces an installed service-worker update', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, { timeout: 15_000 });
  await page.evaluate(async () => { await navigator.serviceWorker.register('/sw.js?update=probe'); });
  await expect(page.getByRole('status')).toContainText('An update is ready. Reload to use it.');
});

test('@claim:demo-sandbox opens a six-item sample in a separate demo IndexedDB namespace', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByLabel('Demo controls')).toContainText('Demo — sample data, nothing is saved to your real stocktake.');
  await expect(page.locator('.location-stamp')).toContainText('Aisle 01 / Bay 02 / Shelf A');
  await expect(page.locator('.progress-copy')).toContainText('0 / 6');
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databases).toContain('demo:shelf-walk-stocktake');
  expect(databases).not.toContain('shelf-walk-stocktake');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.progress-copy')).toContainText('0 / 6');
  await page.goto('/?demo=1');
  await expect(page.getByLabel('Demo controls')).toBeVisible();
  await expect(page).toHaveTitle('Demo — Shelf Walk Stocktake');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  const remaining = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(remaining).not.toContain('demo:shelf-walk-stocktake');
});

test('@claim:shelf-order keeps the bundled sample in natural full shelf-path order', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('.location-stamp')).toContainText('Aisle 01 / Bay 02 / Shelf A');
  await page.getByRole('button', { name: /Save & next shelf/ }).click();
  await expect(page.locator('.location-stamp')).toContainText('Aisle 01 / Bay 02 / Shelf B');
});

test('@claim:csv-export downloads a variance CSV with the full location and numeric shortage', async ({ page }) => {
  await page.goto('/demo/');
  await page.locator('#counted').fill('118');
  await page.locator('#reason').selectOption('Damaged');
  await page.getByRole('button', { name: /Save & next shelf/ }).click();
  await page.getByRole('button', { name: /Finish/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export 1 variances' }).click();
  const output = await readFile(await (await downloadPromise).path()!, 'utf8');
  expect(parseCsv(output)[1].slice(0, 7)).toEqual(['FIX-100', 'M8 hex nuts', '8901111111111', 'Aisle 01 / Bay 02 / Shelf A', '120', '118', '-2']);
  const auditPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export audit trail' }).click();
  expect(parseCsv(await readFile(await (await auditPromise).path()!, 'utf8'))[0]).toContain('timestamp');
});

test('@claim:offline-reload reopens the sample count offline after its first visit', async ({ page, context }) => {
  await page.goto('/demo/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, { timeout: 15_000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel('Demo controls')).toBeVisible();
  await expect(page.locator('.location-stamp')).toContainText('Aisle 01 / Bay 02 / Shelf A');
});

test('@claim:privacy-local keeps a demo count local and makes only same-origin requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await page.locator('#counted').fill('118');
  await page.locator('#reason').selectOption('Damaged');
  await page.getByRole('button', { name: /Save & next shelf/ }).click();
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databases).toContain('demo:shelf-walk-stocktake');
  expect(databases).not.toContain('shelf-walk-stocktake');
});

test('@claim:manual-barcode finds a sample item when camera scanning is unavailable', async ({ page }) => {
  await page.addInitScript(() => { delete (window as Window & { BarcodeDetector?: unknown }).BarcodeDetector; });
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Scan barcode' }).click();
  const dialog = page.getByRole('dialog', { name: 'Scan a barcode' });
  await dialog.getByRole('textbox', { name: 'Barcode', exact: true }).fill('8905555555555');
  await dialog.getByRole('button', { name: 'Find item' }).click();
  await expect(page.locator('.location-stamp')).toContainText('Aisle 10 / Bay 04 / Shelf A');
});

test('@claim:import-capacity accepts a 10,000-row 2 MB CSV and rejects each limit beyond that boundary', async ({ page }) => {
  const accepted = importCsv(10_000, 1_999_900);
  expect(Buffer.byteLength(accepted)).toBe(1_999_900);

  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Import a CSV in demo' }).click();
  await expect(page.getByLabel('Demo controls')).toContainText('sample data, nothing is saved to your real stocktake');
  await page.locator('#csv-file').setInputFiles({ name: '10k-under-2mb.csv', mimeType: 'text/csv', buffer: Buffer.from(accepted) });
  await expect(page.locator('.progress-copy')).toContainText('0 / 10000', { timeout: 30_000 });
  await expect(page.locator('#counted')).toBeVisible();

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('button', { name: 'Import a CSV in demo' }).click();
  await page.locator('#csv-file').setInputFiles({ name: '10001-rows.csv', mimeType: 'text/csv', buffer: Buffer.from(importCsv(10_001)) });
  await expect(page.locator('#import-error')).toHaveText('This count supports up to 10,000 items per file.');

  const tooLarge = importCsv(1, 2_000_001);
  expect(Buffer.byteLength(tooLarge)).toBe(2_000_001);
  await page.locator('#csv-file').setInputFiles({ name: 'over-2mb.csv', mimeType: 'text/csv', buffer: Buffer.from(tooLarge) });
  await expect(page.locator('#import-error')).toHaveText('That file is over 2 MB. Split it into smaller shelf lists.');
});

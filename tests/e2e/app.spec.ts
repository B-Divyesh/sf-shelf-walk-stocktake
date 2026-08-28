import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test('reopens the cached app offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, { timeout: 15_000 });
  const cached = await page.evaluate(async () => (await (await caches.open('shelf-walk-v1')).keys()).map((request) => new URL(request.url).pathname));
  expect(cached.some((path) => path.startsWith('/assets/app-'))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Walk the shelf');
  expect(errors).toEqual([]);
});

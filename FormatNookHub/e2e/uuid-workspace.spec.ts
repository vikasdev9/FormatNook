import { test, expect } from '@playwright/test';

test.describe('UUID / GUID Generator Workspace Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/uuid-generator');
    await page.waitForSelector('[data-testid="uuid-workspace"]', { timeout: 20000 });
  });

  test('1. Loads UUID Generator workspace with controls and initial 10 UUIDs', async ({ page }) => {
    const workspace = page.getByTestId('uuid-workspace');
    await expect(workspace).toBeVisible();

    const panel = page.getByTestId('uuid-generator-panel');
    await expect(panel).toBeVisible();

    const qtyInput = page.getByTestId('uuid-quantity-input');
    await expect(qtyInput).toHaveValue('10');

    const totalBadge = page.getByTestId('badge-total-uuids');
    await expect(totalBadge).toContainText('10 total');

    // 10 result rows
    const firstRow = page.getByTestId('uuid-row-0');
    await expect(firstRow).toBeVisible();
  });

  test('2. Generates custom quantities (1, 25, 50) using presets and input', async ({ page }) => {
    // Preset 25
    await page.getByTestId('preset-25').click();
    await expect(page.getByTestId('badge-total-uuids')).toContainText('25 total');

    // Preset 1
    await page.getByTestId('preset-1').click();
    await expect(page.getByTestId('badge-total-uuids')).toContainText('1 total');

    // Custom input 50
    const qtyInput = page.getByTestId('uuid-quantity-input');
    await qtyInput.fill('50');
    await page.getByTestId('btn-generate-uuids').click();
    await expect(page.getByTestId('badge-total-uuids')).toContainText('50 total');
  });

  test('3. Toggles uppercase and braces formatting options dynamically', async ({ page }) => {
    const firstRowValue = page.getByTestId('uuid-value-0');

    // Uppercase toggle
    await page.getByTestId('opt-uppercase').click();
    const upperText = await firstRowValue.innerText();
    expect(upperText).toMatch(/^[0-9A-F-]+$/);

    // Braces toggle
    await page.getByTestId('opt-braces').click();
    const bracedText = await firstRowValue.innerText();
    expect(bracedText.startsWith('{')).toBe(true);
    expect(bracedText.endsWith('}')).toBe(true);
  });

  test('4. Dedicated routes /tools/uuid-validator and /tools/uuid-converter load their respective tabs', async ({
    page,
  }) => {
    await page.goto('/tools/uuid-validator');
    await page.waitForSelector('[data-testid="uuid-workspace"]', { timeout: 20000 });

    await expect(page.getByTestId('uuid-validator-panel')).toBeVisible();
    await expect(page.getByTestId('tab-validator')).toHaveAttribute('aria-selected', 'true');

    await page.goto('/tools/uuid-converter');
    await page.waitForSelector('[data-testid="uuid-workspace"]', { timeout: 20000 });

    await expect(page.getByTestId('uuid-converter-panel')).toBeVisible();
    await expect(page.getByTestId('tab-converter')).toHaveAttribute('aria-selected', 'true');
  });

  test('5. Validates UUIDs and displays version/variant statistics', async ({ page }) => {
    await page.getByTestId('tab-validator').click();
    await expect(page.getByTestId('uuid-validator-panel')).toBeVisible();

    const textarea = page.getByTestId('validator-textarea');
    await textarea.fill('550e8400-e29b-41d4-a716-446655440000\ninvalid-uuid-here');

    await expect(page.getByTestId('stat-total')).toHaveText('2');
    await expect(page.getByTestId('stat-valid')).toHaveText('1');
    await expect(page.getByTestId('stat-invalid')).toHaveText('1');
    await expect(page.getByTestId('stat-v4')).toHaveText('1');
  });

  test('6. Clears generated UUID results', async ({ page }) => {
    await page.getByTestId('btn-clear-uuids').click();
    await expect(page.getByTestId('badge-total-uuids')).toContainText('0 total');
    await expect(page.getByText(/No UUIDs generated yet/i)).toBeVisible();
  });

  test('7. Responsive mobile viewport (390px) renders without horizontal scroll overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/uuid-generator');
    await page.waitForSelector('[data-testid="uuid-workspace"]', { timeout: 20000 });

    const workspace = page.getByTestId('uuid-workspace');
    await expect(workspace).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

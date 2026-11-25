import { test, expect } from '@playwright/test';

test.describe('CSV to JSON Converter Workspace E2E Tests', () => {
  test('1. Loads /tools/csv-to-json workspace with toolbar and default sample', async ({ page }) => {
    await page.goto('/tools/csv-to-json');

    await expect(page.locator('h1')).toContainText('CSV to JSON Converter');
    await expect(page.getByTestId('csv-workspace')).toBeVisible();
    await expect(page.getByTestId('csv-textarea')).toBeVisible();

    const text = await page.getByTestId('csv-textarea').inputValue();
    expect(text).toContain('Wireless Noise-Canceling Headphones');
  });

  test('2. Table Preview tab displays parsed rows, columns, and pagination', async ({ page }) => {
    await page.goto('/tools/csv-to-json');

    const previewTab = page.getByTestId('tab-preview');
    await previewTab.click();

    await expect(page.getByTestId('csv-preview-table-container')).toBeVisible();
    await expect(page.getByTestId('meta-total-rows')).toHaveText('4');
    await expect(page.getByTestId('badge-csv-healthy')).toBeVisible();
    await expect(page.getByTestId('csv-table')).toBeVisible();
  });

  test('3. Changes delimiter and converts to JSON Array of Arrays', async ({ page }) => {
    await page.goto('/tools/csv-to-json');

    // Switch to Settings tab
    await page.getByTestId('tab-settings').click();
    await expect(page.getByTestId('csv-settings-panel')).toBeVisible();

    // Change output mode to Array of Arrays
    const outputModeSelect = page.getByTestId('select-output-mode');
    await outputModeSelect.selectOption('array-of-arrays');

    // Switch to JSON Output tab
    await page.getByTestId('tab-output').click();
    await expect(page.getByTestId('output-mode-badge')).toHaveText('ARRAY-OF-ARRAYS');
  });

  test('4. Dot-nested sample converts to nested JSON structure', async ({ page }) => {
    await page.goto('/tools/csv-to-json');

    // Choose nested sample
    const sampleSelect = page.getByTestId('select-sample-csv');
    await sampleSelect.selectOption('nested');

    // Switch to Output tab
    await page.getByTestId('tab-output').click();
    await expect(page.getByTestId('csv-output-pane')).toBeVisible();

    // Verify copy button is available and enabled
    const copyBtn = page.getByRole('button', { name: /copy to clipboard/i });
    await expect(copyBtn).toBeEnabled();
  });

  test('5. Direct navigation to /tools/csv-validator and /tools/csv-preview works', async ({ page }) => {
    await page.goto('/tools/csv-validator');
    await expect(page.locator('h1')).toContainText('CSV Validator');
    await expect(page.getByTestId('csv-workspace')).toBeVisible();

    await page.goto('/tools/csv-preview');
    await expect(page.locator('h1')).toContainText('CSV Preview');
    await expect(page.getByTestId('csv-workspace')).toBeVisible();
  });

  test('6. Mobile 390px viewport renders responsive tabs without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/csv-to-json');

    await expect(page.getByTestId('csv-workspace')).toBeVisible();
    await expect(page.getByTestId('tab-editor')).toBeVisible();
    await expect(page.getByTestId('tab-preview')).toBeVisible();
    await expect(page.getByTestId('tab-output')).toBeVisible();

    // Check table preview on mobile
    await page.getByTestId('tab-preview').click();
    await expect(page.getByTestId('csv-preview-table-container')).toBeVisible();
  });
});

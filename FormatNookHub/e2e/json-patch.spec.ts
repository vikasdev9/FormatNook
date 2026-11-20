import { test, expect } from '@playwright/test';

test.describe('JSON Patch & Merge Patch E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');
  });

  test('1. Switches to JSON Patch tab and displays comparison editors', async ({ page }) => {
    const patchTab = page.locator('[data-testid="view-mode-patch"]');
    await expect(patchTab).toBeVisible();
    await patchTab.click();

    const patchView = page.locator('[data-testid="json-patch-view"]');
    await expect(patchView).toBeVisible();

    await expect(page.locator('[data-testid="patch-mode-generate"]')).toBeVisible();
    await expect(page.locator('[data-testid="patch-mode-apply"]')).toBeVisible();
    await expect(page.locator('[data-testid="patch-format-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="patch-original-textarea"]')).toBeVisible();
    await expect(page.locator('[data-testid="patch-modified-textarea"]')).toBeVisible();
    await expect(page.locator('[data-testid="patch-result-textarea"]')).toBeVisible();
  });

  test('2. Generates RFC 6902 patch and shows summary stats', async ({ page }) => {
    await page.locator('[data-testid="view-mode-patch"]').click();

    const generateBtn = page.locator('[data-testid="patch-generate-btn"]');
    await generateBtn.click();

    const stats = page.locator('[data-testid="patch-summary-stats"]');
    await expect(stats).toBeVisible();

    const result = page.locator('[data-testid="patch-result-textarea"]');
    await expect(result).toHaveValue(/"op":/);
  });

  test('3. Generates RFC 7386 Merge Patch and applies to workspace', async ({ page }) => {
    await page.locator('[data-testid="view-mode-patch"]').click();

    // Select RFC 7386
    const formatSelect = page.locator('[data-testid="patch-format-select"]');
    await formatSelect.selectOption('rfc7386');

    // Click Diff & Patch
    await page.locator('[data-testid="patch-generate-btn"]').click();

    const result = page.locator('[data-testid="patch-result-textarea"]');
    await expect(result).toHaveValue(/\{/);

    // Click Insert to Editor
    const insertBtn = page.locator('[data-testid="patch-insert-workspace-btn"]');
    await expect(insertBtn).toBeVisible();
    await insertBtn.click();

    // Switch back to Code view mode to verify inserted data
    await page.locator('[data-testid="view-mode-code"]').click();
    const outputPanel = page.locator('[data-testid="json-output-panel"]');
    await expect(outputPanel).toBeVisible();
  });
});

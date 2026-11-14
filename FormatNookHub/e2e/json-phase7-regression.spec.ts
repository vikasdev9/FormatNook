import { test, expect } from '@playwright/test';

const TARGET_ROUTE = '/tools/json-minifier';

test.describe('Phase 7: JSON Workspace Regression Suite for Final Fixes', () => {
  test('1. Regression: JsonCodeGenModal closes on Escape key and overlay click', async ({ page }) => {
    await page.goto(TARGET_ROUTE);
    await page.waitForLoadState('domcontentloaded');

    const codeGenBtn = page.locator('button:has-text("Code Models")').first();
    await expect(codeGenBtn).toBeVisible();
    await codeGenBtn.click();

    const modal = page.locator('[aria-labelledby="codegen-title"]');
    await expect(modal).toBeVisible();

    // Verify Escape key closes modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // Verify overlay click closes modal
    await codeGenBtn.click();
    await expect(modal).toBeVisible();
    // Click outside modal card on overlay background
    await page.locator('.json-modal-overlay').click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible();
  });

  test('2. Regression: Clear action provides soft-undo recovery', async ({ page }) => {
    await page.goto(TARGET_ROUTE);
    await page.waitForLoadState('domcontentloaded');

    const textarea = page.getByTestId('json-input-panel').locator('textarea');
    await textarea.fill('{"important": "do-not-lose-this"}');

    const clearBtn = page.locator('button[aria-label="Clear contents"], button:has-text("Clear")').first();
    await clearBtn.click();

    // Verify editors are cleared
    expect(await textarea.inputValue()).toBe('');

    // Verify undo notification is visible
    const undoBanner = page.locator('[data-testid="undo-reset-banner"]');
    await expect(undoBanner).toBeVisible();

    // Click Undo
    const undoBtn = page.locator('[data-testid="undo-reset-btn"]');
    await undoBtn.click();

    // Verify content is fully restored
    expect(await textarea.inputValue()).toBe('{"important": "do-not-lose-this"}');
    await expect(undoBanner).not.toBeVisible();
  });

  test('3. Regression: Stale output indicator and 1-click update when auto-format is disabled', async ({ page }) => {
    await page.goto(TARGET_ROUTE);
    await page.waitForLoadState('domcontentloaded');

    // Toggle off auto-format
    const autoFormatBtn = page.locator('[data-testid="toggle-auto-format-btn"]');
    await autoFormatBtn.click();

    // Edit input
    const textarea = page.getByTestId('json-input-panel').locator('textarea');
    await textarea.fill('{"updated": true}');
    await page.waitForTimeout(400);

    // Verify outdated badge and update button appear
    const outdatedBadge = page.locator('[data-testid="output-outdated-badge"]').first();
    await expect(outdatedBadge).toBeVisible();

    const updateBtn = page.locator('[data-testid="refresh-stale-output-btn"]');
    await expect(updateBtn).toBeVisible();

    // Click Update
    await updateBtn.click();
    await page.waitForTimeout(300);

    // Verify output updated and outdated badge disappears
    await expect(outdatedBadge).not.toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('JSON Mock Data Generator E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');
  });

  test('1. Opens Mock Data Generator modal from toolbar and displays controls', async ({ page }) => {
    const mockBtn = page.locator('[data-testid="json-mock-data-btn"]');
    await expect(mockBtn).toBeVisible();
    await mockBtn.click();

    const modal = page.locator('[data-testid="json-mock-data-modal"]');
    await expect(modal).toBeVisible();

    // Verify tabs
    await expect(page.locator('[data-testid="mock-source-sample"]')).toBeVisible();
    await expect(page.locator('[data-testid="mock-source-preset"]')).toBeVisible();
    await expect(page.locator('[data-testid="mock-source-schema"]')).toBeVisible();

    // Verify record count and seed controls
    await expect(page.locator('[data-testid="mock-record-count-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="mock-seed-input"]')).toBeVisible();

    // Verify rules table
    await expect(page.locator('[data-testid="mock-rules-table"]')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('[data-testid="mock-generate-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="mock-insert-editor-btn"]')).toBeVisible();
  });

  test('2. Selects built-in presets and updates detected rules', async ({ page }) => {
    await page.locator('[data-testid="json-mock-data-btn"]').click();

    // Switch to Presets
    await page.locator('[data-testid="mock-source-preset"]').click();

    // Select E-Commerce Products preset
    const productsPreset = page.locator('[data-testid="mock-preset-products"]');
    await expect(productsPreset).toBeVisible();
    await productsPreset.click();

    // Rules table should now list product fields
    const rulesTable = page.locator('[data-testid="mock-rules-table"]');
    await expect(rulesTable).toContainText('price');
    await expect(rulesTable).toContainText('category');
  });

  test('3. Configures record count and deterministic seed', async ({ page }) => {
    await page.locator('[data-testid="json-mock-data-btn"]').click();

    // Set count to 5
    const countInput = page.locator('[data-testid="mock-record-count-input"]');
    await countInput.fill('5');

    // Click Dice / Randomize Seed
    const diceBtn = page.locator('[data-testid="mock-randomize-seed-btn"]');
    await diceBtn.click();

    // Preview should update with 5 records
    const preview = page.locator('[data-testid="mock-preview-code"]');
    await expect(preview).toBeVisible();
  });

  test('4. Inserts generated mock data into JSON Workspace editor', async ({ page }) => {
    await page.locator('[data-testid="json-mock-data-btn"]').click();

    // Select Users preset
    await page.locator('[data-testid="mock-source-preset"]').click();
    await page.locator('[data-testid="mock-preset-users"]').click();

    // Click Insert into JSON Workspace
    const insertBtn = page.locator('[data-testid="mock-insert-editor-btn"]');
    await insertBtn.click();

    // Modal should close
    const modal = page.locator('[data-testid="json-mock-data-modal"]');
    await expect(modal).not.toBeVisible();

    // Editor output should be formatted with inserted data
    const outputPanel = page.locator('[data-testid="json-output-panel"]');
    await expect(outputPanel).toBeVisible();

    // Switch to Visualize tab to confirm graph works immediately with inserted data
    await page.locator('[data-testid="view-mode-graph"]').click();
    const graphContainer = page.locator('[data-testid="json-graph-container"]');
    await expect(graphContainer).toBeVisible();

    // Stats should reflect multiple user records
    const stats = page.locator('[data-testid="json-graph-stats"]');
    await expect(stats).toBeVisible();
  });
});

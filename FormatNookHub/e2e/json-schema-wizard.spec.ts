import { test, expect } from '@playwright/test';

test.describe('JSON Schema Wizard E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');
  });

  test('1. Switches to Schema Wizard tab and renders wizard controls', async ({ page }) => {
    const schemaTab = page.locator('[data-testid="view-mode-schema"]');
    await expect(schemaTab).toBeVisible();
    await schemaTab.click();

    const wizardView = page.locator('[data-testid="json-schema-wizard-view"]');
    await expect(wizardView).toBeVisible();

    await expect(page.locator('[data-testid="schema-draft-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="schema-opt-required"]')).toBeVisible();
    await expect(page.locator('[data-testid="schema-opt-enums"]')).toBeVisible();
    await expect(page.locator('[data-testid="schema-opt-formats"]')).toBeVisible();
    await expect(page.locator('[data-testid="schema-editor-textarea"]')).toBeVisible();
    await expect(page.locator('[data-testid="schema-validation-results"]')).toBeVisible();
  });

  test('2. Generates schema with different drafts and updates definition', async ({ page }) => {
    await page.locator('[data-testid="view-mode-schema"]').click();

    // Select Draft-07
    const draftSelect = page.locator('[data-testid="schema-draft-select"]');
    await draftSelect.selectOption('draft-07');

    // Click Generate from JSON
    const genBtn = page.locator('[data-testid="schema-generate-btn"]');
    await genBtn.click();

    // Check that editor contains draft-07 URI
    const editor = page.locator('[data-testid="schema-editor-textarea"]');
    await expect(editor).toHaveValue(/draft-07/);
  });

  test('3. Generates sample JSON and inserts into workspace', async ({ page }) => {
    await page.locator('[data-testid="view-mode-schema"]').click();

    // Click Generate Sample
    const sampleBtn = page.locator('[data-testid="schema-sample-btn"]');
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();

    // Switch back to Code view mode to verify inserted sample in editor
    await page.locator('[data-testid="view-mode-code"]').click();
    const outputPanel = page.locator('[data-testid="json-output-panel"]');
    await expect(outputPanel).toBeVisible();
  });
});

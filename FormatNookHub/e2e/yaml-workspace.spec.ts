import { test, expect } from '@playwright/test';

test.describe('Professional YAML Workspace & Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]', { timeout: 20000 });
  });

  test('1. YAML Workspace loads successfully with title and default sample', async ({ page }) => {
    await expect(page).toHaveTitle(/YAML Formatter & Beautifier/i);
    const workspace = page.getByTestId('yaml-workspace');
    await expect(workspace).toBeVisible();

    const codeView = page.getByTestId('yaml-code-view');
    await expect(codeView).toBeVisible();
    await expect(page.getByTestId('yaml-input-panel')).toBeVisible();
    await expect(page.getByTestId('yaml-output-panel')).toBeVisible();
  });

  test('2. Formats YAML with indentation and quotes', async ({ page }) => {
    const indentSelect = page.getByTestId('yaml-indent-select');
    await expect(indentSelect).toBeVisible();

    await indentSelect.selectOption('4');
    const beautifyBtn = page.getByTestId('yaml-beautify-btn');
    await beautifyBtn.click();

    const outputTextarea = page.getByTestId('yaml-output-panel').locator('textarea');
    await expect(outputTextarea).toContainText('services:');
  });

  test('3. Minifies YAML into compact flow-style representation', async ({ page }) => {
    const minifyBtn = page.getByTestId('yaml-minify-btn');
    await minifyBtn.click();

    const outputTextarea = page.getByTestId('yaml-output-panel').locator('textarea');
    await expect(outputTextarea).toContainText('"api"');
  });

  test('4. Switches to Visual Tree View and Structured Grid', async ({ page }) => {
    // Switch to Tree View
    const treeTab = page.getByTestId('yaml-view-tree');
    await treeTab.click();
    await expect(page.getByTestId('yaml-tree-view')).toBeVisible();

    // Switch to Structured View
    const structuredTab = page.getByTestId('yaml-view-structured');
    await structuredTab.click();
    await expect(page.locator('.json-structured-view-container').first()).toBeVisible();

    // Switch back to Code View
    const codeTab = page.getByTestId('yaml-view-code');
    await codeTab.click();
    await expect(page.getByTestId('yaml-code-view')).toBeVisible();
  });

  test('5. Opens YAML Converters Modal for JSON, XML, CSV', async ({ page }) => {
    const convertBtn = page.getByTestId('yaml-convert-btn');
    await convertBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('YAML Bidirectional Converters');

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('6. Opens Config Inspector Modal for Kubernetes, Compose, and Actions', async ({ page }) => {
    const inspectorBtn = page.getByTestId('yaml-inspector-btn');
    await inspectorBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Config Inspector & Structural Linter');

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('7. YAML Validator tool route (/tools/yaml-validator) loads in validate mode', async ({ page }) => {
    await page.goto('/tools/yaml-validator');
    await expect(page).toHaveTitle(/YAML Validator/i);
    await expect(page.getByTestId('yaml-workspace')).toBeVisible();
  });
});


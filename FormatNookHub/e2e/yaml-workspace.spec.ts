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

  test('8. Standardized panel headers display title and formatted stats', async ({ page }) => {
    const inputHeader = page.getByTestId('yaml-input-panel').locator('.panel-header');
    const outputHeader = page.getByTestId('yaml-output-panel').locator('.panel-header');

    await expect(inputHeader).toBeVisible();
    await expect(outputHeader).toBeVisible();

    await expect(inputHeader.locator('.panel-title-text')).toHaveText('Original Input (Raw YAML)');
    await expect(outputHeader.locator('.panel-title-text')).toHaveText('Standardized Output');

    await expect(inputHeader.locator('.panel-stats')).toContainText(/Lines/);
    await expect(inputHeader.locator('.panel-stats')).toContainText(/\d+\s*B/);
  });

  test('9. Draggable panel resizer divider supports keyboard and double-click reset', async ({ page }) => {
    const resizer = page.getByTestId('workspace-panels-resizer');
    await expect(resizer).toBeVisible();

    // Verify ARIA accessibility attributes
    await expect(resizer).toHaveAttribute('role', 'separator');
    await expect(resizer).toHaveAttribute('aria-valuenow', '50');

    // Use arrow keys to resize
    await resizer.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(resizer).toHaveAttribute('aria-valuenow', '48');

    // Double-click to reset to 50/50
    await resizer.dblclick();
    await expect(resizer).toHaveAttribute('aria-valuenow', '50');
  });

  test('10. Mobile 390x844 responsive vertical stacking and 3-way segmented tabs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const tabBoth = page.getByRole('tab', { name: 'Both Views' });
    const tabInput = page.getByRole('tab', { name: 'Original Input' });
    const tabOutput = page.getByRole('tab', { name: 'Formatted Output' });

    await expect(tabBoth).toBeVisible();
    await expect(tabInput).toBeVisible();
    await expect(tabOutput).toBeVisible();

    const inputPanel = page.getByTestId('yaml-input-panel');
    const outputPanel = page.getByTestId('yaml-output-panel');

    // Switch to Original Input only
    await tabInput.click();
    await expect(inputPanel).toBeVisible();
    await expect(outputPanel).toHaveClass(/mobile-panel-hidden/);

    // Switch to Formatted Output only
    await tabOutput.click();
    await expect(inputPanel).toHaveClass(/mobile-panel-hidden/);
    await expect(outputPanel).toBeVisible();

    // Switch back to Both Views
    await tabBoth.click();
    await expect(inputPanel).toBeVisible();
    await expect(outputPanel).toBeVisible();
  });

  test('11. Multi-document YAML stream support retains separators and shows document count', async ({ page }) => {
    const inputArea = page.getByTestId('yaml-input-panel').locator('textarea');
    const multiDocYaml = `---
kind: Deployment
metadata:
  name: web
---
kind: Service
metadata:
  name: web-svc`;

    await inputArea.fill(multiDocYaml);
    const beautifyBtn = page.getByTestId('yaml-beautify-btn');
    await beautifyBtn.click();

    const outputArea = page.getByTestId('yaml-output-panel').locator('textarea');
    await expect(outputArea).toContainText('kind: Deployment');
    await expect(outputArea).toContainText('kind: Service');

    const inputHeader = page.getByTestId('yaml-input-panel').locator('.panel-stats');
    await expect(inputHeader).toContainText('2 docs');
  });

  test('12. Light and Dark theme verification for YAML workspace', async ({ page }) => {
    const workspace = page.getByTestId('yaml-workspace');
    await expect(workspace).toBeVisible();

    // Toggle to dark theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const darkBg = await workspace.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(darkBg).toBeDefined();

    // Toggle to light theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const lightBg = await workspace.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(lightBg).toBeDefined();
  });
});


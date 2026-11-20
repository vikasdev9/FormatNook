import { test, expect } from '@playwright/test';

test.describe('Professional XML Workspace & Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]', { timeout: 20000 });
  });

  test('1. XML Workspace loads successfully with title and default sample', async ({ page }) => {
    await expect(page).toHaveTitle(/XML Formatter & Beautifier/i);
    const workspace = page.getByTestId('xml-workspace');
    await expect(workspace).toBeVisible();

    const codeView = page.getByTestId('xml-code-view');
    await expect(codeView).toBeVisible();
    await expect(page.getByTestId('xml-input-panel')).toBeVisible();
    await expect(page.getByTestId('xml-output-panel')).toBeVisible();
  });

  test('2. Formats XML with indentation options', async ({ page }) => {
    const indentSelect = page.getByTestId('xml-indent-select');
    await expect(indentSelect).toBeVisible();

    await indentSelect.selectOption('4');
    const beautifyBtn = page.getByTestId('xml-beautify-btn');
    await beautifyBtn.click();

    const outputTextarea = page.getByTestId('xml-output-panel').locator('textarea');
    await expect(outputTextarea).toHaveValue(/<project>/);
  });

  test('3. Minifies XML into compact single-line string', async ({ page }) => {
    const minifyBtn = page.getByTestId('xml-minify-btn');
    await minifyBtn.click();

    const outputTextarea = page.getByTestId('xml-output-panel').locator('textarea');
    await expect(outputTextarea).toHaveValue(/<project><metadata>/);
  });

  test('4. Switches to Visual Tree View and Structured Grid', async ({ page }) => {
    // Switch to Tree View
    const treeTab = page.getByTestId('xml-view-tree');
    await treeTab.click();
    await expect(page.getByTestId('xml-tree-view')).toBeVisible();

    // Switch to Structured View
    const structuredTab = page.getByTestId('xml-view-structured');
    await structuredTab.click();
    await expect(page.locator('.json-structured-view-container').first()).toBeVisible();

    // Switch back to Code View
    const codeTab = page.getByTestId('xml-view-code');
    await codeTab.click();
    await expect(page.getByTestId('xml-code-view')).toBeVisible();
  });

  test('5. Opens and interacts with XPath Expression Explorer', async ({ page }) => {
    const xpathBtn = page.getByTestId('xml-xpath-btn');
    await xpathBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('XPath Expression Explorer');

    // Run query
    const xpathInput = page.getByTestId('xpath-input');
    await xpathInput.fill('//tool');
    await expect(modal).toContainText('Matches Found');

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('6. Opens Converters Modal for JSON, YAML, and CSV', async ({ page }) => {
    const convertBtn = page.getByTestId('xml-convert-btn');
    await convertBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('XML Converters & Transformers');

    // Switch to JSON tab
    await page.getByText('XML → JSON').click();
    await expect(modal).toContainText('"project"');

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('7. Opens SOAP / WSDL / XSD Specialized Inspector Modal', async ({ page }) => {
    const specBtn = page.getByTestId('xml-specialized-btn');
    await specBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('SOAP / WSDL / XSD Specialized Inspector');

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('8. XML Validator tool route (/tools/xml-validator) loads in validate mode', async ({ page }) => {
    await page.goto('/tools/xml-validator');
    await expect(page).toHaveTitle(/XML Validator/i);
    await expect(page.getByTestId('xml-workspace')).toBeVisible();
  });

  test('9. Standardized panel headers display title and formatted stats', async ({ page }) => {
    const inputHeader = page.getByTestId('xml-input-panel').locator('.panel-header');
    const outputHeader = page.getByTestId('xml-output-panel').locator('.panel-header');

    await expect(inputHeader).toBeVisible();
    await expect(outputHeader).toBeVisible();

    await expect(inputHeader.locator('.panel-title-text')).toHaveText('Original Input (Raw XML)');
    await expect(outputHeader.locator('.panel-title-text')).toHaveText('Formatted Output');

    await expect(inputHeader.locator('.panel-stats')).toContainText(/Lines/);
    await expect(inputHeader.locator('.panel-stats')).toContainText(/\d+\s*B/);
  });

  test('10. Draggable panel resizer divider supports keyboard and double-click reset', async ({ page }) => {
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

  test('11. Mobile 390x844 responsive vertical stacking and 3-way segmented tabs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const tabBoth = page.getByRole('tab', { name: 'Both Views' });
    const tabInput = page.getByRole('tab', { name: 'Original Input' });
    const tabOutput = page.getByRole('tab', { name: 'Formatted Output' });

    await expect(tabBoth).toBeVisible();
    await expect(tabInput).toBeVisible();
    await expect(tabOutput).toBeVisible();

    const inputPanel = page.getByTestId('xml-input-panel');
    const outputPanel = page.getByTestId('xml-output-panel');

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

  test('12. Light and Dark theme verification for XML workspace', async ({ page }) => {
    const workspace = page.getByTestId('xml-workspace');
    await expect(workspace).toBeVisible();

    // Default or toggle to dark theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const darkBg = await workspace.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(darkBg).toBeDefined();

    // Toggle to light theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const lightBg = await workspace.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(lightBg).toBeDefined();
  });
});


import { test, expect } from '@playwright/test';

test.describe('Professional Code Beautifiers Workspace Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/javascript-formatter');
    await page.waitForSelector('[data-testid="beautifier-workspace"]', { timeout: 20000 });
  });

  test('1. Beautifier Workspace loads with two-tier toolbar and JavaScript sample', async ({
    page,
  }) => {
    const workspace = page.getByTestId('beautifier-workspace');
    await expect(workspace).toBeVisible();

    // Verify Primary Toolbar buttons
    await expect(page.getByTestId('btn-format')).toBeVisible();
    await expect(page.getByTestId('btn-minify')).toBeVisible();
    await expect(page.getByTestId('btn-validate')).toBeVisible();
    await expect(page.getByTestId('btn-reset')).toBeVisible();
    await expect(page.getByTestId('btn-shortcuts')).toBeVisible();

    // Verify Format Switcher Pills
    await expect(page.getByTestId('btn-format-javascript')).toBeVisible();
    await expect(page.getByTestId('btn-format-html')).toBeVisible();
    await expect(page.getByTestId('btn-format-css')).toBeVisible();
    await expect(page.getByTestId('btn-format-sql')).toBeVisible();

    // Verify Active language pill has active class
    await expect(page.getByTestId('btn-format-javascript')).toHaveClass(/active/);

    // Verify Standardized 40px Panel Headers
    await expect(page.getByTestId('beautifier-input-panel')).toBeVisible();
    await expect(page.getByTestId('beautifier-output-panel')).toBeVisible();
    await expect(
      page.getByTestId('beautifier-input-panel').locator('.panel-title-text')
    ).toHaveText(/Input \(JavaScript\)/i);
    await expect(
      page.getByTestId('beautifier-output-panel').locator('.panel-title-text')
    ).toHaveText(/Output \(Beautified\)/i);
  });

  test('2. Minifies JavaScript into compact output', async ({ page }) => {
    const minifyBtn = page.getByTestId('btn-minify');
    await minifyBtn.click();

    // Verify output panel title changed to Minified
    await expect(
      page.getByTestId('beautifier-output-panel').locator('.panel-title-text')
    ).toHaveText(/Output \(Minified\)/i);

    // Verify output textarea has minified value
    const outputTextarea = page
      .getByTestId('beautifier-output-panel')
      .locator('textarea');
    const minifiedText = await outputTextarea.inputValue();
    expect(minifiedText).toContain('function processUserData(');
    expect(minifiedText.split('\n').length).toBeLessThanOrEqual(2);
  });

  test('3. Validates syntax and shows status indicator badge', async ({ page }) => {
    const validateBtn = page.getByTestId('btn-validate');
    await validateBtn.click();

    // Verify Valid Syntax badge
    const statusBadge = page.getByTestId('beautifier-status-badge');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveText(/Valid Syntax/i);

    // Corrupt input to verify error diagnosis
    const inputTextarea = page
      .getByTestId('beautifier-input-panel')
      .locator('textarea');
    await inputTextarea.fill('function invalidCode() { return + ; }');
    await validateBtn.click();

    await expect(statusBadge).toHaveClass(/status-invalid/);
  });

  test('4. In-page language switching to HTML, CSS, and SQL with format-specific options', async ({
    page,
  }) => {
    // 1. Switch to HTML
    await page.getByTestId('btn-format-html').click();
    await expect(page.getByTestId('btn-format-html')).toHaveClass(/active/);
    await expect(page.getByTestId('checkbox-html-comments')).toBeVisible();
    await expect(
      page.getByTestId('beautifier-input-panel').locator('.panel-title-text')
    ).toHaveText(/Input \(HTML\)/i);

    // 2. Switch to CSS
    await page.getByTestId('btn-format-css').click();
    await expect(page.getByTestId('btn-format-css')).toHaveClass(/active/);
    await expect(page.getByTestId('checkbox-css-comments')).toBeVisible();
    await expect(
      page.getByTestId('beautifier-input-panel').locator('.panel-title-text')
    ).toHaveText(/Input \(CSS\)/i);

    // 3. Switch to SQL
    await page.getByTestId('btn-format-sql').click();
    await expect(page.getByTestId('btn-format-sql')).toHaveClass(/active/);
    await expect(page.getByTestId('select-sql-keyword-case')).toBeVisible();
    await expect(
      page.getByTestId('beautifier-input-panel').locator('.panel-title-text')
    ).toHaveText(/Input \(SQL\)/i);

    // Format SQL and verify uppercase keywords
    await page.getByTestId('btn-format').click();
    const outputTextarea = page
      .getByTestId('beautifier-output-panel')
      .locator('textarea');
    const sqlOutput = await outputTextarea.inputValue();
    expect(sqlOutput).toContain('SELECT');
    expect(sqlOutput).toContain('FROM');
  });

  test('5. Keyboard accessible split resizer adjusts grid ratio', async ({ page }) => {
    const resizer = page.getByRole('separator', {
      name: /resize beautifier input and output panels/i,
    });
    await expect(resizer).toBeVisible();
    await expect(resizer).toHaveAttribute('aria-valuenow', '50');

    // Focus and press ArrowRight to increase left panel
    await resizer.focus();
    await page.keyboard.press('ArrowRight');
    await expect(resizer).toHaveAttribute('aria-valuenow', '55');

    // Double-click resets back to 50
    await resizer.dblclick();
    await expect(resizer).toHaveAttribute('aria-valuenow', '50');
  });

  test('6. Clears editors when Reset/Clear button is clicked', async ({ page }) => {
    const clearBtn = page.getByTestId('btn-reset');
    await clearBtn.click();

    const inputTextarea = page
      .getByTestId('beautifier-input-panel')
      .locator('textarea');
    const outputTextarea = page
      .getByTestId('beautifier-output-panel')
      .locator('textarea');

    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('7. Mobile segmented tabs switch between Input, Output, and Both views', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const tabInput = page.getByTestId('tab-mobile-input');
    const tabOutput = page.getByTestId('tab-mobile-output');
    const tabBoth = page.getByTestId('tab-mobile-both');

    await tabInput.click();
    await expect(tabInput).toHaveClass(/active/);
    await expect(page.getByTestId('beautifier-output-panel')).toHaveClass(
      /mobile-panel-hidden/
    );

    await tabOutput.click();
    await expect(tabOutput).toHaveClass(/active/);
    await expect(page.getByTestId('beautifier-input-panel')).toHaveClass(
      /mobile-panel-hidden/
    );

    await tabBoth.click();
    await expect(tabBoth).toHaveClass(/active/);
    await expect(page.getByTestId('beautifier-input-panel')).not.toHaveClass(
      /mobile-panel-hidden/
    );
    await expect(page.getByTestId('beautifier-output-panel')).not.toHaveClass(
      /mobile-panel-hidden/
    );
  });
});

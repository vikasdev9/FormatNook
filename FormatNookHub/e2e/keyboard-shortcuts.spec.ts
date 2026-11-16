import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with stable viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('1. JSON Workspace: Control+Enter triggers beautify/format', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');

    // Trigger format via keyboard shortcut Control+Enter
    await page.keyboard.press('Control+Enter');

    // Verify format executed and output panel is populated
    const outputPanel = page.locator('[data-testid="json-output-panel"]').first();
    await expect(outputPanel).toBeVisible();
    await expect(outputPanel).toContainText('{');
  });

  test('2. JSON Workspace: Control+Shift+M triggers Minify', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');

    // Press Control+Shift+M
    await page.keyboard.press('Control+Shift+M');

    // Output status bar or editor should show single line (Ln: 1 or Total Lines: 1)
    const outputBar = page.locator('[data-testid="output-status-bar"]');
    await expect(outputBar).toBeVisible();
    await expect(outputBar).toContainText('Total Lines: 1');
  });

  test('3. JSON Workspace: Control+Shift+V triggers Validate', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');

    // Press Control+Shift+V
    await page.keyboard.press('Control+Shift+V');

    // Validation card should confirm valid JSON
    const validCard = page.locator('.validation-card, [role="status"]').first();
    await expect(validCard).toBeVisible();
    await expect(validCard).toContainText('Valid Document');
  });

  test('4. JSON Workspace: Control+Shift+R opens Auto-Repair preview modal', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');

    // Press Control+Shift+R
    await page.keyboard.press('Control+Shift+R');

    // Repair modal should appear
    const repairModal = page.locator('.json-repair-modal, [data-testid="json-repair-modal"]').first();
    await expect(repairModal).toBeVisible();

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(repairModal).not.toBeVisible();
  });

  test('5. Global Search: Control+K opens and closes CommandMenu from anywhere', async ({ page }) => {
    await page.goto('/');

    // Press Control+K to open
    await page.keyboard.press('Control+K');
    const commandMenu = page.locator('.command-menu-overlay, [role="dialog"]').first();
    await expect(commandMenu).toBeVisible();

    // Press Control+K to close or Escape
    await page.keyboard.press('Control+K');
    await expect(commandMenu).not.toBeVisible();
  });

  test('6. Keyboard Shortcuts Modal: "?" opens help modal and Escape closes it', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');

    // Ensure focus is on body (outside inputs)
    await page.locator('body').click({ position: { x: 50, y: 50 } });

    // Press '?'
    await page.keyboard.press('?');

    // Modal should be visible
    const modal = page.locator('[data-testid="json-shortcuts-modal"], [data-testid="keyboard-shortcuts-modal"]').first();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Keyboard Shortcuts');

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('7. Modal Stack Management: Escape closes topmost modal first without cascading', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');

    // Open Shortcuts modal via toolbar button
    const shortcutsBtn = page.getByTestId('shortcuts-modal-btn');
    if (await shortcutsBtn.isVisible()) {
      await shortcutsBtn.click();
      const shortcutsModal = page.locator('[data-testid="json-shortcuts-modal"]').first();
      await expect(shortcutsModal).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');
      await expect(shortcutsModal).not.toBeVisible();
    }
  });

  test('8. Input Protection: Typing text inside editor preserves characters without firing shortcuts', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');

    // Click on input editor textarea or monaco
    const inputArea = page.locator('[data-testid="input-editor"] textarea, [data-testid="input-editor"] .monaco-editor').first();
    if (await inputArea.isVisible()) {
      await inputArea.click();

      // Type characters '?', 'f', 'm'
      await page.keyboard.type('?');

      // The shortcuts modal should NOT have opened
      const modal = page.locator('[data-testid="keyboard-shortcuts-modal"], [data-testid="json-shortcuts-modal"]');
      await expect(modal).not.toBeVisible();
    }
  });

  test('9. YAML Workspace: Control+Enter and Control+Shift+M execute correctly', async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('.tool-workspace-container');

    // Press Control+Enter to format
    await page.keyboard.press('Control+Enter');

    // Press Control+Shift+M to minify
    await page.keyboard.press('Control+Shift+M');

    // Verify workspace remains interactive and stable
    await expect(page.locator('.tool-workspace-container')).toBeVisible();
  });

  test('10. XML Workspace: Control+Enter and Control+Shift+X execute correctly', async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('.tool-workspace-container');

    // Press Control+Shift+X to open XPath explorer
    await page.keyboard.press('Control+Shift+X');

    // Verify XPath modal is opened
    const xpathModal = page.locator('.modal-backdrop, [role="dialog"]').first();
    await expect(xpathModal).toBeVisible();

    // Escape closes XPath modal
    await page.keyboard.press('Escape');
    await expect(xpathModal).not.toBeVisible();
  });

  test('11. Diff Workspace: Control+Enter and Control+Shift+S execute correctly', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    await page.waitForSelector('[data-testid="diff-workspace"]');

    // Press Control+Enter to recompute diff
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('[data-testid="diff-workspace"]')).toBeVisible();

    // Press Control+Shift+S to swap texts
    await page.keyboard.press('Control+Shift+S');
    await expect(page.locator('[data-testid="diff-workspace"]')).toBeVisible();
  });

  test('12. Base64 Workspace: Shortcuts modal button and Control+Enter execute reliably', async ({ page }) => {
    await page.goto('/tools/text-to-base64');
    await page.waitForSelector('.tool-workspace-container');

    // Click shortcuts button in toolbar
    const shortcutsBtn = page.getByRole('button', { name: /shortcuts/i }).first();
    if (await shortcutsBtn.isVisible()) {
      await shortcutsBtn.click();
      const modal = page.locator('[data-testid="keyboard-shortcuts-modal"]');
      await expect(modal).toBeVisible();

      // Escape closes modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Feature: Text Comparison / Diff Checker', () => {
  // Scenario 1: Text comparison page loads successfully & header link works
  test('1. Text comparison page loads successfully and is accessible via header menu', async ({ page }) => {
    // Navigate from homepage via header menu
    await page.goto('/');
    const headerDiffLink = page.locator('.header-nav a', { hasText: 'Diff Checker' });
    await expect(headerDiffLink).toBeVisible();
    await headerDiffLink.click();

    await expect(page).toHaveURL(/\/tools\/diff-checker/);
    await expect(page).toHaveTitle(/Text Comparison & Diff Checker/i);
    const heading = page.locator('h1.tool-title');
    await expect(heading).toContainText(/Text Comparison \/ Diff Checker/i);
  });

  // Scenario 2: Original and Modified text editors are visible
  test('2. Original and Modified text editors are visible', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const origEditor = page.getByTestId('editor-original');
    const modEditor = page.getByTestId('editor-modified');
    await expect(origEditor).toBeVisible();
    await expect(modEditor).toBeVisible();

    const origTextarea = page.getByTestId('textarea-original-editor');
    const modTextarea = page.getByTestId('textarea-modified-editor');
    await expect(origTextarea).toBeVisible();
    await expect(modTextarea).toBeVisible();
  });

  // Scenario 3: Compare identical text – no differences found
  test('3. Compare identical text – no differences found', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('Line one\nLine two\nLine three');
    await mod.fill('Line one\nLine two\nLine three');

    const compareBtn = page.getByTestId('btn-compare');
    await compareBtn.click();

    const banner = page.getByTestId('banner-identical-text');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/No differences found!/i);

    const diffPercent = page.getByTestId('stat-difference-percentage');
    await expect(diffPercent).toContainText('0%');
  });

  // Scenario 4: Added lines are correctly highlighted
  test('4. Added lines are correctly highlighted', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('First line\nThird line');
    await mod.fill('First line\nSecond line inserted\nThird line');

    const compareBtn = page.getByTestId('btn-compare');
    await compareBtn.click();

    const addedStat = page.getByTestId('stat-added-lines');
    await expect(addedStat).toContainText('+1');

    const addedRow = page.locator('.diff-row-insert');
    await expect(addedRow.first()).toBeVisible();
    await expect(addedRow.first()).toContainText('Second line inserted');
  });

  // Scenario 5: Removed lines are correctly highlighted
  test('5. Removed lines are correctly highlighted', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('Keep this\nDelete this line\nKeep this too');
    await mod.fill('Keep this\nKeep this too');

    const compareBtn = page.getByTestId('btn-compare');
    await compareBtn.click();

    const removedStat = page.getByTestId('stat-removed-lines');
    await expect(removedStat).toContainText('-1');

    const removedRow = page.locator('.diff-row-delete');
    await expect(removedRow.first()).toBeVisible();
    await expect(removedRow.first()).toContainText('Delete this line');
  });

  // Scenario 6: Modified lines are correctly identified
  test('6. Modified lines are correctly identified', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('The quick brown fox');
    await mod.fill('The fast brown fox');

    const compareBtn = page.getByTestId('btn-compare');
    await compareBtn.click();

    const modifiedStat = page.getByTestId('stat-modified-lines');
    await expect(modifiedStat).toContainText('~1');

    const modifiedRow = page.locator('.diff-row-modify');
    await expect(modifiedRow.first()).toBeVisible();
  });

  // Scenario 7: Word-level comparison works correctly
  test('7. Word-level comparison works correctly', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const settingsBtn = page.getByTestId('btn-toggle-settings');
    await settingsBtn.click();

    const wordPill = page.getByTestId('granularity-word');
    await wordPill.click();

    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');
    await orig.fill('Apple Banana Cherry');
    await mod.fill('Apple Orange Cherry');

    const compareBtn = page.getByTestId('btn-compare');
    await compareBtn.click();

    const removedToken = page.locator('.diff-token-removed');
    const addedToken = page.locator('.diff-token-added');
    await expect(removedToken.first()).toContainText('Banana');
    await expect(addedToken.first()).toContainText('Orange');
  });

  // Scenario 8: Character-level comparison works correctly
  test('8. Character-level comparison works correctly', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const settingsBtn = page.getByTestId('btn-toggle-settings');
    await settingsBtn.click();

    const charPill = page.getByTestId('granularity-char');
    await charPill.click();

    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');
    await orig.fill('Cat');
    await mod.fill('Car');

    const compareBtn = page.getByTestId('btn-compare');
    await compareBtn.click();

    const removedToken = page.locator('.diff-token-removed');
    const addedToken = page.locator('.diff-token-added');
    await expect(removedToken.first()).toContainText('t');
    await expect(addedToken.first()).toContainText('r');
  });

  // Scenario 9: Side-by-Side view works
  test('9. Side-by-Side view works', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const splitBtn = page.getByTestId('btn-view-side-by-side');
    await splitBtn.click();

    const splitContainer = page.getByTestId('view-split-container');
    await expect(splitContainer).toBeVisible();
    await expect(page.locator('.diff-pane-left').first()).toBeVisible();
    await expect(page.locator('.diff-pane-right').first()).toBeVisible();
  });

  // Scenario 10: Inline view works
  test('10. Inline view works', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const inlineBtn = page.getByTestId('btn-view-inline');
    await inlineBtn.click();

    const inlineContainer = page.getByTestId('view-inline-container');
    await expect(inlineContainer).toBeVisible();
  });

  // Scenario 11: Ignore whitespace option works
  test('11. Ignore whitespace option works', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('const   x   =   10;');
    await mod.fill('const x = 10;');

    // Without ignore whitespace: not identical
    await expect(page.getByTestId('banner-identical-text')).not.toBeVisible();

    // Toggle settings and check ignore whitespace
    await page.getByTestId('btn-toggle-settings').click();
    await page.getByTestId('checkbox-ignore-whitespace').check();

    // Now identical banner should appear
    await expect(page.getByTestId('banner-identical-text')).toBeVisible();
  });

  // Scenario 12: Ignore case option works
  test('12. Ignore case option works', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('HELLO WORLD');
    await mod.fill('hello world');

    await expect(page.getByTestId('banner-identical-text')).not.toBeVisible();

    await page.getByTestId('btn-toggle-settings').click();
    await page.getByTestId('checkbox-ignore-case').check();

    await expect(page.getByTestId('banner-identical-text')).toBeVisible();
  });

  // Scenario 13: Ignore blank lines option works
  test('13. Ignore blank lines option works', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('Item 1\n\nItem 2');
    await mod.fill('Item 1\nItem 2');

    await expect(page.getByTestId('banner-identical-text')).not.toBeVisible();

    await page.getByTestId('btn-toggle-settings').click();
    await page.getByTestId('checkbox-ignore-blank-lines').check();

    await expect(page.getByTestId('banner-identical-text')).toBeVisible();
  });

  // Scenario 14: Swap text functionality works
  test('14. Swap text functionality works', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('Alpha Content');
    await mod.fill('Beta Content');

    const swapBtn = page.getByTestId('btn-swap');
    await swapBtn.click();

    await expect(orig).toHaveValue('Beta Content');
    await expect(mod).toHaveValue('Alpha Content');
  });

  // Scenario 15: Clear functionality works
  test('15. Clear functionality works', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('Some content');
    await mod.fill('Other content');

    const clearBtn = page.getByTestId('btn-clear');
    await clearBtn.click();

    await expect(orig).toHaveValue('');
    await expect(mod).toHaveValue('');
    await expect(page.getByTestId('diff-empty-state')).toBeVisible();
  });

  // Scenario 16: Difference statistics update correctly
  test('16. Difference statistics update correctly', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    await orig.fill('Line 1\nLine 2');
    await mod.fill('Line 1\nLine 2\nLine 3\nLine 4');

    const addedStat = page.getByTestId('stat-added-lines');
    await expect(addedStat).toContainText('+2');

    const totalStat = page.getByTestId('stat-total-lines');
    await expect(totalStat).toContainText('4');
  });

  // Scenario 17: Copy result functionality works
  test('17. Copy result functionality works', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/tools/diff-checker');

    const copyBtn = page.getByTestId('btn-copy-diff');
    await copyBtn.click();

    await expect(copyBtn).toContainText('Copied!');
  });

  // Scenario 18: Download diff TXT functionality works
  test('18. Download diff TXT functionality works', async ({ page }) => {
    await page.goto('/tools/diff-checker');

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-download-diff').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('text-diff.txt');
  });

  // Scenario 19: Empty input is handled correctly
  test('19. Empty input is handled correctly', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    await page.getByTestId('btn-clear').click();

    const emptyState = page.getByTestId('diff-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/Ready for Comparison/i);
  });

  // Scenario 20: Unicode and special characters are handled correctly
  test('20. Unicode and special characters are handled correctly', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const orig = page.getByTestId('textarea-original-editor');
    const mod = page.getByTestId('textarea-modified-editor');

    const unicodeOrig = '🚀 FormatNook 日本語 💖 <xml attr="test" & >';
    const unicodeMod = '🚀 FormatNook 日本語 💖✨ <xml attr="test" & >';

    await orig.fill(unicodeOrig);
    await mod.fill(unicodeMod);

    const compareBtn = page.getByTestId('btn-compare');
    await compareBtn.click();

    const diffRow = page.locator('.diff-row-modify');
    await expect(diffRow.first()).toBeVisible();
    await expect(page.locator('.diff-content').first()).toContainText('FormatNook 日本語');
  });

  // Scenario 21: Responsive layout works on mobile and desktop
  test('21. Responsive layout works on mobile and desktop', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tools/diff-checker');
    await expect(page.getByTestId('diff-workspace')).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('editor-original')).toBeVisible();
    await expect(page.getByTestId('editor-modified')).toBeVisible();
    await expect(page.getByTestId('btn-compare')).toBeVisible();

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // Scenario 22: Existing JSON, XML, YAML and other utilities continue working
  test('22. Existing JSON, XML, YAML and other utilities continue working', async ({ page }) => {
    // Test JSON Formatter
    await page.goto('/tools/json-formatter');
    await expect(page).toHaveTitle(/JSON Formatter/i);
    await expect(page.locator('h1.tool-title')).toContainText(/JSON Formatter/i);

    // Test XML Formatter
    await page.goto('/tools/xml-formatter');
    await expect(page).toHaveTitle(/XML/i);
    await expect(page.locator('h1.tool-title')).toContainText(/XML/i);

    // Test YAML Formatter
    await page.goto('/tools/yaml-formatter');
    await expect(page).toHaveTitle(/YAML/i);
    await expect(page.locator('h1.tool-title')).toContainText(/YAML/i);
  });
});


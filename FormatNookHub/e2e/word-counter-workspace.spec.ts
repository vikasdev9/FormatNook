import { test, expect } from '@playwright/test';

test.describe('Word & Character Counter + Text Productivity Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/word-counter');
    await page.waitForSelector('[data-testid="word-counter-workspace"]', { timeout: 20000 });
  });

  test('1. Loads Word & Character Counter workspace with sample text and live metrics', async ({ page }) => {
    const workspace = page.getByTestId('word-counter-workspace');
    await expect(workspace).toBeVisible();

    const textarea = page.getByTestId('main-text-input');
    await expect(textarea).toBeVisible();

    const wordBadge = page.getByTestId('badge-word-count');
    await expect(wordBadge).toBeVisible();
    await expect(wordBadge).toContainText(/words/i);

    const charBadge = page.getByTestId('badge-char-count');
    await expect(charBadge).toBeVisible();
    await expect(charBadge).toContainText(/chars/i);

    // Live statistics panel
    await expect(page.getByTestId('live-stats-panel')).toBeVisible();
    await expect(page.getByTestId('reading-time-card')).toBeVisible();
    await expect(page.getByTestId('speaking-time-card')).toBeVisible();
  });

  test('2. Updates statistics in real time when user inputs custom text', async ({ page }) => {
    const textarea = page.getByTestId('main-text-input');
    await textarea.fill('Fast, private, and local browser developer utilities.');

    await expect(page.getByTestId('badge-word-count')).toContainText('7 words');
    await expect(page.getByTestId('badge-char-count')).toContainText('53 chars');
  });

  test('3. Tab navigation switches between all 5 productivity modules', async ({ page }) => {
    // Readability
    await page.getByTestId('tab-readability').click();
    await expect(page.getByTestId('readability-panel')).toBeVisible();
    await expect(page.getByTestId('reading-ease-score')).toBeVisible();

    // Keyword Density
    await page.getByTestId('tab-keywords').click();
    await expect(page.getByTestId('keyword-density-panel')).toBeVisible();

    // Social Media Limits
    await page.getByTestId('tab-social').click();
    await expect(page.getByTestId('social-media-panel')).toBeVisible();
    await expect(page.getByTestId('social-card-x')).toBeVisible();

    // Text Cleaner
    await page.getByTestId('tab-cleaner').click();
    await expect(page.getByTestId('text-cleaner-panel')).toBeVisible();

    // Back to Live Statistics
    await page.getByTestId('tab-counter').click();
    await expect(page.getByTestId('live-stats-panel')).toBeVisible();
  });

  test('4. Dedicated tool route /tools/readability-analyzer renders readability tab directly', async ({ page }) => {
    await page.goto('/tools/readability-analyzer');
    await page.waitForSelector('[data-testid="word-counter-workspace"]', { timeout: 20000 });

    await expect(page.getByTestId('readability-panel')).toBeVisible();
    await expect(page.getByTestId('tab-readability')).toHaveAttribute('aria-selected', 'true');
  });

  test('5. Text Cleaner transforms content and applies it to editor', async ({ page }) => {
    await page.getByTestId('tab-cleaner').click();

    // Choose UPPERCASE action
    await page.getByTestId('action-uppercase').click();
    await expect(page.getByTestId('cleaner-preview-text')).toBeVisible();

    // Apply to editor
    await page.getByTestId('btn-apply-cleaned').click();

    // Check editor content
    const textarea = page.getByTestId('main-text-input');
    const value = await textarea.inputValue();
    expect(value).toContain('FORMATNOOK');
  });

  test('6. Clears text editor and resets stats', async ({ page }) => {
    const clearBtn = page.getByTestId('btn-reset');
    await clearBtn.click();

    const textarea = page.getByTestId('main-text-input');
    await expect(textarea).toHaveValue('');
    await expect(page.getByTestId('badge-word-count')).toContainText('0 words');
    await expect(page.getByTestId('badge-char-count')).toContainText('0 chars');
  });

  test('7. Responsive mobile viewport (390px) renders without horizontal scroll overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/word-counter');
    await page.waitForSelector('[data-testid="word-counter-workspace"]', { timeout: 20000 });

    const workspace = page.getByTestId('word-counter-workspace');
    await expect(workspace).toBeVisible();

    // Verify editor is visible on mobile
    const textarea = page.getByTestId('main-text-input');
    await expect(textarea).toBeVisible();

    // Verify stats panel is stacked and visible
    await expect(page.getByTestId('live-stats-panel')).toBeVisible();

    // Ensure document body does not exceed viewport width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

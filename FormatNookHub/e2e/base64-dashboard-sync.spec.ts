import { test, expect } from '@playwright/test';

test.describe('Base64 Dashboard Selection & Workspace State Synchronization Suite', () => {
  test('Exact Screenshot Scenario: Dashboard -> Base64 to Image Decoder activates Decoder Mode with working Image preview', async ({ page }) => {
    // 1. Open Directory / Dashboard
    await page.goto('/tools/encoders-decoders');
    await expect(page.locator('h1.tool-title')).toContainText('Encoders & Decoders');

    // 2. Click "Base64 to Image Decoder"
    const imageDecoderCard = page.locator('a[href="/tools/base64-to-image"]').first();
    await expect(imageDecoderCard).toBeVisible();
    await imageDecoderCard.click();

    // 3. Verify destination URL and page title
    await expect(page).toHaveURL('/tools/base64-to-image');
    await expect(page.locator('h1.tool-title')).toContainText('Base64 to Image Decoder');
    await expect(page.locator('.tool-subtitle')).toContainText('Convert Base64 strings and Data URIs back into viewable and downloadable images');

    // 4. Verify Decoder Mode is selected (btn-primary) and Encoder switch button is inactive (btn-secondary)
    const decoderModeBtn = page.locator('button[role="tab"]:has-text("Decoder Mode")');
    await expect(decoderModeBtn).toBeVisible();
    await expect(decoderModeBtn).toHaveClass(/btn-primary/);

    const encoderModeLink = page.locator('a[role="tab"]:has-text("Switch to Encoder Mode")');
    await expect(encoderModeLink).toBeVisible();
    await expect(encoderModeLink).toHaveClass(/btn-secondary/);

    // 5. Verify format pill shows Image as active
    await expect(page.locator('span.badge-accent:has-text("Image")')).toBeVisible();

    // 6. Verify Image decoder input is rendered (left panel)
    const inputArea = page.locator('textarea.editor-textarea').first();
    await expect(inputArea).toBeVisible();
    await expect(inputArea).toHaveValue(/data:image\/png;base64/);

    // 7. Verify action button "Decode Payload" is available
    const decodeActionBtn = page.locator('button:has-text("Decode Payload")');
    await expect(decodeActionBtn).toBeVisible();

    // 8. Verify right panel shows Decoded Media Preview with image
    await expect(page.locator('text=Decoded Media Preview')).toBeVisible();
    const previewImg = page.locator('.editor-panel img');
    await expect(previewImg).toBeVisible();

    // 9. Verify Download button is enabled
    const downloadBtn = page.locator('button[title*="Download"]').or(page.locator('button:has-text("Download")')).first();
    await expect(downloadBtn).toBeEnabled();

    // 10. Switch to Image to Base64 via the Encoder Mode switch link
    await encoderModeLink.click();
    await expect(page).toHaveURL('/tools/image-to-base64');
    await expect(page.locator('h1.tool-title')).toContainText('Image to Base64 Converter');

    // 11. Verify Encoder Mode is now selected (btn-primary) and Decoder Mode is inactive link
    const newEncoderBtn = page.locator('button[role="tab"]:has-text("Encoder Mode")');
    await expect(newEncoderBtn).toBeVisible();
    await expect(newEncoderBtn).toHaveClass(/btn-primary/);

    const newDecoderLink = page.locator('a[role="tab"]:has-text("Switch to Decoder Mode")');
    await expect(newDecoderLink).toBeVisible();
    await expect(newDecoderLink).toHaveClass(/btn-secondary/);

    // 12. Verify file dropzone is rendered for encoding
    await expect(page.locator('text=Drop image or click to browse')).toBeVisible();
  });

  test('Workspace in-page format switching: switches format without returning to dashboard', async ({ page }) => {
    // Start on base64-to-image
    await page.goto('/tools/base64-to-image');
    await expect(page.locator('button[role="tab"]:has-text("Decoder Mode")')).toHaveClass(/btn-primary/);

    // Click "Text" format pill inside workspace
    const textFormatLink = page.locator('a[title="Switch to Text Decoder"]');
    await expect(textFormatLink).toBeVisible();
    await textFormatLink.click();

    // Verify seamless transition to base64-to-text
    await expect(page).toHaveURL('/tools/base64-to-text');
    await expect(page.locator('h1.tool-title')).toContainText('Base64 to Text Decoder');
    await expect(page.locator('button[role="tab"]:has-text("Decoder Mode")')).toHaveClass(/btn-primary/);
    await expect(page.locator('div[aria-label="Base64 Format Selection"] span.badge-accent:has-text("Text")')).toBeVisible();

    // Switch to PDF format pill
    const pdfFormatLink = page.locator('a[title="Switch to PDF Decoder"]');
    await expect(pdfFormatLink).toBeVisible();
    await pdfFormatLink.click();

    await expect(page).toHaveURL('/tools/base64-to-pdf');
    await expect(page.locator('h1.tool-title')).toContainText('Base64 to PDF Decoder');
    await expect(page.locator('button[role="tab"]:has-text("Decoder Mode")')).toHaveClass(/btn-primary/);
  });

  test('Direct URL navigation and browser refresh preserves active mode and state', async ({ page }) => {
    // Direct URL access to audio encoder
    await page.goto('/tools/audio-to-base64');
    await expect(page.locator('h1.tool-title')).toContainText('Audio to Base64 Converter');
    await expect(page.locator('button[role="tab"]:has-text("Encoder Mode")')).toHaveClass(/btn-primary/);
    await expect(page.locator('text=Drop audio or click to browse')).toBeVisible();

    // Refresh page
    await page.reload();
    await expect(page.locator('h1.tool-title')).toContainText('Audio to Base64 Converter');
    await expect(page.locator('button[role="tab"]:has-text("Encoder Mode")')).toHaveClass(/btn-primary/);
    await expect(page.locator('text=Drop audio or click to browse')).toBeVisible();
  });

  test('Browser back and forward correctly synchronizes tool mode and workspace', async ({ page }) => {
    await page.goto('/tools/text-to-base64');
    await expect(page.locator('button[role="tab"]:has-text("Encoder Mode")')).toHaveClass(/btn-primary/);

    await page.goto('/tools/base64-to-hex');
    await expect(page.locator('h1.tool-title')).toContainText('Base64 to Hex Converter');
    await expect(page.locator('button[role="tab"]:has-text("Decoder Mode")')).toHaveClass(/btn-primary/);

    // Browser back to text-to-base64
    await page.goBack();
    await expect(page).toHaveURL('/tools/text-to-base64');
    await expect(page.locator('h1.tool-title')).toContainText('Text to Base64');
    await expect(page.locator('button[role="tab"]:has-text("Encoder Mode")')).toHaveClass(/btn-primary/);

    // Browser forward to base64-to-hex
    await page.goForward();
    await expect(page).toHaveURL('/tools/base64-to-hex');
    await expect(page.locator('h1.tool-title')).toContainText('Base64 to Hex Converter');
    await expect(page.locator('button[role="tab"]:has-text("Decoder Mode")')).toHaveClass(/btn-primary/);
  });

  test('All 11 Base64 formats are accessible via industry format selector and quick ribbon', async ({ page }) => {
    await page.goto('/tools/image-to-base64');

    // 1. Verify 11 formats listed in the format bar
    const formatRibbon = page.locator('div[aria-label="Base64 Format Selection"]');
    await expect(formatRibbon).toContainText('Formats (11):');

    // 2. Verify all format pills exist
    const formats = ['Image', 'PDF', 'Audio', 'Video', 'File', 'Text', 'HTML', 'CSS', 'URL', 'Hex', 'Basic Auth'];
    for (const fmt of formats) {
      await expect(formatRibbon.locator(`text=${fmt}`).first()).toBeVisible();
    }

    // 3. Verify dropdown selector has all optgroups attached
    const selectDropdown = page.locator('select#base64-format-select');
    await expect(selectDropdown).toBeVisible();
    await expect(selectDropdown.locator('optgroup[label="Media & Documents"]')).toBeAttached();
    await expect(selectDropdown.locator('optgroup[label="Text & Code"]')).toBeAttached();
    await expect(selectDropdown.locator('optgroup[label="Security"]')).toBeAttached();

    // 4. Navigate to HTML via quick pill
    await page.locator('a[title="Switch to HTML Encoder"]').click();
    await expect(page).toHaveURL('/tools/html-to-base64');
    await expect(page.locator('h1.tool-title')).toContainText('HTML to Base64 Encoder');
    await expect(formatRibbon.locator('span.badge-accent:has-text("HTML")')).toBeVisible();

    // 5. Navigate to Basic Auth via dropdown
    await selectDropdown.selectOption('basic-auth');
    await expect(page).toHaveURL('/tools/basic-auth-decoder');
    await expect(page.locator('h1.tool-title')).toContainText('Basic Authentication Decoder');
    await expect(formatRibbon.locator('span.badge-accent:has-text("Basic Auth")')).toBeVisible();
  });

  test('Pasting massive continuous Base64 payload wraps inside editable area and scrolls vertically without horizontal blowout', async ({ page }) => {
    await page.goto('/tools/base64-to-text');

    const textarea = page.locator('textarea.editor-textarea').first();
    await expect(textarea).toBeVisible();

    // Verify Wrap button is present and active by default
    const wrapBtn = page.locator('button[title*="Word Wrap"]').first();
    await expect(wrapBtn).toBeVisible();
    await expect(wrapBtn).toHaveClass(/btn-primary/);

    // Generate a 5,000-char continuous unbroken Base64 string (no whitespace or newlines)
    const massiveBase64 = 'SGVsbG8gV29ybGQh'.repeat(300); // 4,800 chars unbroken
    await textarea.fill(massiveBase64);

    // Measure wrapping and scrolling behavior
    const metrics = await textarea.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      whiteSpace: window.getComputedStyle(el).whiteSpace,
      wordBreak: window.getComputedStyle(el).wordBreak,
    }));

    // In pre-wrap with break-all, scrollWidth should match clientWidth (no horizontal overflow), and scrollHeight > clientHeight (vertically scrollable)
    expect(metrics.whiteSpace).toBe('pre-wrap');
    expect(metrics.wordBreak).toBe('break-all');
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 5);
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

    // Toggle Wrap OFF
    await wrapBtn.click();
    await expect(wrapBtn).toHaveClass(/btn-ghost/);

    // Verify unwrapped state has white-space: pre
    const unwrappedStyle = await textarea.evaluate((el) => window.getComputedStyle(el).whiteSpace);
    expect(unwrappedStyle).toBe('pre');
  });
});

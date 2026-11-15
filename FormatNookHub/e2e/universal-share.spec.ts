import { test, expect } from '@playwright/test';

test.describe('Universal Share Output System & Base64 Repair UI', () => {
  test('Base64 Repair: Image preview is below editor, and Share dialog offers 5 options', async ({
    page,
  }) => {
    // Navigate to base64 tool repair tab
    await page.goto('/tools/base64-to-image');
    await page.waitForLoadState('networkidle');

    // Switch to Repair & Normalize tab
    const repairTab = page.locator('button', { hasText: 'Repair & Normalize' });
    await repairTab.click();

    // Verify Independent Sections Below Editor Grid
    const previewCard = page.getByTestId('base64-repair-preview-card');
    await expect(previewCard).toBeVisible();

    const errorsCard = page.getByTestId('base64-repair-errors-card');
    await expect(errorsCard).toBeVisible();

    const summaryCard = page.getByTestId('base64-repair-summary-card');
    await expect(summaryCard).toBeVisible();

    // Click sample input "JSON with Image Field"
    const jsonSampleBtn = page.locator('button', { hasText: 'JSON with Image Field' });
    await jsonSampleBtn.click();

    // Verify that preview card updates with image format badge and rendered image
    await expect(previewCard).toContainText('PNG Decoded Successfully');
    await expect(previewCard.locator('img')).toBeVisible();

    // Verify Detected Errors card detects JSON wrapping and Data URI header
    await expect(errorsCard).toContainText('Embedded Data URI Header');

    // Verify Repair Summary card shows transformations
    await expect(summaryCard).toContainText('Repair Transformations Summary');
    await expect(summaryCard).toContainText('Successfully Decodable');

    // Verify Share button is present in output panel header
    const shareBtn = page.getByTestId('btn-share-output');
    await expect(shareBtn).toBeVisible();

    // Open Share Dialog
    await shareBtn.click();
    const shareDialog = page.getByTestId('share-output-dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog).toContainText('Base64 to Image Decoder');

    // Check all format options
    await expect(page.getByTestId('share-option-base64-text')).toBeVisible();
    await expect(page.getByTestId('share-option-decoded-image')).toBeVisible();
    await expect(page.getByTestId('share-option-pdf-report')).toBeVisible();
    await expect(page.getByTestId('share-option-metadata-json')).toBeVisible();
    await expect(page.getByTestId('share-option-summary-txt')).toBeVisible();

    // Test selection of PDF Report
    await page.getByTestId('share-option-pdf-report').click();
    await expect(page.getByTestId('share-option-pdf-report')).toHaveAttribute('aria-checked', 'true');

    // Test selection of Metadata JSON and copy
    await page.getByTestId('share-option-metadata-json').click();
    await page.getByTestId('btn-share-copy').click();
    await expect(page.getByTestId('share-notification')).toBeVisible();

    // Close via Escape key
    await page.keyboard.press('Escape');
    await expect(shareDialog).not.toBeVisible();
  });

  test('Base64 Decoder Mode: Share button is visible in Decoded Media Preview header and provides image PDF report', async ({
    page,
  }) => {
    // Navigate to /tools/base64-to-image (defaults to Decoder Mode)
    await page.goto('/tools/base64-to-image');
    await page.waitForLoadState('networkidle');

    // Input valid 1x1 PNG Base64
    const samplePng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const inputArea = page.locator('textarea').first();
    await inputArea.fill(samplePng);

    // Click Decode Payload
    const decodeBtn = page.getByTestId('btn-decode-payload');
    if (await decodeBtn.isVisible()) {
      await decodeBtn.click();
    }

    // Verify Decoded Media Preview panel header contains [Share] button
    const mediaPanel = page.locator('.editor-panel', { hasText: 'Decoded Media Preview' });
    const shareBtn = mediaPanel.getByTestId('btn-share-output');
    await expect(shareBtn).toBeVisible();

    // Verify Download button is also present
    const downloadBtn = mediaPanel.getByRole('button', { name: /Download/i });
    await expect(downloadBtn).toBeVisible();

    // Click [Share] to open ShareDialog
    await shareBtn.click();
    const shareDialog = page.getByTestId('share-output-dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog).toContainText('Base64 to Image Decoder');

    // Verify dynamic options for decoded image
    await expect(page.getByTestId('share-option-decoded-image-file')).toBeVisible();
    await expect(page.getByTestId('share-option-image-decode-pdf')).toBeVisible();
    await expect(page.getByTestId('share-option-base64-source-text')).toBeVisible();
    await expect(page.getByTestId('share-option-image-metadata-json')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(shareDialog).not.toBeVisible();
  });

  test('JSON Workspace: Share button opens dialog with formatted, minified, and metrics formats', async ({
    page,
  }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForLoadState('networkidle');

    // Verify Output Panel Share button
    const outputPanel = page.getByTestId('json-output-panel');
    const shareBtn = outputPanel.getByTestId('btn-share-output');
    await expect(shareBtn).toBeVisible();

    // Open Share Dialog
    await shareBtn.click();
    const shareDialog = page.getByTestId('share-output-dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog).toContainText('JSON Workspace');

    // Check formats
    await expect(page.getByTestId('share-option-formatted-json')).toBeVisible();
    await expect(page.getByTestId('share-option-minified-json')).toBeVisible();
    await expect(page.getByTestId('share-option-json-metrics')).toBeVisible();

    // Close via Close button
    await page.getByTestId('btn-close-share-dialog').click();
    await expect(shareDialog).not.toBeVisible();
  });

  test('YAML Workspace: Share button opens dialog with YAML document and summary options', async ({
    page,
  }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForLoadState('networkidle');

    // Verify Output Panel Share button
    const outputPanel = page.locator('.editor-panel', { hasText: 'Standardized Output' });
    const shareBtn = outputPanel.getByTestId('btn-share-output');
    await expect(shareBtn).toBeVisible();

    await shareBtn.click();
    const shareDialog = page.getByTestId('share-output-dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog).toContainText('YAML Workspace');

    await expect(page.getByTestId('share-option-formatted-yaml')).toBeVisible();
    await expect(page.getByTestId('share-option-yaml-summary')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(shareDialog).not.toBeVisible();
  });

  test('XML Workspace: Share button opens dialog with clean XML, minified XML, and metrics options', async ({
    page,
  }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForLoadState('networkidle');

    // Verify Output Panel Share button
    const outputPanel = page.locator('.editor-panel', { hasText: 'Formatted Output' });
    const shareBtn = outputPanel.getByTestId('btn-share-output');
    await expect(shareBtn).toBeVisible();

    await shareBtn.click();
    const shareDialog = page.getByTestId('share-output-dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog).toContainText('XML Workspace');

    await expect(page.getByTestId('share-option-formatted-xml')).toBeVisible();
    await expect(page.getByTestId('share-option-minified-xml')).toBeVisible();
    await expect(page.getByTestId('share-option-xml-metrics')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(shareDialog).not.toBeVisible();
  });

  test('Beautifier Workspace: Share button opens dialog with formatted code and audit summary', async ({
    page,
  }) => {
    await page.goto('/tools/sql-formatter');
    await page.waitForLoadState('networkidle');

    // Verify Output Panel Share button
    const outputPanel = page.locator('.editor-panel', { hasText: 'Output (Beautified)' });
    const shareBtn = outputPanel.getByTestId('btn-share-output');
    await expect(shareBtn).toBeVisible();

    await shareBtn.click();
    const shareDialog = page.getByTestId('share-output-dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog).toContainText('SQL Beautifier');

    await expect(page.getByTestId('share-option-formatted-code')).toBeVisible();
    await expect(page.getByTestId('share-option-beautifier-summary')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(shareDialog).not.toBeVisible();
  });

  test('Text Diff: Share button in toolbar opens dialog with patch and summary report', async ({
    page,
  }) => {
    await page.goto('/tools/diff-checker');
    await page.waitForLoadState('networkidle');

    // Trigger compare if needed
    const compareBtn = page.getByTestId('btn-compare');
    if (await compareBtn.isVisible()) {
      await compareBtn.click();
    }

    const shareBtn = page.getByTestId('btn-share-output');
    await expect(shareBtn).toBeVisible();

    await shareBtn.click();
    const shareDialog = page.getByTestId('share-output-dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog).toContainText('Text Diff Checker');

    await expect(page.getByTestId('share-option-unified-diff')).toBeVisible();
    await expect(page.getByTestId('share-option-diff-summary-report')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(shareDialog).not.toBeVisible();
  });

  test('Native Share Cancellation: Aborting native share dialog does not trigger download or error toast', async ({
    page,
  }) => {
    await page.goto('/tools/json-formatter');
    await page.waitForLoadState('networkidle');

    // Mock navigator.share to simulate user cancellation (AbortError)
    await page.addInitScript(() => {
      (navigator as any).share = async () => {
        const err = new Error('Share canceled by user');
        err.name = 'AbortError';
        throw err;
      };
      (navigator as any).canShare = () => true;
    });

    const outputPanel = page.getByTestId('json-output-panel');
    const shareBtn = outputPanel.getByTestId('btn-share-output');
    await shareBtn.click();

    const shareDialog = page.getByTestId('share-output-dialog');
    await expect(shareDialog).toBeVisible();

    // Click native share button
    const nativeShareBtn = page.getByTestId('btn-share-native');
    await nativeShareBtn.click();

    // Verify dialog remains open and NO error or success toast is triggered
    await expect(shareDialog).toBeVisible();
    const notification = page.getByTestId('share-notification');
    await expect(notification).not.toBeVisible();

    await page.keyboard.press('Escape');
    await expect(shareDialog).not.toBeVisible();
  });
});

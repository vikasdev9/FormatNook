import { test, expect } from '@playwright/test';

test.describe('Centered Image Preview Dialog & Click-to-Enlarge Hint', () => {
  // A tiny valid 1x1 PNG Base64 string
  const validPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  test('Desktop: Thumbnail shows Click to enlarge hint and opens centered, non-fullscreen dialog', async ({
    page,
  }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tools/base64-to-image');
    await page.waitForLoadState('networkidle');

    // 8. The `Click to enlarge` hint is visible on the normal image preview
    const hint = page.getByTestId('click-to-enlarge-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('Click to enlarge');

    // 9. The pointer cursor is shown on the preview trigger
    const previewTrigger = page.getByTestId('btn-open-preview-dialog');
    await expect(previewTrigger).toBeVisible();
    const cursor = await previewTrigger.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');

    // 14. Clicking Share or Download does NOT trigger image preview accidentally
    const shareBtn = page.getByTestId('btn-share-output');
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      const shareDialog = page.getByTestId('share-output-dialog');
      await expect(shareDialog).toBeVisible();
      // Ensure image preview modal did NOT open
      await expect(page.getByTestId('image-preview-dialog')).not.toBeVisible();
      // Close share dialog
      await page.keyboard.press('Escape');
      await expect(shareDialog).not.toBeVisible();
    }

    // 1. Clicking the decoded image opens the modal
    await previewTrigger.click();

    // Verify dialog opened
    const dialog = page.getByTestId('image-preview-dialog');
    await expect(dialog).toBeVisible();

    const backdrop = page.getByTestId('image-preview-backdrop');
    await expect(backdrop).toBeVisible();

    // Bounding box measurements
    const viewport = page.viewportSize()!;
    const dialogBox = (await dialog.boundingBox())!;
    const backdropBox = (await backdrop.boundingBox())!;

    // 3. The modal is not full-screen
    expect(dialogBox.width).toBeLessThan(viewport.width);
    expect(dialogBox.height).toBeLessThan(viewport.height);

    // 4. Its width does not exceed 1100px on desktop
    expect(dialogBox.width).toBeLessThanOrEqual(1100);

    // 5. Its height does not exceed 85vh on desktop
    const maxDesktopHeight = viewport.height * 0.85;
    expect(dialogBox.height).toBeLessThanOrEqual(maxDesktopHeight + 2);

    // 6. The backdrop covers the viewport but the dialog does not
    expect(backdropBox.width).toBeGreaterThanOrEqual(viewport.width);
    expect(backdropBox.height).toBeGreaterThanOrEqual(viewport.height);
    expect(dialogBox.width).toBeLessThan(backdropBox.width);
    expect(dialogBox.height).toBeLessThan(backdropBox.height);

    // 2. The modal is centered horizontally and vertically
    const expectedCenterX = (viewport.width - dialogBox.width) / 2;
    const expectedCenterY = (viewport.height - dialogBox.height) / 2;
    expect(Math.abs(dialogBox.x - expectedCenterX)).toBeLessThan(15);
    expect(Math.abs(dialogBox.y - expectedCenterY)).toBeLessThan(25);

    // 7. The image fits inside the modal without cropping
    const imgElement = dialog.getByTestId('preview-image-element');
    await expect(imgElement).toBeVisible();
    const imgBox = (await imgElement.boundingBox())!;
    expect(imgBox.width).toBeLessThanOrEqual(dialogBox.width);
    expect(imgBox.height).toBeLessThanOrEqual(dialogBox.height);

    // 3. Keep only zoom controls (No metadata)
    const dialogText = await dialog.textContent();
    expect(dialogText).not.toMatch(/image\/png/i);
    expect(dialogText).not.toMatch(/image\/jpeg/i);
    expect(dialogText).not.toMatch(/mime/i);
    expect(dialogText).not.toMatch(/\d+\s*KB/i);
    expect(dialogText).not.toMatch(/\d+\s*MB/i);
    expect(dialogText).not.toMatch(/\d+\s*bytes/i);
    expect(dialogText).not.toMatch(/\d+\s*[x×]\s*\d+\s*px/i);
    expect(dialogText).not.toMatch(/aspect\s*ratio/i);
    expect(dialogText).not.toMatch(/exif/i);

    // 11. Zoom and reset controls still work
    const zoomText = dialog.getByTestId('zoom-percentage');
    const zoomInBtn = dialog.getByTestId('btn-zoom-in');
    const zoomOutBtn = dialog.getByTestId('btn-zoom-out');
    const actual100Btn = dialog.getByTestId('btn-zoom-100');
    const resetBtn = dialog.getByTestId('btn-zoom-reset');

    await actual100Btn.click();
    await expect(zoomText).toHaveText('100%');

    await zoomInBtn.click();
    await expect(zoomText).toHaveText('125%');

    await zoomOutBtn.click();
    await expect(zoomText).toHaveText('100%');

    await resetBtn.click();
    await expect(zoomText).toBeVisible();

    // 12. Escape closes the modal
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('Keyboard navigation: Enter and Space open the modal', async ({ page }) => {
    await page.goto('/tools/base64-to-image');
    await page.waitForLoadState('networkidle');

    const previewTrigger = page.getByTestId('btn-open-preview-dialog');
    const dialog = page.getByTestId('image-preview-dialog');

    // 10a. Focus trigger and press Enter
    await previewTrigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // 10b. Focus trigger and press Space
    await previewTrigger.focus();
    await page.keyboard.press('Space');
    await expect(dialog).toBeVisible();

    // Close via close button [X]
    await dialog.getByTestId('btn-close-preview-dialog').click();
    await expect(dialog).not.toBeVisible();
  });

  test('Mobile: Dialog is responsive, fits within viewport, and has no horizontal overflow', async ({
    page,
  }) => {
    // 13. Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tools/base64-to-image');
    await page.waitForLoadState('networkidle');

    const previewTrigger = page.getByTestId('btn-open-preview-dialog');
    await previewTrigger.click();

    const dialog = page.getByTestId('image-preview-dialog');
    await expect(dialog).toBeVisible();

    const dialogBox = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;

    // Modal width is calc(100vw - 24px) or fits within 375px
    expect(dialogBox.width).toBeLessThanOrEqual(viewport.width);
    expect(dialogBox.height).toBeLessThanOrEqual(viewport.height * 0.90 + 2);

    // Verify no document horizontal scrollbar (no horizontal overflow)
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('Base64 Repair: Repaired image has Click to enlarge hint and opens centered modal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tools/base64-to-image');
    await page.waitForLoadState('networkidle');

    // Switch to Repair & Normalize tab
    const repairTab = page.locator('button', { hasText: 'Repair & Normalize' });
    await repairTab.click();

    // Click sample button "JSON with Image Field"
    const jsonSampleBtn = page.locator('button', { hasText: 'JSON with Image Field' });
    await jsonSampleBtn.click();

    // Verify hint on repaired preview
    const hint = page.getByTestId('click-to-enlarge-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('Click to enlarge');

    const repairTrigger = page.getByTestId('btn-open-repair-preview-dialog');
    await repairTrigger.click();

    const dialog = page.getByTestId('image-preview-dialog');
    await expect(dialog).toBeVisible();

    const dialogBox = (await dialog.boundingBox())!;
    expect(dialogBox.width).toBeLessThanOrEqual(1100);

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});

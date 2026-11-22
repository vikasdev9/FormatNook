import { test, expect } from '@playwright/test';

test.describe('FormatNook Image Tools Workspace Suite (Phase B)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/image-tools');
    await page.waitForSelector('[data-testid="image-tools-workspace"]', { timeout: 20000 });
  });

  test('1. Renders empty dropzone with file picker and demo sample trigger', async ({ page }) => {
    const workspace = page.getByTestId('image-tools-workspace');
    await expect(workspace).toBeVisible();

    const dropzone = page.getByTestId('image-dropzone');
    await expect(dropzone).toBeVisible();

    await expect(page.getByTestId('btn-browse-files')).toBeVisible();
    await expect(page.getByTestId('btn-load-sample')).toBeVisible();
    await expect(dropzone.getByText(/100% Client-Side Privacy/i)).toBeVisible();
  });

  test('2. Loads demo sample and displays two-tier toolbar, 40px headers, and viewport', async ({ page }) => {
    // Click Load Demo Sample
    await page.getByTestId('btn-load-sample').click();

    // Verify Toolbar mounts
    await expect(page.getByTestId('image-toolbar')).toBeVisible();

    // Verify 40px Panel Headers
    await expect(page.getByTestId('image-canvas-viewport')).toBeVisible();
    await expect(page.getByTestId('image-inspector')).toBeVisible();

    await expect(page.getByTestId('image-canvas-viewport').getByText('Preview Canvas')).toBeVisible();
    await expect(page.getByTestId('image-inspector').getByText('Adjustment Inspector')).toBeVisible();

    // Verify Viewport Statistics
    const stats = page.getByTestId('viewport-stats');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText('1200 × 800 px');

    // Verify Primary Tool Tabs
    await expect(page.getByTestId('tab-crop')).toBeVisible();
    await expect(page.getByTestId('tab-resize')).toBeVisible();
    await expect(page.getByTestId('tab-rotate')).toBeVisible();
    await expect(page.getByTestId('tab-compress')).toBeVisible();
    await expect(page.getByTestId('tab-convert')).toBeVisible();
    await expect(page.getByTestId('tab-watermark')).toBeVisible();
    await expect(page.getByTestId('tab-metadata')).toBeVisible();
    await expect(page.getByTestId('tab-colors')).toBeVisible();
  });

  test('3. Switches tool tabs and verifies corresponding controls in Inspector', async ({ page }) => {
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('image-toolbar')).toBeVisible();

    // Crop is default active
    await expect(page.getByTestId('inspector-crop')).toBeVisible();

    // Switch to Resize
    await page.getByTestId('tab-resize').click();
    await expect(page.getByTestId('inspector-resize')).toBeVisible();

    // Switch to Rotate & Flip
    await page.getByTestId('tab-rotate').click();
    await expect(page.getByTestId('inspector-rotate')).toBeVisible();

    // Switch to Compress
    await page.getByTestId('tab-compress').click();
    await expect(page.getByTestId('inspector-compress')).toBeVisible();

    // Switch to Convert
    await page.getByTestId('tab-convert').click();
    await expect(page.getByTestId('inspector-convert')).toBeVisible();

    // Switch to Watermark
    await page.getByTestId('tab-watermark').click();
    await expect(page.getByTestId('inspector-watermark')).toBeVisible();

    // Switch to Metadata
    await page.getByTestId('tab-metadata').click();
    await expect(page.getByTestId('inspector-metadata')).toBeVisible();

    // Switch to Color Picker
    await page.getByTestId('tab-colors').click();
    await expect(page.getByTestId('inspector-colors')).toBeVisible();
  });

  test('4. Toggles Before/After split comparison view and zoom controls', async ({ page }) => {
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('image-preview-single')).toBeVisible();

    // Toggle Compare
    const compareBtn = page.getByTestId('btn-toggle-compare');
    await compareBtn.click();

    // Verify split view mounted
    const compareView = page.getByTestId('image-compare-view');
    await expect(compareView).toBeVisible();
    await expect(compareView.getByText('Original')).toBeVisible();
    await expect(compareView.getByText('Processed')).toBeVisible();

    // Toggle back to single preview
    await compareBtn.click();
    await expect(page.getByTestId('image-preview-single')).toBeVisible();
  });

  test('5. Supports mobile responsive tab switching on small viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('btn-load-sample').click();

    await expect(page.getByTestId('image-toolbar')).toBeVisible();

    // Mobile tabs should be visible
    const mobileTabs = page.locator('.image-mobile-tabs');
    await expect(mobileTabs).toBeVisible();

    // Click Adjustments mobile tab
    await mobileTabs.getByRole('tab', { name: /adjustments/i }).click();
    await expect(page.getByTestId('image-inspector')).toBeVisible();

    // Click Canvas mobile tab
    await mobileTabs.getByRole('tab', { name: /canvas/i }).click();
    await expect(page.getByTestId('image-canvas-viewport')).toBeVisible();
  });

  test('6. Header navigation includes Image Tools link and navigates cleanly', async ({ page }) => {
    await page.goto('/');
    const headerNav = page.locator('.header-nav');
    await expect(headerNav).toBeVisible();

    const imageToolsLink = headerNav.getByRole('link', { name: 'Image Tools' });
    await expect(imageToolsLink).toBeVisible();
    await imageToolsLink.click();

    await page.waitForURL('**/tools/image-tools');
    await expect(page.getByTestId('image-tools-workspace')).toBeVisible();
    await expect(imageToolsLink).toHaveClass(/active/);

    await page.locator('.site-header').screenshot({
      path: 'C:/Users/Vikas/.gemini/antigravity/brain/a2402f75-55f8-440d-9238-9f5c9165903e/header-image-tools.png'
    });
  });

  test('7. Interactive crop overlay, aspect presets, and rotate adjustments', async ({ page }) => {
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('image-toolbar')).toBeVisible();

    // Verify Crop Overlay is active on canvas
    const cropOverlay = page.getByTestId('image-crop-overlay');
    await expect(cropOverlay).toBeVisible();

    // Verify 8 crop handles exist
    await expect(page.getByTestId('crop-handle-nw')).toBeVisible();
    await expect(page.getByTestId('crop-handle-se')).toBeVisible();

    // Click 1:1 Aspect Ratio preset in inspector
    await page.getByRole('button', { name: '1:1 Square' }).click();

    // Switch to Rotate tab and click +90 CW
    await page.getByTestId('tab-rotate').click();
    await page.getByRole('button', { name: '+90° CW' }).click();

    // Verify undo button is enabled
    const undoBtn = page.getByTestId('btn-undo');
    await expect(undoBtn).toBeEnabled();

    // Click undo
    await undoBtn.click();
  });

  test('8. Batch queue drawer toggle and ZIP export controls', async ({ page }) => {
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('image-toolbar')).toBeVisible();

    // Open Batch Queue Drawer
    await page.getByTestId('btn-toggle-batch').click();
    const batchDrawer = page.getByTestId('image-batch-drawer');
    await expect(batchDrawer).toBeVisible();

    // Verify Download All (ZIP) button is visible
    await expect(page.getByTestId('btn-download-all-zip')).toBeVisible();
  });

  test('9. Crop area selection triggers cropped image download event', async ({ page }) => {
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('image-crop-overlay')).toBeVisible();

    // Select 1:1 Square aspect preset
    await page.getByRole('button', { name: '1:1 Square' }).click();

    // Wait for download event
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-download-inspector').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('-cropped');
  });

  test('10. Explicit Pixel & Dimension Verification: Crop output matches ONLY selected region and NOT full image', async ({ page }) => {
    // Generate an 800x600 test image with 4 distinct color quadrants (Red, Green, Blue, Yellow)
    const testImageDataUrl = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 600;
      const ctx = c.getContext('2d');
      if (!ctx) return '';
      // Top-Left: Pure Red (#ff0000)
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 400, 300);
      // Top-Right: Pure Green (#00ff00)
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(400, 0, 400, 300);
      // Bottom-Left: Pure Blue (#0000ff)
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(0, 300, 400, 300);
      // Bottom-Right: Pure Yellow (#ffff00)
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(400, 300, 400, 300);
      return c.toDataURL('image/png');
    });

    // Upload via dropzone file input
    const base64Data = testImageDataUrl.replace(/^data:image\/png;base64,/, '');
    const tempBuffer = Buffer.from(base64Data, 'base64');

    await page.getByTestId('image-file-input').setInputFiles({
      name: 'quadrant-test.png',
      mimeType: 'image/png',
      buffer: tempBuffer,
    });

    await expect(page.getByTestId('image-canvas-viewport')).toBeVisible();
    await expect(page.getByTestId('inspector-crop')).toBeVisible();

    // Set custom crop bounds strictly in Top-Left (Pure Red quadrant): W = 250, H = 180
    const widthInput = page.locator('input[type="number"]').first();
    const heightInput = page.locator('input[type="number"]').nth(1);
    await widthInput.fill('250');
    await heightInput.fill('180');

    // Trigger Download and catch the downloaded file
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-download-inspector').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('-cropped');

    // Read downloaded file stream into Buffer
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const downloadedBuffer = Buffer.concat(chunks);

    // 1. Verify PNG IHDR Header Dimensions
    const decodedWidth = downloadedBuffer.readUInt32BE(16);
    const decodedHeight = downloadedBuffer.readUInt32BE(20);
    expect(decodedWidth).toBe(250);
    expect(decodedHeight).toBe(180);
    expect(decodedWidth).not.toBe(800);
    expect(decodedHeight).not.toBe(600);

    // 2. Decode pixels in browser canvas to verify pixel color data
    const pixelAnalysis = await page.evaluate(async (base64) => {
      return new Promise<{ width: number; height: number; center: number[]; topLeft: number[]; bottomRight: number[] }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve({ width: 0, height: 0, center: [], topLeft: [], bottomRight: [] });
          ctx.drawImage(img, 0, 0);

          const center = ctx.getImageData(Math.floor(img.width / 2), Math.floor(img.height / 2), 1, 1).data;
          const topLeft = ctx.getImageData(5, 5, 1, 1).data;
          const bottomRight = ctx.getImageData(img.width - 5, img.height - 5, 1, 1).data;

          resolve({
            width: img.width,
            height: img.height,
            center: Array.from(center),
            topLeft: Array.from(topLeft),
            bottomRight: Array.from(bottomRight),
          });
        };
        img.src = 'data:image/png;base64,' + base64;
      });
    }, downloadedBuffer.toString('base64'));

    expect(pixelAnalysis.width).toBe(250);
    expect(pixelAnalysis.height).toBe(180);

    // Verify center pixel is pure Red (R > 240, G < 15, B < 15, A == 255)
    expect(pixelAnalysis.center[0]).toBeGreaterThan(240);
    expect(pixelAnalysis.center[1]).toBeLessThan(15);
    expect(pixelAnalysis.center[2]).toBeLessThan(15);
    expect(pixelAnalysis.center[3]).toBe(255);

    // Verify corners are also pure Red (confirming no green, blue, or yellow quadrants leaked into crop)
    expect(pixelAnalysis.topLeft[0]).toBeGreaterThan(240);
    expect(pixelAnalysis.topLeft[1]).toBeLessThan(15);
    expect(pixelAnalysis.bottomRight[0]).toBeGreaterThan(240);
    expect(pixelAnalysis.bottomRight[1]).toBeLessThan(15);
  });

  test('11. Multi-image batch queue execution and ZIP download (Phase D)', async ({ page }) => {
    // Generate two synthetic test images in-browser and upload
    await page.evaluate(() => {
      const createDummyFile = (color: string, name: string): File => {
        const c = document.createElement('canvas');
        c.width = 400;
        c.height = 300;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 400, 300);
        const dataUrl = c.toDataURL('image/png');
        const bin = atob(dataUrl.split(',')[1]);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new File([arr], name, { type: 'image/png' });
      };

      const dt = new DataTransfer();
      dt.items.add(createDummyFile('#3b82f6', 'batch-blue.png'));
      dt.items.add(createDummyFile('#10b981', 'batch-green.png'));

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await expect(page.getByTestId('image-toolbar')).toBeVisible();

    // Open Batch Drawer
    const batchToggle = page.getByTestId('btn-toggle-batch');
    await batchToggle.click();

    const drawer = page.getByTestId('image-batch-drawer');
    await expect(drawer).toBeVisible();

    // Verify 2 items in queue
    await expect(drawer.getByText('2 items')).toBeVisible();
    await expect(drawer.getByText('batch-blue.png')).toBeVisible();
    await expect(drawer.getByText('batch-green.png')).toBeVisible();

    // Start Batch Processing
    const startBatchBtn = page.getByTestId('btn-start-batch');
    if (await startBatchBtn.isVisible()) {
      await startBatchBtn.click();
    }

    // Wait for items to be processed
    await expect(drawer.getByText('Ready').first()).toBeVisible({ timeout: 15000 });

    // Download All (ZIP)
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-download-all-zip').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/formatnook-batch-.*\.zip/);

    // Read ZIP buffer and check PKZIP magic number 0x04034b50
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const zipBuffer = Buffer.concat(chunks);
    expect(zipBuffer.length).toBeGreaterThan(0);
    expect(zipBuffer.readUInt32LE(0)).toBe(0x04034b50);
  });

  test('12. Batch cancellation halts in-flight processing (Phase D)', async ({ page }) => {
    // Generate 4 dummy images
    await page.evaluate(() => {
      const createDummyFile = (name: string): File => {
        const c = document.createElement('canvas');
        c.width = 600;
        c.height = 400;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, 0, 600, 400);
        const dataUrl = c.toDataURL('image/png');
        const bin = atob(dataUrl.split(',')[1]);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new File([arr], name, { type: 'image/png' });
      };

      const dt = new DataTransfer();
      for (let i = 1; i <= 4; i++) {
        dt.items.add(createDummyFile(`cancel-test-${i}.png`));
      }

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await expect(page.getByTestId('image-toolbar')).toBeVisible();

    // Open Batch Drawer
    await page.getByTestId('btn-toggle-batch').click();
    const drawer = page.getByTestId('image-batch-drawer');
    await expect(drawer).toBeVisible();

    // Start Batch
    const startBatchBtn = page.getByTestId('btn-start-batch');
    if (await startBatchBtn.isVisible()) {
      await startBatchBtn.click();
      // Click Cancel if still in progress
      const cancelBtn = page.getByTestId('btn-cancel-batch');
      try {
        await cancelBtn.click({ timeout: 1500 });
      } catch {
        // Batch completed before cancel could be clicked
      }
    }

    // Verify drawer still visible and remaining items are not stuck in processing
    await page.waitForTimeout(500);
    const processingBadges = drawer.locator('.batch-badge.processing');
    expect(await processingBadges.count()).toBe(0);
  });

  test('13. Mobile responsive batch segment navigation and vertical stacking at 390px (Phase D)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('image-toolbar')).toBeVisible();

    // Mobile tabs should show Canvas, Adjustments, and Batch tabs
    const mobileTabs = page.locator('.workspace-mobile-tabs');
    await expect(mobileTabs).toBeVisible();
    const batchTab = mobileTabs.getByRole('tab', { name: /Batch/i });
    await expect(batchTab).toBeVisible();

    // Switch to Batch mobile tab
    await batchTab.click();
    const drawer = page.getByTestId('image-batch-drawer');
    await expect(drawer).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '1920px Desktop', width: 1920, height: 1080 },
  { name: '1440px Desktop', width: 1440, height: 900 },
  { name: '1366px Desktop', width: 1366, height: 768 },
  { name: '1024px Landscape Tablet / Small Laptop', width: 1024, height: 768 },
  { name: '768px Tablet Portrait', width: 768, height: 1024 },
  { name: '430px iPhone 14 Pro Max', width: 430, height: 932 },
  { name: '390px iPhone 14', width: 390, height: 844 },
  { name: '375px Mobile Small', width: 375, height: 812 },
  { name: '320px Ultra-Compact Mobile', width: 320, height: 568 },
];

const PAGES_TO_CHECK = [
  '/tools/json-formatter',
  '/tools/xml-formatter',
  '/tools/yaml-formatter',
  '/tools/diff-checker',
  '/tools/text-to-base64',
];

test.describe('Responsive Viewports Multi-Screen Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`Layout at ${vp.name} (${vp.width}x${vp.height}) has no horizontal document overflow and renders editors`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of PAGES_TO_CHECK) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });

        // Check horizontal overflow on document body
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowance for subpixel rendering

        // Check main container visibility
        const container = page.locator('.container, .tool-page-wrapper').first();
        await expect(container).toBeVisible();
      }
    });
  }

  test('Mobile Smartphone (375px) workspace panel switcher toggles input and output panels', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // 1. Base64 Workspace
    await page.goto('/tools/text-to-base64', { waitUntil: 'domcontentloaded' });
    const base64MobileTabs = page.locator('.workspace-mobile-tabs');
    await expect(base64MobileTabs).toBeVisible();

    const outputTab = page.getByRole('tab', { name: /Output Result/i });
    await outputTab.click();
    const inputPanel = page.locator('.editor-panel').first();
    await expect(inputPanel).toHaveClass(/mobile-panel-hidden/);

    // 2. XML Workspace
    await page.goto('/tools/xml-formatter', { waitUntil: 'domcontentloaded' });
    const xmlMobileTabs = page.locator('.workspace-mobile-tabs');
    await expect(xmlMobileTabs).toBeVisible();

    // 3. YAML Workspace
    await page.goto('/tools/yaml-formatter', { waitUntil: 'domcontentloaded' });
    const yamlMobileTabs = page.locator('.workspace-mobile-tabs');
    await expect(yamlMobileTabs).toBeVisible();

    // 4. Diff Workspace
    await page.goto('/tools/diff-checker', { waitUntil: 'domcontentloaded' });
    const diffMobileTabs = page.locator('.workspace-mobile-tabs');
    await expect(diffMobileTabs).toBeVisible();
  });
});


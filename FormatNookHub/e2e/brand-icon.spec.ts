import { test, expect } from '@playwright/test';

test.describe('FormatNook Brand Icon and Favicon', () => {
  test('1. Brand icon displays in top-left navbar with correct source and dimensions', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));
    await page.goto('/');

    const logo = page.locator('.site-header .logo');
    await expect(logo).toBeVisible();

    // Verify wordmark text
    await expect(logo).toContainText('FormatNook');
    await expect(logo.locator('.logo-badge')).toHaveText('Hub');

    // Verify brand icon image
    const icon = logo.locator('.logo-image');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', '/brand-icon.png');
    await expect(icon).toHaveAttribute('alt', 'FormatNook Brand Icon');

    // Verify natural image dimensions
    const isLoaded = await icon.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(isLoaded).toBe(true);

    const box = await icon.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(Math.round(box.width)).toBeGreaterThanOrEqual(32);
      expect(Math.round(box.width)).toBeLessThanOrEqual(36);
      expect(Math.round(box.height)).toBeGreaterThanOrEqual(32);
      expect(Math.round(box.height)).toBeLessThanOrEqual(36);
    }
  });

  test('2. Brand icon displays in footer', async ({ page }) => {
    await page.goto('/');

    const footerLogo = page.locator('.site-footer .logo');
    await expect(footerLogo).toBeVisible();
    await expect(footerLogo).toContainText('FormatNook');

    const footerIcon = footerLogo.locator('.logo-image');
    await expect(footerIcon).toBeVisible();
    await expect(footerIcon).toHaveAttribute('src', '/brand-icon.png');

    const isLoaded = await footerIcon.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(isLoaded).toBe(true);
  });

  test('3. Favicon and PWA metadata tags are present and accessible', async ({ page, request }) => {
    await page.goto('/');

    // Check favicon links in head
    const faviconIco = page.locator('head link[rel="icon"][href="/favicon.ico"]');
    await expect(faviconIco).toHaveCount(1);

    const favicon32 = page.locator('head link[rel="icon"][sizes="32x32"]');
    await expect(favicon32).toHaveAttribute('href', '/favicon-32x32.png');

    const appleTouchIcon = page.locator('head link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveAttribute('href', '/apple-touch-icon.png');

    const manifest = page.locator('head link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/site.webmanifest');

    // Verify HTTP 200 for all icon assets
    const assets = [
      '/favicon.ico',
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/favicon-48x48.png',
      '/brand-icon.png',
      '/apple-touch-icon.png',
      '/icon-192.png',
      '/icon-512.png',
      '/site.webmanifest',
    ];

    for (const asset of assets) {
      const res = await request.get(asset);
      expect(res.status(), `Asset ${asset} returned status ${res.status()}`).toBe(200);
    }
  });

  test('4. Brand icon displays properly in both Dark and Light themes', async ({ page }) => {
    await page.goto('/');

    const icon = page.locator('.site-header .logo .logo-image');
    await expect(icon).toBeVisible();

    // Verify theme toggle works and icon remains visible
    const themeBtn = page.locator('.header-actions button[aria-label*="Switch to"]');
    await expect(themeBtn).toBeVisible();

    // Switch to dark/light
    await themeBtn.click();
    await expect(icon).toBeVisible();

    // Switch back
    await themeBtn.click();
    await expect(icon).toBeVisible();
  });

  test('5. Brand icon maintains aspect ratio and layout on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const logo = page.locator('.site-header .logo');
    await expect(logo).toBeVisible();

    const icon = logo.locator('.logo-image');
    await expect(icon).toBeVisible();

    const box = await icon.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeCloseTo(box.height, 1); // 1:1 aspect ratio
    }

    // Zero horizontal page overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(overflow).toBe(true);
  });
});

import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const TARGET_ROUTE = '/tools/json-minifier';

test('Capture remaining 2 screenshots', async ({ page }) => {
  const dir1 = path.resolve('..', 'docs', 'user-guides', 'json', 'screenshots');
  const dir2 = path.resolve('docs', 'user-guides', 'json', 'screenshots');

  fs.mkdirSync(dir1, { recursive: true });
  fs.mkdirSync(dir2, { recursive: true });

  async function saveScreenshot(name: string) {
    const p1 = path.join(dir1, name);
    const p2 = path.join(dir2, name);
    await page.screenshot({ path: p1, fullPage: false });
    fs.copyFileSync(p1, p2);
  }

  // 1. Recents Modal
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(TARGET_ROUTE);
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('recents-modal-btn').click();
  await page.waitForTimeout(500);
  await saveScreenshot('json-recents-modal.png');

  // 2. Mobile View
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(TARGET_ROUTE);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  await saveScreenshot('json-mobile-390px.png');
});

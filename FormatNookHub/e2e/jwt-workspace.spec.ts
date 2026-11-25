import { test, expect } from '@playwright/test';

test.describe('JWT Decoder & Inspector Workspace Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/jwt-decoder');
    await page.waitForSelector('[data-testid="jwt-workspace"]', { timeout: 20000 });
  });

  test('1. Loads JWT Decoder with initial sample token, security warning, and overview panel', async ({
    page,
  }) => {
    const workspace = page.getByTestId('jwt-workspace');
    await expect(workspace).toBeVisible();

    // Security warning banner must be prominent
    const warning = page.getByTestId('jwt-security-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(/Decoding is NOT Verification/i);

    // Raw input and valid status badge
    await expect(page.getByTestId('jwt-raw-input')).toBeVisible();
    await expect(page.getByTestId('badge-jwt-valid')).toBeVisible();

    // Overview cards
    await expect(page.getByTestId('overview-alg')).toHaveText('HS256');
    await expect(page.getByTestId('overview-typ')).toHaveText('JWT');

    // Claims table
    await expect(page.getByTestId('claims-table')).toBeVisible();
    await expect(page.getByTestId('claim-row-sub')).toBeVisible();
  });

  test('2. Displays error diagnostics when a malformed token is pasted', async ({ page }) => {
    const textarea = page.getByTestId('jwt-raw-input');
    await textarea.fill('invalid.jwt.token.with.five.segments');

    await expect(page.getByTestId('badge-jwt-invalid')).toBeVisible();
    await expect(page.getByTestId('jwt-errors-container')).toBeVisible();
  });

  test('3. Tab navigation switches between Header, Payload, Expiry, and Signature views', async ({ page }) => {
    // Header
    await page.getByTestId('tab-header').click();
    await expect(page.getByTestId('jwt-header-panel')).toBeVisible();
    await expect(page.getByTestId('header-json-textarea')).toContainText('HS256');

    // Payload
    await page.getByTestId('tab-payload').click();
    await expect(page.getByTestId('jwt-payload-panel')).toBeVisible();
    await expect(page.getByTestId('payload-json-textarea')).toContainText('Ada Lovelace');

    // Expiry
    await page.getByTestId('tab-expiry').click();
    await expect(page.getByTestId('jwt-expiry-panel')).toBeVisible();
    await expect(page.getByTestId('clock-skew-slider')).toBeVisible();

    // Signature
    await page.getByTestId('tab-signature').click();
    await expect(page.getByTestId('jwt-signature-panel')).toBeVisible();
    await expect(page.getByTestId('signature-code')).toBeVisible();
  });

  test('4. Dedicated routes /tools/jwt-inspector and /tools/jwt-timestamp-converter render their respective tabs', async ({
    page,
  }) => {
    await page.goto('/tools/jwt-inspector');
    await page.waitForSelector('[data-testid="jwt-workspace"]', { timeout: 20000 });
    await expect(page.getByTestId('jwt-header-panel')).toBeVisible();
    await expect(page.getByTestId('tab-header')).toHaveAttribute('aria-selected', 'true');

    await page.goto('/tools/jwt-timestamp-converter');
    await page.waitForSelector('[data-testid="jwt-workspace"]', { timeout: 20000 });
    await expect(page.getByTestId('jwt-converter-panel')).toBeVisible();
    await expect(page.getByTestId('tab-converter')).toHaveAttribute('aria-selected', 'true');
  });

  test('5. Clears token input and sensitive decoded data', async ({ page }) => {
    await page.getByTestId('btn-reset').click();

    const textarea = page.getByTestId('jwt-raw-input');
    await expect(textarea).toHaveValue('');
    await expect(page.getByText(/Ready for input/i)).toBeVisible();
  });

  test('6. Responsive mobile viewport (390px) renders without horizontal scroll overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/jwt-decoder');
    await page.waitForSelector('[data-testid="jwt-workspace"]', { timeout: 20000 });

    const workspace = page.getByTestId('jwt-workspace');
    await expect(workspace).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Base64 Developer Workbench End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    await page.goto('/tools/text-to-base64');
    await expect(page.locator('h1.tool-title')).toBeVisible();
  });

  test('loads Base64 workspace and encodes plain text', async ({ page }) => {
    // Check main tool title
    await expect(page.locator('h1.tool-title')).toContainText(/Base64/i);

    // Verify workbench tabs are present
    const tabs = page.locator('div[role="tablist"] button[role="tab"]');
    await expect(tabs).toContainText([
      'Workspace',
      'Smart Inspector',
      'Validator',
      'Repair & Normalize',
      'Data URI',
      'Payload Extractor',
      'Hex Viewer',
      'Gzip Compression',
      'Basic Auth',
    ]);

    // Check default input and output
    const inputTextarea = page.locator('textarea.editor-textarea').first();
    const outputTextarea = page.locator('textarea.editor-textarea').nth(1);

    await inputTextarea.fill('Hello FormatNook Hub!');
    await expect(outputTextarea).toHaveValue('SGVsbG8gRm9ybWF0Tm9vayBIdWIh');
  });

  test('Smart Inspector analyzes unknown Base64 payloads and suggests actions', async ({ page }) => {
    // Click Smart Inspector tab
    await page.click('button:has-text("Smart Inspector")');

    // Load PNG sample
    await page.click('button:has-text("PNG Image")');

    // Verify inspector diagnosis cards
    await expect(page.locator('text=image/png').first()).toBeVisible();
    await expect(page.locator('text=HIGH CONFIDENCE').first()).toBeVisible();
    await expect(page.locator('text=Preview Image').first()).toBeVisible();

    // Load JWT sample
    await page.click('button:has-text("JWT Token")');
    await expect(page.locator('text=Decoded JSON Web Token (JWT) Structure')).toBeVisible();
  });

  test('Validator verifies compliance and catches errors with suggestions', async ({ page }) => {
    // Click Validator tab
    await page.click('button:has-text("Validator")');

    // Load Corrupted Char sample
    await page.click('button:has-text("Corrupted Char ($)")');

    // Should indicate invalid
    await expect(page.locator('text=Base64 Validation Errors Found')).toBeVisible();
    await expect(page.locator('text=Illegal Base64 character')).toBeVisible();

    // Load Valid Standard sample
    await page.click('button:has-text("Valid Standard")');
    await expect(page.locator('text=Valid RFC 4648 Base64 String')).toBeVisible();
  });

  test('Repair & Normalize cleans whitespace, strips Data URI, and pads string', async ({ page }) => {
    // Click Repair tab
    await page.click('button:has-text("Repair & Normalize")');

    // Load sample with newlines and Data URI
    await page.click('button:has-text("Embedded Newlines & Data URI")');

    // Repaired output should not contain data: header or newlines
    const repairedTextarea = page.locator('textarea.editor-textarea').nth(1);
    const val = await repairedTextarea.inputValue();
    expect(val).not.toContain('data:image/png;base64,');
    expect(val).not.toContain('\n');
    expect(val.length).toBeGreaterThan(50);
  });

  test('Data URI Workbench parses URI and generates developer snippets', async ({ page }) => {
    // Click Data URI tab
    await page.click('button:has-text("Data URI")');

    // Verify metadata
    await expect(page.locator('text=image/png').first()).toBeVisible();
    await expect(page.locator('text=Ready-to-Use Developer Code Snippets')).toBeVisible();
    await expect(page.locator('text=HTML Image Tag')).toBeVisible();
  });

  test('Payload Extractor finds Base64 candidates in logs', async ({ page }) => {
    // Click Payload Extractor tab
    await page.click('button:has-text("Payload Extractor")');

    // Verify detected candidates appear
    await expect(page.locator('text=Detected Base64 Payloads').first()).toBeVisible();
    await expect(page.locator('text=#1').first()).toBeVisible();
  });

  test('Hex Viewer renders binary offsets, hex columns, and ASCII gutter', async ({ page }) => {
    // Click Hex Viewer tab
    await page.click('button:has-text("Hex Viewer")');

    // Verify offset and decoded ASCII
    await expect(page.locator('text=00000000')).toBeVisible();
    await expect(page.locator('text=Hello, FormatNoo')).toBeVisible();
  });

  test('Basic Auth Workspace generates header and decodes token', async ({ page }) => {
    // Click Basic Auth tab
    await page.click('button:has-text("Basic Auth")');

    // Verify decoded username
    await expect(page.locator('input[value="admin"]')).toBeVisible();

    // Switch to Generate Header mode
    await page.click('button:has-text("Generate Header")');
    await expect(page.locator('pre:has-text("Authorization: Basic")').first()).toBeVisible();
  });
});


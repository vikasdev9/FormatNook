import { test, expect } from '@playwright/test';

const MALFORMED_JSON_IMAGE_INPUT = `{\n  "banner_image": "data:image/png;base64,\\niVBORw0KGgoAAAANSUhEUgAAAAEAAAAB\\nCAYAAAAfFcSJAAAADUlEQVR42mNk\\n+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",\n  "other_field": "some other value"\n}`;
const CLEAN_PNG_PAYLOAD = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test.describe('Base64 to Image Decoder -> Repair & Normalize Round-Trip Workflow Suite', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    await page.goto('/tools/base64-to-image');
    await expect(page.locator('h1.tool-title')).toContainText('Base64 to Image Decoder');
  });

  test('30-35. Complete Round-Trip: Decode error triggers Repair, extracts JSON payload, normalizes, and returns to Image Decoder with preview', async ({ page }) => {
    const inputArea = page.locator('textarea.editor-textarea').first();

    // 1. Enter malformed JSON payload containing image and other fields
    await inputArea.fill(MALFORMED_JSON_IMAGE_INPUT);

    // 2. Click Decode Payload
    const decodeBtn = page.locator('button:has-text("Decode Payload")');
    await decodeBtn.click();

    // 3. Verify decode failure and presence of Repair action
    const validationAlert = page.locator('div.validation-card.invalid');
    await expect(validationAlert).toBeVisible();
    await expect(validationAlert).toContainText(/Invalid Base64 sequence/i);

    const repairActionBtn = page.locator('button:has-text("Repair & Normalize Payload")');
    await expect(repairActionBtn).toBeVisible();

    // 4. Click "Repair & Normalize Payload" to transfer input
    await repairActionBtn.click();

    // 5. Verify transition to Repair & Normalize tab and input transfer (Scenario 31)
    const repairHeading = page.locator('text=Base64 Repair & Normalization Engine');
    await expect(repairHeading).toBeVisible();

    const originalInputTextarea = page.locator('textarea.editor-textarea').first();
    const originalValue = await originalInputTextarea.inputValue();
    expect(originalValue).toBe(MALFORMED_JSON_IMAGE_INPUT);

    // 6. Verify intelligent candidate extraction (Scenario 32)
    await expect(page.locator('text=/Format: JSON/i')).toBeVisible();

    // 7. Verify repaired output is canonical Base64
    const repairedTextarea = page.locator('textarea.editor-textarea').nth(1);
    await expect(repairedTextarea).toHaveValue(CLEAN_PNG_PAYLOAD);

    // 8. Verify transformation report accuracy (Scenario 33)
    const transformSummary = page.locator('text=Repair Transformations Summary');
    await expect(transformSummary).toBeVisible();
    await expect(page.locator('text=Extracted JSON property: banner_image')).toBeVisible();
    await expect(page.locator('text=Stripped Data URI prefix header')).toBeVisible();

    // 9. Verify live image preview in Repair workspace
    const previewImg = page.locator('img[alt="Decoded Repaired Preview"]');
    await expect(previewImg).toBeVisible();
    await expect(page.locator('text=PNG Decoded Successfully')).toBeVisible();
    await expect(page.locator('text=1 × 1 px')).toBeVisible();

    // 10. Click "Use Repaired Base64" action to return to Image Decoder (Scenario 34)
    const useRepairedBtn = page.locator('button:has-text("Use Repaired Base64")').first();
    await expect(useRepairedBtn).toBeVisible();
    await useRepairedBtn.click();

    // 11. Verify return to Workspace and automatic image preview (Scenario 35)
    await expect(page.locator('text=Decoded Media Preview')).toBeVisible();
    const finalImagePreview = page.locator('.editor-panel img');
    await expect(finalImagePreview).toBeVisible();

    // Verify Success validation message in Workspace
    const successValidation = page.locator('div.validation-card.valid');
    await expect(successValidation).toBeVisible();
    await expect(successValidation).toContainText('Successfully Decoded');

    // Verify input now has the clean payload
    const finalInputValue = await page.locator('textarea.editor-textarea').first().inputValue();
    expect(finalInputValue).toBe(CLEAN_PNG_PAYLOAD);
  });

  test('36. Copy and Download actions in Repair workspace', async ({ page }) => {
    // Navigate directly to Repair tab
    await page.click('button[role="tab"]:has-text("Repair & Normalize")');

    // Click sample
    await page.click('button:has-text("Missing Padding (=)")');

    const repairedTextarea = page.locator('textarea.editor-textarea').nth(1);
    await expect(repairedTextarea).toHaveValue('SGVsbG8gV29ybGQ=');

    // Copy Repaired button should be visible and clickable
    const copyRepairedBtn = page.locator('button:has-text("Copy Repaired")');
    await expect(copyRepairedBtn).toBeVisible();

    // Download Repaired button should be visible and enabled
    const downloadBtn = page.locator('button:has-text("Download")').first();
    await expect(downloadBtn).toBeEnabled();
  });

  test('37. Switching between tabs preserves input and state', async ({ page }) => {
    // 1. Enter input in Workspace
    const inputArea = page.locator('textarea.editor-textarea').first();
    await inputArea.fill('data:image/png;base64,iVBORw0KGgo=');

    // 2. Switch to Validator
    await page.click('button[role="tab"]:has-text("Validator")');
    await expect(page.locator('text=Base64 Syntax & Structure Validator')).toBeVisible();

    // 3. Switch to Repair & Normalize
    await page.click('button[role="tab"]:has-text("Repair & Normalize")');
    await expect(page.locator('text=Base64 Repair & Normalization Engine')).toBeVisible();

    // 4. Switch back to Workspace
    await page.click('button[role="tab"]:has-text("Workspace")');
    const returnedValue = await page.locator('textarea.editor-textarea').first().inputValue();
    expect(returnedValue).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  test('Multiple candidates extraction in Repair tab allows candidate switching', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Repair & Normalize")');
    const inputArea = page.locator('textarea.editor-textarea').first();

    const multiJson = JSON.stringify({
      first_img: `data:image/png;base64,${CLEAN_PNG_PAYLOAD}`,
      second_img:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    });

    await inputArea.fill(multiJson);
    await expect(page.locator('text=/Extracted Base64 Candidates \\(2 found\\)/i')).toBeVisible();
    await expect(page.locator('button:has-text("first_img")')).toBeVisible();
    await expect(page.locator('button:has-text("second_img")')).toBeVisible();
  });
});

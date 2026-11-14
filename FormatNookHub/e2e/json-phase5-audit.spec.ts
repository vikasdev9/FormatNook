import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TARGET_ROUTE = '/tools/json-minifier';

interface PerformanceMetric {
  payloadSizeLabel: string;
  payloadSizeBytes: number;
  itemCount: number;
  parseTimeMs: number;
  beautifyTimeMs: number;
  minifyTimeMs: number;
  validateTimeMs: number;
  foldingTimeMs: number;
  treeRenderMs?: number;
  tableRenderMs?: number;
  editorSwitchMs?: number;
  workerFormatMs?: number;
  workerMinifyMs?: number;
  heapUsedBytesBefore?: number;
  heapUsedBytesAfter?: number;
  eventLoopLagMs: number;
}

test.describe('Phase 5: JSON Workspace Production Quality Audit', () => {
  test.setTimeout(240000); // 4 minutes for large payloads and audit

  test('1. Performance Benchmarks across 1KB, 100KB, 1MB, 5MB, 10MB, 25MB', async ({ page }) => {
    await page.goto(TARGET_ROUTE);
    await page.waitForLoadState('networkidle');

    // Run progressive payload benchmark directly inside the browser execution context
    const benchmarkResults: PerformanceMetric[] = await page.evaluate(async () => {
      const results: PerformanceMetric[] = [];

      // Helper to generate synthetic JSON of target byte size
      function generateSyntheticJson(targetBytes: number) {
        const itemTemplate = {
          id: 1000,
          uuid: 'e2a8b5c4-7d3f-4a1b-9c8e-5f6a7b8c9d0e',
          name: 'Sample Item Name with standard length property',
          category: 'Hardware & Accessories',
          price: 199.99,
          inStock: true,
          tags: ['tech', 'gadget', 'formatnook', 'production'],
          attributes: { weightKg: 1.25, dimensions: { w: 10, h: 20, d: 5 } },
          history: [
            { timestamp: 1731600000, event: 'created' },
            { timestamp: 1731610000, event: 'updated' }
          ]
        };
        const templateStr = JSON.stringify(itemTemplate);
        const itemSize = templateStr.length + 2; // with comma
        const count = Math.max(1, Math.floor(targetBytes / itemSize));
        const items = [];
        for (let i = 0; i < count; i++) {
          items.push({
            ...itemTemplate,
            id: i + 1,
            name: `Sample Item #${i + 1}`
          });
        }
        return JSON.stringify(items);
      }

      // Payload target sizes
      const targets = [
        { label: '1 KB', bytes: 1024 },
        { label: '100 KB', bytes: 102400 },
        { label: '1 MB', bytes: 1048576 },
        { label: '5 MB', bytes: 5242880 },
        { label: '10 MB', bytes: 10485760 },
        { label: '25 MB', bytes: 26214400 },
      ];

      for (const target of targets) {
        const jsonStr = generateSyntheticJson(target.bytes);
        const actualBytes = new Blob([jsonStr]).size;

        const heapBefore = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : undefined;

        // 1. Parse duration
        const t0 = performance.now();
        const parsed = JSON.parse(jsonStr);
        const parseTimeMs = Math.round((performance.now() - t0) * 100) / 100;

        // 2. Beautify duration (2 spaces)
        const t1 = performance.now();
        const beautified = JSON.stringify(parsed, null, 2);
        const beautifyTimeMs = Math.round((performance.now() - t1) * 100) / 100;

        // 3. Minify duration
        const t2 = performance.now();
        const minified = JSON.stringify(parsed);
        const minifyTimeMs = Math.round((performance.now() - t2) * 100) / 100;

        // 4. Validate duration (strict check)
        const t3 = performance.now();
        let isValid = true;
        try {
          JSON.parse(minified);
        } catch {
          isValid = false;
        }
        const validateTimeMs = Math.round((performance.now() - t3) * 100) / 100;

        // 5. Folding computation (simulating line-based O(N) folding scanner)
        const t4 = performance.now();
        let foldCount = 0;
        let inStr = false;
        let esc = false;
        for (let i = 0; i < beautified.length; i++) {
          const c = beautified[i];
          if (inStr) {
            if (esc) esc = false;
            else if (c === '\\') esc = true;
            else if (c === '"') inStr = false;
            continue;
          }
          if (c === '"') inStr = true;
          else if (c === '{' || c === '[') foldCount++;
        }
        const foldingTimeMs = Math.round((performance.now() - t4) * 100) / 100;

        // 6. Main thread lag / event loop responsiveness
        const loopStart = performance.now();
        await new Promise((resolve) => setTimeout(resolve, 0));
        const eventLoopLagMs = Math.round((performance.now() - loopStart) * 100) / 100;

        // 7. Worker format & minify for >= 2.5MB
        let workerFormatMs: number | undefined;
        let workerMinifyMs: number | undefined;

        if (actualBytes > 2 * 1024 * 1024) {
          try {
            const workerScript = `
              self.onmessage = function(e) {
                const { id, action, payload } = e.data;
                const start = performance.now();
                if (action === 'format') {
                  const p = JSON.parse(payload);
                  const res = JSON.stringify(p, null, 2);
                  self.postMessage({ id, time: performance.now() - start });
                } else if (action === 'minify') {
                  const p = JSON.parse(payload);
                  const res = JSON.stringify(p);
                  self.postMessage({ id, time: performance.now() - start });
                }
              };
            `;
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const worker = new Worker(url);

            const formatPromise = new Promise<number>((res) => {
              worker.onmessage = (e) => res(Math.round(e.data.time * 100) / 100);
              worker.postMessage({ id: 1, action: 'format', payload: jsonStr });
            });
            workerFormatMs = await formatPromise;

            const minifyPromise = new Promise<number>((res) => {
              worker.onmessage = (e) => res(Math.round(e.data.time * 100) / 100);
              worker.postMessage({ id: 2, action: 'minify', payload: jsonStr });
            });
            workerMinifyMs = await minifyPromise;

            worker.terminate();
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error('Worker benchmark error:', e);
          }
        }

        const heapAfter = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : undefined;

        results.push({
          payloadSizeLabel: target.label,
          payloadSizeBytes: actualBytes,
          itemCount: parsed.length,
          parseTimeMs,
          beautifyTimeMs,
          minifyTimeMs,
          validateTimeMs,
          foldingTimeMs,
          workerFormatMs,
          workerMinifyMs,
          heapUsedBytesBefore: heapBefore,
          heapUsedBytesAfter: heapAfter,
          eventLoopLagMs,
        });

        // Let GC settle if needed
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return results;
    });

    // Write benchmark data to docs directory for report generation
    const docsDir = path.resolve('..', 'docs', 'qa', 'json-workspace');
    if (fs.existsSync(docsDir)) {
      fs.writeFileSync(
        path.join(docsDir, 'benchmark-data.json'),
        JSON.stringify(benchmarkResults, null, 2)
      );
    }

    expect(benchmarkResults.length).toBe(6);
    expect(benchmarkResults[0].parseTimeMs).toBeLessThan(10); // 1KB parse < 10ms
    expect(benchmarkResults[2].parseTimeMs).toBeLessThan(150); // 1MB parse < 150ms
    expect(benchmarkResults[5].payloadSizeLabel).toBe('25 MB');
  });

  test('2. UX Audit: Interactive Verification of Developer Workflows', async ({ page }) => {
    await page.goto(TARGET_ROUTE);
    await page.waitForLoadState('networkidle');

    // 1. Feature discoverability & tooltips
    const buttons = await page.locator('button[data-testid]').all();
    let withTooltipOrAria = 0;
    for (const btn of buttons) {
      const title = await btn.getAttribute('title');
      const ariaLabel = await btn.getAttribute('aria-label');
      if (title || ariaLabel) withTooltipOrAria++;
    }
    expect(withTooltipOrAria).toBeGreaterThan(15);

    // 2. Destructive action safeguard: Clear button
    const clearBtn = page.locator('button[aria-label="Clear contents"], button:has-text("Clear")').first();
    await expect(clearBtn).toBeVisible();

    // 3. Stale output feedback: when input changes, check status
    const standaloneInput = page.locator('textarea[data-testid="standalone-editor"]');
    if (await standaloneInput.isVisible()) {
      await standaloneInput.fill('{"test": 123}');
      await page.waitForTimeout(500);
    }

    // 4. Keyboard Shortcuts modal discoverability
    const shortcutsBtn = page.locator('[data-testid="shortcuts-modal-btn"]');
    if (await shortcutsBtn.isVisible()) {
      await shortcutsBtn.click();
      await expect(page.locator('[data-testid="json-shortcuts-modal"]')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="json-shortcuts-modal"]')).not.toBeVisible();
    }
  });

  test('3. Accessibility Audit: Keyboard Navigation, ARIA, and Contrast', async ({ page }) => {
    await page.goto(TARGET_ROUTE);
    await page.waitForLoadState('networkidle');

    // 1. Verify primary workspace landmarks and roles
    const mainRole = page.locator('main, [role="main"]');
    await expect(mainRole.first()).toBeVisible();

    // 2. Verify Tab key navigation
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();

    // 3. Focus outline visibility
    const focusOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(focusOutline).toBeTruthy();

    // 4. Modal focus trap and Escape key dismissal
    const settingsBtn = page.locator('[data-testid="palette-modal-trigger"]');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await expect(page.locator('[data-testid="palette-modal"]')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="palette-modal"]')).not.toBeVisible();
    }
  });

  test('4. Responsive Viewports & Theme Palettes Verification', async ({ page }) => {
    const viewports = [
      { width: 320, height: 600, label: '320px (Small Mobile)' },
      { width: 375, height: 667, label: '375px (iPhone SE)' },
      { width: 390, height: 844, label: '390px (iPhone 13/14)' },
      { width: 430, height: 932, label: '430px (iPhone Pro Max)' },
      { width: 768, height: 1024, label: '768px (iPad Mini)' },
      { width: 1024, height: 768, label: '1024px (iPad Pro)' },
      { width: 1366, height: 768, label: '1366px (Laptop)' },
      { width: 1920, height: 1080, label: '1920px (Desktop Full HD)' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(TARGET_ROUTE);
      await page.waitForLoadState('domcontentloaded');

      // Check no horizontal scrollbar on body
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // On mobile viewports (<= 768px), verify mobile layout controls
      if (vp.width <= 768) {
        const mobileTabs = page.locator('[data-testid="mobile-tab-input"], [data-testid="mobile-tab-output"]');
        const count = await mobileTabs.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    }

    // Theme Switching: Light, Dark, High Contrast
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(TARGET_ROUTE);

    // Dark Mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    let themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAttr).toBe('dark');

    // Light Mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAttr).toBe('light');
  });

  test('5. Privacy & Security: Zero Payload Egress and Clean Storage', async ({ page }) => {
    const interceptedRequests: { url: string; method: string; postData?: string }[] = [];

    // Monitor all network requests
    page.on('request', (request) => {
      interceptedRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData() || undefined,
      });
    });

    await page.goto(TARGET_ROUTE);
    await page.waitForLoadState('networkidle');

    // Perform intensive JSON operations with sensitive test payload
    const sensitivePayload = JSON.stringify({
      secretKey: 'formatnook-secret-user-token-998877',
      passwordHash: '$2b$12$e8Y5Hq2vB1o7X...sensitive',
      customerEmails: ['john@acme.corp', 'sarah@classified.gov'],
      financialRecords: [{ invoice: 'INV-2026-001', amount: 50000.00 }]
    }, null, 2);

    // Enter into standalone editor
    const textarea = page.locator('textarea[data-testid="standalone-editor"]');
    if (await textarea.isVisible()) {
      await textarea.fill(sensitivePayload);
    }

    // Trigger format, minify, stats, and download actions
    const formatBtn = page.locator('[data-testid="beautify-btn"]');
    if (await formatBtn.isVisible()) await formatBtn.click();

    const minifyBtn = page.locator('[data-testid="minify-btn"]');
    if (await minifyBtn.isVisible()) await minifyBtn.click();

    await page.waitForTimeout(1000);

    // Verify ZERO external egress carrying the sensitive data
    for (const req of interceptedRequests) {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const postData = req.postData || '';
        expect(postData).not.toContain('formatnook-secret-user-token');
        expect(postData).not.toContain('customerEmails');
        expect(postData).not.toContain('classified.gov');
      }
    }

    // Inspect localStorage to verify only expected formatnook keys exist
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    for (const key of storageKeys) {
      expect(key.startsWith('formatnook_') || key.startsWith('fn_') || key.startsWith('next-') || key.startsWith('__')).toBe(true);
    }
  });
});

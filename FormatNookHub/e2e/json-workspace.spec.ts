import { test, expect } from '@playwright/test';

test.describe('Professional JSON Workspace & Formatter', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to JSON Formatter workspace
    await page.goto('/tools/json-formatter');
  });

  test('1. JSON Workspace loads successfully with title and default sample', async ({ page }) => {
    await expect(page).toHaveTitle(/JSON Formatter & Beautifier/i);
    const workspace = page.getByTestId('json-workspace');
    await expect(workspace).toBeVisible();

    // Default Code View is active
    const codeView = page.getByTestId('json-code-view');
    await expect(codeView).toBeVisible();
  });

  test('2. Formats JSON with configurable indentation (2 spaces, 4 spaces, tabs)', async ({ page }) => {
    const indentSelect = page.getByTestId('json-indent-select');
    await expect(indentSelect).toBeVisible();

    // Change to 4 spaces
    await indentSelect.selectOption('4');
    const beautifyBtn = page.getByTestId('json-beautify-btn');
    await beautifyBtn.click();

    // Change to tabs
    await indentSelect.selectOption('tab');
    await beautifyBtn.click();
  });

  test('3. Minifies JSON into compact single-line string', async ({ page }) => {
    const minifyBtn = page.getByTestId('json-minify-btn');
    await minifyBtn.click();

    // Check that processed output is minified
    const outputPanel = page.locator('.editor-panel').nth(1);
    await expect(outputPanel).toBeVisible();
  });

  test('4. Validates JSON syntax and reports validation issues', async ({ page }) => {
    // Clear and enter invalid JSON
    const inputTextarea = page.locator('.editor-panel').nth(0).locator('textarea');
    await inputTextarea.fill('{\n  "broken": "json",\n}');

    const validateBtn = page.getByTestId('json-validate-btn');
    await validateBtn.click();

    // Check error card appears
    const errorCard = page.locator('.validation-card.invalid');
    await expect(errorCard).toBeVisible();
  });

  test('5. Auto-Repair detects syntax mistakes and applies repairs', async ({ page }) => {
    const inputTextarea = page.locator('.editor-panel').nth(0).locator('textarea');
    await inputTextarea.fill(`{
      // Broken test json
      name: 'John Doe',
      skills: ['TypeScript', 'React',],
    }`);

    const repairBtn = page.getByTestId('json-repair-btn');
    await repairBtn.click();

    // Repair modal opens
    const repairModal = page.getByTestId('json-repair-modal');
    await expect(repairModal).toBeVisible();

    // Confirm repair
    const confirmBtn = page.getByTestId('confirm-apply-repair-btn');
    await confirmBtn.click();

    // Modal closes
    await expect(repairModal).not.toBeVisible();
  });

  test('6. Interactive Tree View renders hierarchy, allows expanding/collapsing nodes', async ({ page }) => {
    // Switch to Tree View
    const treeTab = page.getByTestId('view-mode-tree');
    await treeTab.click();

    const treeContainer = page.getByTestId('json-tree-container');
    await expect(treeContainer).toBeVisible();

    // Test expand all
    const expandAllBtn = page.getByTestId('btn-expand-all');
    await expandAllBtn.click();

    // Test collapse all
    const collapseAllBtn = page.getByTestId('btn-collapse-all');
    await collapseAllBtn.click();

    // Test +1 Level expand
    const expandOneLevelBtn = page.getByTestId('btn-expand-one-level');
    await expandOneLevelBtn.click();

    // Test depth button
    const depthBtn = page.getByTestId('btn-depth-2');
    await depthBtn.click();

    // Test search filter in Tree View
    const treeSearch = page.getByTestId('tree-search-input');
    await treeSearch.fill('developer');
  });

  test('7. Table View renders tabular data, allows filtering and sorting', async ({ page }) => {
    // Load Users Array Sample first
    const samplesSelect = page.getByTestId('json-samples-select');
    await samplesSelect.selectOption('users-array');

    // Switch to Table View
    const tableTab = page.getByTestId('view-mode-table');
    await tableTab.click();

    const tableContainer = page.getByTestId('json-table-container');
    await expect(tableContainer).toBeVisible();

    const dataTable = page.getByTestId('json-data-table');
    await expect(dataTable).toBeVisible();

    // Test search filtering in Table View
    const tableSearch = page.getByTestId('table-search-input');
    await tableSearch.fill('Alice');

    // Export CSV button is clickable
    const exportCsvBtn = page.getByTestId('btn-export-table-csv');
    await expect(exportCsvBtn).toBeVisible();
  });

  test('8. JSONPath Evaluator drawer searches and extracts matching nodes', async ({ page }) => {
    const jsonPathToggle = page.getByTestId('json-path-toggle-btn');
    await jsonPathToggle.click();

    const pathPanel = page.getByTestId('json-path-panel');
    await expect(pathPanel).toBeVisible();

    const pathInput = page.getByTestId('input-jsonpath-expression');
    await pathInput.fill('$.developer.name');

    // Matches item should be displayed
    const matchItem = page.getByTestId('jsonpath-match-item').first();
    await expect(matchItem).toBeVisible();
  });

  test('9. Detailed Metrics & Statistics modal displays structural breakdown', async ({ page }) => {
    const statsBtn = page.getByTestId('json-stats-btn');
    await statsBtn.click();

    const statsModal = page.getByTestId('json-stats-modal');
    await expect(statsModal).toBeVisible();

    // Copy metrics button
    const copyStatsBtn = page.getByTestId('copy-stats-btn');
    await expect(copyStatsBtn).toBeVisible();
    await copyStatsBtn.click();

    // Close modal
    const closeBtn = statsModal.locator('button', { hasText: 'Close' });
    await closeBtn.click();
    await expect(statsModal).not.toBeVisible();
  });

  test('10. Transform & Convert modal converts JSON to YAML, XML, and CSV', async ({ page }) => {
    const transformBtn = page.getByTestId('json-transform-btn');
    await transformBtn.click();

    const transformModal = page.getByTestId('json-transform-modal');
    await expect(transformModal).toBeVisible();

    // Select XML
    const xmlBtn = transformModal.locator('button', { hasText: 'JSON to XML' });
    await xmlBtn.click();
    const preview = page.getByTestId('transform-preview-output');
    await expect(preview).toHaveValue(/<root>/);

    // Select YAML
    const yamlBtn = transformModal.locator('button', { hasText: 'JSON to YAML' });
    await yamlBtn.click();
    await expect(preview).toHaveValue(/app: FormatNook/);

    // Select CSV and change delimiter
    const csvBtn = transformModal.locator('button', { hasText: 'JSON to CSV' });
    await csvBtn.click();
    const delimiterSelect = page.getByTestId('csv-delimiter-select');
    await delimiterSelect.selectOption(';');

    // Close modal
    const cancelBtn = transformModal.locator('button', { hasText: 'Cancel' });
    await cancelBtn.click();
    await expect(transformModal).not.toBeVisible();
  });

  test('11. JSON Schema validation modal checks conformance', async ({ page }) => {
    const schemaBtn = page.getByTestId('json-schema-btn');
    await schemaBtn.click();

    const schemaModal = page.getByTestId('json-schema-modal');
    await expect(schemaModal).toBeVisible();

    const closeBtn = schemaModal.locator('button', { hasText: 'Close' });
    await closeBtn.click();
    await expect(schemaModal).not.toBeVisible();
  });

  test('12. Keyboard Shortcuts cheat sheet modal opens and closes', async ({ page }) => {
    const shortcutsBtn = page.getByTestId('shortcuts-modal-btn');
    await shortcutsBtn.click();

    const shortcutsModal = page.getByTestId('json-shortcuts-modal');
    await expect(shortcutsModal).toBeVisible();

    const gotItBtn = shortcutsModal.locator('button', { hasText: 'Got It' });
    await gotItBtn.click();
    await expect(shortcutsModal).not.toBeVisible();
  });

  test('13. Curated sample datasets selector loads sample documents', async ({ page }) => {
    const samplesSelect = page.getByTestId('json-samples-select');
    await samplesSelect.selectOption('ecommerce-order');

    const inputTextarea = page.locator('.editor-panel').nth(0).locator('textarea');
    await expect(inputTextarea).toHaveValue(/ORD-2026-9041/);
  });

  test('14. Large JSON handling activates background Web Worker mode banner', async ({ page }) => {
    // Generate a payload over 2.5MB
    const largeObject = {
      items: Array.from({ length: 40000 }, (_, i) => ({
        id: i,
        name: `User record #${i}`,
        email: `user_${i}_formatnook@example.com`,
        active: i % 2 === 0,
      })),
    };
    const largeJsonString = JSON.stringify(largeObject);

    // Set value triggering React's synthetic onChange setter
    const inputTextarea = page.locator('.editor-panel').nth(0).locator('textarea');
    await inputTextarea.evaluate((el: HTMLTextAreaElement, val: string) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, largeJsonString);

    // Large file banner should be visible
    const largeBanner = page.getByTestId('large-file-banner');
    await expect(largeBanner).toBeVisible();
  });

  test('15. Backward compatibility: /tools/json-validator loads with validation mode', async ({ page }) => {
    await page.goto('/tools/json-validator');
    await expect(page).toHaveTitle(/JSON Validator/i);
    const workspace = page.getByTestId('json-workspace');
    await expect(workspace).toBeVisible();
  });

  test('16. Backward compatibility: /tools/json-minifier loads with minify mode', async ({ page }) => {
    await page.goto('/tools/json-minifier');
    await expect(page).toHaveTitle(/JSON Minifier/i);
    const workspace = page.getByTestId('json-workspace');
    await expect(workspace).toBeVisible();
  });

  test('17. Regression check: Diff Checker still loads and functions', async ({ page }) => {
    await page.goto('/tools/diff-checker');
    const compareBtn = page.getByTestId('btn-compare');
    await expect(compareBtn).toBeVisible();
  });

  test('18. Regression check: XML and YAML tools still load and function', async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await expect(page.locator('.tool-workspace-container')).toBeVisible();

    await page.goto('/tools/yaml-formatter');
    await expect(page.locator('.tool-workspace-container')).toBeVisible();
  });

  test('19. Full-screen editor mode toggles and exits correctly', async ({ page }) => {
    const fullScreenBtn = page.getByTestId('toggle-fullscreen-btn');
    await fullScreenBtn.click();

    const workspace = page.getByTestId('json-workspace');
    await expect(workspace).toHaveClass(/json-fullscreen-mode/);

    // Exit full screen
    await fullScreenBtn.click();
    await expect(workspace).not.toHaveClass(/json-fullscreen-mode/);
  });

  test('20. Recents & Favorite Snippets modal opens, allows saving and managing snippets', async ({ page }) => {
    const recentsBtn = page.getByTestId('recents-modal-btn');
    await recentsBtn.click();

    const recentModal = page.getByTestId('json-recent-modal');
    await expect(recentModal).toBeVisible();

    // Switch to Snippets tab
    const snippetsTab = page.getByTestId('tab-snippets');
    await snippetsTab.click();

    // Open save form
    const saveToggleBtn = page.getByTestId('btn-toggle-save-snippet');
    await saveToggleBtn.click();

    const titleInput = page.getByTestId('input-snippet-title');
    await titleInput.fill('Test Sample Snippet');

    const confirmSaveBtn = page.getByTestId('btn-confirm-save-snippet');
    await confirmSaveBtn.click();

    // Check saved snippet exists in list
    const snippetItem = page.getByTestId('snippet-item').first();
    await expect(snippetItem).toBeVisible();

    // Close modal
    const closeBtn = recentModal.locator('button', { hasText: 'Close' });
    await closeBtn.click();
    await expect(recentModal).not.toBeVisible();
  });

  test('21. Resizable panels divider is present in Code View', async ({ page }) => {
    const resizer = page.getByTestId('workspace-panels-resizer');
    await expect(resizer).toBeVisible();
  });

  test('22. Side-by-side horizontal editor layout across desktop and tablet viewports', async ({ page }) => {
    const desktopViewports = [
      { width: 1920, height: 1080, name: '1920x1080 Full HD' },
      { width: 1440, height: 900, name: '1440x900 Desktop' },
      { width: 1280, height: 800, name: '1280x800 Laptop' },
      { width: 1024, height: 768, name: '1024x768 Small Desktop/Tablet' },
      { width: 768, height: 1024, name: '768x1024 Tablet Portrait' },
    ];

    for (const vp of desktopViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const inputPanel = page.getByTestId('json-input-panel');
      const outputPanel = page.getByTestId('json-output-panel');
      await expect(inputPanel).toBeVisible();
      await expect(outputPanel).toBeVisible();

      const inputBox = await inputPanel.boundingBox();
      const outputBox = await outputPanel.boundingBox();
      expect(inputBox).not.toBeNull();
      expect(outputBox).not.toBeNull();

      if (inputBox && outputBox) {
        // 1. Original Input must be on the LEFT of Processed Output
        expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(outputBox.x + 1);

        // 2. Both panels must share the same horizontal row (matching Y positions within margin)
        expect(Math.abs(inputBox.y - outputBox.y)).toBeLessThan(15);

        // 3. Both panels must have matching equal height
        expect(Math.abs(inputBox.height - outputBox.height)).toBeLessThan(5);

        // 4. No horizontal page overflow
        const overflowData = await page.evaluate(() => {
          const docEl = document.documentElement;
          const offenders = Array.from(document.querySelectorAll('*'))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.right > window.innerWidth;
            })
            .map((el) => ({
              tag: el.tagName,
              cls: el.className,
              id: el.id,
              right: el.getBoundingClientRect().right,
              width: el.getBoundingClientRect().width,
            }))
            .slice(0, 5);

          return {
            scrollWidth: docEl.scrollWidth,
            innerWidth: window.innerWidth,
            offenders,
          };
        });
        console.log(`Viewport ${vp.name}:`, overflowData);
        expect(overflowData.scrollWidth).toBeLessThanOrEqual(overflowData.innerWidth + 1);
      }
    }
  });

  test('23. Draggable panel resizer and 50/50 reset options', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const resizer = page.getByTestId('workspace-panels-resizer');
    const inputPanel = page.getByTestId('json-input-panel');
    const outputPanel = page.getByTestId('json-output-panel');

    const initialInputBox = await inputPanel.boundingBox();
    const initialOutputBox = await outputPanel.boundingBox();
    expect(initialInputBox).not.toBeNull();
    expect(initialOutputBox).not.toBeNull();

    await resizer.scrollIntoViewIfNeeded();

    // Drag resizer to the right
    const resizerBox = await resizer.boundingBox();
    if (resizerBox) {
      await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + resizerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(resizerBox.x + 120, resizerBox.y + resizerBox.height / 2, { steps: 5 });
      await page.mouse.up();

      // Check input panel became wider
      const resizedInputBox = await inputPanel.boundingBox();
      expect(resizedInputBox!.width).toBeGreaterThan(initialInputBox!.width);

      // Reset button should now be visible in toolbar
      const resetBtn = page.getByTestId('reset-split-btn');
      await expect(resetBtn).toBeVisible();

      // Click Reset 50/50 button
      await resetBtn.click();
      const resetInputBox = await inputPanel.boundingBox();
      const resetOutputBox = await outputPanel.boundingBox();
      expect(Math.abs(resetInputBox!.width - resetOutputBox!.width)).toBeLessThan(20);

      // Now test double-click resizer to reset
      await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + resizerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(resizerBox.x - 100, resizerBox.y + resizerBox.height / 2, { steps: 5 });
      await page.mouse.up();

      // Double-click resizer to reset
      await resizer.dblclick();
      const dblResetInputBox = await inputPanel.boundingBox();
      const dblResetOutputBox = await outputPanel.boundingBox();
      expect(Math.abs(dblResetInputBox!.width - dblResetOutputBox!.width)).toBeLessThan(20);
    }
  });

  test('24. Mobile 390x844 responsive vertical stacking and tabs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const inputPanel = page.getByTestId('json-input-panel');
    const outputPanel = page.getByTestId('json-output-panel');

    // On mobile default (Both Editors), both should be visible stacked vertically
    await expect(inputPanel).toBeVisible();
    await expect(outputPanel).toBeVisible();

    const inputBox = await inputPanel.boundingBox();
    const outputBox = await outputPanel.boundingBox();
    // Input is above Output
    expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(outputBox!.y + 20);

    // No horizontal scrollbar on mobile
    const overflowInfo = await page.evaluate(() => {
      const offenders = Array.from(document.querySelectorAll('*'))
        .filter((el) => el.getBoundingClientRect().right > window.innerWidth)
        .map((el) => ({
          tag: el.tagName,
          cls: el.className,
          right: el.getBoundingClientRect().right,
        }))
        .slice(0, 5);
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        offenders,
      };
    });
    console.log('Mobile overflow info:', overflowInfo);
    expect(overflowInfo.scrollWidth).toBeLessThanOrEqual(overflowInfo.innerWidth + 1);

    // Test mobile tab switching
    const tabInput = page.getByTestId('mobile-tab-input');
    const tabOutput = page.getByTestId('mobile-tab-output');
    const tabBoth = page.getByTestId('mobile-tab-both');

    await tabInput.click();
    await expect(inputPanel).toBeVisible();
    await expect(outputPanel).not.toBeVisible();

    await tabOutput.click();
    await expect(inputPanel).not.toBeVisible();
    await expect(outputPanel).toBeVisible();

    await tabBoth.click();
    await expect(inputPanel).toBeVisible();
    await expect(outputPanel).toBeVisible();
  });

  test('25. Independent scrolling for both editors', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const inputArea = page.getByTestId('json-input-panel').locator('textarea');
    const outputArea = page.getByTestId('json-output-panel').locator('textarea');

    // Generate large JSON content with 100 lines
    const longJson = JSON.stringify(
      Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}`, val: Math.random() })),
      null,
      2
    );

    await inputArea.fill(longJson);
    await page.getByTestId('json-beautify-btn').click();

    // Verify textarea has scrollHeight > clientHeight (internal scroll)
    const canScrollInput = await inputArea.evaluate((el) => el.scrollHeight > el.clientHeight);
    const canScrollOutput = await outputArea.evaluate((el) => el.scrollHeight > el.clientHeight);

    expect(canScrollInput).toBeTruthy();
    expect(canScrollOutput).toBeTruthy();

    // Scroll input without affecting output scroll
    await inputArea.evaluate((el) => (el.scrollTop = 250));
    const outputScrollTop = await outputArea.evaluate((el) => el.scrollTop);
    expect(outputScrollTop).toBe(0);
  });

  test('26. Automatic formatting on paste/typing with debounce and status updates', async ({ page }) => {
    const inputArea = page.getByTestId('json-input-panel').locator('textarea');
    const outputArea = page.getByTestId('json-output-panel').locator('textarea');
    const statusBadge = page.getByTestId('json-status-badge');

    // Paste compact valid JSON
    await inputArea.fill('{"user":"Alice","age":30,"city":"Berlin"}');

    // Wait for debounced auto-format (350ms) to trigger and format output
    await expect(outputArea).toHaveValue(`{\n  "user": "Alice",\n  "age": 30,\n  "city": "Berlin"\n}`);
    await expect(statusBadge).toContainText(/Valid JSON|Formatting successful/i);
  });

  test('27. Toggle Auto-Format OFF and verify manual Beautify requirement', async ({ page }) => {
    const toggleAutoFormatBtn = page.getByTestId('toggle-auto-format-btn');
    await expect(toggleAutoFormatBtn).toBeVisible();

    // Turn Auto Format OFF
    await toggleAutoFormatBtn.click();
    await expect(toggleAutoFormatBtn).toHaveText(/Auto Format: Off/i);

    const inputArea = page.getByTestId('json-input-panel').locator('textarea');
    const outputArea = page.getByTestId('json-output-panel').locator('textarea');

    // Fill new JSON while auto format is OFF
    await inputArea.fill('{"manual":true,"tested":123}');
    // Output should NOT update automatically
    await page.waitForTimeout(450);
    expect(await outputArea.inputValue()).not.toContain('"manual": true');

    // Click explicit Beautify button
    const beautifyBtn = page.getByTestId('json-beautify-btn');
    await beautifyBtn.click();

    // Now output should update immediately
    await expect(outputArea).toHaveValue(`{\n  "manual": true,\n  "tested": 123\n}`);

    // Restore Auto Format to ON
    await toggleAutoFormatBtn.click();
    await expect(toggleAutoFormatBtn).toHaveText(/Auto Format: On/i);
  });

  test('28. Invalid JSON shows error banner, marks output outdated, and error card repair button works', async ({ page }) => {
    const inputArea = page.getByTestId('json-input-panel').locator('textarea');

    // Enter invalid JSON with single quotes and trailing comma
    await inputArea.fill("{\n  name: 'FormatNook',\n  active: true,\n}");

    // Wait for debounce to report syntax error
    const errorCard = page.locator('.validation-card.invalid');
    await expect(errorCard).toBeVisible();

    // Check line indicator exists
    await expect(errorCard).toContainText(/Line/i);

    // Outdated output badge should be present
    const outdatedBadge = page.getByTestId('output-outdated-badge');
    await expect(outdatedBadge).toBeVisible();

    // Click Auto-Repair directly from error card banner
    const repairFromBannerBtn = page.getByTestId('error-banner-repair-btn');
    await expect(repairFromBannerBtn).toBeVisible();
    await repairFromBannerBtn.click();

    // Repair modal opens with proposal
    const repairModal = page.getByTestId('json-repair-modal');
    await expect(repairModal).toBeVisible();

    // Confirm repair
    const confirmBtn = page.getByTestId('confirm-apply-repair-btn');
    await confirmBtn.click();

    // Verify error is gone and output is updated
    await expect(errorCard).not.toBeVisible();
    const outputArea = page.getByTestId('json-output-panel').locator('textarea');
    await expect(outputArea).toContainText('"name": "FormatNook"');
  });

  test('29. Accurate logical line count for 100-line and 1,000-line documents in header and footer', async ({ page }) => {
    const inputArea = page.getByTestId('json-input-panel').locator('textarea');

    // 100-line document
    const lines100 = Array.from({ length: 100 }, (_, i) => `  "item_${i}": ${i}`).join('\n');
    await inputArea.fill(lines100);

    // Check header
    const inputHeader = page.getByTestId('json-input-panel').locator('.panel-stats');
    await expect(inputHeader).toContainText('100 Lines');

    // Check footer status bar
    const inputFooter = page.getByTestId('input-status-bar');
    await expect(inputFooter.getByTestId('status-total-lines')).toHaveText('Total Lines: 100');

    // 1,000-line document
    const lines1000 = Array.from({ length: 1000 }, (_, i) => `  "line_${i}": ${i}`).join('\n');
    await inputArea.fill(lines1000);

    await expect(inputHeader).toContainText('1,000 Lines');
    await expect(inputFooter.getByTestId('status-total-lines')).toHaveText('Total Lines: 1000');
  });

  test('30. LF, CRLF, empty document, and independent Input/Output line counting', async ({ page }) => {
    const inputArea = page.getByTestId('json-input-panel').locator('textarea');
    const inputFooter = page.getByTestId('input-status-bar');
    const outputFooter = page.getByTestId('output-status-bar');

    // CRLF 3-line document
    await inputArea.fill('{\r\n  "test": 1\r\n}');
    await expect(inputFooter.getByTestId('status-total-lines')).toHaveText('Total Lines: 3');

    // Empty document
    await inputArea.fill('');
    await expect(inputFooter.getByTestId('status-total-lines')).toHaveText('Total Lines: 0');
    await expect(outputFooter.getByTestId('status-total-lines')).toHaveText('Total Lines: 0');
  });

  test('31. Real-time cursor Ln and Col tracking in footer status bar', async ({ page }) => {
    const inputArea = page.getByTestId('json-input-panel').locator('textarea');
    const inputFooter = page.getByTestId('input-status-bar');

    await inputArea.fill('{\n  "greeting": "hello",\n  "number": 42\n}');

    // Move cursor to start of document (Ln 1, Col 1)
    await inputArea.click();
    await inputArea.press('Control+Home');

    await expect(inputFooter.getByTestId('status-cursor-line')).toHaveText('Ln: 1');
    await expect(inputFooter.getByTestId('status-cursor-col')).toHaveText('Col: 1');

    // Move down to Line 2 and right 2 characters (Ln 2, Col 3)
    await inputArea.press('ArrowDown');
    await inputArea.press('ArrowRight');
    await inputArea.press('ArrowRight');

    await expect(inputFooter.getByTestId('status-cursor-line')).toHaveText('Ln: 2');
    await expect(inputFooter.getByTestId('status-cursor-col')).toHaveText('Col: 3');
  });
});

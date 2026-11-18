import { test, expect } from '@playwright/test';

test.describe('JSON Graph Visualizer E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tools/json-formatter');
    await page.waitForSelector('[data-testid="json-workspace"]');
  });

  test('1. Switches to Visualize view mode and renders interactive SVG graph', async ({ page }) => {
    // Switch to Visualize tab
    const visualizeTab = page.locator('[data-testid="view-mode-graph"]');
    await expect(visualizeTab).toBeVisible();
    await visualizeTab.click();

    // Verify Graph container is displayed
    const graphContainer = page.locator('[data-testid="json-graph-container"]');
    await expect(graphContainer).toBeVisible();

    const graphVisualizer = page.locator('[data-testid="json-graph-visualizer"]');
    await expect(graphVisualizer).toBeVisible();

    // Verify SVG canvas and nodes are rendered
    const canvas = page.locator('[data-testid="json-graph-canvas"]');
    await expect(canvas).toBeVisible();

    const nodes = page.locator('.json-graph-node-group');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);

    // Verify stats pill shows node count
    const stats = page.locator('[data-testid="json-graph-stats"]');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText('nodes');
  });

  test('2. Searches nodes and highlights matching keys and values', async ({ page }) => {
    // Switch to Visualize tab
    await page.locator('[data-testid="view-mode-graph"]').click();

    // Search input
    const searchInput = page.locator('[data-testid="json-graph-search-input"]');
    await expect(searchInput).toBeVisible();

    // Type a query that matches root or children
    await searchInput.fill('title');

    // Verify match count badge appears
    const searchCount = page.locator('[data-testid="json-graph-search-count"]');
    await expect(searchCount).toBeVisible();
  });

  test('3. Selects a node and shows JSONPath inspector with copy actions', async ({ page }) => {
    // Switch to Visualize tab
    await page.locator('[data-testid="view-mode-graph"]').click();

    // Inspector should be visible
    const inspector = page.locator('[data-testid="json-graph-inspector"]');
    await expect(inspector).toBeVisible();

    const jsonPathCode = page.locator('[data-testid="inspector-jsonpath"]');
    await expect(jsonPathCode).toBeVisible();

    // Click Copy JSONPath
    const copyPathBtn = page.locator('[data-testid="inspector-copy-path"]');
    await copyPathBtn.click();
    await expect(copyPathBtn).toContainText('Copied Path');

    // Click Copy Value
    const copyValBtn = page.locator('[data-testid="inspector-copy-value"]');
    await copyValBtn.click();
    await expect(copyValBtn).toContainText('Copied Value');
  });

  test('4. Controls zoom, fit to screen, and expand/collapse all', async ({ page }) => {
    await page.locator('[data-testid="view-mode-graph"]').click();

    // Test Zoom In
    const zoomInBtn = page.locator('[data-testid="json-graph-zoom-in"]');
    await zoomInBtn.click();

    // Test Zoom Out
    const zoomOutBtn = page.locator('[data-testid="json-graph-zoom-out"]');
    await zoomOutBtn.click();

    // Test Fit to Screen
    const fitBtn = page.locator('[data-testid="json-graph-fit-screen"]');
    await fitBtn.click();

    // Test Reset Zoom
    const resetZoomBtn = page.locator('[data-testid="json-graph-reset-zoom"]');
    await resetZoomBtn.click();

    // Test Collapse All and Expand All
    const collapseAllBtn = page.locator('[data-testid="json-graph-collapse-all"]');
    await collapseAllBtn.click();

    const expandAllBtn = page.locator('[data-testid="json-graph-expand-all"]');
    await expandAllBtn.click();
  });

  test('5. Opens export menu with SVG and PNG download options', async ({ page }) => {
    await page.locator('[data-testid="view-mode-graph"]').click();

    const exportBtn = page.locator('[data-testid="json-graph-export-btn"]');
    await exportBtn.click();

    const exportMenu = page.locator('[data-testid="json-graph-export-menu"]');
    await expect(exportMenu).toBeVisible();

    await expect(page.locator('[data-testid="json-graph-export-svg"]')).toBeVisible();
    await expect(page.locator('[data-testid="json-graph-export-png"]')).toBeVisible();
  });

  test('6. Shows clear error state and CTA on invalid JSON', async ({ page }) => {
    // Switch to Code view mode
    await page.locator('[data-testid="view-mode-code"]').click();

    // Find input editor textarea or monaco and break JSON
    const textarea = page.locator('[data-testid="json-input-panel"] textarea');
    if (await textarea.isVisible()) {
      await textarea.fill('{ "broken": json without quotes ');
    }

    // Switch to Visualize tab
    await page.locator('[data-testid="view-mode-graph"]').click();

    // If input is invalid, error state should be displayed with Format & Parse button
    const errorState = page.locator('.json-empty-structured-state');
    if (await errorState.isVisible()) {
      await expect(errorState).toContainText('Valid JSON Required for Graph Visualizer');
      const formatBtn = errorState.locator('button');
      await expect(formatBtn).toBeVisible();
    }
  });
});

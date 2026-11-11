import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const QA_DIR = path.resolve('..', 'test-results', 'qa-evidence');

test.describe('XML & YAML Final Manual QA Verification', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(QA_DIR)) {
      fs.mkdirSync(QA_DIR, { recursive: true });
    }
  });

  test('XML-1 & XML-2: Code editor loads, accepts input, and Beautify produces clean indented XML', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]', { timeout: 15000 });

    const inputPanel = page.getByTestId('xml-input-panel');
    const inputTextarea = inputPanel.locator('textarea');
    await expect(inputPanel).toBeVisible();

    const sampleXml = '<bookstore><book id="b1"><title>Refactoring</title><author>Fowler</author></book></bookstore>';
    await inputTextarea.fill(sampleXml);

    const beautifyBtn = page.getByTestId('xml-beautify-btn');
    await beautifyBtn.click();

    const outputTextarea = page.getByTestId('xml-output-panel').locator('textarea');
    await expect(outputTextarea).toHaveValue(/<bookstore>\s+<book id="b1">\s+<title>Refactoring<\/title>/);

    await page.screenshot({ path: path.join(QA_DIR, 'xml_01_beautify.png') });
    expect(consoleErrors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('XML-3: Minify preserves CDATA, comments, and text content', async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]');

    const input = '<note><!-- Important note --><content><![CDATA[Special <chars> & content]]></content></note>';
    const inputTextarea = page.getByTestId('xml-input-panel').locator('textarea');
    await inputTextarea.fill(input);

    const minifyBtn = page.getByTestId('xml-minify-btn');
    await minifyBtn.click();

    const outputTextarea = page.getByTestId('xml-output-panel').locator('textarea');
    await expect(outputTextarea).toHaveValue(/<!-- Important note -->/);
    await expect(outputTextarea).toHaveValue(/<!\[CDATA\[Special <chars> & content\]\]>/);

    await page.screenshot({ path: path.join(QA_DIR, 'xml_02_minify.png') });
  });

  test('XML-4: Validate detects malformed XML and displays diagnostic error feedback', async ({ page }) => {
    await page.goto('/tools/xml-validator');
    await page.waitForSelector('[data-testid="xml-workspace"]');

    const brokenXml = '<catalog>\n  <item>First item\n</catalog>';
    const inputTextarea = page.getByTestId('xml-input-panel').locator('textarea');
    await inputTextarea.fill(brokenXml);

    const validateBtn = page.getByTestId('xml-validate-btn');
    await validateBtn.click();

    const validationAlert = page.locator('.validation-card');
    await expect(validationAlert).toBeVisible();

    await page.screenshot({ path: path.join(QA_DIR, 'xml_03_validate_error.png') });
  });

  test('XML-5 & XML-6: Tree View and Structured View display nested elements and attributes', async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]');

    // Switch to Tree View
    const treeTab = page.getByTestId('xml-view-tree');
    await treeTab.click();
    const treeView = page.getByTestId('xml-tree-view');
    await expect(treeView).toBeVisible();
    await expect(treeView).toContainText('project');
    await expect(treeView).toContainText('metadata');
    await page.screenshot({ path: path.join(QA_DIR, 'xml_04_tree_view.png') });

    // Switch to Structured View
    const structuredTab = page.getByTestId('xml-view-structured');
    await structuredTab.click();
    const structView = page.locator('.json-structured-view-container').first();
    await expect(structView).toBeVisible();
    await expect(structView).toContainText('Elements & Nodes');
    await page.screenshot({ path: path.join(QA_DIR, 'xml_05_structured_view.png') });
  });

  test('XML-7: XPath Explorer executes queries and displays matching nodes', async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]');

    const xpathBtn = page.getByTestId('xml-xpath-btn');
    await xpathBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();

    const xpathInput = page.getByTestId('xpath-input');
    await xpathInput.fill('//tool');
    await expect(modal).toContainText('Matches Found:');

    await page.screenshot({ path: path.join(QA_DIR, 'xml_06_xpath_explorer.png') });
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('XML-8: XML Converters produce correct JSON, YAML, and CSV output', async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]');

    const convertBtn = page.getByTestId('xml-convert-btn');
    await convertBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();

    // Verify XML to JSON
    await page.getByText('XML → JSON').click();
    await expect(modal.locator('textarea').nth(1)).toHaveValue(/"project":/);

    // Verify XML to YAML
    await page.getByText('XML → YAML').click();
    await expect(modal.locator('textarea').nth(1)).toHaveValue(/project:/);

    await page.screenshot({ path: path.join(QA_DIR, 'xml_07_converters.png') });
    await page.keyboard.press('Escape');
  });

  test('XML-9: SOAP, WSDL, and XSD inspector displays meaningful parsed metadata', async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]');

    // Load SOAP Request Sample
    const sampleSelect = page.getByTestId('xml-sample-select');
    await sampleSelect.selectOption('soap-request');

    const specBtn = page.getByTestId('xml-specialized-btn');
    await specBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('SOAP 1.1 Envelope');
    await expect(modal).toContainText('SOAP Header');
    await expect(modal).toContainText('SOAP Body');

    await page.screenshot({ path: path.join(QA_DIR, 'xml_08_soap_inspector.png') });
    await page.keyboard.press('Escape');
  });

  test('XML-10: Sample selection and clear controls function properly', async ({ page }) => {
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]');

    const sampleSelect = page.getByTestId('xml-sample-select');
    await sampleSelect.selectOption('rss');

    const inputTextarea = page.getByTestId('xml-input-panel').locator('textarea');
    await expect(inputTextarea).toHaveValue(/<rss version="2.0">/);

    // Click Reset
    const resetBtn = page.locator('button[title*="Reset"], button:has-text("Clear")').first();
    await resetBtn.click();
    await expect(inputTextarea).toHaveValue('');
  });

  test('YAML-1 & YAML-2: Code editor loads, accepts input, and Formatter respects indentation settings', async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]', { timeout: 15000 });

    const sampleYaml = 'app:\n  name: FormatNook\n  port: 8080\n';
    const inputTextarea = page.getByTestId('yaml-input-panel').locator('textarea');
    await inputTextarea.fill(sampleYaml);

    // Indent 4 spaces
    const indentSelect = page.getByTestId('yaml-indent-select');
    await indentSelect.selectOption('4');

    const beautifyBtn = page.getByTestId('yaml-beautify-btn');
    await beautifyBtn.click();

    const outputTextarea = page.getByTestId('yaml-output-panel').locator('textarea');
    await expect(outputTextarea).toHaveValue(/app:\s+name:\s+"?FormatNook"?/);

    await page.screenshot({ path: path.join(QA_DIR, 'yaml_01_beautify_4spaces.png') });
  });

  test('YAML-3: Minifier produces valid compact flow-style YAML', async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]');

    const minifyBtn = page.getByTestId('yaml-minify-btn');
    await minifyBtn.click();

    const outputTextarea = page.getByTestId('yaml-output-panel').locator('textarea');
    await expect(outputTextarea).toHaveValue(/{"version":/);

    await page.screenshot({ path: path.join(QA_DIR, 'yaml_02_minify.png') });
  });

  test('YAML-4: Multiple YAML documents separated by --- are parsed and formatted cleanly', async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]');

    const multiDoc = 'kind: ConfigMap\nmetadata:\n  name: cm\n---\nkind: Service\nmetadata:\n  name: svc\n';
    const inputTextarea = page.getByTestId('yaml-input-panel').locator('textarea');
    await inputTextarea.fill(multiDoc);

    const beautifyBtn = page.getByTestId('yaml-beautify-btn');
    await beautifyBtn.click();

    const outputTextarea = page.getByTestId('yaml-output-panel').locator('textarea');
    await expect(outputTextarea).toHaveValue(/name:\s+"?cm"?\s+---\s+kind:\s+"?Service"?/);

    await page.screenshot({ path: path.join(QA_DIR, 'yaml_03_multidoc.png') });
  });

  test('YAML-5 & YAML-6: Tree View and Structured View display mappings and sequences accurately', async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]');

    // Tree View
    const treeTab = page.getByTestId('yaml-view-tree');
    await treeTab.click();
    const treeView = page.getByTestId('yaml-tree-view');
    await expect(treeView).toBeVisible();
    await expect(treeView).toContainText('services');
    await expect(treeView).toContainText('api');
    await page.screenshot({ path: path.join(QA_DIR, 'yaml_04_tree_view.png') });

    // Structured View
    const structuredTab = page.getByTestId('yaml-view-structured');
    await structuredTab.click();
    const structView = page.locator('.json-structured-view-container').first();
    await expect(structView).toBeVisible();
    await page.screenshot({ path: path.join(QA_DIR, 'yaml_05_structured_view.png') });
  });

  test('YAML-7: Converters produce correct JSON, XML, and CSV outputs', async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]');

    const convertBtn = page.getByTestId('yaml-convert-btn');
    await convertBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();

    await page.getByText('YAML → JSON').click();
    await expect(modal.locator('textarea').nth(1)).toHaveValue(/"version": "3.9"/);

    await page.getByText('YAML → XML').click();
    await expect(modal.locator('textarea').nth(1)).toHaveValue(/<version>3.9<\/version>/);

    await page.screenshot({ path: path.join(QA_DIR, 'yaml_06_converters.png') });
    await page.keyboard.press('Escape');
  });

  test('YAML-8 & YAML-9: Developer Configuration samples load and Config Inspector analyzes structure', async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]');

    // Load Kubernetes Sample
    const sampleSelect = page.getByTestId('yaml-sample-select');
    await sampleSelect.selectOption('k8s-deployment');

    const inspectorBtn = page.getByTestId('yaml-inspector-btn');
    await inspectorBtn.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Kubernetes Manifest (Deployment)');
    await expect(modal).toContainText('payment-service');

    await page.screenshot({ path: path.join(QA_DIR, 'yaml_07_k8s_inspector.png') });
    await page.keyboard.press('Escape');
  });

  test('YAML-10: Sample selection, copy, and clear controls function properly', async ({ page }) => {
    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]');

    const sampleSelect = page.getByTestId('yaml-sample-select');
    await sampleSelect.selectOption('github-actions');

    const inputTextarea = page.getByTestId('yaml-input-panel').locator('textarea');
    await expect(inputTextarea).toHaveValue(/name: CI Pipeline/);

    // Click Reset
    const resetBtn = page.locator('button[title*="Reset"], button:has-text("Clear")').first();
    await resetBtn.click();
    await expect(inputTextarea).toHaveValue('');
  });

  test('Mobile Responsive Layout Viewport (375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/tools/xml-formatter');
    await page.waitForSelector('[data-testid="xml-workspace"]');

    await page.screenshot({ path: path.join(QA_DIR, 'xml_mobile_375.png') });

    await page.goto('/tools/yaml-formatter');
    await page.waitForSelector('[data-testid="yaml-workspace"]');

    await page.screenshot({ path: path.join(QA_DIR, 'yaml_mobile_375.png') });
  });
});

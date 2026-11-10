import { describe, it, expect } from 'vitest';
import {
  textEngine,
  jsonEngine,
  xmlEngine,
  yamlEngine,
  csvEngine,
  sqlEngine,
  htmlEngine,
  cssEngine,
  jsEngine,
  genericCodeEngine,
  getEngine,
  ENGINE_REGISTRY,
} from '../services/engines';
import { DEFAULT_DIFF_OPTIONS, computeDiff } from '../services/diff-service';

describe('Universal Diff Checker - 10 Comparison Engines', () => {
  // 1. Text Engine
  describe('1. TextEngine', () => {
    it('handles identical inputs', () => {
      const res = textEngine.compare({
        originalText: 'Hello World',
        modifiedText: 'Hello World',
        options: DEFAULT_DIFF_OPTIONS,
      });
      expect(res.isIdentical).toBe(true);
      expect(res.statistics.addedLines).toBe(0);
      expect(res.statistics.removedLines).toBe(0);
    });

    it('handles Unicode and emoji characters properly', () => {
      const res = textEngine.compare({
        originalText: '🚀 Launch v1.0\n✨ Antigravity',
        modifiedText: '🚀 Launch v2.0\n✨ Antigravity\n🔥 Supercharged',
        options: DEFAULT_DIFF_OPTIONS,
      });
      expect(res.isIdentical).toBe(false);
      expect(res.statistics.addedLines).toBeGreaterThan(0);
    });

    it('handles empty inputs', () => {
      const res = textEngine.compare({
        originalText: '',
        modifiedText: '',
        options: DEFAULT_DIFF_OPTIONS,
      });
      expect(res.isEmpty).toBe(true);
      expect(res.isIdentical).toBe(true);
    });
  });

  // 2. JSON Engine
  describe('2. JsonEngine', () => {
    it('detects nested property additions, removals, modifications and type changes', () => {
      const jsonA = JSON.stringify({
        name: 'FormatNook',
        version: 1,
        active: true,
        tags: ['tool', 'dev'],
        meta: { env: 'dev' },
      });
      const jsonB = JSON.stringify({
        name: 'FormatNook Hub', // modified
        version: '1.0.0', // type_changed
        // active removed
        tags: ['tool', 'dev', 'diff'], // added element
        meta: { env: 'prod' }, // modified
        author: 'Antigravity', // added
      });

      const res = jsonEngine.compare({
        originalText: jsonA,
        modifiedText: jsonB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'json' },
      });

      expect(res.isValid.original).toBe(true);
      expect(res.isValid.modified).toBe(true);
      expect(res.structuredData?.type).toBe('json');
      expect(res.structuredData?.details.length).toBeGreaterThan(0);

      const kinds = res.structuredData?.details.map((d: any) => d.kind);
      expect(kinds).toContain('modified');
      expect(kinds).toContain('type_changed');
      expect(kinds).toContain('removed');
      expect(kinds).toContain('added');
    });

    it('supports ignoring key order with sortKeys', () => {
      const jsonA = '{"b": 2, "a": 1}';
      const jsonB = '{"a": 1, "b": 2}';

      const res = jsonEngine.compare({
        originalText: jsonA,
        modifiedText: jsonB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'json', sortKeys: true },
      });

      expect(res.isIdentical).toBe(true);
      expect(res.statistics.addedLines).toBe(0);
      expect(res.statistics.removedLines).toBe(0);
    });

    it('reports meaningful validation errors on malformed JSON without throwing', () => {
      const invalidJson = '{"broken": json}';
      const validJson = '{"valid": true}';

      const res = jsonEngine.compare({
        originalText: invalidJson,
        modifiedText: validJson,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'json' },
      });

      expect(res.isValid.original).toBe(false);
      expect(res.isValid.modified).toBe(true);
      expect(res.errors.original).toContain('Invalid JSON');
      expect(res.lines.length).toBeGreaterThan(0);
    });
  });

  // 3. XML Engine
  describe('3. XmlEngine', () => {
    it('normalizes attribute order to prevent false differences', () => {
      const xml1 = '<item id="101" category="books" inStock="true">Book Title</item>';
      const xml2 = '<item inStock="true" category="books" id="101">Book Title</item>';

      const res = xmlEngine.compare({
        originalText: xml1,
        modifiedText: xml2,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'xml' },
      });

      expect(res.isIdentical).toBe(true);
      expect(res.statistics.addedLines).toBe(0);
      expect(res.statistics.removedLines).toBe(0);
    });

    it('detects element, attribute, and text differences', () => {
      const xml1 = `<root><user id="1"><name>Alice</name></user></root>`;
      const xml2 = `<root><user id="1" role="admin"><name>Bob</name></user><guest>true</guest></root>`;

      const res = xmlEngine.compare({
        originalText: xml1,
        modifiedText: xml2,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'xml' },
      });

      expect(res.isValid.original).toBe(true);
      expect(res.isValid.modified).toBe(true);
      expect(res.structuredData?.type).toBe('xml');
      expect(res.structuredData?.details.length).toBeGreaterThan(0);
    });

    it('reports syntax errors on invalid XML', () => {
      const brokenXml = '<root><unclosed></root>';
      const validXml = '<root><closed/></root>';

      const res = xmlEngine.compare({
        originalText: brokenXml,
        modifiedText: validXml,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'xml' },
      });

      expect(res.isValid.original).toBe(false);
      expect(res.errors.original).toBeDefined();
    });
  });

  // 4. YAML Engine
  describe('4. YamlEngine', () => {
    it('compares nested mappings, sequences, and values', () => {
      const yaml1 = `
server:
  host: localhost
  port: 3000
  ssl: false
routes:
  - /api
  - /home
`;
      const yaml2 = `
server:
  host: 0.0.0.0
  port: 8080
  ssl: true
routes:
  - /api
  - /dashboard
`;

      const res = yamlEngine.compare({
        originalText: yaml1,
        modifiedText: yaml2,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'yaml' },
      });

      expect(res.isValid.original).toBe(true);
      expect(res.isValid.modified).toBe(true);
      expect(res.structuredData?.type).toBe('yaml');
      expect(res.structuredData?.details.length).toBeGreaterThan(0);
    });

    it('supports key sorting for unordered dictionary comparisons', () => {
      const yaml1 = `b: 2\na: 1`;
      const yaml2 = `a: 1\nb: 2`;

      const res = yamlEngine.compare({
        originalText: yaml1,
        modifiedText: yaml2,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'yaml', sortKeys: true },
      });

      expect(res.isIdentical).toBe(true);
    });

    it('catches invalid YAML with indentation or tab errors', () => {
      const tabYaml = "root:\n\tbad_tab: true";
      const validYaml = "root:\n  good_space: true";

      const res = yamlEngine.compare({
        originalText: tabYaml,
        modifiedText: validYaml,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'yaml' },
      });

      expect(res.isValid.original).toBe(false);
      expect(res.errors.original).toContain('Tabs are strictly forbidden');
    });
  });

  // 5. CSV Engine
  describe('5. CsvEngine', () => {
    it('compares headers, columns, rows and cells', () => {
      const csvA = 'Name,Age,Role\nAlice,30,Developer\nBob,25,Designer';
      const csvB = 'Name,Age,Role,Location\nAlice,31,Developer,Remote\nBob,25,Lead Designer,NYC';

      const res = csvEngine.compare({
        originalText: csvA,
        modifiedText: csvB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'csv' },
      });

      expect(res.isValid.original).toBe(true);
      expect(res.structuredData?.type).toBe('csv');
      expect(res.structuredData?.details.headers.added).toContain('Location');
      expect(res.structuredData?.details.cellChanges.length).toBeGreaterThan(0);
    });

    it('supports ignoreRowOrder for reordered rows', () => {
      const csvA = 'ID,Name\n1,Alice\n2,Bob';
      const csvB = 'ID,Name\n2,Bob\n1,Alice';

      const res = csvEngine.compare({
        originalText: csvA,
        modifiedText: csvB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'csv', ignoreRowOrder: true },
      });

      expect(res.structuredData?.details.rowStats.unchangedRows).toBe(2);
      expect(res.structuredData?.details.rowStats.addedRows).toBe(0);
      expect(res.structuredData?.details.rowStats.removedRows).toBe(0);
    });

    it('handles quoted fields with commas and escaped quotes', () => {
      const csvA = 'ID,Note\n1,"Hello, World"\n2,"Quote: ""Test"""';
      const csvB = 'ID,Note\n1,"Hello, World"\n2,"Quote: ""Updated"""';

      const res = csvEngine.compare({
        originalText: csvA,
        modifiedText: csvB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'csv' },
      });

      expect(res.structuredData?.details.cellChanges.length).toBe(1);
      expect(res.structuredData?.details.cellChanges[0].oldValue).toBe('Quote: "Test"');
      expect(res.structuredData?.details.cellChanges[0].newValue).toBe('Quote: "Updated"');
    });
  });

  // 6. SQL Engine
  describe('6. SqlEngine', () => {
    it('normalizes keywords and clauses and identifies structural changes', () => {
      const sqlA = `select id, name from users where status = 1;`;
      const sqlB = `SELECT id, name, email FROM users WHERE status = 1 AND active = true ORDER BY name ASC;`;

      const res = sqlEngine.compare({
        originalText: sqlA,
        modifiedText: sqlB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'sql' },
      });

      expect(res.isValid.original).toBe(true);
      expect(res.structuredData?.type).toBe('sql');
      const clauses = res.structuredData?.details.clauseChanges.map((c: any) => c.clause);
      expect(clauses).toContain('SELECT');
      expect(clauses).toContain('WHERE');
      expect(clauses).toContain('ORDER BY');
    });

    it('detects multiple statement changes', () => {
      const sqlA = `CREATE TABLE users (id INT); DROP TABLE logs;`;
      const sqlB = `CREATE TABLE users (id INT, email VARCHAR);`;

      const res = sqlEngine.compare({
        originalText: sqlA,
        modifiedText: sqlB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'sql' },
      });

      expect(res.structuredData?.details.clauseChanges.length).toBeGreaterThan(0);
    });
  });

  // 7. HTML Engine
  describe('7. HtmlEngine', () => {
    it('normalizes attributes alphabetically to avoid order noise', () => {
      const html1 = '<div id="app" class="main" role="container">Hello</div>';
      const html2 = '<div role="container" class="main" id="app">Hello</div>';

      const res = htmlEngine.compare({
        originalText: html1,
        modifiedText: html2,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'html' },
      });

      expect(res.isIdentical).toBe(true);
      expect(res.statistics.addedLines).toBe(0);
    });

    it('detects added, removed, and modified elements and attributes', () => {
      const html1 = '<div class="banner">Welcome</div>';
      const html2 = '<div class="banner-hero" id="hero">Welcome Back!</div><span>New</span>';

      const res = htmlEngine.compare({
        originalText: html1,
        modifiedText: html2,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'html' },
      });

      expect(res.structuredData?.type).toBe('html');
      expect(res.structuredData?.details.length).toBeGreaterThan(0);
    });
  });

  // 8. CSS Engine
  describe('8. CssEngine', () => {
    it('handles declaration order independence within selectors', () => {
      const css1 = `.card {\n  color: red;\n  margin: 10px;\n}`;
      const css2 = `.card {\n  margin: 10px;\n  color: red;\n}`;

      const res = cssEngine.compare({
        originalText: css1,
        modifiedText: css2,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'css' },
      });

      expect(res.isIdentical).toBe(true);
    });

    it('detects added, removed, and modified properties within rules', () => {
      const css1 = `.btn { color: red; font-size: 14px; }`;
      const css2 = `.btn { color: blue; padding: 8px; } .btn:hover { opacity: 0.8; }`;

      const res = cssEngine.compare({
        originalText: css1,
        modifiedText: css2,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'css' },
      });

      expect(res.structuredData?.type).toBe('css');
      const diffs = res.structuredData?.details.ruleDiffs;
      expect(diffs.length).toBeGreaterThan(0);
    });
  });

  // 9. JavaScript Engine
  describe('9. JsEngine', () => {
    it('detects function, class, and variable declaration changes', () => {
      const jsA = `
function calculate(a, b) {
  return a + b;
}
const version = 1;
`;
      const jsB = `
function calculate(a, b) {
  return a * b;
}
class AppService {}
const version = 2;
`;

      const res = jsEngine.compare({
        originalText: jsA,
        modifiedText: jsB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'javascript' },
      });

      expect(res.isValid.original).toBe(true);
      expect(res.isValid.modified).toBe(true);
      expect(res.structuredData?.type).toBe('javascript');
      expect(res.structuredData?.details.symbolChanges.length).toBeGreaterThan(0);
    });

    it('catches syntax errors safely without executing invalid code', () => {
      const brokenJs = `function bad( { return;`;
      const validJs = `function good() { return 1; }`;

      const res = jsEngine.compare({
        originalText: brokenJs,
        modifiedText: validJs,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'javascript' },
      });

      expect(res.isValid.original).toBe(false);
      expect(res.errors.original).toContain('SyntaxError');
    });
  });

  // 10. Generic Code Engine
  describe('10. GenericCodeEngine', () => {
    it('analyzes code vs comment line changes in non-JS languages', () => {
      const pyA = `
# Helper method
def compute():
    # Return zero
    return 0
`;
      const pyB = `
# Helper method updated
def compute():
    # Return zero
    x = 10
    return x
`;

      const res = genericCodeEngine.compare({
        originalText: pyA,
        modifiedText: pyB,
        options: { ...DEFAULT_DIFF_OPTIONS, format: 'code' },
      });

      expect(res.format).toBe('code');
      expect(res.structuredData?.type).toBe('code');
      expect(res.structuredData?.details.codeLinesChanged).toBeGreaterThan(0);
      expect(res.structuredData?.details.commentLinesChanged).toBeGreaterThan(0);
    });
  });

  // Dispatcher & Integration
  describe('Engine Registry & Dispatcher', () => {
    it('registers all 10 engine modes', () => {
      const modes = ['text', 'json', 'xml', 'yaml', 'csv', 'sql', 'html', 'css', 'javascript', 'code'];
      for (const m of modes) {
        expect(ENGINE_REGISTRY[m as any]).toBeDefined();
        expect(getEngine(m as any).format).toBe(m);
      }
    });

    it('routes computeDiff to the correct engine for json', () => {
      const res = computeDiff('{"x":1}', '{"x":2}', {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'json',
      });
      expect(res.format).toBe('json');
      expect(res.structuredData?.type).toBe('json');
    });

    it('routes computeDiff to the correct engine for csv', () => {
      const res = computeDiff('A,B\n1,2', 'A,B\n1,3', {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'csv',
      });
      expect(res.format).toBe('csv');
      expect(res.structuredData?.type).toBe('csv');
    });

    it('routes computeDiff to the correct engine for sql', () => {
      const res = computeDiff('SELECT 1;', 'SELECT 2;', {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'sql',
      });
      expect(res.format).toBe('sql');
      expect(res.structuredData?.type).toBe('sql');
    });
  });
});


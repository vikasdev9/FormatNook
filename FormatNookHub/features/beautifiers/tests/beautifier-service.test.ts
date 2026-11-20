import { describe, it, expect } from 'vitest';
import {
  formatSql,
  formatHtml,
  tokenizeHtml,
  formatCss,
  formatJavascript,
  minifyJavascript,
  minifyHtml,
  minifyCss,
  minifySql,
  validateCode,
} from '../services/beautifier-service';

describe('beautifier-service', () => {
  it('formats SQL queries with uppercase keywords and indentation', () => {
    const rawSql = 'select u.id, u.name from users u where u.status = 1 order by u.name asc;';
    const result = formatSql(rawSql, '2');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('SELECT');
    expect(result.output).toContain('FROM');
    expect(result.output).toContain('WHERE');
  });

  it('formats HTML with proper hierarchy', () => {
    const rawHtml = '<main><section><h1>Title</h1><p>Description</p></section></main>';
    const result = formatHtml(rawHtml, '2');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('  <section>');
    expect(result.output).toContain('    <h1>');
  });

  describe('formatHtml quote-aware attribute parsing', () => {
    it('preserves greater-than inside double-quoted attribute values without splitting tags', () => {
      const html = '<form><input pattern="[0-9]>" /></form>';
      const result = formatHtml(html, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toBe('<form>\n  <input pattern="[0-9]>" />\n</form>');
    });

    it('preserves greater-than inside single-quoted attribute values', () => {
      const html = '<div><span data-expr=\'x > y\'>Condition</span></div>';
      const result = formatHtml(html, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('  <span data-expr=\'x > y\'>');
      expect(result.output).toContain('    Condition');
      expect(result.output).toContain('  </span>');
    });

    it('correctly formats void tags like input, img, br, and hr without increasing depth', () => {
      const html = '<div><img src="pic.png"><br><hr><input type="text"><p>Next</p></div>';
      const result = formatHtml(html, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('  <img src="pic.png">');
      expect(result.output).toContain('  <br>');
      expect(result.output).toContain('  <hr>');
      expect(result.output).toContain('  <input type="text">');
      expect(result.output).toContain('  <p>');
      expect(result.output).toContain('    Next');
      expect(result.output).toContain('  </p>');
    });

    it('handles comments containing greater-than arrows', () => {
      const html = '<div><!-- check: if x > y --><span>Text</span></div>';
      const result = formatHtml(html, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('  <!-- check: if x > y -->');
      expect(result.output).toContain('  <span>');
    });

    it('tokenizes HTML correctly with tokenizeHtml helper', () => {
      const tokens = tokenizeHtml('<div class="box"><input pattern="[0-9]>" /><span>Text</span></div>');
      expect(tokens).toEqual([
        '<div class="box">',
        '<input pattern="[0-9]>" />',
        '<span>',
        'Text',
        '</span>',
        '</div>',
      ]);
    });
  });

  it('formats CSS rules and properties', () => {
    const rawCss = '.card{background:#fff;border-radius:8px;}';
    const result = formatCss(rawCss, '2');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('.card {');
    expect(result.output).toContain('  background: #fff;');
  });

  it('formats JavaScript functions and blocks', () => {
    const rawJs = 'function hello(){console.log("world");}';
    const result = formatJavascript(rawJs, '2');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('function hello() {');
    expect(result.output).toContain('  console.log("world");');
  });

  describe('formatJavascript state-aware correctness', () => {
    it('preserves for loop headers without breaking semicolons into newlines', () => {
      const code = 'for (let i = 0; i < 10; i++) { count += i; }';
      const result = formatJavascript(code, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('for (let i = 0; i < 10; i++) {');
      expect(result.output).toContain('  count += i;');
      // Semicolons inside for loop header must NOT trigger line breaks
      expect(result.output).not.toContain('i = 0;\n');
      expect(result.output).not.toContain('i < 10;\n');
    });

    it('preserves string literals containing semicolons and braces', () => {
      const code = 'const query = "SELECT id, name; FROM users WHERE data = {active: true};";';
      const result = formatJavascript(code, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('"SELECT id, name; FROM users WHERE data = {active: true};"');
    });

    it('preserves template literals with expressions without injecting linebreaks', () => {
      const code = 'const greeting = `Hello ${user.name}; balance: ${calc(total)}; {ok}`;';
      const result = formatJavascript(code, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('const greeting = `Hello ${user.name}; balance: ${calc(total)}; {ok}`;');
    });

    it('formats nested functions and objects with proper indentation', () => {
      const code = 'const config = { api: { timeout: 5000, handler: function(req) { return req.status; } } };';
      const result = formatJavascript(code, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('const config = {');
      expect(result.output).toContain('  api: {');
      expect(result.output).toContain('    timeout: 5000,');
      expect(result.output).toContain('    handler: function(req) {');
      expect(result.output).toContain('      return req.status;');
    });

    it('formats arrow functions correctly', () => {
      const code = 'const multiply = (x, y) => { return x * y; }; const double = (n) => n * 2;';
      const result = formatJavascript(code, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('const multiply = (x, y) => {');
      expect(result.output).toContain('  return x * y;');
      expect(result.output).toContain('const double = (n) => n * 2;');
    });

    it('preserves single-line and multiline comments', () => {
      const code = '// Header comment\nconst x = 10; /* inline comment */ const y = 20;';
      const result = formatJavascript(code, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('// Header comment');
      expect(result.output).toContain('const x = 10;');
      expect(result.output).toContain('/* inline comment */');
      expect(result.output).toContain('const y = 20;');
    });

    it('preserves regular expressions containing punctuation without splitting', () => {
      const code = 'const pattern = /;[0-9]{1,3}\\{test\\}/g; const isValid = pattern.test(input);';
      const result = formatJavascript(code, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('const pattern = /;[0-9]{1,3}\\{test\\}/g;');
      expect(result.output).toContain('const isValid = pattern.test(input);');
    });

    it('formats valid modern JavaScript syntax including async/await and classes', () => {
      const code = 'async function fetchData(url) { try { const res = await fetch(url); return res.json(); } catch(err) { throw err; } }';
      const result = formatJavascript(code, '2');
      expect(result.isValid).toBe(true);
      expect(result.output).toContain('async function fetchData(url) {');
      expect(result.output).toContain('  try {');
      expect(result.output).toContain('    const res = await fetch(url);');
      expect(result.output).toContain('    return res.json();');
    });

    it('converts quotes when requested in JsFormatOptions', () => {
      const code = 'const msg = "hello world";';
      const singleQuoteResult = formatJavascript(code, { indent: '2', quotes: 'single' });
      expect(singleQuoteResult.output).toBe("const msg = 'hello world';");

      const doubleQuoteResult = formatJavascript("const msg = 'hello world';", { indent: '2', quotes: 'double' });
      expect(doubleQuoteResult.output).toBe('const msg = "hello world";');
    });
  });

  describe('Minification Suite (JS, HTML, CSS, SQL)', () => {
    it('minifies JavaScript without corrupting tokens, operators, and literals', () => {
      const js = `// Test function
      function calculateTotal(price, taxRate) {
        /* compute total */
        const total = price + (price * taxRate);
        return total;
      }`;
      const result = minifyJavascript(js);
      expect(result.isValid).toBe(true);
      expect(result.output).not.toContain('//');
      expect(result.output).not.toContain('/*');
      expect(result.output).toContain('function calculateTotal(price,taxRate){const total=price+(price*taxRate);return total;}');
    });

    it('minifies HTML preserving tags and stripping whitespace and comments', () => {
      const html = `
        <!-- Main header -->
        <div class="container">
          <h1> Hello World </h1>
          <p> This is a paragraph. </p>
        </div>
      `;
      const result = minifyHtml(html);
      expect(result.isValid).toBe(true);
      expect(result.output).not.toContain('<!-- Main header -->');
      expect(result.output).toBe('<div class="container"><h1>Hello World</h1><p>This is a paragraph.</p></div>');
    });

    it('minifies CSS removing comments and collapsing whitespace around rules', () => {
      const css = `
        /* Card component */
        .card {
          background-color: #ffffff;
          border-radius: 8px;
          margin: 10px 0;
        }
      `;
      const result = minifyCss(css);
      expect(result.isValid).toBe(true);
      expect(result.output).not.toContain('/* Card component */');
      expect(result.output).toBe('.card{background-color:#ffffff;border-radius:8px;margin:10px 0}');
    });

    it('minifies SQL queries stripping comments and excess whitespace outside literals', () => {
      const sql = `
        -- Fetch active users
        SELECT u.id, u.name, 'Sample String with spaces' AS sample_text
        FROM users u
        WHERE u.active = 1;
      `;
      const result = minifySql(sql);
      expect(result.isValid).toBe(true);
      expect(result.output).not.toContain('-- Fetch active users');
      expect(result.output).toContain("SELECT u.id, u.name, 'Sample String with spaces' AS sample_text FROM users u WHERE u.active = 1;");
    });
  });

  describe('Validation Suite (JS, HTML, CSS, SQL)', () => {
    it('validates correct and incorrect JavaScript syntax', () => {
      const valid = validateCode('function add(a, b) { return a + b; }', 'javascript');
      expect(valid.isValid).toBe(true);
      expect(valid.issues.length).toBe(0);

      const invalid = validateCode('function add(a, b) { return a + ; }', 'javascript');
      expect(invalid.isValid).toBe(false);
      expect(invalid.issues.length).toBeGreaterThan(0);
    });

    it('validates correct and unclosed HTML tags', () => {
      const valid = validateCode('<div><p>Hello <span>world</span></p></div>', 'html');
      expect(valid.isValid).toBe(true);

      const invalid = validateCode('<div><p>Hello <span>world</p></div>', 'html');
      expect(invalid.isValid).toBe(false);
      expect(invalid.issues.length).toBeGreaterThan(0);
    });

    it('validates correct and unbalanced CSS braces', () => {
      const valid = validateCode('.btn { color: red; font-size: 14px; }', 'css');
      expect(valid.isValid).toBe(true);

      const invalid = validateCode('.btn { color: red; font-size: 14px;', 'css');
      expect(invalid.isValid).toBe(false);
      expect(invalid.issues.length).toBeGreaterThan(0);
    });

    it('validates correct and incorrect SQL syntax', () => {
      const valid = validateCode('SELECT id, name FROM users WHERE id = 1;', 'sql');
      expect(valid.isValid).toBe(true);

      const empty = validateCode('', 'sql');
      expect(empty.isValid).toBe(false);
    });
  });
});

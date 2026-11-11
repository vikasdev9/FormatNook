import { describe, it, expect } from 'vitest';
import {
  formatSql,
  formatHtml,
  formatCss,
  formatJavascript,
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
  });
});

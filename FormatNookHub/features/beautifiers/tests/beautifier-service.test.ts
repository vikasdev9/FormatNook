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
});

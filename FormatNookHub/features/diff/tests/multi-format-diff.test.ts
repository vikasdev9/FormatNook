import { describe, it, expect } from 'vitest';
import {
  computeDiff,
  detectFormat,
  sortObjectKeys,
  preprocessContent,
  DEFAULT_DIFF_OPTIONS,
} from '../services/diff-service';

describe('Universal Multi-Format Comparison', () => {
  describe('Format Auto-Detection', () => {
    it('detects JSON correctly', () => {
      expect(detectFormat('{"key": "value", "list": [1, 2]}')).toBe('json');
      expect(detectFormat('[1, 2, 3]')).toBe('json');
    });

    it('detects XML and HTML correctly', () => {
      expect(detectFormat('<?xml version="1.0"?><root><item>test</item></root>')).toBe('xml');
      expect(detectFormat('<root><user id="1">Alice</user></root>')).toBe('xml');
      expect(detectFormat('<!DOCTYPE html><html><body><h1>Hello</h1></body></html>')).toBe('html');
    });

    it('detects YAML correctly', () => {
      expect(detectFormat('name: FormatNook\nversion: 1.0\nstatus: active')).toBe('yaml');
      expect(detectFormat('---\nservices:\n  web:\n    image: node')).toBe('yaml');
    });

    it('detects SQL correctly', () => {
      expect(detectFormat('SELECT id, name FROM users WHERE active = 1;')).toBe('sql');
      expect(detectFormat('INSERT INTO logs (event) VALUES (\'login\');')).toBe('sql');
    });

    it('falls back to text for unstructured text', () => {
      expect(detectFormat('Just a simple note with some thoughts.')).toBe('text');
      expect(detectFormat('')).toBe('text');
    });
  });

  describe('JSON Semantic Key Sorting & Normalization', () => {
    it('sorts object keys recursively', () => {
      const unordered = { z: 1, a: { y: 2, b: 3 }, m: [ { d: 4, c: 5 } ] };
      const sorted = sortObjectKeys(unordered);
      expect(Object.keys(sorted)).toEqual(['a', 'm', 'z']);
      expect(Object.keys(sorted.a)).toEqual(['b', 'y']);
      expect(Object.keys(sorted.m[0])).toEqual(['c', 'd']);
    });

    it('considers unordered JSON keys identical when sortKeys is true', () => {
      const jsonA = '{\n  "version": "1.0",\n  "name": "FormatNook"\n}';
      const jsonB = '{\n  "name": "FormatNook",\n  "version": "1.0"\n}';

      // Without sortKeys: they differ
      const diffWithoutSort = computeDiff(jsonA, jsonB, {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'json',
        sortKeys: false,
      });
      expect(diffWithoutSort.isIdentical).toBe(false);

      // With sortKeys: they are identical
      const diffWithSort = computeDiff(jsonA, jsonB, {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'json',
        sortKeys: true,
      });
      expect(diffWithSort.isIdentical).toBe(true);
    });

    it('normalizes minified and prettified JSON when prettifyBeforeCompare is true', () => {
      const minified = '{"name":"FormatNook","version":"1.0"}';
      const pretty = '{\n  "name": "FormatNook",\n  "version": "1.0"\n}';

      const res = computeDiff(minified, pretty, {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'json',
        prettifyBeforeCompare: true,
      });
      expect(res.isIdentical).toBe(true);
    });

    it('handles invalid JSON gracefully without throwing', () => {
      const invalidJson = '{"broken": json without quotes}';
      const validJson = '{"broken": false}';

      const res = computeDiff(invalidJson, validJson, {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'json',
        prettifyBeforeCompare: true,
      });

      expect(res.formatWarnings?.original).toContain('Invalid JSON');
      expect(res.lines.length).toBeGreaterThan(0);
    });
  });

  describe('XML and YAML Formatting Normalization', () => {
    it('normalizes XML indentation differences', () => {
      const xml1 = '<root><child attr="1">Hello</child></root>';
      const xml2 = '<root>\n  <child attr="1">Hello</child>\n</root>';

      const res = computeDiff(xml1, xml2, {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'xml',
        prettifyBeforeCompare: true,
      });
      expect(res.isIdentical).toBe(true);
    });

    it('normalizes YAML formatting differences', () => {
      const yaml1 = 'name: FormatNook\nversion: "1.0"';
      const yaml2 = 'name: FormatNook\nversion: \'1.0\'';

      const res = computeDiff(yaml1, yaml2, {
        ...DEFAULT_DIFF_OPTIONS,
        format: 'yaml',
        prettifyBeforeCompare: true,
      });
      expect(res.isIdentical).toBe(true);
    });
  });
});

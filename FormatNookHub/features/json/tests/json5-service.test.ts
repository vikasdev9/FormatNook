import { describe, it, expect } from 'vitest';
import {
  validateJson5,
  parseJson5,
  formatJson5,
  json5ToStandardJson,
  convertJson5ToStandardJson,
} from '../services/json5-service';

describe('JSON5 Service', () => {
  it('validates and parses valid standard JSON', () => {
    const json = '{"name": "FormatNook", "active": true, "count": 42}';
    const validation = validateJson5(json);
    expect(validation.isValid).toBe(true);

    const parsed = parseJson5(json);
    expect(parsed.name).toBe('FormatNook');
    expect(parsed.count).toBe(42);
  });

  it('handles single-line and multi-line comments', () => {
    const json5 = `
      // Single line comment
      {
        /* Multi-line
           comment block */
        "title": "Developer Tool"
      }
    `;
    const res = convertJson5ToStandardJson(json5);
    expect(res.valid).toBe(true);
    const parsed = parseJson5(json5);
    expect(parsed.title).toBe('Developer Tool');
  });

  it('handles unquoted object keys', () => {
    const json5 = '{ name: "Alex", age: 30, is_admin: false }';
    const parsed = parseJson5(json5);
    expect(parsed.name).toBe('Alex');
    expect(parsed.age).toBe(30);
    expect(parsed.is_admin).toBe(false);
  });

  it('handles trailing commas in objects and arrays', () => {
    const json5 = '{ "items": [1, 2, 3,], "config": { "debug": true, }, }';
    const parsed = parseJson5(json5);
    expect(parsed.items).toEqual([1, 2, 3]);
    expect(parsed.config.debug).toBe(true);
  });

  it('handles single-quoted strings with nested quotes', () => {
    const json5 = "{ 'greeting': 'Hello \"World\"', 'symbol': '🚀' }";
    const parsed = parseJson5(json5);
    expect(parsed.greeting).toBe('Hello "World"');
    expect(parsed.symbol).toBe('🚀');
  });

  it('handles numbers: hex, leading/trailing decimals, and positive signs', () => {
    const json5 = '{ hex: 0x1f, leading: .5, trailing: 42., positive: +100 }';
    const parsed = parseJson5(json5);
    expect(parsed.hex).toBe(31);
    expect(parsed.leading).toBe(0.5);
    expect(parsed.trailing).toBe(42.0);
    expect(parsed.positive).toBe(100);
  });

  it('converts JSON5 to standard strict JSON', () => {
    const json5 = "{ unquotedKey: 'single-quoted value', count: +5, }";
    const standard = json5ToStandardJson(json5, 2);
    expect(JSON.parse(standard)).toEqual({
      unquotedKey: 'single-quoted value',
      count: 5,
    });
  });

  it('rejects unterminated strings or syntax errors', () => {
    const invalid = '{ unclosed: "test }';
    const validation = validateJson5(invalid);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toBeDefined();
  });
});


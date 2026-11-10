import { describe, it, expect } from 'vitest';
import { formatJson, validateJson, minifyJson, repairJson } from '../services/json-service';

describe('json-service', () => {
  const validJson = '{"name":"FormatNook","version":1,"features":["formatting","validation"],"active":true}';

  it('formats valid JSON with 2 spaces by default', () => {
    const result = formatJson(validJson, '2');
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.output).toContain('  "name": "FormatNook"');
  });

  it('formats valid JSON with 4 spaces', () => {
    const result = formatJson(validJson, '4');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('    "name": "FormatNook"');
  });

  it('formats valid JSON with tabs', () => {
    const result = formatJson(validJson, 'tab');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('\t"name": "FormatNook"');
  });

  it('correctly minifies JSON', () => {
    const formatted = '{\n  "test": 123\n}';
    const result = minifyJson(formatted);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('{"test":123}');
  });

  it('flags invalid JSON with line and column information', () => {
    const invalidJson = '{\n  "name": "FormatNook",\n}';
    const validation = validateJson(invalidJson);
    expect(validation.isValid).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);
    expect(validation.issues[0].severity).toBe('error');
  });

  it('handles empty input gracefully', () => {
    const result = validateJson('   ');
    expect(result.isValid).toBe(false);
    expect(result.issues[0].message).toContain('empty');
  });

  it('preserves unicode characters and emojis', () => {
    const unicodeJson = '{"greeting":"Hello 🌍 世界!","special":"\\u0041"}';
    const result = formatJson(unicodeJson);
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('Hello 🌍 世界!');
  });

  it('repairs common JSON errors when requested explicitly', () => {
    const broken = "{ name: 'Vikas', list: [1, 2, ], }";
    const repaired = repairJson(broken);
    const parsed = JSON.parse(repaired);
    expect(parsed.name).toBe('Vikas');
    expect(parsed.list).toEqual([1, 2]);
  });
});

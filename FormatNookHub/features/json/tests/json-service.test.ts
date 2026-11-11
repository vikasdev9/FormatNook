import { describe, it, expect } from 'vitest';
import { formatJson, validateJson, minifyJson, repairJson } from '../services/json-service';
import { countLogicalLines } from '@/components/workspace/CodeEditor';

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

  describe('countLogicalLines', () => {
    it('returns 0 for empty or whitespace-only documents', () => {
      expect(countLogicalLines('')).toBe(0);
    });

    it('accurately counts single line text without newline', () => {
      expect(countLogicalLines('{"single": "line"}')).toBe(1);
    });

    it('accurately counts 100-line JSON document', () => {
      const doc = Array.from({ length: 100 }, (_, i) => `  "key_${i}": ${i}`).join('\n');
      expect(countLogicalLines(doc)).toBe(100);
    });

    it('accurately counts 1,000-line document', () => {
      const doc = Array.from({ length: 1000 }, (_, i) => `  "line_${i}": ${i}`).join('\n');
      expect(countLogicalLines(doc)).toBe(1000);
    });

    it('handles CRLF (Windows) and LF (Unix) identically', () => {
      const lfDoc = 'line1\nline2\nline3';
      const crlfDoc = 'line1\r\nline2\r\nline3';
      expect(countLogicalLines(lfDoc)).toBe(3);
      expect(countLogicalLines(crlfDoc)).toBe(3);
    });

    it('handles trailing newline consistently as a terminal line', () => {
      expect(countLogicalLines('line1\n')).toBe(2);
      expect(countLogicalLines('line1\r\n')).toBe(2);
    });

    it('updates count after adding and removing lines', () => {
      let doc = 'line1\nline2';
      expect(countLogicalLines(doc)).toBe(2);
      doc += '\nline3\nline4';
      expect(countLogicalLines(doc)).toBe(4);
      doc = doc.replace('\nline4', '');
      expect(countLogicalLines(doc)).toBe(3);
    });
  });
});

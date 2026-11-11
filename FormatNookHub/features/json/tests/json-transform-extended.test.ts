import { describe, it, expect } from 'vitest';
import {
  jsonToTsv,
  extractJsonFields,
  mergeJsonObjects,
  splitJsonArray,
} from '../services/json-transform-service';
import {
  formatJson,
  sortObjectKeysRecursive,
  stringifyJson,
  unstringifyJson,
  oneLineJson,
} from '../services/json-service';

describe('Extended JSON Transformations and Formatting Tools', () => {
  it('converts JSON to TSV with tab delimiters', () => {
    const data = [
      { id: 1, name: 'Alice', role: 'Dev' },
      { id: 2, name: 'Bob', role: 'Design' },
    ];
    const res = jsonToTsv(data);
    expect(res.output).toContain('id\tname\trole');
    expect(res.output).toContain('1\tAlice\tDev');
    expect(res.output).toContain('2\tBob\tDesign');
  });

  it('extracts selected fields from array and objects', () => {
    const list = [
      { id: 101, username: 'user1', secret: 'abc', details: { city: 'NY' } },
      { id: 102, username: 'user2', secret: 'xyz', details: { city: 'SF' } },
    ];

    const extracted = extractJsonFields(list, { fields: ['id', 'username'] });
    const parsed = JSON.parse(extracted.output);
    expect(parsed).toEqual([
      { id: 101, username: 'user1' },
      { id: 102, username: 'user2' },
    ]);

    // Test nested dot-notation field extraction
    const nested = extractJsonFields(list, { fields: ['id', 'details.city'], keepStructure: true });
    const parsedNested = JSON.parse(nested.output);
    expect(parsedNested[0]).toEqual({ id: 101, details: { city: 'NY' } });
  });

  it('merges JSON objects shallowly and deeply', () => {
    const objA = { app: 'FormatNook', settings: { theme: 'dark', logging: true } };
    const objB = { version: '2.0.0', settings: { logging: false, port: 3000 } };

    const deep = mergeJsonObjects(objA, objB, { strategy: 'deep' });
    const parsedDeep = JSON.parse(deep.output);
    expect(parsedDeep.app).toBe('FormatNook');
    expect(parsedDeep.version).toBe('2.0.0');
    expect(parsedDeep.settings.theme).toBe('dark');
    expect(parsedDeep.settings.logging).toBe(false);
    expect(parsedDeep.settings.port).toBe(3000);

    const shallow = mergeJsonObjects(objA, objB, { strategy: 'shallow' });
    const parsedShallow = JSON.parse(shallow.output);
    expect(parsedShallow.settings).toEqual({ logging: false, port: 3000 });
  });

  it('splits array into smaller chunks', () => {
    const array = [1, 2, 3, 4, 5, 6, 7];
    const split = splitJsonArray(array, { chunkSize: 3 });
    const parsed = JSON.parse(split.output);
    expect(parsed).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('stringifies, unstringifies, and compacts one-line JSON', () => {
    const original = '{"a": 1, "b": "hello"}';
    const oneLine = oneLineJson(original);
    expect(oneLine).toBe('{"a":1,"b":"hello"}');

    const stringified = stringifyJson(original);
    expect(typeof stringified).toBe('string');
    expect(stringified.startsWith('"')).toBe(true);

    const unstringified = unstringifyJson(stringified);
    expect(JSON.parse(unstringified)).toEqual({ a: 1, b: 'hello' });
  });

  it('formats JSON with alphabetical key sorting and custom indentations', () => {
    const unsorted = '{"z": 10, "a": 20, "m": {"y": 1, "b": 2}}';
    const sorted = formatJson(unsorted, '3', { sortKeys: true });
    expect(sorted.isValid).toBe(true);

    // Verify key order
    const keys = Object.keys(JSON.parse(sorted.output));
    expect(keys).toEqual(['a', 'm', 'z']);
    expect(sorted.output).toContain('   "a": 20'); // 3 spaces indent
  });
});


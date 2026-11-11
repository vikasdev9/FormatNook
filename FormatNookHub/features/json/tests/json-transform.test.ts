import { describe, it, expect } from 'vitest';
import {
  jsonToCsv,
  jsonToXml,
  jsonToYaml,
  flattenJson,
  unflattenJson,
  sortJsonKeys,
  sortJsonArray,
  filterJson,
  deduplicateJsonArrays,
  escapeJsonString,
  unescapeJsonString,
} from '../services/json-transform-service';

describe('json-transform-service', () => {
  it('converts array of objects to CSV with default comma delimiter', () => {
    const data = [
      { id: 1, name: 'Alice', city: 'London' },
      { id: 2, name: 'Bob', city: 'Paris' },
    ];
    const res = jsonToCsv(data);
    expect(res.format).toBe('csv');
    expect(res.output).toContain('id,name,city');
    expect(res.output).toContain('1,Alice,London');
    expect(res.output).toContain('2,Bob,Paris');
  });

  it('converts array of objects to CSV with semicolon delimiter and custom columns', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30, salary: 100000 },
      { id: 2, name: 'Bob', age: 25, salary: 90000 },
    ];
    const res = jsonToCsv(data, { delimiter: ';', customColumns: ['name', 'salary'] });
    expect(res.output).toContain('name;salary');
    expect(res.output).toContain('Alice;100000');
    expect(res.output).not.toContain('age');
  });

  it('converts nested structures in CSV using flatten strategy', () => {
    const data = [
      { id: 1, profile: { role: 'Admin', verified: true } },
    ];
    const res = jsonToCsv(data, { nestedStrategy: 'flatten' });
    expect(res.output).toContain('profile.role');
    expect(res.output).toContain('Admin');
  });

  it('converts JSON object to clean XML with custom root and item tags', () => {
    const data = { title: 'Book', count: 5 };
    const res = jsonToXml(data, { rootTag: 'catalog', itemTag: 'entry' });
    expect(res.format).toBe('xml');
    expect(res.output).toContain('<catalog>');
    expect(res.output).toContain('<title>Book</title>');
    expect(res.output).toContain('</catalog>');
  });

  it('converts JSON to YAML', () => {
    const data = { app: 'FormatNook', port: 3000 };
    const res = jsonToYaml(data);
    expect(res.format).toBe('yaml');
    expect(res.output).toContain('app: FormatNook');
    expect(res.output).toContain('port: 3000');
  });

  it('flattens nested object keys with custom slash separator', () => {
    const data = {
      user: {
        profile: {
          username: 'alex',
        },
      },
    };
    const res = flattenJson(data, { separator: '/' });
    expect(res.format).toBe('json');
    const parsed = JSON.parse(res.output);
    expect(parsed['user/profile/username']).toBe('alex');
  });

  it('unflattens custom slash separated keys back to nested hierarchy', () => {
    const data = {
      'user/profile/username': 'alex',
      'user/active': true,
    };
    const res = unflattenJson(data, { separator: '/' });
    expect(res.format).toBe('json');
    const parsed = JSON.parse(res.output);
    expect(parsed.user.profile.username).toBe('alex');
    expect(parsed.user.active).toBe(true);
  });

  it('sorts object keys descending and case-insensitively', () => {
    const data = {
      a: 1,
      Z: 2,
      b: 3,
    };
    const res = sortJsonKeys(data, { direction: 'desc', caseSensitive: false });
    const parsed = JSON.parse(res.output);
    expect(Object.keys(parsed)).toEqual(['Z', 'b', 'a']);
  });

  it('sorts arrays by property (numeric and string)', () => {
    const items = [
      { id: 3, name: 'Charlie', score: 85 },
      { id: 1, name: 'Alice', score: 95 },
      { id: 2, name: 'Bob', score: 70 },
    ];

    // Sort by numeric score descending
    const sortedNum = sortJsonArray(items, { sortProperty: 'score', direction: 'desc', propertyType: 'number' });
    const parsedNum = JSON.parse(sortedNum.output);
    expect(parsedNum[0].name).toBe('Alice');
    expect(parsedNum[2].name).toBe('Bob');

    // Sort by name ascending
    const sortedStr = sortJsonArray(items, { sortProperty: 'name', direction: 'asc', propertyType: 'string' });
    const parsedStr = JSON.parse(sortedStr.output);
    expect(parsedStr[0].name).toBe('Alice');
    expect(parsedStr[2].name).toBe('Charlie');
  });

  it('filters JSON array by property equals and contains', () => {
    const users = [
      { id: 1, name: 'Alex Mercer', role: 'Engineer', active: true },
      { id: 2, name: 'Sarah Connor', role: 'Manager', active: false },
      { id: 3, name: 'John Connor', role: 'Engineer', active: true },
    ];

    const res = filterJson(users, {
      conditions: [{ field: 'role', operator: 'equals', value: 'Engineer' }],
    });
    const parsed = JSON.parse(res.output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('Alex Mercer');
    expect(parsed[1].name).toBe('John Connor');
  });

  it('deduplicates array elements by object property (e.g. id)', () => {
    const users = [
      { id: 101, name: 'Alice' },
      { id: 102, name: 'Bob' },
      { id: 101, name: 'Alice Duplicate' },
    ];
    const res = deduplicateJsonArrays(users, { propertyKey: 'id' });
    expect(res.format).toBe('json');
    const parsed = JSON.parse(res.output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('Alice');
    expect(parsed[1].name).toBe('Bob');
    expect(res.notes).toContain('Removed 1 duplicate');
  });

  it('escapes and unescapes JSON strings', () => {
    const raw = '{"hello":"world"}';
    const escaped = escapeJsonString(raw);
    expect(escaped.format).toBe('text');
    expect(escaped.output).toContain('\\"hello\\"');

    const unescaped = unescapeJsonString(escaped.output);
    expect(unescaped.format).toBe('text');
    expect(unescaped.output).toBe(raw);
  });
});

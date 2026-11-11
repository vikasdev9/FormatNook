import { describe, it, expect } from 'vitest';
import { evaluateJsonPath, searchJson, validateJsonPathSyntax } from '../services/json-path-service';

describe('json-path-service', () => {
  const dataset = {
    store: {
      book: [
        { title: 'The Hobbit', price: 10.99, available: true },
        { title: '1984', price: 8.99, available: false },
      ],
      location: 'London',
    },
    version: 2,
  };

  it('evaluates root document ($)', () => {
    const matches = evaluateJsonPath(dataset, '$');
    expect(matches).toHaveLength(1);
    expect(matches[0].path).toBe('$');
    expect(matches[0].value).toEqual(dataset);
  });

  it('evaluates wildcard top-level keys ($.*)', () => {
    const matches = evaluateJsonPath(dataset, '$.*');
    expect(matches.length).toBe(2); // store, version
  });

  it('evaluates deep recursive search ($..price)', () => {
    const matches = evaluateJsonPath(dataset, '$..price');
    expect(matches.length).toBe(2);
    expect(matches.map((m) => m.value)).toEqual([10.99, 8.99]);
  });

  it('evaluates specific nested property ($.store.location)', () => {
    const matches = evaluateJsonPath(dataset, '$.store.location');
    expect(matches).toHaveLength(1);
    expect(matches[0].value).toBe('London');
  });

  it('evaluates array wildcard ($.store.book[*])', () => {
    const matches = evaluateJsonPath(dataset, '$.store.book[*]');
    expect(matches).toHaveLength(2);
  });

  it('throws descriptive error on invalid JSONPath expression', () => {
    expect(() => evaluateJsonPath(dataset, 'store.book')).toThrow(/must start with '\$'/);
    expect(() => evaluateJsonPath(dataset, '$.book[0')).toThrow(/Unclosed bracket/);
    expect(validateJsonPathSyntax('$.items...name')).toContain('Invalid wildcard');
  });

  it('searches text query with case sensitivity and exact matching', () => {
    // Case sensitive
    const caseMatch = searchJson(dataset, 'hobbit', { caseSensitive: true });
    expect(caseMatch).toHaveLength(0);

    const exactMatch = searchJson(dataset, 'The Hobbit', { exactMatch: true });
    expect(exactMatch).toHaveLength(1);

    const partialMatch = searchJson(dataset, 'Hobbit', { exactMatch: false });
    expect(partialMatch).toHaveLength(1);
  });

  it('filters search by data type and scoped path', () => {
    const numberMatches = searchJson(dataset, '10.99', { typeFilter: 'number' });
    expect(numberMatches).toHaveLength(1);

    const scopedMatches = searchJson(dataset, 'price', { scopePath: '$.store.book[0]' });
    expect(scopedMatches).toHaveLength(1);
    expect(scopedMatches[0].path).toBe('$.store.book[0].price');
  });
});

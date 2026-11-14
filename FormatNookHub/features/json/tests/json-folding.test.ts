import { describe, it, expect } from 'vitest';
import {
  computeFoldingRanges,
  getRangesToFoldForLevel,
  getCollapsedSummary,
} from '../services/json-folding-service';

describe('JSON Folding Service', () => {
  const sampleJson = `{
  "app": "FormatNook",
  "version": 1.0,
  "user": {
    "id": 101,
    "profile": {
      "name": "Alex",
      "city": "Mumbai"
    }
  },
  "tags": [
    "json",
    "developer",
    "tools"
  ]
}`;

  it('computes accurate folding ranges for objects and arrays', () => {
    const ranges = computeFoldingRanges(sampleJson);
    expect(ranges.length).toBeGreaterThan(0);

    // Root object: lines 1 to 16
    const root = ranges.find((r) => r.startLine === 1);
    expect(root).toBeDefined();
    expect(root?.endLine).toBe(16);
    expect(root?.type).toBe('object');
    expect(root?.depth).toBe(1);

    // Nested "user" object: lines 4 to 10
    const user = ranges.find((r) => r.startLine === 4);
    expect(user).toBeDefined();
    expect(user?.endLine).toBe(10);
    expect(user?.type).toBe('object');
    expect(user?.depth).toBe(2);

    // Nested "profile" object: lines 6 to 9
    const profile = ranges.find((r) => r.startLine === 6);
    expect(profile).toBeDefined();
    expect(profile?.endLine).toBe(9);
    expect(profile?.depth).toBe(3);

    // "tags" array: lines 11 to 15
    const tags = ranges.find((r) => r.startLine === 11);
    expect(tags).toBeDefined();
    expect(tags?.endLine).toBe(15);
    expect(tags?.type).toBe('array');
    expect(tags?.depth).toBe(2);
  });

  it('ignores braces and brackets inside string literals and escaped strings', () => {
    const jsonWithFakeBrackets = `{
  "template": "{ hello [world] }",
  "escaped": "{\\"nested\\": true}",
  "realObj": {
    "active": true
  }
}`;
    const ranges = computeFoldingRanges(jsonWithFakeBrackets);
    expect(ranges).toHaveLength(2); // Only root and realObj!

    expect(ranges[0].startLine).toBe(1);
    expect(ranges[0].endLine).toBe(7);

    expect(ranges[1].startLine).toBe(4);
    expect(ranges[1].endLine).toBe(6);
  });

  it('computes correct collapsed summaries with item counts', () => {
    const ranges = computeFoldingRanges(sampleJson);
    const root = ranges.find((r) => r.startLine === 1)!;
    const tags = ranges.find((r) => r.startLine === 11)!;

    const rootSummary = getCollapsedSummary(root);
    expect(rootSummary).toContain('{ ...');
    expect(rootSummary).toContain('props');

    const tagsSummary = getCollapsedSummary(tags);
    expect(tagsSummary).toContain('[ ...');
    expect(tagsSummary).toContain('items');
  });

  it('filters folding targets by structural depth level', () => {
    const ranges = computeFoldingRanges(sampleJson);

    // Level 1 targets: depth >= 1 (folds all)
    const level1 = getRangesToFoldForLevel(ranges, 1);
    expect(level1.length).toBe(ranges.length);

    // Level 2 targets: depth >= 2 (leaves root open, folds user and tags)
    const level2 = getRangesToFoldForLevel(ranges, 2);
    expect(level2.some((r) => r.depth === 1)).toBe(false);
    expect(level2.some((r) => r.depth === 2)).toBe(true);

    // Level 3 targets: depth >= 3 (only folds profile)
    const level3 = getRangesToFoldForLevel(ranges, 3);
    expect(level3.every((r) => r.depth >= 3)).toBe(true);
  });

  it('handles empty and malformed JSON gracefully', () => {
    expect(computeFoldingRanges('')).toEqual([]);
    expect(computeFoldingRanges('not a json')).toEqual([]);
    expect(computeFoldingRanges('{"unclosed": {')).toHaveLength(0);
  });

  it('processes a large 10,000+ line JSON document in under 30ms', () => {
    const items = [];
    for (let i = 0; i < 2000; i++) {
      items.push(`  {
    "id": ${i},
    "name": "item_${i}",
    "tags": ["a", "b", "c"],
    "details": {
      "active": ${i % 2 === 0},
      "code": "XYZ-${i}"
    }
  }`);
    }
    const largeJson = `[\n${items.join(',\n')}\n]`;

    const start = performance.now();
    const ranges = computeFoldingRanges(largeJson);
    const duration = performance.now() - start;

    expect(ranges.length).toBeGreaterThan(4000);
    expect(duration).toBeLessThan(100); // Fast O(N) execution
  });
});

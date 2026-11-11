import { describe, it, expect } from 'vitest';
import { computeJsonStats } from '../services/json-stats-service';

describe('json-stats-service', () => {
  it('computes accurate metrics for a nested JSON object including empty objects and arrays', () => {
    const json = JSON.stringify({
      user: {
        name: 'Alex',
        age: 30,
        active: true,
        nickname: null,
        metadata: {}, // empty object
      },
      tags: ['dev', 'sysadmin'],
      history: [], // empty array
    });

    const stats = computeJsonStats(json);
    expect(stats.totalObjects).toBe(3); // root + user + metadata
    expect(stats.totalArrays).toBe(2); // tags + history
    expect(stats.emptyObjects).toBe(1);
    expect(stats.emptyArrays).toBe(1);
    expect(stats.stringsCount).toBe(3); // 'Alex', 'dev', 'sysadmin'
    expect(stats.numbersCount).toBe(1); // 30
    expect(stats.booleansCount).toBe(1); // true
    expect(stats.nullsCount).toBe(1); // null
    expect(stats.maxDepth).toBeGreaterThanOrEqual(2);
    expect(stats.fileSizeBytes).toBeGreaterThan(0);
  });

  it('handles empty or malformed strings gracefully', () => {
    const stats = computeJsonStats('');
    expect(stats.totalObjects).toBe(0);
    expect(stats.characterCount).toBe(0);
    expect(stats.emptyObjects).toBe(0);
    expect(stats.emptyArrays).toBe(0);

    const invalidStats = computeJsonStats('{ broken json ');
    expect(invalidStats.totalObjects).toBe(0);
    expect(invalidStats.characterCount).toBe(14);
  });
});

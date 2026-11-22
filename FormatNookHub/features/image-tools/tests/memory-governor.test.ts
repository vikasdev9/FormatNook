import { describe, it, expect } from 'vitest';
import {
  estimateJobMemory,
  validateTaskMemory,
  calculateAdaptiveConcurrency,
  getMemoryBudget,
  DESKTOP_MAX_TASK_RAM,
  DESKTOP_MAX_BATCH_RAM,
  MOBILE_MAX_TASK_RAM,
  MOBILE_MAX_BATCH_RAM,
  PIPELINE_OVERHEAD_BYTES,
} from '../services/memory-governor.service';

describe('Dual-Layer Memory Governor Service', () => {
  it('calculates peak working memory according to the blueprint formula', () => {
    const width = 1000;
    const height = 1000;
    // (1000 * 1000 * 4) + (1000 * 1000 * 4) + 20MB
    const expected = 4_000_000 + 4_000_000 + PIPELINE_OVERHEAD_BYTES;
    const estimated = estimateJobMemory(width, height);
    expect(estimated).toBe(expected);
  });

  it('validates task memory for desktop and permits normal images', () => {
    // 1920x1080: ~36.6 MB peak, well under 128 MB desktop limit
    const res = validateTaskMemory(1920, 1080, false);
    expect(res.allowed).toBe(true);
    expect(res.estimatedBytes).toBeLessThan(DESKTOP_MAX_TASK_RAM);
  });

  it('rejects oversized images on desktop exceeding 128 MB budget', () => {
    // 6000x6000: (36M * 4) + (36M * 4) + 20MB = 288 MB + 20 MB = 308 MB
    const res = validateTaskMemory(6000, 6000, false);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('exceeds task memory budget');
  });

  it('strictly rejects images exceeding 48 MB mobile budget on mobile devices', () => {
    // 2500x2500: ~70 MB peak, exceeds 48 MB mobile limit
    const res = validateTaskMemory(2500, 2500, true);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('exceeds mobile memory budget');
  });

  it('forces concurrency to 1 on mobile devices regardless of cores', () => {
    const items = [
      { width: 800, height: 600 },
      { width: 800, height: 600 },
      { width: 800, height: 600 },
    ];
    // Force mobile with 8 CPU cores
    const concurrency = calculateAdaptiveConcurrency(items, true, 8);
    expect(concurrency).toBe(1);
  });

  it('calculates adaptive concurrency on desktop within batch memory cap', () => {
    const smallItems = [
      { width: 800, height: 600 },
      { width: 800, height: 600 },
      { width: 800, height: 600 },
    ];
    // Small images with 8 cores -> max cap 4
    const concurrencySmall = calculateAdaptiveConcurrency(smallItems, false, 8);
    expect(concurrencySmall).toBe(4);

    // Large images (4000x3000 -> peak ~116MB)
    // 512MB / 116MB = 4, but let's test very large images that throttle concurrency
    const largeItems = [
      { width: 5000, height: 5000 }, // peak ~220MB
    ];
    // 512MB / 220MB = 2 workers max
    const concurrencyLarge = calculateAdaptiveConcurrency(largeItems, false, 8);
    expect(concurrencyLarge).toBeLessThanOrEqual(2);
  });

  it('produces a full memory budget summary', () => {
    const items = [{ width: 1024, height: 768 }];
    const budget = getMemoryBudget(items, false);
    expect(budget.isMobile).toBe(false);
    expect(budget.maxTaskMemoryBytes).toBe(DESKTOP_MAX_TASK_RAM);
    expect(budget.maxBatchMemoryBytes).toBe(DESKTOP_MAX_BATCH_RAM);
    expect(budget.concurrency).toBeGreaterThanOrEqual(1);
    expect(budget.estimatedBatchBytes).toBeGreaterThan(0);
  });
});

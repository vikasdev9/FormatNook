import { describe, it, expect } from 'vitest';
import { computeDiff, DEFAULT_DIFF_OPTIONS } from '../services/diff-service';

describe('Diff Engine Performance & Myers Cutoff Benchmark', () => {
  it('measures small files (50 lines)', () => {
    const orig = Array.from({ length: 50 }, (_, i) => `line ${i}: const val = ${i};`).join('\n');
    const mod = Array.from({ length: 50 }, (_, i) => `line ${i}: const val = ${i % 5 === 0 ? i * 2 : i};`).join('\n');

    const t0 = performance.now();
    const result = computeDiff(orig, mod, { ...DEFAULT_DIFF_OPTIONS, format: 'text' });
    const elapsedMs = performance.now() - t0;

    expect(result.isValid.original).toBe(true);
    expect(result.statistics.totalLines).toBeGreaterThan(0);
    expect(result.statistics.modifiedLines + result.statistics.addedLines + result.statistics.removedLines).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(50); // Instant for small files
  });

  it('measures large similar files (3,000 lines with 5% differences)', () => {
    const orig = Array.from({ length: 3000 }, (_, i) => `record_${i}: { id: ${i}, status: 'active', tag: 'prod' }`).join('\n');
    const mod = Array.from({ length: 3000 }, (_, i) => `record_${i}: { id: ${i}, status: '${i % 20 === 0 ? 'inactive' : 'active'}', tag: 'prod' }`).join('\n');

    const t0 = performance.now();
    const result = computeDiff(orig, mod, { ...DEFAULT_DIFF_OPTIONS, format: 'text' });
    const elapsedMs = performance.now() - t0;

    expect(result.isValid.original).toBe(true);
    expect(result.statistics.unchangedLines).toBeGreaterThan(2500);
    expect(elapsedMs).toBeLessThan(350); // Under 350ms on main thread
  });

  it('measures large completely different files (2,000 lines with 100% differences)', () => {
    const orig = Array.from({ length: 2000 }, (_, i) => `AAA_${i}_original_data_content_${i}`).join('\n');
    const mod = Array.from({ length: 2000 }, (_, i) => `ZZZ_${i}_modified_payload_text_${i}`).join('\n');

    const t0 = performance.now();
    const result = computeDiff(orig, mod, { ...DEFAULT_DIFF_OPTIONS, format: 'text' });
    const elapsedMs = performance.now() - t0;

    expect(result.isValid.original).toBe(true);
    expect(result.statistics.modifiedLines).toBe(2000);
    expect(result.isIdentical).toBe(false);
    expect(elapsedMs).toBeLessThan(500);
  });

  it('verifies adversarial input reaching Myers distance cutoff (D >= 2000) produces safe fallback output', () => {
    // Generate 2500 completely alternating disjoint lines to guarantee D >= 2000
    const orig = Array.from({ length: 2500 }, (_, i) => `alpha_${i}_unique_${Math.random()}`).join('\n');
    const mod = Array.from({ length: 2500 }, (_, i) => `beta_${i}_unique_${Math.random()}`).join('\n');

    const t0 = performance.now();
    const result = computeDiff(orig, mod, { ...DEFAULT_DIFF_OPTIONS, format: 'text' });
    const elapsedMs = performance.now() - t0;

    // Must trigger safe bailout without freezing the thread or running out of memory
    expect(result.isValid.original).toBe(true);
    expect(result.lines.length).toBeGreaterThanOrEqual(2500);
    expect(result.unifiedDiffText).toContain('-alpha_');
    expect(result.unifiedDiffText).toContain('+beta_');
    expect(elapsedMs).toBeLessThan(600); // Cutoff ensures execution terminates in under 600ms
  });
});

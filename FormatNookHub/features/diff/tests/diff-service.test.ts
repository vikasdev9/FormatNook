import { describe, it, expect } from 'vitest';
import {
  computeDiff,
  tokenizeWords,
  tokenizeChars,
  normalizeToken,
  myersDiff,
  generateUnifiedDiff,
  DEFAULT_DIFF_OPTIONS,
} from '../services/diff-service';

describe('Diff Service - Myers Diff & Core Logic', () => {
  it('handles empty inputs', () => {
    const result = computeDiff('', '');
    expect(result.isEmpty).toBe(true);
    expect(result.isIdentical).toBe(true);
    expect(result.statistics.totalLines).toBe(0);
    expect(result.statistics.addedLines).toBe(0);
    expect(result.statistics.removedLines).toBe(0);
    expect(result.statistics.modifiedLines).toBe(0);
    expect(result.statistics.differencePercentage).toBe(0);
    expect(result.lines).toHaveLength(0);
  });

  it('handles identical text with no differences found', () => {
    const text = 'line one\nline two\nline three';
    const result = computeDiff(text, text);
    expect(result.isIdentical).toBe(true);
    expect(result.isEmpty).toBe(false);
    expect(result.statistics.addedLines).toBe(0);
    expect(result.statistics.removedLines).toBe(0);
    expect(result.statistics.modifiedLines).toBe(0);
    expect(result.statistics.unchangedLines).toBe(3);
    expect(result.statistics.differencePercentage).toBe(0);
    expect(result.lines.every((l) => l.type === 'equal')).toBe(true);
  });

  it('detects added lines correctly', () => {
    const original = 'first line\nsecond line';
    const modified = 'first line\nnew middle line\nsecond line';
    const result = computeDiff(original, modified);

    expect(result.isIdentical).toBe(false);
    expect(result.statistics.addedLines).toBe(1);
    expect(result.statistics.removedLines).toBe(0);
    const added = result.lines.find((l) => l.type === 'insert');
    expect(added).toBeDefined();
    expect(added?.modifiedContent).toBe('new middle line');
  });

  it('detects removed lines correctly', () => {
    const original = 'alpha\nbeta\ngamma';
    const modified = 'alpha\ngamma';
    const result = computeDiff(original, modified);

    expect(result.isIdentical).toBe(false);
    expect(result.statistics.removedLines).toBe(1);
    expect(result.statistics.addedLines).toBe(0);
    const removed = result.lines.find((l) => l.type === 'delete');
    expect(removed).toBeDefined();
    expect(removed?.originalContent).toBe('beta');
  });

  it('identifies modified lines with within-line word highlights', () => {
    const original = 'The quick brown fox';
    const modified = 'The fast brown fox';
    const result = computeDiff(original, modified);

    expect(result.isIdentical).toBe(false);
    expect(result.statistics.modifiedLines).toBe(1);
    const modifiedLine = result.lines[0];
    expect(modifiedLine.type).toBe('modify');
    expect(modifiedLine.originalContent).toBe(original);
    expect(modifiedLine.modifiedContent).toBe(modified);

    // Verify sub-word highlight tokens
    const deletedWord = modifiedLine.originalTokens?.find((t) => t.type === 'delete');
    const insertedWord = modifiedLine.modifiedTokens?.find((t) => t.type === 'insert');
    expect(deletedWord?.text).toBe('quick');
    expect(insertedWord?.text).toBe('fast');
  });

  it('supports word-level granularity comparison', () => {
    const original = 'apple banana cherry';
    const modified = 'apple orange cherry';
    const result = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      granularity: 'word',
    });

    expect(result.isIdentical).toBe(false);
    expect(result.statistics.addedLines).toBeGreaterThan(0);
    expect(result.statistics.removedLines).toBeGreaterThan(0);
  });

  it('supports character-level granularity comparison', () => {
    const original = 'cat';
    const modified = 'car';
    const result = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      granularity: 'char',
    });

    expect(result.isIdentical).toBe(false);
    expect(result.statistics.totalLines).toBeGreaterThan(0);
  });

  it('handles ignoreCase option properly', () => {
    const original = 'Hello World';
    const modified = 'hello world';

    // Without ignoreCase
    const strictResult = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreCase: false,
    });
    expect(strictResult.isIdentical).toBe(false);

    // With ignoreCase
    const laxResult = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreCase: true,
    });
    expect(laxResult.isIdentical).toBe(true);
    expect(laxResult.statistics.unchangedLines).toBe(1);
  });

  it('handles ignoreWhitespace option properly', () => {
    const original = 'const   x   =   10;';
    const modified = 'const x = 10;';

    // Without ignoreWhitespace
    const strictResult = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreWhitespace: false,
    });
    expect(strictResult.isIdentical).toBe(false);

    // With ignoreWhitespace
    const laxResult = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreWhitespace: true,
    });
    expect(laxResult.isIdentical).toBe(true);
  });

  it('handles ignoreTrailingWhitespace option properly', () => {
    const original = 'hello world   \t';
    const modified = 'hello world';

    const strictResult = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreTrailingWhitespace: false,
    });
    expect(strictResult.isIdentical).toBe(false);

    const laxResult = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreTrailingWhitespace: true,
    });
    expect(laxResult.isIdentical).toBe(true);
  });

  it('handles ignoreBlankLines option properly', () => {
    const original = 'line one\n\nline two\n   \nline three';
    const modified = 'line one\nline two\nline three';

    const strictResult = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreBlankLines: false,
    });
    expect(strictResult.isIdentical).toBe(false);

    const laxResult = computeDiff(original, modified, {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreBlankLines: true,
    });
    expect(laxResult.isIdentical).toBe(true);
  });

  it('handles Unicode, emojis, and special characters correctly', () => {
    const original = '🚀 Launch version 1.0 — 日本語 & 💖';
    const modified = '🚀 Launch version 2.0 — 日本語 & 💖✨';
    const result = computeDiff(original, modified);

    expect(result.isIdentical).toBe(false);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].type).toBe('modify');
  });

  it('generates standard Unified Diff format text', () => {
    const original = 'item 1\nitem 2';
    const modified = 'item 1\nitem 2 updated';
    const result = computeDiff(original, modified);

    expect(result.unifiedDiffText).toContain('--- original.txt');
    expect(result.unifiedDiffText).toContain('+++ modified.txt');
    expect(result.unifiedDiffText).toContain(' item 1');
    expect(result.unifiedDiffText).toContain('-item 2');
    expect(result.unifiedDiffText).toContain('+item 2 updated');
  });

  it('computes difference percentage correctly', () => {
    const original = 'line 1\nline 2';
    const modified = 'line 1\nline 2';
    const resIdentical = computeDiff(original, modified);
    expect(resIdentical.statistics.differencePercentage).toBe(0);

    const completelyDifferent = computeDiff('a\nb', 'c\nd');
    expect(completelyDifferent.statistics.differencePercentage).toBe(100);
  });
});


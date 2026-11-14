import { describe, it, expect } from 'vitest';
import {
  computeVisibleLines,
  toggleLineFold,
  collapseAllLines,
  expandAllLines,
  foldLinesForLevel,
  tokenizeJsonLine,
  getTokenColor,
} from '../services/json-folding-controller';
import { computeFoldingRanges } from '../services/json-folding-service';
import { BUILT_IN_THEMES } from '../services/json-palette-service';

const SAMPLE_JSON = `{
  "app": "FormatNook",
  "developer": {
    "name": "Alex Mercer",
    "role": "Engineer"
  },
  "items": [
    "Keyboard",
    "Mouse"
  ],
  "active": true
}`;

describe('JSON Folding Controller', () => {
  const ranges = computeFoldingRanges(SAMPLE_JSON);
  const lines = SAMPLE_JSON.split('\n');

  it('detects all object and array ranges accurately', () => {
    expect(ranges.length).toBe(3);
    // Root object: lines 1 to 12
    expect(ranges[0].startLine).toBe(1);
    expect(ranges[0].endLine).toBe(12);
    expect(ranges[0].type).toBe('object');

    // Developer object: lines 3 to 6
    expect(ranges[1].startLine).toBe(3);
    expect(ranges[1].endLine).toBe(6);
    expect(ranges[1].type).toBe('object');
    expect(ranges[1].itemCount).toBe(2);

    // Items array: lines 7 to 10
    expect(ranges[2].startLine).toBe(7);
    expect(ranges[2].endLine).toBe(10);
    expect(ranges[2].type).toBe('array');
    expect(ranges[2].itemCount).toBe(2);
  });

  it('computes visible lines when nothing is folded', () => {
    const visible = computeVisibleLines(lines, ranges, new Set());
    expect(visible.length).toBe(lines.length);
    expect(visible[0].originalLineNumber).toBe(1);
    expect(visible[visible.length - 1].originalLineNumber).toBe(12);
    expect(visible.every((v) => !v.isCollapsed)).toBe(true);
  });

  it('collapses an individual nested object and hides inner lines', () => {
    // Collapse developer object on line 3
    const collapsed = toggleLineFold(new Set(), 3, ranges);
    expect(collapsed.has(3)).toBe(true);

    const visible = computeVisibleLines(lines, ranges, collapsed);
    // Lines 4, 5, 6 should be hidden!
    const lineNumbers = visible.map((v) => v.originalLineNumber);
    expect(lineNumbers).toEqual([1, 2, 3, 7, 8, 9, 10, 11, 12]);

    const line3 = visible.find((v) => v.originalLineNumber === 3)!;
    expect(line3.isCollapsed).toBe(true);
    expect(line3.summaryText).toContain('2 props');
    expect(line3.trailingComma).toBe(true);
  });

  it('collapses an individual nested array and hides inner lines', () => {
    // Collapse items array on line 7
    const collapsed = toggleLineFold(new Set(), 7, ranges);
    expect(collapsed.has(7)).toBe(true);

    const visible = computeVisibleLines(lines, ranges, collapsed);
    // Lines 8, 9, 10 should be hidden!
    const lineNumbers = visible.map((v) => v.originalLineNumber);
    expect(lineNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 11, 12]);

    const line7 = visible.find((v) => v.originalLineNumber === 7)!;
    expect(line7.isCollapsed).toBe(true);
    expect(line7.summaryText).toContain('2 items');
    expect(line7.trailingComma).toBe(true);
  });

  it('unfolds a previously collapsed node', () => {
    let collapsed = new Set([3]);
    collapsed = toggleLineFold(collapsed, 3, ranges);
    expect(collapsed.has(3)).toBe(false);

    const visible = computeVisibleLines(lines, ranges, collapsed);
    expect(visible.length).toBe(12);
  });

  it('supports collapseAll and expandAll', () => {
    const allCollapsed = collapseAllLines(ranges);
    expect(allCollapsed.has(1)).toBe(true);
    expect(allCollapsed.has(3)).toBe(true);
    expect(allCollapsed.has(7)).toBe(true);

    // When root (line 1) is collapsed, lines 2 to 12 are hidden!
    const visible = computeVisibleLines(lines, ranges, allCollapsed);
    expect(visible.length).toBe(1);
    expect(visible[0].originalLineNumber).toBe(1);
    expect(visible[0].isCollapsed).toBe(true);

    const allExpanded = expandAllLines();
    expect(allExpanded.size).toBe(0);
    const visibleExpanded = computeVisibleLines(lines, ranges, allExpanded);
    expect(visibleExpanded.length).toBe(12);
  });

  it('supports depth-based folding (Level 2 leaves Level 1 open)', () => {
    // Level 2 should fold depth >= 2 (developer on line 3, items on line 7)
    // while keeping Level 1 (root on line 1) expanded!
    const level2 = foldLinesForLevel(ranges, 2);
    expect(level2.has(1)).toBe(false);
    expect(level2.has(3)).toBe(true);
    expect(level2.has(7)).toBe(true);

    const visible = computeVisibleLines(lines, ranges, level2);
    const lineNumbers = visible.map((v) => v.originalLineNumber);
    expect(lineNumbers).toEqual([1, 2, 3, 7, 11, 12]);
  });

  it('tokenizes JSON lines accurately with palette colors', () => {
    const palette = BUILT_IN_THEMES[0].dark;
    const tokens = tokenizeJsonLine('  "name": "Alex Mercer",');

    expect(tokens.length).toBe(6);
    expect(tokens[0].type).toBe('whitespace');
    expect(tokens[1].type).toBe('key');
    expect(tokens[1].text).toBe('"name"');
    expect(tokens[2].type).toBe('punctuation'); // :
    expect(tokens[3].type).toBe('whitespace');
    expect(tokens[4].type).toBe('string');
    expect(tokens[4].text).toBe('"Alex Mercer"');
    expect(tokens[5].type).toBe('punctuation'); // ,

    expect(getTokenColor(tokens[1].type, tokens[1].text, palette)).toBe(palette.property);
    expect(getTokenColor(tokens[4].type, tokens[4].text, palette)).toBe(palette.string);
    expect(getTokenColor(tokens[2].type, tokens[2].text, palette)).toBe(palette.punctuation);
  });

  it('handles invalid JSON gracefully without throwing', () => {
    const invalidText = '{\n  "broken": unquoted,\n  "missingEnd": [1, 2';
    expect(() => {
      const brokenRanges = computeFoldingRanges(invalidText);
      const brokenLines = invalidText.split('\n');
      const visible = computeVisibleLines(brokenLines, brokenRanges, new Set([1]));
      expect(visible).toBeDefined();
    }).not.toThrow();
  });
});

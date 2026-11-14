import {
  JsonFoldingRange,
  computeFoldingRanges,
  getCollapsedSummary,
  getRangesToFoldForLevel,
} from './json-folding-service';
import { JsonColorPalette } from '../types/palette.types';

export interface VisibleLineInfo {
  originalLineNumber: number; // 1-based original line index
  text: string;
  isFoldStart: boolean;
  isCollapsed: boolean;
  range?: JsonFoldingRange;
  summaryText?: string;
  trailingComma: boolean;
  prefixText: string;
  closingDelimiter: string;
}

export interface JsonLineToken {
  type:
    | 'key'
    | 'string'
    | 'number'
    | 'boolean'
    | 'null'
    | 'bracket'
    | 'punctuation'
    | 'whitespace'
    | 'plain';
  text: string;
}

/**
 * Toggles a folding line in the active collapsed set.
 */
export function toggleLineFold(
  currentCollapsed: Set<number>,
  lineNo: number,
  ranges: JsonFoldingRange[]
): Set<number> {
  const next = new Set(currentCollapsed);
  const targetRange = ranges.find((r) => r.startLine === lineNo);
  if (!targetRange) return next;

  if (next.has(lineNo)) {
    next.delete(lineNo);
  } else {
    next.add(lineNo);
  }
  return next;
}

/**
 * Collapses all eligible object and array ranges.
 */
export function collapseAllLines(ranges: JsonFoldingRange[]): Set<number> {
  const next = new Set<number>();
  for (const r of ranges) {
    next.add(r.startLine);
  }
  return next;
}

/**
 * Expands all lines by returning an empty set.
 */
export function expandAllLines(): Set<number> {
  return new Set<number>();
}

/**
 * Computes collapsed lines for depth-based folding (Level 1 to 5).
 * Level 1 folds all ranges with depth >= 1.
 * Level 2 folds all ranges with depth >= 2 (leaving level 1 expanded).
 */
export function foldLinesForLevel(
  ranges: JsonFoldingRange[],
  targetLevel: number
): Set<number> {
  const eligible = getRangesToFoldForLevel(ranges, targetLevel);
  const next = new Set<number>();
  for (const r of eligible) {
    next.add(r.startLine);
  }
  return next;
}

/**
 * Computes visible lines and collapsed summaries without modifying the original text.
 * Preserves exact original line numbers and indentation.
 */
export function computeVisibleLines(
  lines: string[],
  ranges: JsonFoldingRange[],
  collapsedLines: Set<number>
): VisibleLineInfo[] {
  if (!lines || lines.length === 0) return [];

  // Map each startLine to its folding range
  const rangeByStartLine = new Map<number, JsonFoldingRange>();
  for (const r of ranges) {
    rangeByStartLine.set(r.startLine, r);
  }

  // Calculate hidden line numbers (lines inside any currently collapsed range)
  const hiddenLines = new Set<number>();
  for (const lineNo of collapsedLines) {
    const range = rangeByStartLine.get(lineNo);
    if (range) {
      for (let l = range.startLine + 1; l <= range.endLine; l++) {
        hiddenLines.add(l);
      }
    }
  }

  const result: VisibleLineInfo[] = [];

  for (let lineNo = 1; lineNo <= lines.length; lineNo++) {
    if (hiddenLines.has(lineNo)) {
      continue;
    }

    const text = lines[lineNo - 1] ?? '';
    const range = rangeByStartLine.get(lineNo);
    const isFoldStart = Boolean(range);
    const isCollapsed = Boolean(range && collapsedLines.has(lineNo));

    let summaryText = undefined;
    let trailingComma = false;
    let prefixText = text;
    let closingDelimiter = '';

    if (isCollapsed && range) {
      summaryText = getCollapsedSummary(range);
      const endLineText = lines[range.endLine - 1] ?? '';
      const trimmedEnd = endLineText.trim();
      trailingComma = trimmedEnd.endsWith(',');
      closingDelimiter = range.type === 'array' ? ']' : '}';

      // Isolate prefix up to the opening bracket/brace
      const openChar = range.type === 'array' ? '[' : '{';
      const openIdx = text.indexOf(openChar);
      if (openIdx !== -1) {
        prefixText = text.substring(0, openIdx + 1);
      }
    }

    result.push({
      originalLineNumber: lineNo,
      text,
      isFoldStart,
      isCollapsed,
      range,
      summaryText,
      trailingComma,
      prefixText,
      closingDelimiter,
    });
  }

  return result;
}

/**
 * Fast, lightweight regex tokenizer for a single JSON line.
 * Used for syntax highlighting in Standalone mode with the active color palette.
 */
export function tokenizeJsonLine(lineText: string): JsonLineToken[] {
  if (!lineText) return [];

  const tokens: JsonLineToken[] = [];
  let remaining = lineText;

  while (remaining.length > 0) {
    // 1. Whitespace
    const wsMatch = remaining.match(/^[ \t]+/);
    if (wsMatch) {
      tokens.push({ type: 'whitespace', text: wsMatch[0] });
      remaining = remaining.substring(wsMatch[0].length);
      continue;
    }

    // 2. Property Key: "key":
    const keyMatch = remaining.match(/^"((?:[^"\\]|\\.)*)"(?=\s*:)/);
    if (keyMatch) {
      tokens.push({ type: 'key', text: keyMatch[0] });
      remaining = remaining.substring(keyMatch[0].length);
      continue;
    }

    // 3. String value: "value"
    const strMatch = remaining.match(/^"((?:[^"\\]|\\.)*)"/);
    if (strMatch) {
      tokens.push({ type: 'string', text: strMatch[0] });
      remaining = remaining.substring(strMatch[0].length);
      continue;
    }

    // 4. Number
    const numMatch = remaining.match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/);
    if (numMatch) {
      tokens.push({ type: 'number', text: numMatch[0] });
      remaining = remaining.substring(numMatch[0].length);
      continue;
    }

    // 5. Boolean
    const boolMatch = remaining.match(/^(?:true|false)\b/);
    if (boolMatch) {
      tokens.push({ type: 'boolean', text: boolMatch[0] });
      remaining = remaining.substring(boolMatch[0].length);
      continue;
    }

    // 6. Null
    const nullMatch = remaining.match(/^null\b/);
    if (nullMatch) {
      tokens.push({ type: 'null', text: nullMatch[0] });
      remaining = remaining.substring(nullMatch[0].length);
      continue;
    }

    // 7. Brackets
    const bracketMatch = remaining.match(/^[{}[\]]/);
    if (bracketMatch) {
      tokens.push({ type: 'bracket', text: bracketMatch[0] });
      remaining = remaining.substring(bracketMatch[0].length);
      continue;
    }

    // 8. Colons & Commas
    const punctMatch = remaining.match(/^[:,]/);
    if (punctMatch) {
      tokens.push({ type: 'punctuation', text: punctMatch[0] });
      remaining = remaining.substring(punctMatch[0].length);
      continue;
    }

    // 9. Any other characters (comments, single char fallback)
    tokens.push({ type: 'plain', text: remaining[0] });
    remaining = remaining.substring(1);
  }

  return tokens;
}

/**
 * Maps a token type to the active palette hex color.
 */
export function getTokenColor(
  type: JsonLineToken['type'],
  tokenText: string,
  palette?: JsonColorPalette
): string | undefined {
  if (!palette) return undefined;

  switch (type) {
    case 'key':
      return palette.property;
    case 'string':
      return palette.string;
    case 'number':
      return palette.number;
    case 'boolean':
      return palette.boolean;
    case 'null':
      return palette.null;
    case 'bracket':
      return tokenText === '{' || tokenText === '}' ? palette.object : palette.array;
    case 'punctuation':
      return palette.punctuation;
    default:
      return undefined;
  }
}

import {
  DiffChange,
  DiffChangeType,
  DiffFormat,
  DiffGranularity,
  DiffLineItem,
  DiffOptions,
  DiffResultData,
  DiffStatistics,
  InlineDiffToken,
} from '../types/diff.types';
import { getEngine } from './engines';
import { DiffEngineResult } from './engines/types';
import { formatXml } from '@/features/xml/services/xml-service';
import { formatYaml } from '@/features/yaml/services/yaml-service';
import {
  formatHtml,
  formatCss,
  formatJavascript,
  formatSql,
} from '@/features/beautifiers/services/beautifier-service';

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreBlankLines: false,
  ignoreTrailingWhitespace: false,
  granularity: 'line',
  viewMode: 'side-by-side',
  format: 'auto',
  prettifyBeforeCompare: false,
  sortKeys: false,
};

/**
 * Tokenize a string into words, whitespace, and symbols.
 * Guarantees that tokens.join('') === text exactly.
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  // Match newlines, whitespace runs, alphanumeric word runs, or individual punctuation/symbols
  const matches = text.match(/\r\n|\r|\n|[^\S\r\n]+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu);
  return matches || [];
}

/**
 * Tokenize a string into characters, preserving Unicode surrogate pairs.
 */
export function tokenizeChars(text: string): string[] {
  if (!text) return [];
  return Array.from(text);
}

/**
 * Normalize a token or line according to comparison options.
 */
export function normalizeToken(
  token: string,
  options: Pick<DiffOptions, 'ignoreCase' | 'ignoreWhitespace' | 'ignoreTrailingWhitespace'>
): string {
  let result = token;

  if (options.ignoreTrailingWhitespace) {
    result = result.replace(/[ \t]+$/, '');
  }

  if (options.ignoreWhitespace) {
    // Collapse multiple whitespace characters into a single space and trim
    result = result.trim().replace(/\s+/g, ' ');
  }

  if (options.ignoreCase) {
    result = result.toLowerCase();
  }

  return result;
}

/**
 * Core Myers Diff Algorithm (1986).
 * Computes the Longest Common Subsequence and minimal edit script.
 * Includes prefix and suffix optimization for O(N) best-case performance.
 */
export function myersDiff<T>(
  a: T[],
  b: T[],
  equals: (x: T, y: T) => boolean = (x, y) => x === y
): DiffChange<T>[] {
  const n = a.length;
  const m = b.length;

  if (n === 0 && m === 0) return [];

  if (n === 0) {
    return b.map((val, idx) => ({ type: 'insert', value: val, newIndex: idx }));
  }

  if (m === 0) {
    return a.map((val, idx) => ({ type: 'delete', value: val, oldIndex: idx }));
  }

  // Optimization: Fast-forward common prefix
  let prefixCount = 0;
  while (prefixCount < n && prefixCount < m && equals(a[prefixCount], b[prefixCount])) {
    prefixCount++;
  }

  // Optimization: Fast-rewind common suffix
  let suffixCount = 0;
  while (
    suffixCount < n - prefixCount &&
    suffixCount < m - prefixCount &&
    equals(a[n - 1 - suffixCount], b[m - 1 - suffixCount])
  ) {
    suffixCount++;
  }

  const prefixEdits: DiffChange<T>[] = [];
  for (let i = 0; i < prefixCount; i++) {
    prefixEdits.push({ type: 'equal', value: a[i], oldIndex: i, newIndex: i });
  }

  const suffixEdits: DiffChange<T>[] = [];
  for (let i = 0; i < suffixCount; i++) {
    const aIdx = n - suffixCount + i;
    const bIdx = m - suffixCount + i;
    suffixEdits.push({ type: 'equal', value: a[aIdx], oldIndex: aIdx, newIndex: bIdx });
  }

  const trimmedA = a.slice(prefixCount, n - suffixCount);
  const trimmedB = b.slice(prefixCount, m - suffixCount);

  let middleEdits: DiffChange<T>[] = [];

  if (trimmedA.length === 0 && trimmedB.length === 0) {
    middleEdits = [];
  } else if (trimmedA.length === 0) {
    middleEdits = trimmedB.map((val, idx) => ({
      type: 'insert',
      value: val,
      newIndex: prefixCount + idx,
    }));
  } else if (trimmedB.length === 0) {
    middleEdits = trimmedA.map((val, idx) => ({
      type: 'delete',
      value: val,
      oldIndex: prefixCount + idx,
    }));
  } else {
    middleEdits = runMyersCore(trimmedA, trimmedB, equals, prefixCount);
  }

  return [...prefixEdits, ...middleEdits, ...suffixEdits];
}

/**
 * Inner Myers solver for trimmed sequences.
 */
function runMyersCore<T>(
  a: T[],
  b: T[],
  equals: (x: T, y: T) => boolean,
  offsetA: number
): DiffChange<T>[] {
  const n = a.length;
  const m = b.length;
  const max = n + m;

  // Offset array for diagonal k in [-max .. max]
  const vSize = 2 * max + 3;
  const vOffset = max + 1;
  const v = new Int32Array(vSize);
  v[vOffset + 1] = 0;

  const trace: Int32Array[] = [];

  let foundD = -1;

  for (let d = 0; d <= max; d++) {
    const vSnapshot = new Int32Array(v);
    trace.push(vSnapshot);

    for (let k = -d; k <= d; k += 2) {
      const kIndex = vOffset + k;
      let x: number;

      if (k === -d || (k !== d && v[kIndex - 1] < v[kIndex + 1])) {
        x = v[kIndex + 1];
      } else {
        x = v[kIndex - 1] + 1;
      }

      let y = x - k;

      while (x < n && y < m && equals(a[x], b[y])) {
        x++;
        y++;
      }

      v[kIndex] = x;

      if (x >= n && y >= m) {
        foundD = d;
        break;
      }
    }

    if (foundD !== -1) break;
  }

  // Backtrack to assemble edit path
  const edits: DiffChange<T>[] = [];
  let currX = n;
  let currY = m;

  for (let d = trace.length - 1; d > 0; d--) {
    const vSnap = trace[d];
    const k = currX - currY;
    const kIndex = vOffset + k;

    let prevK: number;
    if (k === -d || (k !== d && vSnap[kIndex - 1] < vSnap[kIndex + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = vSnap[vOffset + prevK];
    const prevY = prevX - prevK;

    while (currX > prevX && currY > prevY) {
      edits.unshift({
        type: 'equal',
        value: a[currX - 1],
        oldIndex: offsetA + currX - 1,
        newIndex: offsetA + currY - 1,
      });
      currX--;
      currY--;
    }

    if (currX === prevX) {
      edits.unshift({
        type: 'insert',
        value: b[currY - 1],
        newIndex: offsetA + currY - 1,
      });
      currY--;
    } else {
      edits.unshift({
        type: 'delete',
        value: a[currX - 1],
        oldIndex: offsetA + currX - 1,
      });
      currX--;
    }
  }

  while (currX > 0 && currY > 0) {
    edits.unshift({
      type: 'equal',
      value: a[currX - 1],
      oldIndex: offsetA + currX - 1,
      newIndex: offsetA + currY - 1,
    });
    currX--;
    currY--;
  }

  return edits;
}

/**
 * Compute within-line word-level differences between two strings.
 */
export function computeInlineDiff(
  originalStr: string,
  modifiedStr: string,
  options: Pick<DiffOptions, 'ignoreCase' | 'ignoreWhitespace'> & { ignoreTrailingWhitespace?: boolean }
): { originalTokens: InlineDiffToken[]; modifiedTokens: InlineDiffToken[] } {
  const origTokens = tokenizeWords(originalStr);
  const modTokens = tokenizeWords(modifiedStr);
  const normalizedOpts = {
    ignoreCase: options.ignoreCase,
    ignoreWhitespace: options.ignoreWhitespace,
    ignoreTrailingWhitespace: options.ignoreTrailingWhitespace ?? false,
  };

  const edits = myersDiff(origTokens, modTokens, (a, b) => {
    return normalizeToken(a, normalizedOpts) === normalizeToken(b, normalizedOpts);
  });

  const originalTokens: InlineDiffToken[] = [];
  const modifiedTokens: InlineDiffToken[] = [];

  for (const edit of edits) {
    if (edit.type === 'equal') {
      originalTokens.push({ type: 'equal', text: edit.value });
      modifiedTokens.push({ type: 'equal', text: edit.value });
    } else if (edit.type === 'delete') {
      originalTokens.push({ type: 'delete', text: edit.value });
    } else if (edit.type === 'insert') {
      modifiedTokens.push({ type: 'insert', text: edit.value });
    }
  }

  return { originalTokens, modifiedTokens };
}

/**
 * Split text into lines, keeping track of original text.
 */
function splitLines(text: string): string[] {
  if (!text) return [];
  // Normalize \r\n and \r to \n before splitting
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

/**
 * Filter blank lines if ignoreBlankLines option is set.
 */
interface IndexedLine {
  line: string;
  originalIndex: number;
}

function prepareLines(lines: string[], ignoreBlankLines: boolean): IndexedLine[] {
  const result: IndexedLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ignoreBlankLines && line.trim() === '') {
      continue;
    }
    result.push({ line, originalIndex: i + 1 });
  }
  return result;
}

/**
 * Detect the content format (JSON, XML, YAML, HTML, CSS, JavaScript, SQL, or plain text).
 */
export function detectFormat(text: string): DiffFormat {
  if (!text || !text.trim()) return 'text';
  const trimmed = text.trim();

  // JSON detection
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue checks
    }
  }

  // HTML / XML detection
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    if (
      /<!DOCTYPE\s+html/i.test(trimmed) ||
      /<html[\s>]/i.test(trimmed) ||
      /<body[\s>]/i.test(trimmed)
    ) {
      return 'html';
    }
    if (/<\?xml/i.test(trimmed) || /<[a-zA-Z0-9_:-]+[\s>]/.test(trimmed)) {
      return 'xml';
    }
  }

  // SQL detection
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(trimmed)) {
    return 'sql';
  }

  // YAML detection
  if (trimmed.startsWith('---') || (/^[\w.-]+:\s*.+$/m.test(trimmed) && !trimmed.includes('{'))) {
    return 'yaml';
  }

  // CSS detection
  if (/^[.#a-zA-Z0-9_\s,-]+{\s*[\w-]+:\s*[^}]+;?\s*}/m.test(trimmed)) {
    return 'css';
  }

  // JavaScript detection
  if (/\b(function|const|let|var|import|export|class)\b/.test(trimmed)) {
    return 'javascript';
  }

  return 'text';
}

/**
 * Recursively sort keys of an object alphabetically.
 */
export function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort();
    const result: Record<string, any> = {};
    for (const key of sortedKeys) {
      result[key] = sortObjectKeys(obj[key]);
    }
    return result;
  }
  return obj;
}

/**
 * Pre-process and normalize content according to selected format and options.
 */
export function preprocessContent(
  text: string,
  format: DiffFormat,
  options: Pick<DiffOptions, 'prettifyBeforeCompare' | 'sortKeys'>
): { text: string; warning?: string } {
  if (!text || !text.trim() || format === 'text') {
    return { text };
  }

  try {
    if (format === 'json') {
      try {
        let parsed = JSON.parse(text);
        if (options.sortKeys) {
          parsed = sortObjectKeys(parsed);
        }
        if (options.prettifyBeforeCompare || options.sortKeys) {
          return { text: JSON.stringify(parsed, null, 2) };
        }
      } catch (err: any) {
        return { text, warning: 'Invalid JSON: ' + (err?.message || 'Parse error') };
      }
    }

    if (format === 'xml' && options.prettifyBeforeCompare) {
      const res = formatXml(text, '2');
      if (res.isValid) return { text: res.output };
      return { text, warning: res.issues[0]?.message || 'XML syntax warning' };
    }

    if (format === 'yaml' && (options.prettifyBeforeCompare || options.sortKeys)) {
      const res = formatYaml(text, '2');
      if (res.isValid) return { text: res.output };
      return { text, warning: res.issues[0]?.message || 'YAML syntax warning' };
    }

    if (options.prettifyBeforeCompare) {
      if (format === 'html') {
        const res = formatHtml(text, '2');
        return { text: res.output };
      }
      if (format === 'css') {
        const res = formatCss(text, '2');
        return { text: res.output };
      }
      if (format === 'javascript') {
        const res = formatJavascript(text, '2');
        return { text: res.output };
      }
      if (format === 'sql') {
        const res = formatSql(text, '2');
        return { text: res.output };
      }
    }
  } catch (err: any) {
    return { text, warning: 'Formatting error: ' + (err?.message || 'failed to format') };
  }

  return { text };
}

/**
 * Low-level text comparison runner across granularities without engine dispatch.
 */
export function computeRawTextDiff(
  originalText: string,
  modifiedText: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS
): DiffResultData {
  const isEmpty = originalText.length === 0 && modifiedText.length === 0;

  if (isEmpty) {
    return {
      lines: [],
      statistics: {
        totalLines: 0,
        addedLines: 0,
        removedLines: 0,
        modifiedLines: 0,
        unchangedLines: 0,
        differencePercentage: 0,
      },
      isIdentical: true,
      isEmpty: true,
      unifiedDiffText: '',
      detectedFormat: 'text',
    };
  }

  let result: DiffResultData;
  if (options.granularity === 'word') {
    result = computeWordGranularityDiff(originalText, modifiedText, options);
  } else if (options.granularity === 'char') {
    result = computeCharGranularityDiff(originalText, modifiedText, options);
  } else {
    result = computeLineGranularityDiff(originalText, modifiedText, options);
  }

  return {
    ...result,
    detectedFormat: options.format === 'auto' ? 'text' : options.format,
  };
}

/**
 * Main Diff Computation function with Universal Multi-Format engine dispatch.
 */
export function computeDiff(
  originalText: string,
  modifiedText: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS
): DiffEngineResult {
  const isEmpty = originalText.length === 0 && modifiedText.length === 0;

  if (isEmpty) {
    return {
      lines: [],
      statistics: {
        totalLines: 0,
        addedLines: 0,
        removedLines: 0,
        modifiedLines: 0,
        unchangedLines: 0,
        differencePercentage: 0,
      },
      isIdentical: true,
      isEmpty: true,
      unifiedDiffText: '',
      detectedFormat: 'text',
      format: 'text',
      isValid: { original: true, modified: true },
      errors: {},
    };
  }

  // Format detection and normalization
  const effectiveFormat: DiffFormat =
    options.format === 'auto'
      ? (detectFormat(originalText) !== 'text'
          ? detectFormat(originalText)
          : detectFormat(modifiedText))
      : options.format;

  const engine = getEngine(effectiveFormat);
  return engine.compare({
    originalText,
    modifiedText,
    options: {
      ...options,
      format: effectiveFormat,
    },
  });
}

/**
 * Line-level Diff Computation with word-level highlight within modified lines.
 */
function computeLineGranularityDiff(
  originalText: string,
  modifiedText: string,
  options: DiffOptions
): DiffResultData {
  const origRawLines = splitLines(originalText);
  const modRawLines = splitLines(modifiedText);

  const origIndexed = prepareLines(origRawLines, options.ignoreBlankLines);
  const modIndexed = prepareLines(modRawLines, options.ignoreBlankLines);

  const edits = myersDiff(origIndexed, modIndexed, (a, b) => {
    return normalizeToken(a.line, options) === normalizeToken(b.line, options);
  });

  const diffLines: DiffLineItem[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let unchangedCount = 0;

  let i = 0;
  while (i < edits.length) {
    const edit = edits[i];

    if (edit.type === 'equal') {
      unchangedCount++;
      diffLines.push({
        id: `eq-${i}`,
        type: 'equal',
        originalLineNumber: edit.value.originalIndex,
        modifiedLineNumber: (edits[i] as DiffChange<IndexedLine>).value.originalIndex,
        originalContent: edit.value.line,
        modifiedContent: edit.value.line,
        originalTokens: [{ type: 'equal', text: edit.value.line }],
        modifiedTokens: [{ type: 'equal', text: edit.value.line }],
        inlineTokens: [{ type: 'equal', text: edit.value.line }],
      });
      i++;
      continue;
    }

    // Collect contiguous deletes and inserts to pair them into modify lines
    const deletes: DiffChange<IndexedLine>[] = [];
    const inserts: DiffChange<IndexedLine>[] = [];

    while (i < edits.length && edits[i].type === 'delete') {
      deletes.push(edits[i]);
      i++;
    }

    while (i < edits.length && edits[i].type === 'insert') {
      inserts.push(edits[i]);
      i++;
    }

    // Pair up deletes and inserts as 'modify' lines
    const minPairs = Math.min(deletes.length, inserts.length);

    for (let p = 0; p < minPairs; p++) {
      const delItem = deletes[p];
      const insItem = inserts[p];
      modifiedCount++;

      const inlineDiff = computeInlineDiff(delItem.value.line, insItem.value.line, options);

      diffLines.push({
        id: `mod-${p}-${delItem.value.originalIndex}-${insItem.value.originalIndex}`,
        type: 'modify',
        originalLineNumber: delItem.value.originalIndex,
        modifiedLineNumber: insItem.value.originalIndex,
        originalContent: delItem.value.line,
        modifiedContent: insItem.value.line,
        originalTokens: inlineDiff.originalTokens,
        modifiedTokens: inlineDiff.modifiedTokens,
        inlineTokens: [
          ...inlineDiff.originalTokens.filter((t) => t.type !== 'equal').map((t) => ({ ...t, type: 'delete' as DiffChangeType })),
          ...inlineDiff.modifiedTokens.filter((t) => t.type !== 'equal').map((t) => ({ ...t, type: 'insert' as DiffChangeType })),
        ],
      });
    }

    // Remaining unpaired deletes
    for (let p = minPairs; p < deletes.length; p++) {
      const delItem = deletes[p];
      removedCount++;
      diffLines.push({
        id: `del-${delItem.value.originalIndex}`,
        type: 'delete',
        originalLineNumber: delItem.value.originalIndex,
        originalContent: delItem.value.line,
        originalTokens: [{ type: 'delete', text: delItem.value.line }],
        inlineTokens: [{ type: 'delete', text: delItem.value.line }],
      });
    }

    // Remaining unpaired inserts
    for (let p = minPairs; p < inserts.length; p++) {
      const insItem = inserts[p];
      addedCount++;
      diffLines.push({
        id: `ins-${insItem.value.originalIndex}`,
        type: 'insert',
        modifiedLineNumber: insItem.value.originalIndex,
        modifiedContent: insItem.value.line,
        modifiedTokens: [{ type: 'insert', text: insItem.value.line }],
        inlineTokens: [{ type: 'insert', text: insItem.value.line }],
      });
    }
  }

  const totalLines = diffLines.length;
  const changes = addedCount + removedCount + modifiedCount;
  const differencePercentage =
    totalLines > 0 ? Math.min(100, Math.round((changes / totalLines) * 1000) / 10) : 0;

  const isIdentical = changes === 0;
  const unifiedDiffText = generateUnifiedDiff(diffLines, 'original.txt', 'modified.txt');

  return {
    lines: diffLines,
    statistics: {
      totalLines,
      addedLines: addedCount,
      removedLines: removedCount,
      modifiedLines: modifiedCount,
      unchangedLines: unchangedCount,
      differencePercentage,
    },
    isIdentical,
    isEmpty: false,
    unifiedDiffText,
  };
}

/**
 * Word-level Diff Computation.
 */
function computeWordGranularityDiff(
  originalText: string,
  modifiedText: string,
  options: DiffOptions
): DiffResultData {
  const origTokens = tokenizeWords(originalText);
  const modTokens = tokenizeWords(modifiedText);

  const edits = myersDiff(origTokens, modTokens, (a, b) => {
    return normalizeToken(a, options) === normalizeToken(b, options);
  });

  // Reconstruct into lines
  const diffLines: DiffLineItem[] = [];
  let currentOriginalTokens: InlineDiffToken[] = [];
  let currentModifiedTokens: InlineDiffToken[] = [];
  let origLineNum = 1;
  let modLineNum = 1;
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  const flushLine = () => {
    const hasAdded = currentModifiedTokens.some((t) => t.type === 'insert');
    const hasRemoved = currentOriginalTokens.some((t) => t.type === 'delete');
    const origText = currentOriginalTokens.map((t) => t.text).join('');
    const modText = currentModifiedTokens.map((t) => t.text).join('');

    let type: DiffLineItem['type'] = 'equal';
    if (hasAdded && hasRemoved) {
      type = 'modify';
    } else if (hasAdded) {
      type = 'insert';
    } else if (hasRemoved) {
      type = 'delete';
    }

    if (type === 'equal') unchangedCount++;
    else if (type === 'insert') addedCount++;
    else if (type === 'delete') removedCount++;
    else if (type === 'modify') {
      addedCount++;
      removedCount++;
    }

    diffLines.push({
      id: `wline-${diffLines.length + 1}`,
      type,
      originalLineNumber: currentOriginalTokens.length > 0 ? origLineNum : undefined,
      modifiedLineNumber: currentModifiedTokens.length > 0 ? modLineNum : undefined,
      originalContent: origText,
      modifiedContent: modText,
      originalTokens: [...currentOriginalTokens],
      modifiedTokens: [...currentModifiedTokens],
      inlineTokens: [
        ...currentOriginalTokens.filter((t) => t.type !== 'equal'),
        ...currentModifiedTokens.filter((t) => t.type !== 'equal'),
      ],
    });

    if (currentOriginalTokens.length > 0) origLineNum++;
    if (currentModifiedTokens.length > 0) modLineNum++;

    currentOriginalTokens = [];
    currentModifiedTokens = [];
  };

  for (const edit of edits) {
    const isNewline = edit.value.includes('\n');

    if (edit.type === 'equal') {
      if (isNewline) {
        const parts = edit.value.split('\n');
        for (let p = 0; p < parts.length; p++) {
          if (parts[p]) {
            currentOriginalTokens.push({ type: 'equal', text: parts[p] });
            currentModifiedTokens.push({ type: 'equal', text: parts[p] });
          }
          if (p < parts.length - 1) {
            flushLine();
          }
        }
      } else {
        currentOriginalTokens.push({ type: 'equal', text: edit.value });
        currentModifiedTokens.push({ type: 'equal', text: edit.value });
      }
    } else if (edit.type === 'delete') {
      if (isNewline) {
        const parts = edit.value.split('\n');
        for (let p = 0; p < parts.length; p++) {
          if (parts[p]) {
            currentOriginalTokens.push({ type: 'delete', text: parts[p] });
          }
          if (p < parts.length - 1) {
            flushLine();
          }
        }
      } else {
        currentOriginalTokens.push({ type: 'delete', text: edit.value });
      }
    } else if (edit.type === 'insert') {
      if (isNewline) {
        const parts = edit.value.split('\n');
        for (let p = 0; p < parts.length; p++) {
          if (parts[p]) {
            currentModifiedTokens.push({ type: 'insert', text: parts[p] });
          }
          if (p < parts.length - 1) {
            flushLine();
          }
        }
      } else {
        currentModifiedTokens.push({ type: 'insert', text: edit.value });
      }
    }
  }

  if (currentOriginalTokens.length > 0 || currentModifiedTokens.length > 0) {
    flushLine();
  }

  const totalLines = diffLines.length;
  const changes = addedCount + removedCount;
  const differencePercentage =
    totalLines > 0 ? Math.min(100, Math.round((changes / totalLines) * 1000) / 10) : 0;
  const isIdentical = changes === 0;

  return {
    lines: diffLines,
    statistics: {
      totalLines,
      addedLines: addedCount,
      removedLines: removedCount,
      modifiedLines: 0,
      unchangedLines: unchangedCount,
      differencePercentage,
    },
    isIdentical,
    isEmpty: false,
    unifiedDiffText: generateUnifiedDiff(diffLines, 'original.txt', 'modified.txt'),
  };
}

/**
 * Character-level Diff Computation.
 */
function computeCharGranularityDiff(
  originalText: string,
  modifiedText: string,
  options: DiffOptions
): DiffResultData {
  const origChars = tokenizeChars(originalText);
  const modChars = tokenizeChars(modifiedText);

  const edits = myersDiff(origChars, modChars, (a, b) => {
    return normalizeToken(a, options) === normalizeToken(b, options);
  });

  const diffLines: DiffLineItem[] = [];
  let currentOriginalTokens: InlineDiffToken[] = [];
  let currentModifiedTokens: InlineDiffToken[] = [];
  let origLineNum = 1;
  let modLineNum = 1;
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  const flushLine = () => {
    const hasAdded = currentModifiedTokens.some((t) => t.type === 'insert');
    const hasRemoved = currentOriginalTokens.some((t) => t.type === 'delete');
    const origText = currentOriginalTokens.map((t) => t.text).join('');
    const modText = currentModifiedTokens.map((t) => t.text).join('');

    let type: DiffLineItem['type'] = 'equal';
    if (hasAdded && hasRemoved) type = 'modify';
    else if (hasAdded) type = 'insert';
    else if (hasRemoved) type = 'delete';

    if (type === 'equal') unchangedCount++;
    else if (type === 'insert') addedCount++;
    else if (type === 'delete') removedCount++;
    else if (type === 'modify') {
      addedCount++;
      removedCount++;
    }

    diffLines.push({
      id: `cline-${diffLines.length + 1}`,
      type,
      originalLineNumber: currentOriginalTokens.length > 0 ? origLineNum : undefined,
      modifiedLineNumber: currentModifiedTokens.length > 0 ? modLineNum : undefined,
      originalContent: origText,
      modifiedContent: modText,
      originalTokens: [...currentOriginalTokens],
      modifiedTokens: [...currentModifiedTokens],
      inlineTokens: [
        ...currentOriginalTokens.filter((t) => t.type !== 'equal'),
        ...currentModifiedTokens.filter((t) => t.type !== 'equal'),
      ],
    });

    if (currentOriginalTokens.length > 0) origLineNum++;
    if (currentModifiedTokens.length > 0) modLineNum++;

    currentOriginalTokens = [];
    currentModifiedTokens = [];
  };

  for (const edit of edits) {
    if (edit.type === 'equal') {
      if (edit.value === '\n') {
        flushLine();
      } else if (edit.value !== '\r') {
        currentOriginalTokens.push({ type: 'equal', text: edit.value });
        currentModifiedTokens.push({ type: 'equal', text: edit.value });
      }
    } else if (edit.type === 'delete') {
      if (edit.value === '\n') {
        flushLine();
      } else if (edit.value !== '\r') {
        currentOriginalTokens.push({ type: 'delete', text: edit.value });
      }
    } else if (edit.type === 'insert') {
      if (edit.value === '\n') {
        flushLine();
      } else if (edit.value !== '\r') {
        currentModifiedTokens.push({ type: 'insert', text: edit.value });
      }
    }
  }

  if (currentOriginalTokens.length > 0 || currentModifiedTokens.length > 0) {
    flushLine();
  }

  const totalLines = diffLines.length;
  const changes = addedCount + removedCount;
  const differencePercentage =
    totalLines > 0 ? Math.min(100, Math.round((changes / totalLines) * 1000) / 10) : 0;
  const isIdentical = changes === 0;

  return {
    lines: diffLines,
    statistics: {
      totalLines,
      addedLines: addedCount,
      removedLines: removedCount,
      modifiedLines: 0,
      unchangedLines: unchangedCount,
      differencePercentage,
    },
    isIdentical,
    isEmpty: false,
    unifiedDiffText: generateUnifiedDiff(diffLines, 'original.txt', 'modified.txt'),
  };
}

/**
 * Generate standard Unified Diff format text.
 */
export function generateUnifiedDiff(
  lines: DiffLineItem[],
  oldFileName = 'original.txt',
  newFileName = 'modified.txt'
): string {
  if (lines.length === 0) return '';

  const header = `--- ${oldFileName}\n+++ ${newFileName}\n@@ -1,${lines.length} +1,${lines.length} @@\n`;
  const body = lines
    .map((line) => {
      switch (line.type) {
        case 'equal':
          return ` ${line.originalContent ?? ''}`;
        case 'delete':
          return `-${line.originalContent ?? ''}`;
        case 'insert':
          return `+${line.modifiedContent ?? ''}`;
        case 'modify':
          return `-${line.originalContent ?? ''}\n+${line.modifiedContent ?? ''}`;
        default:
          return '';
      }
    })
    .join('\n');

  return header + body;
}

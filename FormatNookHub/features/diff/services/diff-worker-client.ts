/**
 * Diff Web Worker Client
 * FormatNook Hub - Universal Client-Side Developer Platform
 *
 * Offloads expensive Myers diff algorithm computation to a background Web Worker
 * to maintain 60fps UI responsiveness on large or adversarial inputs.
 */

import { DiffOptions, DiffResultData } from '../types/diff.types';
import { DiffEngineResult } from './engines/types';
import { computeDiff, DEFAULT_DIFF_OPTIONS } from './diff-service';

export interface WorkerJobResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  executionTimeMs: number;
}

const DIFF_WORKER_SCRIPT = `
self.onmessage = function(e) {
  const { id, action, payload } = e.data;
  const start = performance.now();

  try {
    if (action === 'diff') {
      const { originalText, modifiedText, options } = payload;
      const result = computeRawWorkerDiff(originalText || '', modifiedText || '', options || {});
      self.postMessage({
        id,
        success: true,
        data: result,
        executionTimeMs: Math.round(performance.now() - start),
      });
    } else {
      self.postMessage({ id, success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    self.postMessage({
      id,
      success: false,
      error: err && err.message ? err.message : 'Diff worker error',
    });
  }
};

function tokenizeWords(text) {
  if (!text) return [];
  const matches = text.match(/\\r\\n|\\r|\\n|[^\\S\\r\\n]+|[\\p{L}\\p{N}_]+|[^\\s\\p{L}\\p{N}_]/gu);
  return matches || [];
}

function tokenizeChars(text) {
  if (!text) return [];
  return Array.from(text);
}

function normalizeToken(token, options) {
  let result = token;
  if (options.ignoreTrailingWhitespace) {
    result = result.replace(/[ \\t]+$/, '');
  }
  if (options.ignoreWhitespace) {
    result = result.trim().replace(/\\s+/g, ' ');
  }
  if (options.ignoreCase) {
    result = result.toLowerCase();
  }
  return result;
}

function splitLines(text) {
  if (!text) return [];
  return text.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n').split('\\n');
}

function prepareLines(lines, ignoreBlankLines) {
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ignoreBlankLines && line.trim() === '') {
      continue;
    }
    result.push({ line, originalIndex: i + 1 });
  }
  return result;
}

function myersDiff(a, b, equals) {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [];
  if (n === 0) return b.map((val, idx) => ({ type: 'insert', value: val, newIndex: idx }));
  if (m === 0) return a.map((val, idx) => ({ type: 'delete', value: val, oldIndex: idx }));

  let prefixCount = 0;
  while (prefixCount < n && prefixCount < m && equals(a[prefixCount], b[prefixCount])) {
    prefixCount++;
  }

  let suffixCount = 0;
  while (
    suffixCount < n - prefixCount &&
    suffixCount < m - prefixCount &&
    equals(a[n - 1 - suffixCount], b[m - 1 - suffixCount])
  ) {
    suffixCount++;
  }

  const prefixEdits = [];
  for (let i = 0; i < prefixCount; i++) {
    prefixEdits.push({ type: 'equal', value: a[i], oldIndex: i, newIndex: i });
  }

  const suffixEdits = [];
  for (let i = 0; i < suffixCount; i++) {
    const oldIdx = n - suffixCount + i;
    const newIdx = m - suffixCount + i;
    suffixEdits.push({ type: 'equal', value: a[oldIdx], oldIndex: oldIdx, newIndex: newIdx });
  }

  let middleEdits = [];
  const trimmedA = a.slice(prefixCount, n - suffixCount);
  const trimmedB = b.slice(prefixCount, m - suffixCount);

  if (trimmedA.length > 0 || trimmedB.length > 0) {
    middleEdits = runMyersCore(trimmedA, trimmedB, equals, prefixCount);
  }

  return [...prefixEdits, ...middleEdits, ...suffixEdits];
}

function runMyersCore(a, b, equals, offsetA) {
  const n = a.length;
  const m = b.length;
  const max = n + m;

  const vSize = 2 * max + 3;
  const vOffset = max + 1;
  const v = new Int32Array(vSize);
  v[vOffset + 1] = 0;

  const trace = [];
  let foundD = -1;

  for (let d = 0; d <= max; d++) {
    // 2,000-step ceiling bailout to prevent browser heap exhaustion on adversarial inputs
    if (d >= 2000) {
      return [
        ...a.map((val, idx) => ({ type: 'delete', value: val, oldIndex: offsetA + idx })),
        ...b.map((val, idx) => ({ type: 'insert', value: val, newIndex: offsetA + idx })),
      ];
    }

    const vSnapshot = new Int32Array(v);
    trace.push(vSnapshot);

    for (let k = -d; k <= d; k += 2) {
      const kIndex = vOffset + k;
      let x = (k === -d || (k !== d && v[kIndex - 1] < v[kIndex + 1]))
        ? v[kIndex + 1]
        : v[kIndex - 1] + 1;
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

  const edits = [];
  let currX = n;
  let currY = m;

  for (let d = trace.length - 1; d > 0; d--) {
    const vSnap = trace[d];
    const k = currX - currY;
    const kIndex = vOffset + k;
    const prevK = (k === -d || (k !== d && vSnap[kIndex - 1] < vSnap[kIndex + 1])) ? k + 1 : k - 1;
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

function computeInlineDiff(originalStr, modifiedStr, options) {
  const origTokens = tokenizeWords(originalStr);
  const modTokens = tokenizeWords(modifiedStr);
  const normalizedOpts = {
    ignoreCase: options.ignoreCase,
    ignoreWhitespace: options.ignoreWhitespace,
    ignoreTrailingWhitespace: options.ignoreTrailingWhitespace || false,
  };

  const edits = myersDiff(origTokens, modTokens, (a, b) => {
    return normalizeToken(a, normalizedOpts) === normalizeToken(b, normalizedOpts);
  });

  const originalTokens = [];
  const modifiedTokens = [];

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

function generateUnifiedDiff(lines, oldFileName = 'original.txt', newFileName = 'modified.txt') {
  if (lines.length === 0) return '';
  const header = '--- ' + oldFileName + '\\n+++ ' + newFileName + '\\n@@ -1,' + lines.length + ' +1,' + lines.length + ' @@\\n';
  const body = lines
    .map((line) => {
      switch (line.type) {
        case 'equal': return ' ' + (line.originalContent || '');
        case 'delete': return '-' + (line.originalContent || '');
        case 'insert': return '+' + (line.modifiedContent || '');
        case 'modify': return '-' + (line.originalContent || '') + '\\n+' + (line.modifiedContent || '');
        default: return '';
      }
    })
    .join('\\n');
  return header + body;
}

function computeRawWorkerDiff(originalText, modifiedText, options) {
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
      format: options.format || 'text',
      isValid: { original: true, modified: true },
      errors: {},
    };
  }

  const origRawLines = splitLines(originalText);
  const modRawLines = splitLines(modifiedText);
  const origIndexed = prepareLines(origRawLines, options.ignoreBlankLines);
  const modIndexed = prepareLines(modRawLines, options.ignoreBlankLines);

  const edits = myersDiff(origIndexed, modIndexed, (a, b) => {
    return normalizeToken(a.line, options) === normalizeToken(b.line, options);
  });

  const diffLines = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let unchangedCount = 0;
  let i = 0;

  while (i < edits.length) {
    const current = edits[i];

    if (current.type === 'equal') {
      diffLines.push({
        id: 'line-' + (diffLines.length + 1),
        type: 'equal',
        originalLineNumber: current.value.originalIndex,
        modifiedLineNumber: current.value.originalIndex,
        originalContent: current.value.line,
        modifiedContent: current.value.line,
        originalTokens: [{ type: 'equal', text: current.value.line }],
        modifiedTokens: [{ type: 'equal', text: current.value.line }],
        inlineTokens: [],
      });
      unchangedCount++;
      i++;
    } else if (
      current.type === 'delete' &&
      i + 1 < edits.length &&
      edits[i + 1].type === 'insert'
    ) {
      const delItem = current;
      const insItem = edits[i + 1];
      const inline = computeInlineDiff(delItem.value.line, insItem.value.line, options);

      diffLines.push({
        id: 'line-' + (diffLines.length + 1),
        type: 'modify',
        originalLineNumber: delItem.value.originalIndex,
        modifiedLineNumber: insItem.value.originalIndex,
        originalContent: delItem.value.line,
        modifiedContent: insItem.value.line,
        originalTokens: inline.originalTokens,
        modifiedTokens: inline.modifiedTokens,
        inlineTokens: [
          ...inline.originalTokens.filter((t) => t.type !== 'equal'),
          ...inline.modifiedTokens.filter((t) => t.type !== 'equal'),
        ],
      });
      modifiedCount++;
      addedCount++;
      removedCount++;
      i += 2;
    } else if (current.type === 'delete') {
      diffLines.push({
        id: 'line-' + (diffLines.length + 1),
        type: 'delete',
        originalLineNumber: current.value.originalIndex,
        originalContent: current.value.line,
        originalTokens: [{ type: 'delete', text: current.value.line }],
        modifiedTokens: [],
        inlineTokens: [{ type: 'delete', text: current.value.line }],
      });
      removedCount++;
      i++;
    } else if (current.type === 'insert') {
      diffLines.push({
        id: 'line-' + (diffLines.length + 1),
        type: 'insert',
        modifiedLineNumber: current.value.originalIndex,
        modifiedContent: current.value.line,
        originalTokens: [],
        modifiedTokens: [{ type: 'insert', text: current.value.line }],
        inlineTokens: [{ type: 'insert', text: current.value.line }],
      });
      addedCount++;
      i++;
    }
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
      modifiedLines: modifiedCount,
      unchangedLines: unchangedCount,
      differencePercentage,
    },
    isIdentical,
    isEmpty: false,
    unifiedDiffText: generateUnifiedDiff(diffLines, 'original.txt', 'modified.txt'),
    detectedFormat: options.format || 'text',
    format: options.format || 'text',
    isValid: { original: true, modified: true },
    errors: {},
  };
}
`;

interface PendingWorkerJob<T = any> {
  resolve: (res: WorkerJobResult<T>) => void;
  reject: (err: any) => void;
  settled: boolean;
}

export class DiffWorkerClient {
  private worker: Worker | null = null;
  private workerUrl: string | null = null;
  private currentJobId = 0;
  private pendingCallbacks = new Map<number, PendingWorkerJob>();
  private activeConsumerCount = 0;

  public acquire(): () => void {
    this.activeConsumerCount++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.release();
    };
  }

  public release() {
    this.activeConsumerCount = Math.max(0, this.activeConsumerCount - 1);
    if (this.activeConsumerCount === 0 && this.worker) {
      this.terminate();
    }
  }

  public getActiveConsumerCount(): number {
    return this.activeConsumerCount;
  }

  public isWorkerActive(): boolean {
    return this.worker !== null;
  }

  private initWorker() {
    if (this.worker) return;
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const blob = new Blob([DIFF_WORKER_SCRIPT], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(this.workerUrl);

      this.worker.onmessage = (e: MessageEvent) => {
        const { id } = e.data || {};
        if (id !== undefined && this.pendingCallbacks.has(id)) {
          const job = this.pendingCallbacks.get(id)!;
          if (!job.settled) {
            job.settled = true;
            this.pendingCallbacks.delete(id);
            job.resolve(e.data);
          }
        }
      };

      this.worker.onerror = (err: any) => {
        const errorMsg =
          err?.message || (typeof err === 'string' ? err : 'Diff Worker crashed or ran out of memory');
        this.handleCrash(errorMsg);
      };
    } catch (e) {
      console.warn('Failed to initialize inline DiffWorker, using main thread fallback:', e);
      this.worker = null;
    }
  }

  public handleCrash(errorMsg: string) {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // ignore
      }
      this.worker = null;
    }
    if (this.workerUrl) {
      try {
        URL.revokeObjectURL(this.workerUrl);
      } catch {
        // ignore
      }
      this.workerUrl = null;
    }

    const callbacksToReject = Array.from(this.pendingCallbacks.values());
    this.pendingCallbacks.clear();

    for (const job of callbacksToReject) {
      if (!job.settled) {
        job.settled = true;
        job.reject(new Error(`Worker error: ${errorMsg}`));
      }
    }
  }

  public terminate() {
    this.handleCrash('Diff Worker was terminated');
  }

  public getPendingCount(): number {
    return this.pendingCallbacks.size;
  }

  public async computeDiff(
    originalText: string,
    modifiedText: string,
    options: DiffOptions = DEFAULT_DIFF_OPTIONS
  ): Promise<WorkerJobResult<DiffEngineResult>> {
    const start = performance.now();
    this.initWorker();

    if (!this.worker) {
      // Main-thread fallback
      try {
        const data = computeDiff(originalText, modifiedText, options);
        return {
          success: true,
          data,
          executionTimeMs: Math.round(performance.now() - start),
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Diff failed',
          executionTimeMs: Math.round(performance.now() - start),
        };
      }
    }

    return new Promise((resolve, reject) => {
      const id = ++this.currentJobId;
      this.pendingCallbacks.set(id, { resolve, reject, settled: false });
      this.worker!.postMessage({
        id,
        action: 'diff',
        payload: { originalText, modifiedText, options },
      });
    });
  }
}

export const diffWorkerClient = new DiffWorkerClient();

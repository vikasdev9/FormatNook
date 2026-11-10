import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import {
  computeRawTextDiff,
  sortObjectKeys,
} from '../diff-service';
import { extractJsonErrorPosition } from '@/features/json/services/json-service';

export interface JsonDiffDetail {
  path: string;
  kind: 'added' | 'removed' | 'modified' | 'type_changed';
  oldValue?: any;
  newValue?: any;
  oldType?: string;
  newType?: string;
}

export class JsonEngine implements DiffEngine {
  readonly format = 'json';

  compare(input: DiffEngineInput): DiffEngineResult {
    const { originalText, modifiedText, options } = input;

    const isEmptyOriginal = !originalText || !originalText.trim();
    const isEmptyModified = !modifiedText || !modifiedText.trim();

    if (isEmptyOriginal && isEmptyModified) {
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
        format: 'json',
        detectedFormat: 'json',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    // Validate inputs
    let parsedOrig: any = null;
    let parsedMod: any = null;
    let origValid = true;
    let modValid = true;
    let origError: string | undefined;
    let modError: string | undefined;

    if (!isEmptyOriginal) {
      try {
        parsedOrig = JSON.parse(originalText);
      } catch (err: any) {
        origValid = false;
        const pos = extractJsonErrorPosition(err?.message || '', originalText);
        origError = `Invalid JSON: Line ${pos.line ?? 1}, Column ${pos.column ?? 1} - ${err?.message || 'Syntax error'}`;
      }
    }

    if (!isEmptyModified) {
      try {
        parsedMod = JSON.parse(modifiedText);
      } catch (err: any) {
        modValid = false;
        const pos = extractJsonErrorPosition(err?.message || '', modifiedText);
        modError = `Invalid JSON: Line ${pos.line ?? 1}, Column ${pos.column ?? 1} - ${err?.message || 'Syntax error'}`;
      }
    }

    // If either input is invalid, fall back to line diff with parsing errors attached
    if (!origValid || !modValid) {
      const fallbackResult = computeRawTextDiff(originalText, modifiedText, {
        ...options,
        format: 'text',
      });

      return {
        ...fallbackResult,
        format: 'json',
        detectedFormat: 'json',
        isValid: { original: origValid, modified: modValid },
        errors: { original: origError, modified: modError },
        formatWarnings: { original: origError, modified: modError },
      };
    }

    // Both inputs are valid JSON: Perform structural comparison
    const details = this.diffJsonValues('', parsedOrig, parsedMod);

    // Apply key sorting if requested or if prettify is active
    const sort = options.sortKeys;
    const finalOrigObj = sort ? sortObjectKeys(parsedOrig) : parsedOrig;
    const finalModObj = sort ? sortObjectKeys(parsedMod) : parsedMod;

    const formattedOrig = JSON.stringify(finalOrigObj, null, 2);
    const formattedMod = JSON.stringify(finalModObj, null, 2);

    const diffResult = computeRawTextDiff(formattedOrig, formattedMod, {
      ...options,
      format: 'text',
    });

    return {
      ...diffResult,
      format: 'json',
      detectedFormat: 'json',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'json',
        summary: `${details.length} structural differences found.`,
        details,
      },
    };
  }

  /**
   * Deep structural diff between two parsed JSON values.
   */
  diffJsonValues(path: string, a: any, b: any): JsonDiffDetail[] {
    const details: JsonDiffDetail[] = [];
    const typeA = this.getType(a);
    const typeB = this.getType(b);

    if (typeA !== typeB) {
      details.push({
        path: path || '$',
        kind: 'type_changed',
        oldValue: a,
        newValue: b,
        oldType: typeA,
        newType: typeB,
      });
      return details;
    }

    if (typeA === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      const allKeys = Array.from(new Set([...keysA, ...keysB])).sort();

      for (const k of allKeys) {
        const curPath = path ? `${path}.${k}` : k;
        if (!(k in b)) {
          details.push({ path: curPath, kind: 'removed', oldValue: a[k] });
        } else if (!(k in a)) {
          details.push({ path: curPath, kind: 'added', newValue: b[k] });
        } else {
          details.push(...this.diffJsonValues(curPath, a[k], b[k]));
        }
      }
      return details;
    }

    if (typeA === 'array') {
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        const curPath = `${path}[${i}]`;
        if (i >= b.length) {
          details.push({ path: curPath, kind: 'removed', oldValue: a[i] });
        } else if (i >= a.length) {
          details.push({ path: curPath, kind: 'added', newValue: b[i] });
        } else {
          details.push(...this.diffJsonValues(curPath, a[i], b[i]));
        }
      }
      return details;
    }

    if (a !== b) {
      details.push({
        path: path || '$',
        kind: 'modified',
        oldValue: a,
        newValue: b,
        oldType: typeA,
        newType: typeB,
      });
    }

    return details;
  }

  private getType(val: any): string {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  }
}

export const jsonEngine = new JsonEngine();

import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff } from '../diff-service';
import { formatJavascript } from '@/features/beautifiers/services/beautifier-service';

export interface JsSymbolDiff {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'import' | 'export';
  action: 'added' | 'removed' | 'modified';
}

export class JsEngine implements DiffEngine {
  readonly format = 'javascript';

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
        format: 'javascript',
        detectedFormat: 'javascript',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    let origValid = true;
    let modValid = true;
    let origError: string | undefined;
    let modError: string | undefined;

    if (!isEmptyOriginal) {
      const v = this.validateJsSyntax(originalText);
      if (!v.isValid) {
        origValid = false;
        origError = v.error;
      }
    }

    if (!isEmptyModified) {
      const v = this.validateJsSyntax(modifiedText);
      if (!v.isValid) {
        modValid = false;
        modError = v.error;
      }
    }

    if (!origValid || !modValid) {
      const fallbackResult = computeRawTextDiff(originalText, modifiedText, {
        ...options,
        format: 'text',
      });

      return {
        ...fallbackResult,
        format: 'javascript',
        detectedFormat: 'javascript',
        isValid: { original: origValid, modified: modValid },
        errors: { original: origError, modified: modError },
        formatWarnings: { original: origError, modified: modError },
      };
    }

    const formattedOrig = formatJavascript(originalText).output;
    const formattedMod = formatJavascript(modifiedText).output;

    const symbolDiffs = this.diffJsSymbols(formattedOrig, formattedMod);

    const diffResult = computeRawTextDiff(formattedOrig, formattedMod, {
      ...options,
      format: 'text',
    });

    return {
      ...diffResult,
      format: 'javascript',
      detectedFormat: 'javascript',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'javascript',
        summary: `${symbolDiffs.length} symbol/declaration differences detected.`,
        details: {
          symbolChanges: symbolDiffs,
        },
      },
    };
  }

  /**
   * Safely validate JavaScript syntax without executing code.
   */
  validateJsSyntax(code: string): { isValid: boolean; error?: string } {
    try {
      // Compiles code into a function body without invoking it
      new Function(code);
      return { isValid: true };
    } catch (err: any) {
      return {
        isValid: false,
        error: `SyntaxError: ${err?.message || 'Invalid JavaScript syntax'}`,
      };
    }
  }

  /**
   * Extract top-level symbols (functions, classes, const/let/var, imports, exports) and compare.
   */
  diffJsSymbols(codeA: string, codeB: string): JsSymbolDiff[] {
    const symbolsA = this.extractSymbols(codeA);
    const symbolsB = this.extractSymbols(codeB);
    const diffs: JsSymbolDiff[] = [];

    const allKeys = Array.from(new Set([...symbolsA.keys(), ...symbolsB.keys()]));

    for (const key of allKeys) {
      const symA = symbolsA.get(key);
      const symB = symbolsB.get(key);

      if (symA && !symB) {
        diffs.push({ name: key, kind: symA.kind, action: 'removed' });
      } else if (!symA && symB) {
        diffs.push({ name: key, kind: symB.kind, action: 'added' });
      } else if (symA && symB && symA.body !== symB.body) {
        diffs.push({ name: key, kind: symB.kind, action: 'modified' });
      }
    }

    return diffs;
  }

  private extractSymbols(code: string): Map<string, { kind: JsSymbolDiff['kind']; body: string }> {
    const map = new Map<string, { kind: JsSymbolDiff['kind']; body: string }>();

    // Function declarations: function name(...)
    const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{([\s\S]*?)\}/g;
    let m: RegExpExecArray | null;
    while ((m = funcRegex.exec(code)) !== null) {
      map.set(`function:${m[1]}`, { kind: 'function', body: m[2].trim() });
    }

    // Class declarations: class Name { ... }
    const classRegex = /class\s+([a-zA-Z0-9_$]+)[\s\S]*?\{([\s\S]*?)\}/g;
    while ((m = classRegex.exec(code)) !== null) {
      map.set(`class:${m[1]}`, { kind: 'class', body: m[2].trim() });
    }

    // Top-level variable/const declarations
    const varRegex = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*([^;]+);/g;
    while ((m = varRegex.exec(code)) !== null) {
      map.set(`var:${m[1]}`, { kind: 'variable', body: m[2].trim() });
    }

    // Imports
    const importRegex = /import\s+([\s\S]*?)\s+from\s+['"][^'"]+['']/g;
    while ((m = importRegex.exec(code)) !== null) {
      map.set(`import:${m[1].trim()}`, { kind: 'import', body: m[0] });
    }

    // Exports
    const exportRegex = /export\s+(?:default\s+)?([a-zA-Z0-9_$]+)/g;
    while ((m = exportRegex.exec(code)) !== null) {
      map.set(`export:${m[1]}`, { kind: 'export', body: m[0] });
    }

    return map;
  }
}

export const jsEngine = new JsEngine();


import yaml from 'js-yaml';
import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff, sortObjectKeys } from '../diff-service';
import { validateYaml } from '@/features/yaml/services/yaml-service';

export interface YamlDiffDetail {
  path: string;
  kind: 'added' | 'removed' | 'modified' | 'type_changed';
  oldValue?: any;
  newValue?: any;
  oldType?: string;
  newType?: string;
}

export class YamlEngine implements DiffEngine {
  readonly format = 'yaml';

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
        format: 'yaml',
        detectedFormat: 'yaml',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    let origValid = true;
    let modValid = true;
    let origError: string | undefined;
    let modError: string | undefined;
    let parsedOrig: any = null;
    let parsedMod: any = null;

    if (!isEmptyOriginal) {
      const v = validateYaml(originalText);
      if (!v.isValid) {
        origValid = false;
        origError = v.issues[0]?.message || 'Invalid YAML';
      } else {
        try {
          parsedOrig = yaml.load(originalText);
        } catch (e: any) {
          origValid = false;
          origError = e?.message || 'Failed to parse YAML';
        }
      }
    }

    if (!isEmptyModified) {
      const v = validateYaml(modifiedText);
      if (!v.isValid) {
        modValid = false;
        modError = v.issues[0]?.message || 'Invalid YAML';
      } else {
        try {
          parsedMod = yaml.load(modifiedText);
        } catch (e: any) {
          modValid = false;
          modError = e?.message || 'Failed to parse YAML';
        }
      }
    }

    if (!origValid || !modValid) {
      const fallbackResult = computeRawTextDiff(originalText, modifiedText, {
        ...options,
        format: 'text',
      });

      return {
        ...fallbackResult,
        format: 'yaml',
        detectedFormat: 'yaml',
        isValid: { original: origValid, modified: modValid },
        errors: { original: origError, modified: modError },
        formatWarnings: { original: origError, modified: modError },
      };
    }

    // Deep structural comparison
    const details = this.diffYamlValues('', parsedOrig, parsedMod);

    const sort = options.sortKeys;
    const finalOrigObj = sort ? sortObjectKeys(parsedOrig) : parsedOrig;
    const finalModObj = sort ? sortObjectKeys(parsedMod) : parsedMod;

    const formattedOrig = yaml.dump(finalOrigObj, { indent: 2, sortKeys: options.sortKeys, noRefs: true });
    const formattedMod = yaml.dump(finalModObj, { indent: 2, sortKeys: options.sortKeys, noRefs: true });

    const diffResult = computeRawTextDiff(formattedOrig, formattedMod, {
      ...options,
      format: 'text',
    });

    return {
      ...diffResult,
      format: 'yaml',
      detectedFormat: 'yaml',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'yaml',
        summary: `${details.length} YAML structural differences found.`,
        details,
      },
    };
  }

  diffYamlValues(path: string, a: any, b: any): YamlDiffDetail[] {
    const details: YamlDiffDetail[] = [];
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
          details.push(...this.diffYamlValues(curPath, a[k], b[k]));
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
          details.push(...this.diffYamlValues(curPath, a[i], b[i]));
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

export const yamlEngine = new YamlEngine();

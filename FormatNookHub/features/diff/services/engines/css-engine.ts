import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff } from '../diff-service';
import { formatCss } from '@/features/beautifiers/services/beautifier-service';

export interface CssPropertyDiff {
  property: string;
  kind: 'added' | 'removed' | 'modified';
  oldValue?: string;
  newValue?: string;
}

export interface CssRuleDiff {
  selector: string;
  kind: 'added' | 'removed' | 'modified';
  propertyDiffs: CssPropertyDiff[];
}

export class CssEngine implements DiffEngine {
  readonly format = 'css';

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
        format: 'css',
        detectedFormat: 'css',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    const rulesOrig = this.parseCssRules(originalText);
    const rulesMod = this.parseCssRules(modifiedText);

    const ruleDiffs = this.diffCssRules(rulesOrig, rulesMod);

    const normOrig = this.normalizeCssWithSortedProps(rulesOrig);
    const normMod = this.normalizeCssWithSortedProps(rulesMod);

    const diffResult = computeRawTextDiff(normOrig, normMod, {
      ...options,
      format: 'text',
    });

    return {
      ...diffResult,
      format: 'css',
      detectedFormat: 'css',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'css',
        summary: `${ruleDiffs.length} CSS rule/property differences found.`,
        details: {
          ruleDiffs,
        },
      },
    };
  }

  /**
   * Parse CSS text into structured selector-to-declarations map.
   */
  parseCssRules(css: string): Map<string, Record<string, string>> {
    const rules = new Map<string, Record<string, string>>();
    // Strip comments
    const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = ruleRegex.exec(cleanCss)) !== null) {
      const selector = match[1].trim();
      const body = match[2].trim();
      const decls: Record<string, string> = {};

      const declPairs = body.split(';');
      for (const pair of declPairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx > 0) {
          const prop = pair.slice(0, colonIdx).trim().toLowerCase();
          const val = pair.slice(colonIdx + 1).trim();
          if (prop && val) {
            decls[prop] = val;
          }
        }
      }

      rules.set(selector, decls);
    }

    return rules;
  }

  /**
   * Diff CSS rules, finding added, removed, and modified selectors/properties.
   */
  diffCssRules(
    rulesA: Map<string, Record<string, string>>,
    rulesB: Map<string, Record<string, string>>
  ): CssRuleDiff[] {
    const diffs: CssRuleDiff[] = [];
    const allSelectors = Array.from(new Set([...Array.from(rulesA.keys()), ...Array.from(rulesB.keys())]));

    for (const sel of allSelectors) {
      const declsA = rulesA.get(sel);
      const declsB = rulesB.get(sel);

      if (declsA && !declsB) {
        diffs.push({
          selector: sel,
          kind: 'removed',
          propertyDiffs: Object.entries(declsA).map(([prop, val]) => ({
            property: prop,
            kind: 'removed',
            oldValue: val,
          })),
        });
      } else if (!declsA && declsB) {
        diffs.push({
          selector: sel,
          kind: 'added',
          propertyDiffs: Object.entries(declsB).map(([prop, val]) => ({
            property: prop,
            kind: 'added',
            newValue: val,
          })),
        });
      } else if (declsA && declsB) {
        const propDiffs: CssPropertyDiff[] = [];
        const allProps = Array.from(new Set([...Object.keys(declsA), ...Object.keys(declsB)])).sort();

        for (const prop of allProps) {
          const valA = declsA[prop];
          const valB = declsB[prop];

          if (valA !== undefined && valB === undefined) {
            propDiffs.push({ property: prop, kind: 'removed', oldValue: valA });
          } else if (valA === undefined && valB !== undefined) {
            propDiffs.push({ property: prop, kind: 'added', newValue: valB });
          } else if (valA !== valB) {
            propDiffs.push({ property: prop, kind: 'modified', oldValue: valA, newValue: valB });
          }
        }

        if (propDiffs.length > 0) {
          diffs.push({
            selector: sel,
            kind: 'modified',
            propertyDiffs: propDiffs,
          });
        }
      }
    }

    return diffs;
  }

  normalizeCssWithSortedProps(rules: Map<string, Record<string, string>>): string {
    const lines: string[] = [];
    for (const [selector, decls] of rules.entries()) {
      lines.push(`${selector} {`);
      const sortedProps = Object.keys(decls).sort();
      for (const prop of sortedProps) {
        lines.push(`  ${prop}: ${decls[prop]};`);
      }
      lines.push('}\n');
    }
    return lines.join('\n').trim();
  }
}

export const cssEngine = new CssEngine();

import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff } from '../diff-service';
import { formatHtml } from '@/features/beautifiers/services/beautifier-service';

export interface HtmlDiffDetail {
  tag: string;
  kind: 'element_added' | 'element_removed' | 'attribute_changed' | 'attribute_added' | 'attribute_removed' | 'text_changed';
  attributeName?: string;
  oldValue?: string;
  newValue?: string;
}

export class HtmlEngine implements DiffEngine {
  readonly format = 'html';

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
        format: 'html',
        detectedFormat: 'html',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    const normOrig = this.normalizeHtml(originalText);
    const normMod = this.normalizeHtml(modifiedText);

    const details = this.diffHtmlStructure(normOrig, normMod);

    const diffResult = computeRawTextDiff(normOrig, normMod, {
      ...options,
      format: 'text',
    });

    return {
      ...diffResult,
      format: 'html',
      detectedFormat: 'html',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'html',
        summary: `${details.length} HTML structural differences found.`,
        details,
      },
    };
  }

  normalizeHtml(html: string): string {
    const formatted = formatHtml(html).output;

    // Normalize attributes alphabetically inside tags
    return formatted.replace(/<([a-zA-Z0-9:-]+)(\s+[^>]*?)?(\/?)>/g, (match, tag, attrsStr, selfClose) => {
      if (!attrsStr || !attrsStr.trim()) {
        return `<${tag}${selfClose ? ' /' : ''}>`;
      }

      const attrRegex = /([a-zA-Z0-9:-]+)(?:\s*=\s*(["'][^"']*?["']|[^\s>]+))?/g;
      const attrs: { name: string; full: string }[] = [];
      let m: RegExpExecArray | null;

      while ((m = attrRegex.exec(attrsStr)) !== null) {
        const name = m[1];
        const val = m[2] ? `=${m[2]}` : '';
        attrs.push({ name, full: `${name}${val}` });
      }

      attrs.sort((a, b) => a.name.localeCompare(b.name));
      const sortedAttrs = attrs.map((a) => a.full).join(' ');
      return `<${tag}${sortedAttrs ? ' ' + sortedAttrs : ''}${selfClose ? ' /' : ''}>`;
    });
  }

  private diffHtmlStructure(htmlA: string, htmlB: string): HtmlDiffDetail[] {
    const details: HtmlDiffDetail[] = [];
    const elementsA = this.parseHtmlTokens(htmlA);
    const elementsB = this.parseHtmlTokens(htmlB);

    const max = Math.max(elementsA.length, elementsB.length);
    for (let i = 0; i < max; i++) {
      const elA = elementsA[i];
      const elB = elementsB[i];

      if (!elB) {
        details.push({ tag: elA.tag, kind: 'element_removed', oldValue: elA.raw });
      } else if (!elA) {
        details.push({ tag: elB.tag, kind: 'element_added', newValue: elB.raw });
      } else if (elA.tag !== elB.tag) {
        details.push({ tag: elA.tag, kind: 'element_removed', oldValue: elA.tag });
        details.push({ tag: elB.tag, kind: 'element_added', newValue: elB.tag });
      } else {
        // Compare attributes
        const keysA = Object.keys(elA.attrs);
        const keysB = Object.keys(elB.attrs);
        const allKeys = Array.from(new Set([...keysA, ...keysB])).sort();

        for (const k of allKeys) {
          const valA = elA.attrs[k];
          const valB = elB.attrs[k];
          if (valA !== undefined && valB === undefined) {
            details.push({ tag: elA.tag, kind: 'attribute_removed', attributeName: k, oldValue: valA });
          } else if (valA === undefined && valB !== undefined) {
            details.push({ tag: elB.tag, kind: 'attribute_added', attributeName: k, newValue: valB });
          } else if (valA !== valB) {
            details.push({ tag: elA.tag, kind: 'attribute_changed', attributeName: k, oldValue: valA, newValue: valB });
          }
        }

        // Compare text
        if (elA.text && elB.text && elA.text !== elB.text) {
          details.push({ tag: elA.tag, kind: 'text_changed', oldValue: elA.text, newValue: elB.text });
        }
      }
    }

    return details;
  }

  private parseHtmlTokens(html: string): Array<{ tag: string; attrs: Record<string, string>; text: string; raw: string }> {
    const tokens: Array<{ tag: string; attrs: Record<string, string>; text: string; raw: string }> = [];
    const lines = html.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const tagMatch = trimmed.match(/^<([a-zA-Z0-9:-]+)([^>]*)>(.*?)<\/\1>$|^<([a-zA-Z0-9:-]+)([^>]*)\/?>$/);
      if (tagMatch) {
        const tag = tagMatch[1] || tagMatch[4];
        const attrStr = tagMatch[2] || tagMatch[5] || '';
        const text = tagMatch[3] || '';
        const attrs: Record<string, string> = {};

        const attrRegex = /([a-zA-Z0-9:-]+)(?:=(["'])(.*?)\2)?/g;
        let m: RegExpExecArray | null;
        while ((m = attrRegex.exec(attrStr)) !== null) {
          attrs[m[1]] = m[3] ?? '';
        }

        tokens.push({ tag, attrs, text, raw: trimmed });
      }
    }

    return tokens;
  }
}

export const htmlEngine = new HtmlEngine();

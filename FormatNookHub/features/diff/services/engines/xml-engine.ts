import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff } from '../diff-service';
import { validateXml, formatXml } from '@/features/xml/services/xml-service';

export interface XmlDiffDetail {
  path: string;
  kind: 'element_added' | 'element_removed' | 'attribute_changed' | 'attribute_added' | 'attribute_removed' | 'text_changed';
  oldValue?: string;
  newValue?: string;
}

export class XmlEngine implements DiffEngine {
  readonly format = 'xml';

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
        format: 'xml',
        detectedFormat: 'xml',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    // Validate inputs
    let origValid = true;
    let modValid = true;
    let origError: string | undefined;
    let modError: string | undefined;

    if (!isEmptyOriginal) {
      const v = validateXml(originalText);
      if (!v.isValid) {
        origValid = false;
        const firstIssue = v.issues[0];
        origError = firstIssue ? `Line ${firstIssue.line ?? 1}: ${firstIssue.message}` : 'Invalid XML';
      }
    }

    if (!isEmptyModified) {
      const v = validateXml(modifiedText);
      if (!v.isValid) {
        modValid = false;
        const firstIssue = v.issues[0];
        modError = firstIssue ? `Line ${firstIssue.line ?? 1}: ${firstIssue.message}` : 'Invalid XML';
      }
    }

    if (!origValid || !modValid) {
      const fallbackResult = computeRawTextDiff(originalText, modifiedText, {
        ...options,
        format: 'text',
      });

      return {
        ...fallbackResult,
        format: 'xml',
        detectedFormat: 'xml',
        isValid: { original: origValid, modified: modValid },
        errors: { original: origError, modified: modError },
        formatWarnings: { original: origError, modified: modError },
      };
    }

    // Both valid: Normalize XML (sort attributes alphabetically and format)
    const normOrig = this.normalizeXml(originalText);
    const normMod = this.normalizeXml(modifiedText);

    // Extract structural differences
    const details = this.diffXmlStructure(normOrig, normMod);

    const diffResult = computeRawTextDiff(normOrig, normMod, {
      ...options,
      format: 'text',
    });

    return {
      ...diffResult,
      format: 'xml',
      detectedFormat: 'xml',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'xml',
        summary: `${details.length} XML structural differences found.`,
        details,
      },
    };
  }

  /**
   * Normalize XML by sorting attributes alphabetically within tags and standardizing indentation.
   */
  normalizeXml(xml: string): string {
    const formatted = formatXml(xml).output;

    // Sort attributes in opening and self-closing tags
    const normalizedTags = formatted.replace(/<([a-zA-Z0-9_:-]+)(\s+[^>]*?)?(\/?)>/g, (match, tag, attrsStr, selfClose) => {
      if (!attrsStr || !attrsStr.trim()) {
        return `<${tag}${selfClose ? ' /' : ''}>`;
      }

      // Parse attributes
      const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(["'][^"']*?["']|[^\s>]+)/g;
      const attrs: { name: string; full: string }[] = [];
      let m: RegExpExecArray | null;
      while ((m = attrRegex.exec(attrsStr)) !== null) {
        attrs.push({ name: m[1], full: `${m[1]}=${m[2]}` });
      }

      attrs.sort((a, b) => a.name.localeCompare(b.name));
      const sortedAttrs = attrs.map((a) => a.full).join(' ');
      return `<${tag}${sortedAttrs ? ' ' + sortedAttrs : ''}${selfClose ? ' /' : ''}>`;
    });

    return normalizedTags;
  }

  /**
   * Fast structural comparison of normalized XML elements and attributes.
   */
  private diffXmlStructure(xmlA: string, xmlB: string): XmlDiffDetail[] {
    const details: XmlDiffDetail[] = [];
    const elementsA = this.parseXmlElements(xmlA);
    const elementsB = this.parseXmlElements(xmlB);

    const max = Math.max(elementsA.length, elementsB.length);
    for (let i = 0; i < max; i++) {
      const elA = elementsA[i];
      const elB = elementsB[i];

      if (!elB) {
        details.push({ path: elA.path, kind: 'element_removed', oldValue: elA.text || elA.tag });
      } else if (!elA) {
        details.push({ path: elB.path, kind: 'element_added', newValue: elB.text || elB.tag });
      } else {
        if (elA.tag !== elB.tag) {
          details.push({ path: elA.path, kind: 'element_removed', oldValue: elA.tag });
          details.push({ path: elB.path, kind: 'element_added', newValue: elB.tag });
        } else {
          // Compare attributes
          const keysA = Object.keys(elA.attrs);
          const keysB = Object.keys(elB.attrs);
          const allKeys = Array.from(new Set([...keysA, ...keysB])).sort();

          for (const key of allKeys) {
            const valA = elA.attrs[key];
            const valB = elB.attrs[key];
            if (valA !== undefined && valB === undefined) {
              details.push({ path: `${elA.path}/@${key}`, kind: 'attribute_removed', oldValue: valA });
            } else if (valA === undefined && valB !== undefined) {
              details.push({ path: `${elB.path}/@${key}`, kind: 'attribute_added', newValue: valB });
            } else if (valA !== valB) {
              details.push({ path: `${elA.path}/@${key}`, kind: 'attribute_changed', oldValue: valA, newValue: valB });
            }
          }

          // Compare text
          if (elA.text !== elB.text) {
            details.push({ path: `${elA.path}/text()`, kind: 'text_changed', oldValue: elA.text, newValue: elB.text });
          }
        }
      }
    }

    return details;
  }

  private parseXmlElements(xml: string): Array<{ tag: string; path: string; attrs: Record<string, string>; text: string }> {
    const list: Array<{ tag: string; path: string; attrs: Record<string, string>; text: string }> = [];
    const tagRegex = /<([a-zA-Z0-9_:-]+)([^>]*)>([^<]*)<\/\1>|<([a-zA-Z0-9_:-]+)([^>]*)\/>|<([a-zA-Z0-9_:-]+)([^>]*)>/g;
    const pathStack: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(xml)) !== null) {
      const full = match[0];
      if (full.startsWith('</')) {
        pathStack.pop();
        continue;
      }

      if (match[1]) {
        // inline element <tag attrs>text</tag>
        const tag = match[1];
        const attrs = this.extractAttributes(match[2]);
        const text = (match[3] || '').trim();
        const currentPath = [...pathStack, tag].join('/');
        list.push({ tag, path: currentPath, attrs, text });
      } else if (match[4]) {
        // self closing <tag attrs/>
        const tag = match[4];
        const attrs = this.extractAttributes(match[5]);
        const currentPath = [...pathStack, tag].join('/');
        list.push({ tag, path: currentPath, attrs, text: '' });
      } else if (match[6]) {
        // opening tag
        const tag = match[6];
        pathStack.push(tag);
        const attrs = this.extractAttributes(match[7]);
        const currentPath = pathStack.join('/');
        list.push({ tag, path: currentPath, attrs, text: '' });
      }
    }

    return list;
  }

  private extractAttributes(attrStr: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    if (!attrStr) return attrs;
    const regex = /([a-zA-Z0-9_:-]+)\s*=\s*(["'])(.*?)\2/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(attrStr)) !== null) {
      attrs[m[1]] = m[3];
    }
    return attrs;
  }
}

export const xmlEngine = new XmlEngine();


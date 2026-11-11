import { XPathQueryResult, XPathMatch } from '../types/xml.types';

export const COMMON_XPATH_PRESETS = [
  { label: 'All Elements', query: '//*', description: 'Selects every element in the XML document' },
  { label: 'Root Children', query: '/*/*', description: 'Selects all direct children of root' },
  { label: 'All Attributes', query: '//@*', description: 'Selects every attribute on every element' },
  { label: 'All Text Nodes', query: '//text()[normalize-space()]', description: 'Selects all non-empty text content' },
  { label: 'First Element', query: '(//*)[1]', description: 'Selects the very first element' },
  { label: 'Elements with Attributes', query: '//*[@*]', description: 'Selects elements that contain at least one attribute' },
];

/**
 * Executes an XPath expression against an XML string client-side.
 */
export function evaluateXPath(xml: string, xpathQuery: string): XPathQueryResult {
  if (!xpathQuery || !xpathQuery.trim()) {
    return {
      query: '',
      isValid: false,
      error: 'XPath expression cannot be empty.',
      matchCount: 0,
      matches: [],
    };
  }

  if (!xml || !xml.trim()) {
    return {
      query: xpathQuery,
      isValid: false,
      error: 'XML document is empty.',
      matchCount: 0,
      matches: [],
    };
  }

  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return {
      query: xpathQuery,
      isValid: false,
      error: 'XPath evaluation requires browser DOMParser and XPathEvaluator.',
      matchCount: 0,
      matches: [],
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parserError = doc.querySelector('parsererror');

    if (parserError) {
      return {
        query: xpathQuery,
        isValid: false,
        error: `XML syntax error: ${parserError.textContent?.split('\n')[0] || 'Malformed XML'}`,
        matchCount: 0,
        matches: [],
      };
    }

    const serializer = new XMLSerializer();
    const snapshot = doc.evaluate(
      xpathQuery.trim(),
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const matches: XPathMatch[] = [];
    const count = snapshot.snapshotLength;

    for (let i = 0; i < Math.min(count, 500); i++) {
      const node = snapshot.snapshotItem(i);
      if (!node) continue;

      let xmlString = '';
      if (node.nodeType === Node.ELEMENT_NODE) {
        xmlString = serializer.serializeToString(node);
      } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
        const attr = node as Attr;
        xmlString = `${attr.name}="${attr.value}"`;
      } else {
        xmlString = node.textContent || '';
      }

      // Compute simple node path
      let nodePath = xpathQuery;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        nodePath = getElementXPath(el);
      } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
        const attr = node as Attr;
        nodePath = `${getElementXPath(attr.ownerElement || undefined)}/@${attr.name}`;
      }

      matches.push({
        xpath: nodePath,
        nodeName: node.nodeName,
        value: node.textContent || '',
        xml: xmlString,
      });
    }

    return {
      query: xpathQuery,
      isValid: true,
      matchCount: count,
      matches,
    };
  } catch (err: any) {
    return {
      query: xpathQuery,
      isValid: false,
      error: `Invalid XPath expression: ${err?.message || 'Syntax error in query'}`,
      matchCount: 0,
      matches: [],
    };
  }
}

/**
 * Computes the absolute XPath of an Element
 */
function getElementXPath(element?: Element): string {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  if (element === element.ownerDocument?.documentElement) {
    return `/${element.tagName}`;
  }

  let index = 1;
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }

  const parentPath = element.parentElement ? getElementXPath(element.parentElement) : '';
  return `${parentPath}/${element.tagName}[${index}]`;
}


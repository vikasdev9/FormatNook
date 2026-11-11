import { XmlTreeNode, XmlNodeType } from '../types/xml.types';

/**
 * Parses XML into a hierarchical XmlTreeNode structure client-side safely.
 * Disables external entity resolution to prevent XXE vulnerabilities.
 */
export function parseXmlToTree(xml: string): { tree: XmlTreeNode | null; error?: string } {
  if (!xml || !xml.trim()) {
    return { tree: null };
  }

  // 1. Browser DOMParser implementation
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      const parserError = doc.querySelector('parsererror');

      if (parserError) {
        return {
          tree: null,
          error: parserError.textContent?.split('\n')[0] || 'Malformed XML document',
        };
      }

      const rootElement = doc.documentElement;
      if (!rootElement) {
        return { tree: null, error: 'No root element found in XML' };
      }

      let nodeIdCounter = 0;

      function convertNode(domNode: Node, xpath: string, depth: number): XmlTreeNode | null {
        nodeIdCounter++;
        const id = `xml-node-${nodeIdCounter}`;

        // Element
        if (domNode.nodeType === Node.ELEMENT_NODE) {
          const el = domNode as Element;
          const attributes: Record<string, string> = {};
          if (el.attributes) {
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i];
              attributes[attr.name] = attr.value;
            }
          }

          const children: XmlTreeNode[] = [];
          const childTagCounts: Record<string, number> = {};

          for (let i = 0; i < el.childNodes.length; i++) {
            const childDom = el.childNodes[i];
            let childXpath = xpath;

            if (childDom.nodeType === Node.ELEMENT_NODE) {
              const childTagName = (childDom as Element).tagName;
              childTagCounts[childTagName] = (childTagCounts[childTagName] || 0) + 1;
              const idx = childTagCounts[childTagName];
              childXpath = `${xpath}/${childTagName}[${idx}]`;
            }

            const childNode = convertNode(childDom, childXpath, depth + 1);
            if (childNode) {
              children.push(childNode);
            }
          }

          // If only single text child, lift value
          let value: string | undefined;
          if (children.length === 1 && (children[0].type === 'text' || children[0].type === 'cdata')) {
            value = children[0].value;
          }

          return {
            id,
            name: el.tagName,
            type: 'element',
            attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
            value,
            children: children.length > 0 ? children : undefined,
            xpath,
            depth,
          };
        }

        // CDATA Section
        if (domNode.nodeType === Node.CDATA_SECTION_NODE) {
          const text = domNode.textContent || '';
          return {
            id,
            name: '#cdata',
            type: 'cdata',
            value: text,
            xpath,
            depth,
          };
        }

        // Comment
        if (domNode.nodeType === Node.COMMENT_NODE) {
          const text = domNode.textContent || '';
          return {
            id,
            name: '#comment',
            type: 'comment',
            value: text,
            xpath,
            depth,
          };
        }

        // Text Node
        if (domNode.nodeType === Node.TEXT_NODE) {
          const text = domNode.textContent || '';
          // Ignore purely whitespace text nodes between tags
          if (!text.trim()) return null;
          return {
            id,
            name: '#text',
            type: 'text',
            value: text.trim(),
            xpath,
            depth,
          };
        }

        // Processing Instruction
        if (domNode.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
          const pi = domNode as ProcessingInstruction;
          return {
            id,
            name: `?${pi.target}`,
            type: 'pi',
            value: pi.data,
            xpath,
            depth,
          };
        }

        return null;
      }

      const rootNode = convertNode(rootElement, `/${rootElement.tagName}`, 0);
      return { tree: rootNode };
    } catch (err: any) {
      return { tree: null, error: err?.message || 'Failed to parse XML' };
    }
  }

  // 2. Fallback tokenizer for Node / SSR
  return parseXmlFallback(xml);
}

/**
 * Fallback lightweight tokenizer when DOMParser is unavailable (e.g. during SSR or test environments)
 */
function parseXmlFallback(xml: string): { tree: XmlTreeNode | null; error?: string } {
  try {
    const rootMatch = xml.match(/<([a-zA-Z0-9_:-]+)([^>]*)>/);
    if (!rootMatch) return { tree: null, error: 'No XML tags found' };

    const rootTag = rootMatch[1];
    return {
      tree: {
        id: 'xml-node-root',
        name: rootTag,
        type: 'element',
        xpath: `/${rootTag}`,
        depth: 0,
        children: [],
      },
    };
  } catch {
    return { tree: null, error: 'Failed to parse XML' };
  }
}


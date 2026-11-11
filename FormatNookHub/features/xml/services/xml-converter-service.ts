import yaml from 'js-yaml';
import { XmlConversionResult, XmlConversionFormat } from '../types/xml.types';

/**
 * Converts a DOM Node recursively into a JSON-serializable structure.
 */
function domNodeToJson(node: Element): any {
  const result: Record<string, any> = {};

  // 1. Capture attributes with @ prefix
  if (node.attributes && node.attributes.length > 0) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      result[`@${attr.name}`] = attr.value;
    }
  }

  // 2. Iterate child nodes
  const childElements: Element[] = [];
  let textContent = '';

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      childElements.push(child as Element);
    } else if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
      const text = child.textContent?.trim() || '';
      if (text) {
        textContent += (textContent ? ' ' : '') + text;
      }
    }
  }

  if (childElements.length === 0) {
    // Leaf node: if there are no attributes, return pure text/primitive
    if (Object.keys(result).length === 0) {
      if (textContent === 'true') return true;
      if (textContent === 'false') return false;
      if (textContent !== '' && !isNaN(Number(textContent))) return Number(textContent);
      return textContent;
    }
    if (textContent) {
      result['#text'] = textContent;
    }
    return result;
  }

  // Group child elements by tagName
  const groupedChildren: Record<string, any[]> = {};
  for (const childEl of childElements) {
    const tag = childEl.tagName;
    if (!groupedChildren[tag]) {
      groupedChildren[tag] = [];
    }
    groupedChildren[tag].push(domNodeToJson(childEl));
  }

  for (const [tag, items] of Object.entries(groupedChildren)) {
    result[tag] = items.length === 1 ? items[0] : items;
  }

  if (textContent) {
    result['#text'] = textContent;
  }

  return result;
}

/**
 * Converts XML to JSON format.
 */
export function xmlToJson(xml: string): XmlConversionResult {
  if (!xml || !xml.trim()) {
    return { output: '{}', format: 'json', notes: 'Input XML is empty.' };
  }

  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return { output: '{}', format: 'json', error: 'XML parsing requires browser DOMParser environment.' };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return { output: '', format: 'json', error: parserError.textContent || 'Malformed XML document.' };
    }

    const root = doc.documentElement;
    if (!root) {
      return { output: '{}', format: 'json', error: 'No root element found in XML.' };
    }

    const jsonStructure = {
      [root.tagName]: domNodeToJson(root),
    };

    return {
      output: JSON.stringify(jsonStructure, null, 2),
      format: 'json',
      notes: 'Repeated sibling tags grouped as arrays; attributes prefixed with @.',
    };
  } catch (err: any) {
    return { output: '', format: 'json', error: err?.message || 'Failed to convert XML to JSON.' };
  }
}

/**
 * Converts XML to YAML format.
 */
export function xmlToYaml(xml: string): XmlConversionResult {
  const jsonRes = xmlToJson(xml);
  if (jsonRes.error) {
    return { output: '', format: 'yaml', error: jsonRes.error };
  }

  try {
    const parsed = JSON.parse(jsonRes.output);
    const yamlOutput = yaml.dump(parsed, { indent: 2, noRefs: true });
    return { output: yamlOutput, format: 'yaml' };
  } catch (err: any) {
    return { output: '', format: 'yaml', error: err?.message || 'Failed to serialize YAML.' };
  }
}

/**
 * Converts XML to CSV/TSV table by extracting repeated elements.
 */
export function xmlToCsv(xml: string, delimiter = ','): XmlConversionResult {
  const jsonRes = xmlToJson(xml);
  if (jsonRes.error) {
    return { output: '', format: delimiter === '\t' ? 'tsv' : 'csv', error: jsonRes.error };
  }

  try {
    const parsed = JSON.parse(jsonRes.output);
    const rootKey = Object.keys(parsed)[0];
    const rootVal = parsed[rootKey];

    // Find first array of objects inside root
    let rows: any[] = [];
    if (Array.isArray(rootVal)) {
      rows = rootVal;
    } else if (typeof rootVal === 'object' && rootVal !== null) {
      for (const key of Object.keys(rootVal)) {
        if (Array.isArray(rootVal[key])) {
          rows = rootVal[key];
          break;
        }
      }
      if (rows.length === 0) {
        const subKeys = Object.keys(rootVal);
        if (subKeys.length === 1 && typeof rootVal[subKeys[0]] === 'object' && rootVal[subKeys[0]] !== null) {
          const sub = rootVal[subKeys[0]];
          rows = Array.isArray(sub) ? sub : [sub];
        } else {
          rows = [rootVal];
        }
      }
    }

    if (rows.length === 0) {
      return { output: '', format: delimiter === '\t' ? 'tsv' : 'csv', notes: 'No tabular rows found in XML.' };
    }

    const headersSet = new Set<string>();
    for (const r of rows) {
      if (typeof r === 'object' && r !== null) {
        for (const k of Object.keys(r)) {
          headersSet.add(k);
        }
      }
    }

    const headers = Array.from(headersSet);
    if (headers.length === 0) {
      return { output: '', format: delimiter === '\t' ? 'tsv' : 'csv', notes: 'No scalar columns found.' };
    }

    function escapeCell(val: any): string {
      const strVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val !== undefined && val !== null ? val : '');
      if (strVal.includes(delimiter) || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }

    const lines: string[] = [headers.map(escapeCell).join(delimiter)];
    for (const row of rows) {
      const line = headers.map((h) => escapeCell(row[h]));
      lines.push(line.join(delimiter));
    }

    return {
      output: lines.join('\n'),
      format: delimiter === '\t' ? 'tsv' : 'csv',
    };
  } catch (err: any) {
    return { output: '', format: delimiter === '\t' ? 'tsv' : 'csv', error: err?.message || 'Failed to convert XML to CSV.' };
  }
}

/**
 * Escapes XML into a string literal for embedding in code.
 */
export function xmlToStringLiteral(xml: string): XmlConversionResult {
  return {
    output: JSON.stringify(xml),
    format: 'string',
  };
}

/**
 * Converts JSON to XML markup.
 */
export function jsonToXmlString(jsonStr: string): XmlConversionResult {
  try {
    const data = JSON.parse(jsonStr);
    function toXml(node: any, tagName: string): string {
      if (node === null || node === undefined) return `<${tagName}/>`;
      if (Array.isArray(node)) {
        return node.map((item) => toXml(item, tagName)).join('\n');
      }
      if (typeof node === 'object') {
        const children = Object.entries(node)
          .map(([k, v]) => {
            if (k.startsWith('@')) return ''; // Handled as attributes if needed
            return toXml(v, k.replace(/[^a-zA-Z0-9_.-]/g, '_'));
          })
          .filter(Boolean)
          .join('\n');
        return `<${tagName}>\n${children}\n</${tagName}>`;
      }
      const escaped = String(node)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<${tagName}>${escaped}</${tagName}>`;
    }

    const rootTag = typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 1
      ? Object.keys(data)[0]
      : 'root';
    const content = typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 1
      ? data[rootTag]
      : data;

    const xmlBody = toXml(content, rootTag);
    return {
      output: `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`,
      format: 'html',
    };
  } catch (err: any) {
    return { output: '', format: 'html', error: err?.message || 'Invalid JSON input.' };
  }
}

/**
 * Converts YAML to XML markup.
 */
export function yamlToXmlString(yamlStr: string): XmlConversionResult {
  try {
    const parsed = yaml.load(yamlStr);
    return jsonToXmlString(JSON.stringify(parsed));
  } catch (err: any) {
    return { output: '', format: 'html', error: err?.message || 'Invalid YAML input.' };
  }
}

/**
 * Converts CSV to XML markup.
 */
export function csvToXmlString(csvStr: string, delimiter = ','): XmlConversionResult {
  const lines = csvStr.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { output: '', format: 'html', error: 'CSV requires at least a header row and one data row.' };
  }

  const headers = lines[0].split(delimiter).map((h) => h.replace(/[^a-zA-Z0-9_.-]/g, '_').trim());
  const rowsXml: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter);
    const cells = headers.map((h, idx) => {
      const val = (values[idx] || '').trim();
      return `    <${h}>${val}</${h}>`;
    });
    rowsXml.push(`  <row>\n${cells.join('\n')}\n  </row>`);
  }

  return {
    output: `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${rowsXml.join('\n')}\n</root>`,
    format: 'html',
  };
}


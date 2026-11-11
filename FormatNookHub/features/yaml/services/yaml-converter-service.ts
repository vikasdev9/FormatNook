import yaml from 'js-yaml';

/**
 * Converts YAML string to formatted JSON.
 */
export function yamlToJson(yamlStr: string, indent: number = 2): string {
  try {
    const docs = yaml.loadAll(yamlStr);
    if (docs.length === 0) return '';
    if (docs.length === 1) {
      return JSON.stringify(docs[0], null, indent);
    }
    return JSON.stringify(docs, null, indent);
  } catch (err: any) {
    throw new Error(`YAML to JSON conversion failed: ${err?.message || 'Invalid YAML'}`);
  }
}

/**
 * Converts JSON string to clean YAML.
 */
export function jsonToYaml(jsonStr: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(jsonStr);
    return yaml.dump(parsed, { indent, lineWidth: -1, noRefs: true }).trimEnd() + '\n';
  } catch (err: any) {
    throw new Error(`JSON to YAML conversion failed: ${err?.message || 'Invalid JSON'}`);
  }
}

/**
 * Escapes characters for XML text.
 */
function escapeXmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts a JavaScript value recursively to XML tags.
 */
function valueToXml(val: any, tagName: string = 'item', depth: number = 1): string {
  const pad = '  '.repeat(depth);

  if (val === null || val === undefined) {
    return `${pad}<${tagName} />`;
  }

  if (typeof val === 'boolean' || typeof val === 'number') {
    return `${pad}<${tagName}>${val}</${tagName}>`;
  }

  if (typeof val === 'string') {
    return `${pad}<${tagName}>${escapeXmlText(val)}</${tagName}>`;
  }

  if (Array.isArray(val)) {
    return val.map((item) => valueToXml(item, tagName, depth)).join('\n');
  }

  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) {
      return `${pad}<${tagName} />`;
    }

    const inner = keys
      .map((k) => {
        const cleanTag = k.replace(/[^a-zA-Z0-9_\-]/g, '_');
        return valueToXml(val[k], cleanTag, depth + 1);
      })
      .join('\n');

    return `${pad}<${tagName}>\n${inner}\n${pad}</${tagName}>`;
  }

  return `${pad}<${tagName}>${escapeXmlText(String(val))}</${tagName}>`;
}

/**
 * Converts YAML to XML.
 */
export function yamlToXml(yamlStr: string, rootTag: string = 'root'): string {
  try {
    const docs = yaml.loadAll(yamlStr);
    if (docs.length === 0) return '<?xml version="1.0" encoding="UTF-8"?>\n<root />\n';

    const xmlLines = ['<?xml version="1.0" encoding="UTF-8"?>'];

    if (docs.length === 1) {
      const doc = docs[0];
      if (typeof doc === 'object' && doc !== null && !Array.isArray(doc)) {
        const keys = Object.keys(doc);
        if (keys.length === 1) {
          // Use single root key if present
          const rootKey = keys[0].replace(/[^a-zA-Z0-9_\-]/g, '_');
          xmlLines.push(valueToXml((doc as any)[keys[0]], rootKey, 0));
        } else {
          xmlLines.push(valueToXml(doc, rootTag, 0));
        }
      } else {
        xmlLines.push(valueToXml(doc, rootTag, 0));
      }
    } else {
      // Multi-document stream wrapped in a documents container
      xmlLines.push('<documents>');
      docs.forEach((doc, idx) => {
        xmlLines.push(valueToXml(doc, `document`, 1));
      });
      xmlLines.push('</documents>');
    }

    return xmlLines.join('\n') + '\n';
  } catch (err: any) {
    throw new Error(`YAML to XML conversion failed: ${err?.message || 'Invalid YAML'}`);
  }
}

/**
 * Converts XML to YAML.
 */
export function xmlToYaml(xmlStr: string, indent: number = 2): string {
  try {
    if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'application/xml');
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        throw new Error(parseError.textContent || 'XML parser error');
      }

      function domNodeToObj(node: Element): any {
        const result: Record<string, any> = {};

        // Attributes
        if (node.hasAttributes()) {
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            result[`@${attr.name}`] = attr.value;
          }
        }

        const childElements = Array.from(node.children);
        if (childElements.length === 0) {
          const text = node.textContent?.trim() || '';
          if (Object.keys(result).length === 0) {
            return text;
          }
          if (text) {
            result['#text'] = text;
          }
          return result;
        }

        // Group children by tag name
        for (const child of childElements) {
          const tag = child.tagName;
          const childVal = domNodeToObj(child);
          if (result[tag]) {
            if (Array.isArray(result[tag])) {
              result[tag].push(childVal);
            } else {
              result[tag] = [result[tag], childVal];
            }
          } else {
            result[tag] = childVal;
          }
        }

        return result;
      }

      const rootElement = doc.documentElement;
      const rootObj = { [rootElement.tagName]: domNodeToObj(rootElement) };
      return yaml.dump(rootObj, { indent, lineWidth: -1, noRefs: true }).trimEnd() + '\n';
    } else {
      // Basic fallback
      return `root:\n  value: "${xmlStr.replace(/"/g, '\\"')}"\n`;
    }
  } catch (err: any) {
    throw new Error(`XML to YAML conversion failed: ${err?.message || 'Invalid XML'}`);
  }
}

/**
 * Converts YAML to CSV format.
 */
export function yamlToCsv(yamlStr: string, delimiter: string = ','): string {
  try {
    const docs = yaml.loadAll(yamlStr);
    if (docs.length === 0) return '';

    let items: any[] = [];
    if (Array.isArray(docs[0])) {
      items = docs[0];
    } else if (docs.length > 1) {
      items = docs;
    } else if (typeof docs[0] === 'object' && docs[0] !== null) {
      // Single object - check if it has an array property or is a single row
      const firstDoc = docs[0] as any;
      const keys = Object.keys(firstDoc);
      const arrayKey = keys.find((k) => Array.isArray(firstDoc[k]));
      if (arrayKey) {
        items = firstDoc[arrayKey];
      } else {
        items = [firstDoc];
      }
    } else {
      return String(docs[0]);
    }

    if (items.length === 0) return '';

    // Collect all headers
    const headerSet = new Set<string>();
    items.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach((k) => headerSet.add(k));
      }
    });

    const headers = Array.from(headerSet);
    if (headers.length === 0) {
      return items.map((it) => String(it)).join('\n');
    }

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerRow = headers.map(escapeCsv).join(delimiter);
    const dataRows = items.map((item) =>
      headers
        .map((h) => (typeof item === 'object' && item !== null ? escapeCsv(item[h]) : ''))
        .join(delimiter)
    );

    return [headerRow, ...dataRows].join('\n');
  } catch (err: any) {
    throw new Error(`YAML to CSV conversion failed: ${err?.message || 'Invalid YAML'}`);
  }
}

/**
 * Converts CSV/TSV text to YAML list of objects.
 */
export function csvToYaml(csvStr: string, delimiter: string = ',', indent: number = 2): string {
  try {
    const lines = csvStr
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return '';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let inQuotes = false;
      let cur = '';

      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === delimiter && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
      const values = parseLine(line);
      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const rawVal = values[idx] || '';
        if (rawVal === 'true') rowObj[h] = true;
        else if (rawVal === 'false') rowObj[h] = false;
        else if (rawVal === 'null') rowObj[h] = null;
        else if (!isNaN(Number(rawVal)) && rawVal !== '') rowObj[h] = Number(rawVal);
        else rowObj[h] = rawVal;
      });
      return rowObj;
    });

    return yaml.dump(rows, { indent, lineWidth: -1, noRefs: true }).trimEnd() + '\n';
  } catch (err: any) {
    throw new Error(`CSV to YAML conversion failed: ${err?.message || 'Invalid CSV'}`);
  }
}

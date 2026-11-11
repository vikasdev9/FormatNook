import yaml from 'js-yaml';
import {
  JsonTransformResult,
  CsvOptions,
  XmlOptions,
  FlattenOptions,
  SortKeysOptions,
  SortArrayOptions,
  FilterOptions,
  DeduplicateOptions,
} from '../types/json.types';

/**
 * Converts a JSON document to standard CSV format with configurable options.
 */
export function jsonToCsv(data: any, options: CsvOptions = {}): JsonTransformResult {
  const delimiter = options.delimiter || ',';
  const nestedStrategy = options.nestedStrategy || 'json-string';

  if (data === null || data === undefined) {
    return { output: '', format: 'csv', notes: 'Empty input.' };
  }

  function escapeCell(val: string): string {
    if (val.includes(delimiter) || val.includes('"') || val.includes('\n') || val.includes('\r')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  // Helper to resolve cell value based on nestedStrategy
  function formatValue(v: any): string {
    if (v === undefined || v === null) return '';
    if (typeof v === 'object') {
      if (nestedStrategy === 'discard') return '';
      return JSON.stringify(v);
    }
    return String(v);
  }

  // Pre-process data if nestedStrategy is 'flatten'
  let targetData = data;
  if (nestedStrategy === 'flatten' && Array.isArray(data)) {
    targetData = data.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const flatRes = flattenObjectInternal(item, '.');
        return flatRes;
      }
      return item;
    });
  }

  // Case 1: Array of items (most common tabular CSV use case)
  if (Array.isArray(targetData)) {
    if (targetData.length === 0) {
      return { output: '', format: 'csv', notes: 'Empty array.' };
    }

    const headersSet = new Set<string>();
    let hasNestedStructures = false;

    for (const item of targetData) {
      if (typeof item === 'object' && item !== null) {
        for (const k of Object.keys(item)) {
          headersSet.add(k);
          if (typeof item[k] === 'object' && item[k] !== null) {
            hasNestedStructures = true;
          }
        }
      }
    }

    let headers = Array.from(headersSet);
    if (options.customColumns && options.customColumns.length > 0) {
      headers = options.customColumns;
    }

    if (headers.length === 0) {
      // Array of primitives
      const rows = ['Value', ...targetData.map((v) => escapeCell(String(v)))];
      return { output: rows.join('\n'), format: 'csv' };
    }

    const rows: string[] = [headers.map(escapeCell).join(delimiter)];

    for (const item of targetData) {
      const row = headers.map((header) => {
        if (!item || typeof item !== 'object') return '';
        const val = item[header];
        return escapeCell(formatValue(val));
      });
      rows.push(row.join(delimiter));
    }

    return {
      output: rows.join('\n'),
      format: 'csv',
      isLossy: hasNestedStructures && nestedStrategy !== 'flatten',
      notes: hasNestedStructures
        ? `Nested structures were processed using strategy: ${nestedStrategy}.`
        : undefined,
    };
  }

  // Case 2: Single object -> 2-column Key/Value table
  if (typeof targetData === 'object') {
    const rows = [`Key${delimiter}Value`];
    let hasNestedStructures = false;

    for (const [k, v] of Object.entries(targetData)) {
      if (typeof v === 'object' && v !== null) {
        hasNestedStructures = true;
      }
      rows.push(`${escapeCell(k)}${delimiter}${escapeCell(formatValue(v))}`);
    }

    return {
      output: rows.join('\n'),
      format: 'csv',
      isLossy: hasNestedStructures,
      notes: hasNestedStructures
        ? 'Nested structures were serialized in the Value column.'
        : undefined,
    };
  }

  return { output: `Value\n${escapeCell(String(targetData))}`, format: 'csv' };
}

/**
 * Converts JSON to well-formatted XML with configurable root and item tags.
 */
export function jsonToXml(data: any, options: XmlOptions = {}): JsonTransformResult {
  const rootTag = options.rootTag ? options.rootTag.replace(/[^a-zA-Z0-9_.-]/g, '_') : 'root';
  const itemTag = options.itemTag ? options.itemTag.replace(/[^a-zA-Z0-9_.-]/g, '_') : 'item';

  if (data === null || data === undefined) {
    return { output: `<${rootTag}></${rootTag}>`, format: 'xml' };
  }

  let isLossy = false;

  function toXml(node: any, tagName: string): string {
    if (node === null || node === undefined) {
      return `<${tagName}/>`;
    }

    if (Array.isArray(node)) {
      return node.map((item) => toXml(item, itemTag)).join('\n');
    }

    if (typeof node === 'object') {
      const children: string[] = [];
      for (const [key, val] of Object.entries(node)) {
        const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
        if (safeKey !== key) isLossy = true;
        children.push(toXml(val, safeKey));
      }
      return `<${tagName}>\n${children.join('\n')}\n</${tagName}>`;
    }

    const textVal = String(node)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    return `<${tagName}>${textVal}</${tagName}>`;
  }

  const xmlBody = typeof data === 'object' && !Array.isArray(data)
    ? Object.entries(data)
        .map(([k, v]) => toXml(v, k.replace(/[^a-zA-Z0-9_.-]/g, '_')))
        .join('\n')
    : toXml(data, itemTag);

  return {
    output: `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n${xmlBody}\n</${rootTag}>`,
    format: 'xml',
    isLossy,
    notes: isLossy ? 'Some special characters in property names were sanitized for XML compliance.' : undefined,
  };
}

/**
 * Converts JSON to clean YAML format.
 */
export function jsonToYaml(data: any, options: { indent?: number } = {}): JsonTransformResult {
  if (data === null || data === undefined) {
    return { output: '', format: 'yaml' };
  }

  try {
    const yamlString = yaml.dump(data, {
      indent: options.indent || 2,
      noRefs: true,
      sortKeys: false,
    });
    return { output: yamlString, format: 'yaml' };
  } catch (err: any) {
    return {
      output: `Error converting to YAML: ${err?.message || 'Invalid data'}`,
      format: 'yaml',
      isLossy: true,
      notes: 'YAML serialization failed for this data structure.',
    };
  }
}

/**
 * Helper to recursively flatten an object
 */
function flattenObjectInternal(data: any, separator: string = '.'): Record<string, any> {
  const result: Record<string, any> = {};

  function recurse(cur: any, prop: string) {
    if (Object(cur) !== cur || cur === null) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      if (cur.length === 0) {
        result[prop] = [];
      } else {
        for (let i = 0; i < cur.length; i++) {
          recurse(cur[i], prop ? `${prop}[${i}]` : `[${i}]`);
        }
      }
    } else {
      const keys = Object.keys(cur);
      if (keys.length === 0) {
        result[prop] = {};
      } else {
        for (const k of keys) {
          recurse(cur[k], prop ? `${prop}${separator}${k}` : k);
        }
      }
    }
  }

  recurse(data, '');
  return result;
}

/**
 * Flattens nested JSON object into a flat key-value map.
 */
export function flattenJson(data: any, options: FlattenOptions = {}): JsonTransformResult {
  const sep = options.separator || '.';
  if (typeof data !== 'object' || data === null) {
    return { output: JSON.stringify(data, null, 2), format: 'json' };
  }

  const flattened = flattenObjectInternal(data, sep);
  return { output: JSON.stringify(flattened, null, 2), format: 'json' };
}

/**
 * Unflattens flat dot-notated or custom-delimited JSON back into nested hierarchy.
 */
export function unflattenJson(data: Record<string, any>, options: FlattenOptions = {}): JsonTransformResult {
  const sep = options.separator || '.';
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { output: JSON.stringify(data, null, 2), format: 'json' };
  }

  const result: any = {};
  const conflictWarnings: string[] = [];

  for (const flatKey of Object.keys(data)) {
    const value = data[flatKey];
    // Convert array bracket notation [0] into separator steps
    const normalizedKey = flatKey.replace(/\[(\w+)\]/g, `${sep}$1`);
    const parts = normalizedKey.split(sep);
    let curr = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        if (curr[part] !== undefined && typeof curr[part] === 'object' && curr[part] !== null) {
          conflictWarnings.push(`Path conflict detected at "${flatKey}": existing nested object was overwritten.`);
        }
        curr[part] = value;
      } else {
        const nextPart = parts[i + 1];
        const isNextIndex = /^\d+$/.test(nextPart);

        if (typeof curr[part] !== 'object' || curr[part] === null) {
          if (curr[part] !== undefined) {
            conflictWarnings.push(`Path conflict at "${part}": primitive was converted to container.`);
          }
          curr[part] = isNextIndex ? [] : {};
        }
        curr = curr[part];
      }
    }
  }

  return {
    output: JSON.stringify(result, null, 2),
    format: 'json',
    isLossy: conflictWarnings.length > 0,
    notes: conflictWarnings.length > 0 ? conflictWarnings.join(' ') : undefined,
  };
}

/**
 * Sorts all object keys recursively with direction and case-sensitivity options.
 */
export function sortJsonKeys(data: any, options: SortKeysOptions = {}): JsonTransformResult {
  const direction = options.direction || 'asc';
  const caseSensitive = options.caseSensitive !== false;
  const preserveArrayOrder = options.preserveArrayOrder !== false;

  function sortKeysRecursive(node: any): any {
    if (node === null || typeof node !== 'object') {
      return node;
    }
    if (Array.isArray(node)) {
      return preserveArrayOrder ? node.map(sortKeysRecursive) : node.map(sortKeysRecursive);
    }

    const keys = Object.keys(node);
    keys.sort((a, b) => {
      const compA = caseSensitive ? a : a.toLowerCase();
      const compB = caseSensitive ? b : b.toLowerCase();
      const cmp = compA.localeCompare(compB);
      return direction === 'asc' ? cmp : -cmp;
    });

    const sortedObj: Record<string, any> = {};
    for (const key of keys) {
      sortedObj[key] = sortKeysRecursive(node[key]);
    }
    return sortedObj;
  }

  const sorted = sortKeysRecursive(data);
  return { output: JSON.stringify(sorted, null, 2), format: 'json' };
}

/**
 * Sorts array elements by a chosen property or value with type awareness.
 */
export function sortJsonArray(data: any, options: SortArrayOptions = {}): JsonTransformResult {
  if (!Array.isArray(data)) {
    return {
      output: JSON.stringify(data, null, 2),
      format: 'json',
      notes: 'Root input is not an array; array sorting requires an array input.',
    };
  }

  const prop = options.sortProperty;
  const dir = options.direction || 'asc';
  const type = options.propertyType || 'auto';

  const sorted = [...data].sort((a, b) => {
    let valA = prop ? (a && typeof a === 'object' ? a[prop] : undefined) : a;
    let valB = prop ? (b && typeof b === 'object' ? b[prop] : undefined) : b;

    // Put nulls and undefined at the end
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    let cmp = 0;
    if (type === 'number' || (type === 'auto' && typeof valA === 'number' && typeof valB === 'number')) {
      cmp = Number(valA) - Number(valB);
    } else if (type === 'date') {
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      cmp = dateA - dateB;
    } else if (type === 'boolean') {
      cmp = (valA === valB ? 0 : valA ? 1 : -1);
    } else {
      cmp = String(valA).localeCompare(String(valB));
    }

    return dir === 'asc' ? cmp : -cmp;
  });

  return { output: JSON.stringify(sorted, null, 2), format: 'json' };
}

/**
 * Filters JSON object or array by property name, value, and conditions.
 */
export function filterJson(data: any, options: FilterOptions): JsonTransformResult {
  const { conditions, matchAll = true } = options;

  if (!conditions || conditions.length === 0) {
    return { output: JSON.stringify(data, null, 2), format: 'json' };
  }

  function matchesItem(item: any): boolean {
    if (typeof item !== 'object' || item === null) return false;

    const results = conditions.map((cond) => {
      const targetVal = item[cond.field];
      if (cond.operator === 'type') {
        if (targetVal === null) return cond.value === 'null';
        if (Array.isArray(targetVal)) return cond.value === 'array';
        return typeof targetVal === cond.value;
      }

      if (targetVal === undefined || targetVal === null) return false;

      const strTarget = cond.caseSensitive ? String(targetVal) : String(targetVal).toLowerCase();
      const strVal = cond.caseSensitive ? cond.value : cond.value.toLowerCase();

      switch (cond.operator) {
        case 'equals':
          return strTarget === strVal;
        case 'contains':
          return strTarget.includes(strVal);
        case 'starts_with':
          return strTarget.startsWith(strVal);
        default:
          return false;
      }
    });

    return matchAll ? results.every(Boolean) : results.some(Boolean);
  }

  let filteredResult: any;

  if (Array.isArray(data)) {
    filteredResult = data.filter(matchesItem);
  } else if (typeof data === 'object' && data !== null) {
    // Filter object entries
    const objRes: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'object' && v !== null && matchesItem(v)) {
        objRes[k] = v;
      }
    }
    filteredResult = objRes;
  } else {
    filteredResult = data;
  }

  return {
    output: JSON.stringify(filteredResult, null, 2),
    format: 'json',
    notes: Array.isArray(data)
      ? `Filtered ${filteredResult.length} matching items out of ${data.length} total.`
      : undefined,
  };
}

/**
 * Deduplicates array elements with support for specific property comparison in arrays of objects.
 */
export function deduplicateJsonArrays(data: any, options: DeduplicateOptions = {}): JsonTransformResult {
  const propKey = options.propertyKey;
  let removedCount = 0;

  function dedupRecursive(node: any): any {
    if (node === null || typeof node !== 'object') {
      return node;
    }

    if (Array.isArray(node)) {
      const seen = new Set<string>();
      const deduped: any[] = [];

      for (const item of node) {
        let key: string;
        if (propKey && item && typeof item === 'object') {
          key = JSON.stringify(item[propKey]);
        } else {
          key = JSON.stringify(item);
        }

        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(dedupRecursive(item));
        } else {
          removedCount++;
        }
      }
      return deduped;
    }

    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      result[k] = dedupRecursive(v);
    }
    return result;
  }

  const deduped = dedupRecursive(data);
  return {
    output: JSON.stringify(deduped, null, 2),
    format: 'json',
    notes: `Removed ${removedCount} duplicate ${removedCount === 1 ? 'element' : 'elements'}.`,
  };
}

/**
 * Escapes a JSON string for embedding.
 */
export function escapeJsonString(input: string): JsonTransformResult {
  return { output: JSON.stringify(input), format: 'text' };
}

/**
 * Unescapes an escaped JSON string.
 */
export function unescapeJsonString(input: string): JsonTransformResult {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'string') {
      return { output: parsed, format: 'text' };
    }
    return { output: input, format: 'text' };
  } catch {
    const unescaped = input
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');
    return { output: unescaped, format: 'text' };
  }
}

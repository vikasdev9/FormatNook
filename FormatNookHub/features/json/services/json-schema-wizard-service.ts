/**
 * JSON Schema Wizard Service
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

import {
  JsonSchemaDraft,
  SchemaGeneratorOptions,
  SchemaValidationError,
  SchemaValidationResult,
} from '../types/schema-wizard.types';

export const DEFAULT_SCHEMA_OPTIONS: SchemaGeneratorOptions = {
  draft: '2020-12',
  includeRequired: true,
  detectEnums: true,
  enumMaxCount: 5,
  detectFormats: true,
};

const DRAFT_URIS: Record<JsonSchemaDraft, string> = {
  'draft-07': 'http://json-schema.org/draft-07/schema#',
  '2019-09': 'https://json-schema.org/draft/2019-09/schema',
  '2020-12': 'https://json-schema.org/draft/2020-12/schema',
};

// Common string format matchers
const FORMAT_REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  uri: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ipv4: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/,
};

/**
 * Determine JSON data type
 */
export function getJsonType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'string') return 'string';
  return 'string';
}

/**
 * Detect string format
 */
function detectStringFormat(str: string): string | undefined {
  if (FORMAT_REGEX.uuid.test(str)) return 'uuid';
  if (FORMAT_REGEX.email.test(str)) return 'email';
  if (FORMAT_REGEX['date-time'].test(str)) return 'date-time';
  if (FORMAT_REGEX.date.test(str)) return 'date';
  if (FORMAT_REGEX.uri.test(str)) return 'uri';
  if (FORMAT_REGEX.ipv4.test(str)) return 'ipv4';
  return undefined;
}

/**
 * Generates JSON Schema from arbitrary JSON value
 */
export function generateJsonSchema(
  data: any,
  options: Partial<SchemaGeneratorOptions> = {}
): any {
  const opts: SchemaGeneratorOptions = { ...DEFAULT_SCHEMA_OPTIONS, ...options };
  const schemaDraftUri = DRAFT_URIS[opts.draft] || DRAFT_URIS['2020-12'];

  function buildNodeSchema(val: any): any {
    const type = getJsonType(val);

    if (type === 'null') {
      return { type: 'null' };
    }

    if (type === 'boolean') {
      return { type: 'boolean' };
    }

    if (type === 'integer' || type === 'number') {
      return { type };
    }

    if (type === 'string') {
      const node: any = { type: 'string' };
      if (opts.detectFormats) {
        const fmt = detectStringFormat(val);
        if (fmt) node.format = fmt;
      }
      return node;
    }

    if (type === 'array') {
      const node: any = { type: 'array' };
      if (val.length === 0) {
        node.items = {};
      } else {
        // Collect types of array items
        const itemTypes = new Set<string>(val.map(getJsonType));

        if (itemTypes.has('object')) {
          // Merge properties of all object items in array
          const mergedProps: Record<string, any> = {};
          const commonRequired = new Set<string>(Object.keys(val[0] || {}));

          for (const item of val) {
            if (typeof item === 'object' && item !== null) {
              const currentKeys = new Set(Object.keys(item));
              for (const k of Array.from(commonRequired)) {
                if (!currentKeys.has(k)) commonRequired.delete(k);
              }
              for (const [k, v] of Object.entries(item)) {
                if (!mergedProps[k]) {
                  mergedProps[k] = buildNodeSchema(v);
                }
              }
            }
          }

          const itemsSchema: any = {
            type: 'object',
            properties: mergedProps,
          };

          if (opts.includeRequired && commonRequired.size > 0) {
            itemsSchema.required = Array.from(commonRequired);
          }

          node.items = itemsSchema;
        } else if (itemTypes.size === 1) {
          // Homogeneous array of primitives
          const primItem = val[0];
          const itemSchema = buildNodeSchema(primItem);

          if (opts.detectEnums && val.length > 2 && (itemTypes.has('string') || itemTypes.has('number') || itemTypes.has('integer'))) {
            const uniqueVals = Array.from(new Set(val));
            if (uniqueVals.length <= (opts.enumMaxCount || 5) && uniqueVals.length < val.length) {
              itemSchema.enum = uniqueVals;
            }
          }

          node.items = itemSchema;
        } else {
          node.items = {};
        }
      }
      return node;
    }

    if (type === 'object') {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, propVal] of Object.entries(val || {})) {
        properties[key] = buildNodeSchema(propVal);
        if (opts.includeRequired) {
          required.push(key);
        }
      }

      const node: any = {
        type: 'object',
        properties,
      };

      if (opts.includeRequired && required.length > 0) {
        node.required = required;
      }

      return node;
    }

    return {};
  }

  const rootSchema = buildNodeSchema(data);
  rootSchema.$schema = schemaDraftUri;
  if (opts.title) rootSchema.title = opts.title;
  if (opts.description) rootSchema.description = opts.description;

  return rootSchema;
}

/**
 * Validates JSON against a given schema and produces actionable error details with JSONPaths
 */
export function validateJsonAgainstSchema(data: any, schema: any): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];
  const evaluatedAt = Date.now();

  if (!schema || typeof schema !== 'object') {
    return { isValid: true, errors: [], evaluatedAt };
  }

  function validateNode(node: any, curSchema: any, path: string) {
    if (!curSchema || typeof curSchema !== 'object') return;

    // Type validation
    if (curSchema.type) {
      const allowed = Array.isArray(curSchema.type) ? curSchema.type : [curSchema.type];
      const actual = getJsonType(node);
      const matches = allowed.some((t: string) => {
        if (t === 'number' && actual === 'integer') return true;
        return t === actual;
      });

      if (!matches && node !== undefined) {
        errors.push({
          path,
          message: `Expected type ${JSON.stringify(allowed)} but got "${actual}"`,
          keyword: 'type',
          expected: allowed,
          actual,
        });
        return; // Don't test deeper rules on mismatch
      }
    }

    // Enum validation
    if (Array.isArray(curSchema.enum) && node !== undefined) {
      const inEnum = curSchema.enum.some((val: any) => JSON.stringify(val) === JSON.stringify(node));
      if (!inEnum) {
        errors.push({
          path,
          message: `Value must be one of allowable enum choices: ${JSON.stringify(curSchema.enum)}`,
          keyword: 'enum',
          expected: curSchema.enum,
          actual: node,
        });
      }
    }

    // Numbers
    if (typeof node === 'number') {
      if (typeof curSchema.minimum === 'number' && node < curSchema.minimum) {
        errors.push({
          path,
          message: `Value ${node} is less than minimum ${curSchema.minimum}`,
          keyword: 'minimum',
          expected: curSchema.minimum,
          actual: node,
        });
      }
      if (typeof curSchema.maximum === 'number' && node > curSchema.maximum) {
        errors.push({
          path,
          message: `Value ${node} exceeds maximum ${curSchema.maximum}`,
          keyword: 'maximum',
          expected: curSchema.maximum,
          actual: node,
        });
      }
    }

    // Strings
    if (typeof node === 'string') {
      if (typeof curSchema.minLength === 'number' && node.length < curSchema.minLength) {
        errors.push({
          path,
          message: `String length ${node.length} is shorter than minLength ${curSchema.minLength}`,
          keyword: 'minLength',
          expected: curSchema.minLength,
          actual: node.length,
        });
      }
      if (typeof curSchema.maxLength === 'number' && node.length > curSchema.maxLength) {
        errors.push({
          path,
          message: `String length ${node.length} exceeds maxLength ${curSchema.maxLength}`,
          keyword: 'maxLength',
          expected: curSchema.maxLength,
          actual: node.length,
        });
      }
      if (typeof curSchema.pattern === 'string') {
        try {
          const rx = new RegExp(curSchema.pattern);
          if (!rx.test(node)) {
            errors.push({
              path,
              message: `String does not match pattern /${curSchema.pattern}/`,
              keyword: 'pattern',
              expected: curSchema.pattern,
              actual: node,
            });
          }
        } catch {
          // ignore invalid pattern regex
        }
      }
      if (typeof curSchema.format === 'string' && FORMAT_REGEX[curSchema.format as keyof typeof FORMAT_REGEX]) {
        const rx = FORMAT_REGEX[curSchema.format as keyof typeof FORMAT_REGEX];
        if (!rx.test(node)) {
          errors.push({
            path,
            message: `String format is invalid for "${curSchema.format}"`,
            keyword: 'format',
            expected: curSchema.format,
            actual: node,
          });
        }
      }
    }

    // Objects
    if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
      if (Array.isArray(curSchema.required)) {
        for (const reqKey of curSchema.required) {
          if (!(reqKey in node) || node[reqKey] === undefined) {
            errors.push({
              path: path === '$' ? `$.${reqKey}` : `${path}.${reqKey}`,
              message: `Missing required property "${reqKey}"`,
              keyword: 'required',
              expected: reqKey,
            });
          }
        }
      }

      if (curSchema.properties && typeof curSchema.properties === 'object') {
        for (const [key, propSchema] of Object.entries(curSchema.properties)) {
          if (key in node) {
            validateNode(node[key], propSchema, path === '$' ? `$.${key}` : `${path}.${key}`);
          }
        }
      }

      if (curSchema.additionalProperties === false && curSchema.properties) {
        const allowedKeys = new Set(Object.keys(curSchema.properties));
        for (const actualKey of Object.keys(node)) {
          if (!allowedKeys.has(actualKey)) {
            errors.push({
              path: path === '$' ? `$.${actualKey}` : `${path}.${actualKey}`,
              message: `Additional property "${actualKey}" is not allowed`,
              keyword: 'additionalProperties',
              actual: actualKey,
            });
          }
        }
      }
    }

    // Arrays
    if (Array.isArray(node)) {
      if (typeof curSchema.minItems === 'number' && node.length < curSchema.minItems) {
        errors.push({
          path,
          message: `Array length ${node.length} is less than minItems ${curSchema.minItems}`,
          keyword: 'minItems',
          expected: curSchema.minItems,
          actual: node.length,
        });
      }
      if (typeof curSchema.maxItems === 'number' && node.length > curSchema.maxItems) {
        errors.push({
          path,
          message: `Array length ${node.length} exceeds maxItems ${curSchema.maxItems}`,
          keyword: 'maxItems',
          expected: curSchema.maxItems,
          actual: node.length,
        });
      }
      if (curSchema.items && typeof curSchema.items === 'object') {
        for (let i = 0; i < node.length; i++) {
          validateNode(node[i], curSchema.items, `${path}[${i}]`);
        }
      }
    }
  }

  validateNode(data, schema, '$');
  return {
    isValid: errors.length === 0,
    errors,
    evaluatedAt,
  };
}

/**
 * Generate compliant sample JSON data from JSON Schema
 */
export function generateSampleFromSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return null;

  function synthesize(node: any): any {
    if (!node || typeof node !== 'object') return '';

    if (Array.isArray(node.enum) && node.enum.length > 0) {
      return node.enum[0];
    }

    if (node.default !== undefined) {
      return node.default;
    }

    const type = Array.isArray(node.type) ? node.type[0] : node.type;

    switch (type) {
      case 'string':
        if (node.format === 'email') return 'user@example.com';
        if (node.format === 'date-time') return '2025-01-15T08:30:00.000Z';
        if (node.format === 'date') return '2025-01-15';
        if (node.format === 'uri') return 'https://example.com';
        if (node.format === 'uuid') return 'a1b2c3d4-e5f6-47a8-b901-23456789abcd';
        if (node.format === 'ipv4') return '192.168.1.1';
        return 'sample string';

      case 'integer':
        return node.minimum ?? 10;

      case 'number':
        return node.minimum ?? 99.95;

      case 'boolean':
        return true;

      case 'null':
        return null;

      case 'array':
        if (node.items && typeof node.items === 'object') {
          return [synthesize(node.items)];
        }
        return [];

      case 'object':
      default: {
        const obj: Record<string, any> = {};
        const props = node.properties || {};
        for (const [key, propDef] of Object.entries(props)) {
          obj[key] = synthesize(propDef);
        }
        return obj;
      }
    }
  }

  return synthesize(schema);
}

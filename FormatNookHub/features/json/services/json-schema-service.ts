export interface JsonSchemaError {
  path: string;
  message: string;
}

export interface JsonSchemaValidationResult {
  isValid: boolean;
  errors: JsonSchemaError[];
}

export function validateJsonSchema(data: any, schema: any): JsonSchemaValidationResult {
  const errors: JsonSchemaError[] = [];

  function validateNode(node: any, curSchema: any, path: string) {
    if (!curSchema || typeof curSchema !== 'object') return;

    // Type validation
    if (curSchema.type) {
      const types = Array.isArray(curSchema.type) ? curSchema.type : [curSchema.type];
      const actualType = getNodeType(node);
      const matchesType = types.some((t: string) => {
        if (t === 'integer') return typeof node === 'number' && Number.isInteger(node);
        return t === actualType;
      });

      if (!matchesType && node !== undefined) {
        errors.push({
          path,
          message: `Expected type "${types.join(' | ')}" but found "${actualType}"`,
        });
        return; // Skip inner checks if primary type does not match
      }
    }

    // Enum validation
    if (Array.isArray(curSchema.enum) && node !== undefined) {
      const inEnum = curSchema.enum.some((val: any) => JSON.stringify(val) === JSON.stringify(node));
      if (!inEnum) {
        errors.push({
          path,
          message: `Value is not one of allowable enum options: ${JSON.stringify(curSchema.enum)}`,
        });
      }
    }

    // Number constraints
    if (typeof node === 'number') {
      if (typeof curSchema.minimum === 'number' && node < curSchema.minimum) {
        errors.push({ path, message: `Value ${node} is less than minimum ${curSchema.minimum}` });
      }
      if (typeof curSchema.maximum === 'number' && node > curSchema.maximum) {
        errors.push({ path, message: `Value ${node} is greater than maximum ${curSchema.maximum}` });
      }
    }

    // String constraints
    if (typeof node === 'string') {
      if (typeof curSchema.minLength === 'number' && node.length < curSchema.minLength) {
        errors.push({ path, message: `String length ${node.length} is less than minLength ${curSchema.minLength}` });
      }
      if (typeof curSchema.maxLength === 'number' && node.length > curSchema.maxLength) {
        errors.push({ path, message: `String length ${node.length} exceeds maxLength ${curSchema.maxLength}` });
      }
      if (typeof curSchema.pattern === 'string') {
        try {
          const rx = new RegExp(curSchema.pattern);
          if (!rx.test(node)) {
            errors.push({ path, message: `String does not match required pattern /${curSchema.pattern}/` });
          }
        } catch {
          // ignore invalid pattern regex
        }
      }
    }

    // Object constraints
    if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
      if (Array.isArray(curSchema.required)) {
        for (const reqKey of curSchema.required) {
          if (!(reqKey in node) || node[reqKey] === undefined) {
            errors.push({
              path: path === '$' ? `$.${reqKey}` : `${path}.${reqKey}`,
              message: `Required property "${reqKey}" is missing`,
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
    }

    // Array constraints
    if (Array.isArray(node)) {
      if (typeof curSchema.minItems === 'number' && node.length < curSchema.minItems) {
        errors.push({ path, message: `Array items count ${node.length} is less than minItems ${curSchema.minItems}` });
      }
      if (typeof curSchema.maxItems === 'number' && node.length > curSchema.maxItems) {
        errors.push({ path, message: `Array items count ${node.length} exceeds maxItems ${curSchema.maxItems}` });
      }
      if (curSchema.items && typeof curSchema.items === 'object') {
        node.forEach((item, index) => {
          validateNode(item, curSchema.items, `${path}[${index}]`);
        });
      }
    }
  }

  function getNodeType(val: any): string {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  }

  validateNode(data, schema, '$');

  return {
    isValid: errors.length === 0,
    errors,
  };
}


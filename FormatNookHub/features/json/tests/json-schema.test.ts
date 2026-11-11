import { describe, it, expect } from 'vitest';
import { validateJsonSchema } from '../services/json-schema-service';

describe('json-schema-service', () => {
  it('validates correct types and required fields', () => {
    const schema = {
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number', minimum: 18 },
      },
    };

    const validData = { name: 'Alex', age: 25 };
    const res = validateJsonSchema(validData, schema);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('reports missing required properties and constraint failures', () => {
    const schema = {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 3 },
        email: { type: 'string' },
        role: { type: 'string', enum: ['admin', 'user'] },
      },
    };

    const invalidData = {
      name: 'Al', // minLength failure
      role: 'superadmin', // enum failure
    };

    const res = validateJsonSchema(invalidData, schema);
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(3);
    expect(res.errors.some((e) => e.message.includes('Required property "email"'))).toBe(true);
    expect(res.errors.some((e) => e.message.includes('minLength'))).toBe(true);
    expect(res.errors.some((e) => e.message.includes('enum'))).toBe(true);
  });

  it('validates array items', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'number',
      },
    };

    const invalidData = [1, 2, 'three'];
    const res = validateJsonSchema(invalidData, schema);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].path).toBe('$[2]');
  });
});


import { describe, it, expect } from 'vitest';
import {
  generateJsonSchema,
  validateJsonAgainstSchema,
  generateSampleFromSchema,
  getJsonType,
} from '../services/json-schema-wizard-service';

describe('JSON Schema Wizard Service', () => {
  const sampleUser = {
    id: 101,
    name: 'Alice Cooper',
    email: 'alice@example.com',
    isActive: true,
    created: '2025-01-15T08:30:00.000Z',
    address: {
      city: 'Seattle',
      zip: '98101',
    },
    roles: ['admin', 'developer', 'admin'],
  };

  it('determines JSON types accurately', () => {
    expect(getJsonType(null)).toBe('null');
    expect(getJsonType(123)).toBe('integer');
    expect(getJsonType(45.67)).toBe('number');
    expect(getJsonType('hello')).toBe('string');
    expect(getJsonType(true)).toBe('boolean');
    expect(getJsonType([])).toBe('array');
    expect(getJsonType({})).toBe('object');
  });

  it('generates Draft-07, 2019-09, and 2020-12 schemas', () => {
    const s7 = generateJsonSchema(sampleUser, { draft: 'draft-07' });
    expect(s7.$schema).toBe('http://json-schema.org/draft-07/schema#');

    const s19 = generateJsonSchema(sampleUser, { draft: '2019-09' });
    expect(s19.$schema).toBe('https://json-schema.org/draft/2019-09/schema');

    const s20 = generateJsonSchema(sampleUser, { draft: '2020-12' });
    expect(s20.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
  });

  it('detects nested objects, properties, formats, and required fields', () => {
    const schema = generateJsonSchema(sampleUser, { includeRequired: true, detectFormats: true });

    expect(schema.type).toBe('object');
    expect(schema.required).toContain('id');
    expect(schema.required).toContain('name');
    expect(schema.required).toContain('email');

    expect(schema.properties.email.type).toBe('string');
    expect(schema.properties.email.format).toBe('email');

    expect(schema.properties.created.format).toBe('date-time');

    // Nested object checks
    expect(schema.properties.address.type).toBe('object');
    expect(schema.properties.address.properties.city.type).toBe('string');
    expect(schema.properties.address.required).toContain('city');
  });

  it('detects enums for repeated array values', () => {
    const data = {
      statusHistory: ['active', 'inactive', 'active', 'active', 'inactive'],
    };
    const schema = generateJsonSchema(data, { detectEnums: true });
    expect(schema.properties.statusHistory.items.enum).toEqual(['active', 'inactive']);
  });

  it('merges object properties across array items', () => {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
    const schema = generateJsonSchema(users);
    expect(schema.type).toBe('array');
    expect(schema.items.type).toBe('object');
    expect(schema.items.properties.id).toBeDefined();
    expect(schema.items.properties.name).toBeDefined();
    expect(schema.items.properties.email).toBeDefined();
    // Common required is id and name, but not email
    expect(schema.items.required).toContain('id');
    expect(schema.items.required).toContain('name');
    expect(schema.items.required).not.toContain('email');
  });

  it('validates compliant and non-compliant JSON against schema', () => {
    const schema = {
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string', minLength: 3 },
        age: { type: 'integer', minimum: 18 },
        email: { type: 'string', format: 'email' },
      },
    };

    // Valid
    const validRes = validateJsonAgainstSchema({ name: 'Charlie', age: 25, email: 'c@test.com' }, schema);
    expect(validRes.isValid).toBe(true);
    expect(validRes.errors).toHaveLength(0);

    // Invalid (missing required age, short name, invalid email)
    const invalidRes = validateJsonAgainstSchema({ name: 'Al', email: 'not-an-email' }, schema);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.errors.length).toBeGreaterThanOrEqual(3);

    const paths = invalidRes.errors.map((e) => e.path);
    expect(paths).toContain('$.age');
    expect(paths).toContain('$.name');
    expect(paths).toContain('$.email');
  });

  it('generates sample JSON data conforming to a schema', () => {
    const schema = {
      type: 'object',
      properties: {
        userId: { type: 'integer', minimum: 1 },
        email: { type: 'string', format: 'email' },
        roles: {
          type: 'array',
          items: { type: 'string', enum: ['admin', 'user'] },
        },
      },
    };

    const sample = generateSampleFromSchema(schema);
    expect(sample).toHaveProperty('userId', 1);
    expect(sample).toHaveProperty('email', 'user@example.com');
    expect(sample.roles).toEqual(['admin']);
  });
});

import { describe, it, expect } from 'vitest';
import {
  SeededRandom,
  generateUuid,
  detectFieldCategory,
  extractRulesFromSample,
  extractRulesFromSchema,
  generateFieldValue,
  generateMockData,
  MOCK_PRESETS,
} from '../services/json-mock-generator';
import { MockFieldRule, MockGeneratorConfig } from '../types/mock-generator.types';

describe('JSON Mock Data Generator Engine', () => {
  it('produces deterministic pseudo-random sequences with Mulberry32', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const values1 = [rng1.next(), rng1.nextInt(1, 100), rng1.nextFloat(0, 10, 2)];
    const values2 = [rng2.next(), rng2.nextInt(1, 100), rng2.nextFloat(0, 10, 2)];

    expect(values1).toEqual(values2);
  });

  it('generates valid RFC 4122 v4 UUIDs', () => {
    const rng = new SeededRandom(42);
    const uuid = generateUuid(rng);

    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('detects field categories accurately by name and value heuristics', () => {
    expect(detectFieldCategory('id', 123)).toBe('integer');
    expect(detectFieldCategory('id', 'abc')).toBe('uuid');
    expect(detectFieldCategory('email')).toBe('email');
    expect(detectFieldCategory('user_email')).toBe('email');
    expect(detectFieldCategory('phone')).toBe('phone');
    expect(detectFieldCategory('phoneNumber')).toBe('phone');
    expect(detectFieldCategory('firstName')).toBe('firstName');
    expect(detectFieldCategory('lastName')).toBe('lastName');
    expect(detectFieldCategory('fullName')).toBe('fullName');
    expect(detectFieldCategory('address')).toBe('address');
    expect(detectFieldCategory('city')).toBe('city');
    expect(detectFieldCategory('country')).toBe('country');
    expect(detectFieldCategory('zipCode')).toBe('zipCode');
    expect(detectFieldCategory('company')).toBe('company');
    expect(detectFieldCategory('jobTitle')).toBe('jobTitle');
    expect(detectFieldCategory('price')).toBe('decimal');
    expect(detectFieldCategory('count', 10)).toBe('integer');
    expect(detectFieldCategory('isActive', true)).toBe('boolean');
    expect(detectFieldCategory('createdAt')).toBe('datetime');
    expect(detectFieldCategory('website')).toBe('url');
  });

  it('extracts field rules from sample JSON including nested structures', () => {
    const sample = {
      id: 1,
      name: 'Alex',
      email: 'alex@example.com',
      address: {
        city: 'Mumbai',
        country: 'India',
      },
      tags: ['alpha', 'beta'],
    };

    const rules = extractRulesFromSample(sample);
    expect(rules.length).toBeGreaterThanOrEqual(5);

    const paths = rules.map((r) => r.path);
    expect(paths).toContain('id');
    expect(paths).toContain('name');
    expect(paths).toContain('email');
    expect(paths).toContain('address.city');
    expect(paths).toContain('address.country');
    expect(paths).toContain('tags');
  });

  it('extracts field rules from JSON Schema', () => {
    const schema = {
      type: 'object',
      properties: {
        userId: { type: 'integer', minimum: 1, maximum: 500 },
        email: { type: 'string', format: 'email' },
        status: { type: 'string', enum: ['active', 'pending', 'suspended'] },
      },
    };

    const rules = extractRulesFromSchema(schema);
    expect(rules.length).toBe(3);

    const statusRule = rules.find((r) => r.key === 'status');
    expect(statusRule?.type).toBe('enum');
    expect(statusRule?.enumValues).toEqual(['active', 'pending', 'suspended']);
  });

  it('generates values for all supported field categories', () => {
    const rng = new SeededRandom(999);

    const categories: MockFieldRule[] = [
      { path: 'a', key: 'a', type: 'fullName' },
      { path: 'b', key: 'b', type: 'firstName' },
      { path: 'c', key: 'c', type: 'lastName' },
      { path: 'd', key: 'd', type: 'email' },
      { path: 'e', key: 'e', type: 'phone' },
      { path: 'f', key: 'f', type: 'address' },
      { path: 'g', key: 'g', type: 'city' },
      { path: 'h', key: 'h', type: 'country' },
      { path: 'i', key: 'i', type: 'zipCode' },
      { path: 'j', key: 'j', type: 'company' },
      { path: 'k', key: 'k', type: 'jobTitle' },
      { path: 'l', key: 'l', type: 'uuid' },
      { path: 'm', key: 'm', type: 'integer', min: 10, max: 20 },
      { path: 'n', key: 'n', type: 'decimal', min: 5, max: 15, decimals: 2 },
      { path: 'o', key: 'o', type: 'boolean' },
      { path: 'p', key: 'p', type: 'date' },
      { path: 'q', key: 'q', type: 'datetime' },
      { path: 'r', key: 'r', type: 'url' },
      { path: 's', key: 's', type: 'enum', enumValues: ['red', 'green', 'blue'] },
      { path: 't', key: 't', type: 'custom', customTemplate: 'ORD-####' },
    ];

    for (const rule of categories) {
      const val = generateFieldValue(rule, rng);
      expect(val).toBeDefined();
      if (rule.type === 'integer') {
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThanOrEqual(20);
      } else if (rule.type === 'enum') {
        expect(['red', 'green', 'blue']).toContain(val);
      } else if (rule.type === 'custom') {
        expect(val).toMatch(/^ORD-\d{4}$/);
      }
    }
  });

  it('generates reproducible synthetic datasets given the same seed', () => {
    const sample = {
      id: 1,
      name: 'Alex',
      email: 'alex@example.com',
      price: 1200,
      active: true,
      address: {
        city: 'Mumbai',
      },
    };

    const rules = extractRulesFromSample(sample);
    const config: MockGeneratorConfig = {
      sourceType: 'sample',
      recordCount: 5,
      seed: 8888,
      asArray: true,
      rules,
    };

    const run1 = generateMockData(config, sample);
    const run2 = generateMockData(config, sample);

    expect(run1).toEqual(run2);
    expect(run1.length).toBe(5);
    expect(run1[0].address.city).toBeDefined();
    expect(run1[0].email).toContain('@');
  });

  it('generates a single object when recordCount is 1 and asArray is false', () => {
    const sample = { id: 1, name: 'Single Item' };
    const rules = extractRulesFromSample(sample);
    const config: MockGeneratorConfig = {
      sourceType: 'sample',
      recordCount: 1,
      seed: 123,
      asArray: false,
      rules,
    };

    const result = generateMockData(config, sample);
    expect(Array.isArray(result)).toBe(false);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
  });

  it('supports built-in presets (users, products, orders, employees)', () => {
    expect(MOCK_PRESETS.length).toBe(4);
    for (const preset of MOCK_PRESETS) {
      const rules = extractRulesFromSample(preset.sample);
      const config: MockGeneratorConfig = {
        sourceType: 'preset',
        recordCount: 3,
        seed: 777,
        asArray: true,
        rules,
      };
      const res = generateMockData(config, preset.sample);
      expect(res.length).toBe(3);
    }
  });

  it('handles large generation requests efficiently', () => {
    const sample = { id: 1, name: 'Bulk Test', active: true };
    const rules = extractRulesFromSample(sample);
    const config: MockGeneratorConfig = {
      sourceType: 'sample',
      recordCount: 1000,
      seed: 42,
      asArray: true,
      rules,
    };

    const startTime = performance.now();
    const result = generateMockData(config, sample);
    const duration = performance.now() - startTime;

    expect(result.length).toBe(1000);
    expect(duration).toBeLessThan(500); // 1,000 records generated in < 500ms
  });
});

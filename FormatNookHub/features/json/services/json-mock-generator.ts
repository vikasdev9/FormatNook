/**
 * JSON Mock Data Generator Engine
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

import {
  MockFieldCategory,
  MockFieldRule,
  MockGeneratorConfig,
  MockPresetTemplate,
} from '../types/mock-generator.types';

/**
 * Seeded PRNG using Mulberry32 algorithm
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a float between [0, 1)
   */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number, decimals: number = 2): number {
    const val = this.next() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  }

  nextBoolean(trueProb: number = 0.5): boolean {
    return this.next() < trueProb;
  }

  pick<T>(arr: T[]): T {
    if (!arr || arr.length === 0) return '' as any;
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// Built-in synthetic data dictionaries
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Chris', 'Pat',
  'Avery', 'Riley', 'Cameron', 'Dakota', 'Reese', 'Rowan', 'Jesse', 'Peyton',
  'Devon', 'Kai', 'Skyler', 'Kendall', 'Logan', 'Harper', 'Emerson', 'Finley',
  'Aarav', 'Vihaan', 'Priya', 'Ananya', 'Chen', 'Wei', 'Yuki', 'Kenji'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'Patel', 'Sharma', 'Gupta', 'Tanaka', 'Sato', 'Wong', 'Kim', 'Park'
];

const DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com', 'techhub.io', 'formatnook.dev'];

const CITIES = [
  'New York', 'San Francisco', 'London', 'Tokyo', 'Berlin', 'Paris', 'Toronto',
  'Sydney', 'Singapore', 'Mumbai', 'Bengaluru', 'Amsterdam', 'Stockholm', 'Seoul',
  'Austin', 'Seattle', 'Chicago', 'Dublin', 'Zurich', 'Vancouver'
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'Japan',
  'India', 'France', 'Netherlands', 'Singapore', 'Sweden', 'Ireland', 'Switzerland'
];

const STREETS = [
  'Market St', 'Broadway', 'Main St', 'High St', 'Oak Ave', 'Maple Rd',
  'Cedar Ln', 'Pine Blvd', 'River Rd', 'Park Way', '5th Ave', 'Kingsway'
];

const COMPANIES = [
  'Apex Innovations', 'NovaTech Solutions', 'CloudPeak Systems', 'Vanguard Dynamics',
  'BluePulse Labs', 'Summit Digital', 'Catalyst Media', 'Nexus Logic', 'Starlight Data',
  'Zenith Systems', 'Beacon Enterprise', 'Orion Cloud', 'Horizon Networks'
];

const JOB_TITLES = [
  'Software Engineer', 'Senior Frontend Developer', 'Backend Architect',
  'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UI/UX Designer',
  'QA Automation Engineer', 'Cloud Solutions Architect', 'Engineering Manager',
  'Technical Lead', 'Security Analyst', 'Full Stack Developer', 'System Administrator'
];

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud'
];

/**
 * Built-in Preset Templates
 */
export const MOCK_PRESETS: MockPresetTemplate[] = [
  {
    id: 'users',
    label: 'User Profiles',
    description: 'User accounts with personal details, contacts, and role status',
    sample: {
      id: 'a1b2c3d4-e5f6-47a8-b901-23456789abcd',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      phone: '+1-555-0199',
      role: 'Software Engineer',
      company: 'NovaTech Solutions',
      address: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        country: 'United States',
        zipCode: '97477',
      },
      active: true,
      createdAt: '2025-01-15T08:30:00.000Z',
    },
  },
  {
    id: 'products',
    label: 'E-Commerce Products',
    description: 'Catalog products with categories, pricing, stock, and ratings',
    sample: {
      id: 101,
      name: 'Wireless Noise-Canceling Headphones',
      category: 'Electronics',
      price: 199.99,
      stock: 45,
      rating: 4.8,
      inStock: true,
      sku: 'WNC-HD-001',
      url: 'https://example.com/products/headphones',
      updatedAt: '2025-02-10T12:00:00.000Z',
    },
  },
  {
    id: 'orders',
    label: 'Orders & Invoices',
    description: 'Transaction records with customer info, line items, and totals',
    sample: {
      orderId: 'ORD-98421',
      customerName: 'Jordan Smith',
      customerEmail: 'jordan.smith@example.com',
      totalAmount: 349.5,
      status: 'completed',
      itemCount: 3,
      items: [
        {
          itemId: 1,
          title: 'Ergonomic Desk Chair',
          unitPrice: 249.5,
          quantity: 1,
        },
      ],
      orderDate: '2025-03-01T15:45:00.000Z',
    },
  },
  {
    id: 'employees',
    label: 'Company Employees',
    description: 'Staff directory with department, salary, title, and contact',
    sample: {
      empId: 'EMP-1042',
      fullName: 'Taylor Morgan',
      email: 'taylor.morgan@company.org',
      department: 'Engineering',
      jobTitle: 'Senior Frontend Developer',
      salary: 115000,
      city: 'San Francisco',
      startDate: '2023-06-01',
      active: true,
    },
  },
];

/**
 * Generate a synthetic UUID v4 using PRNG
 */
export function generateUuid(rng: SeededRandom): string {
  const hex = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      s += '-';
    } else if (i === 14) {
      s += '4'; // Version 4
    } else if (i === 19) {
      s += hex[(Math.floor(rng.next() * 4) + 8)]; // 8, 9, a, or b
    } else {
      s += hex[Math.floor(rng.next() * 16)];
    }
  }
  return s;
}

/**
 * Heuristically detect best generator category from field name and type
 */
export function detectFieldCategory(key: string, value?: any): MockFieldCategory {
  const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (k === 'id' || k === 'uuid' || k === '_id' || k.endsWith('uuid')) {
    if (typeof value === 'number') return 'integer';
    return 'uuid';
  }

  if (k.includes('email') || k.includes('mail')) return 'email';
  if (k.includes('phone') || k.includes('mobile') || k.includes('tel')) return 'phone';
  if (k === 'firstname' || k === 'fname') return 'firstName';
  if (k === 'lastname' || k === 'lname' || k === 'surname') return 'lastName';
  if (k.includes('name') || k === 'user' || k === 'author' || k === 'customer') return 'fullName';

  if (k.includes('street') || k.includes('address')) return 'address';
  if (k.includes('city') || k.includes('town')) return 'city';
  if (k.includes('country') || k.includes('nation')) return 'country';
  if (k.includes('zip') || k.includes('postal') || k.includes('pincode')) return 'zipCode';

  if (k.includes('company') || k.includes('corp') || k.includes('org') || k.includes('employer')) return 'company';
  if (k.includes('title') || k.includes('job') || k.includes('role') || k.includes('position')) return 'jobTitle';

  if (k.includes('url') || k.includes('website') || k.includes('link') || k.includes('avatar') || k.includes('image')) return 'url';

  if (k.includes('created') || k.includes('updated') || k.includes('timestamp') || k.includes('time') || k.includes('date')) {
    return 'datetime';
  }

  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'decimal';
  }

  if (k.includes('price') || k.includes('amount') || k.includes('cost') || k.includes('salary') || k.includes('total') || k.includes('fee')) {
    return 'decimal';
  }

  if (k.includes('count') || k.includes('qty') || k.includes('quantity') || k.includes('age') || k.includes('num')) {
    return 'integer';
  }

  if (k.includes('active') || k.includes('status') || k.includes('enabled') || k.includes('verified')) {
    return 'boolean';
  }

  return 'text';
}

/**
 * Extracts field rules from sample object or array
 */
export function extractRulesFromSample(sampleData: any): MockFieldRule[] {
  const rules: MockFieldRule[] = [];
  const visitedPaths = new Set<string>();

  // If array, inspect the first item
  const target = Array.isArray(sampleData) ? sampleData[0] || {} : sampleData;

  function traverse(obj: any, currentPath: string) {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, val] of Object.entries(obj)) {
      const fieldPath = currentPath ? `${currentPath}.${key}` : key;
      if (visitedPaths.has(fieldPath)) continue;
      visitedPaths.add(fieldPath);

      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          traverse(val[0], `${fieldPath}[]`);
        } else {
          // Array of primitives
          const primType = val.length > 0 ? typeof val[0] : 'string';
          const cat = detectFieldCategory(key, val[0]);
          rules.push({
            path: fieldPath,
            key,
            type: cat,
            isArray: true,
            arrayLength: Math.max(1, Math.min(val.length || 3, 5)),
            min: typeof val[0] === 'number' ? (Number.isInteger(val[0]) ? 1 : 10) : undefined,
            max: typeof val[0] === 'number' ? (Number.isInteger(val[0]) ? 100 : 1000) : undefined,
            decimals: 2,
            originalType: `Array<${primType}>`,
          });
        }
      } else if (val !== null && typeof val === 'object') {
        traverse(val, fieldPath);
      } else {
        const cat = detectFieldCategory(key, val);
        rules.push({
          path: fieldPath,
          key,
          type: cat,
          min: typeof val === 'number' ? (Number.isInteger(val) ? 1 : 10) : 1,
          max: typeof val === 'number' ? (Number.isInteger(val) ? 1000 : 5000) : 1000,
          decimals: 2,
          originalType: typeof val,
        });
      }
    }
  }

  traverse(target, '');
  return rules;
}

/**
 * Extracts field rules from JSON Schema (draft-04/07/2020-12 basic support)
 */
export function extractRulesFromSchema(schema: any): MockFieldRule[] {
  const rules: MockFieldRule[] = [];
  if (!schema || typeof schema !== 'object') return rules;

  const properties = schema.properties || (schema.items && schema.items.properties) || {};

  for (const [key, propDef] of Object.entries(properties) as [string, any][]) {
    const propType = propDef.type || 'string';
    let cat: MockFieldCategory = detectFieldCategory(key);

    if (propDef.enum && Array.isArray(propDef.enum)) {
      cat = 'enum';
      rules.push({
        path: key,
        key,
        type: 'enum',
        enumValues: propDef.enum.map(String),
        originalType: propType,
      });
      continue;
    }

    if (propType === 'integer') cat = 'integer';
    else if (propType === 'number') cat = 'decimal';
    else if (propType === 'boolean') cat = 'boolean';
    else if (propDef.format === 'email') cat = 'email';
    else if (propDef.format === 'date-time') cat = 'datetime';
    else if (propDef.format === 'date') cat = 'date';
    else if (propDef.format === 'uri') cat = 'url';
    else if (propDef.format === 'uuid') cat = 'uuid';

    rules.push({
      path: key,
      key,
      type: cat,
      min: propDef.minimum ?? (cat === 'integer' ? 1 : 10),
      max: propDef.maximum ?? (cat === 'integer' ? 1000 : 5000),
      decimals: 2,
      originalType: propType,
    });
  }

  return rules;
}

/**
 * Generate a single primitive value based on rule
 */
export function generateFieldValue(rule: MockFieldRule, rng: SeededRandom): any {
  switch (rule.type) {
    case 'fullName':
      return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    case 'firstName':
      return rng.pick(FIRST_NAMES);
    case 'lastName':
      return rng.pick(LAST_NAMES);
    case 'email': {
      const f = rng.pick(FIRST_NAMES).toLowerCase();
      const l = rng.pick(LAST_NAMES).toLowerCase();
      const num = rng.nextInt(1, 999);
      const dom = rng.pick(DOMAINS);
      return `${f}.${l}${num}@${dom}`;
    }
    case 'phone': {
      const p1 = rng.nextInt(200, 999);
      const p2 = rng.nextInt(100, 999);
      const p3 = rng.nextInt(1000, 9999);
      return `+1-${p1}-${p2}-${p3}`;
    }
    case 'address': {
      const num = rng.nextInt(10, 9999);
      return `${num} ${rng.pick(STREETS)}`;
    }
    case 'city':
      return rng.pick(CITIES);
    case 'country':
      return rng.pick(COUNTRIES);
    case 'zipCode':
      return String(rng.nextInt(10000, 99999));
    case 'company':
      return rng.pick(COMPANIES);
    case 'jobTitle':
      return rng.pick(JOB_TITLES);
    case 'uuid':
      return generateUuid(rng);
    case 'integer':
      return rng.nextInt(rule.min ?? 1, rule.max ?? 1000);
    case 'decimal':
      return rng.nextFloat(rule.min ?? 1, rule.max ?? 1000, rule.decimals ?? 2);
    case 'boolean':
      return rng.nextBoolean();
    case 'date': {
      const year = rng.nextInt(2023, 2026);
      const month = String(rng.nextInt(1, 12)).padStart(2, '0');
      const day = String(rng.nextInt(1, 28)).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    case 'datetime': {
      const year = rng.nextInt(2023, 2026);
      const month = String(rng.nextInt(1, 12)).padStart(2, '0');
      const day = String(rng.nextInt(1, 28)).padStart(2, '0');
      const hours = String(rng.nextInt(0, 23)).padStart(2, '0');
      const mins = String(rng.nextInt(0, 59)).padStart(2, '0');
      const secs = String(rng.nextInt(0, 59)).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${mins}:${secs}.000Z`;
    }
    case 'url': {
      const sub = rng.pick(LOREM_WORDS);
      const path = rng.pick(LOREM_WORDS);
      return `https://${sub}.example.com/${path}`;
    }
    case 'enum': {
      if (rule.enumValues && rule.enumValues.length > 0) {
        return rng.pick(rule.enumValues);
      }
      return 'active';
    }
    case 'custom': {
      if (rule.customTemplate) {
        return rule.customTemplate.replace(/#+/g, (match) => {
          let numStr = '';
          for (let i = 0; i < match.length; i++) {
            numStr += rng.nextInt(0, 9);
          }
          return numStr;
        });
      }
      return `custom-${rng.nextInt(100, 999)}`;
    }
    case 'text':
    default: {
      const count = rng.nextInt(2, 5);
      const words: string[] = [];
      for (let i = 0; i < count; i++) {
        words.push(rng.pick(LOREM_WORDS));
      }
      return words.join(' ');
    }
  }
}

/**
 * Main Mock Data Generator function
 * Generates single record or array of synthetic records matching the schema or sample structure.
 */
export function generateMockData(
  config: MockGeneratorConfig,
  templateObj: any
): any {
  const seed = config.seed !== undefined ? config.seed : Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed);
  const rulesMap = new Map<string, MockFieldRule>();

  for (const r of config.rules) {
    rulesMap.set(r.path, r);
  }

  // Helper to clone structure and replace leaf values based on rules
  function synthesizeObject(template: any, currentPath: string): any {
    if (template === null || template === undefined) return null;

    if (Array.isArray(template)) {
      if (template.length === 0) return [];
      const sampleItem = template[0];
      const count = rng.nextInt(1, 3);
      const res: any[] = [];
      for (let i = 0; i < count; i++) {
        if (typeof sampleItem === 'object' && sampleItem !== null) {
          res.push(synthesizeObject(sampleItem, `${currentPath}[]`));
        } else {
          const rule = rulesMap.get(currentPath) || {
            path: currentPath,
            key: 'item',
            type: detectFieldCategory('item', sampleItem),
          };
          res.push(generateFieldValue(rule, rng));
        }
      }
      return res;
    }

    if (typeof template === 'object') {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(template)) {
        const fieldPath = currentPath ? `${currentPath}.${key}` : key;
        const rule = rulesMap.get(fieldPath);

        if (Array.isArray(val)) {
          if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
            const arrCount = rng.nextInt(1, 3);
            const arrRes = [];
            for (let i = 0; i < arrCount; i++) {
              arrRes.push(synthesizeObject(val[0], `${fieldPath}[]`));
            }
            result[key] = arrRes;
          } else {
            // Primitive array
            const len = rule?.arrayLength || (val.length > 0 ? val.length : 3);
            const arrRes = [];
            for (let i = 0; i < len; i++) {
              arrRes.push(generateFieldValue(rule || { path: fieldPath, key, type: 'text' }, rng));
            }
            result[key] = arrRes;
          }
        } else if (val !== null && typeof val === 'object') {
          result[key] = synthesizeObject(val, fieldPath);
        } else {
          const effectiveRule = rule || {
            path: fieldPath,
            key,
            type: detectFieldCategory(key, val),
          };
          result[key] = generateFieldValue(effectiveRule, rng);
        }
      }
      return result;
    }

    const fallbackRule = rulesMap.get(currentPath) || {
      path: currentPath,
      key: 'val',
      type: detectFieldCategory('val', template),
    };
    return generateFieldValue(fallbackRule, rng);
  }

  // Base sample object to synthesize
  const baseObject = Array.isArray(templateObj) ? templateObj[0] || {} : templateObj || {};

  const recordCount = Math.max(1, Math.min(config.recordCount, 10000));

  if (!config.asArray && recordCount === 1) {
    return synthesizeObject(baseObject, '');
  }

  const records: any[] = [];
  for (let i = 0; i < recordCount; i++) {
    records.push(synthesizeObject(baseObject, ''));
  }

  return records;
}

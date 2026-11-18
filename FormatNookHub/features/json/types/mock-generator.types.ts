/**
 * JSON Mock Data Generator Type Definitions
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

export type MockFieldCategory =
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'country'
  | 'zipCode'
  | 'company'
  | 'jobTitle'
  | 'uuid'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'url'
  | 'enum'
  | 'text'
  | 'custom';

export interface MockFieldRule {
  path: string;           // JSONPath-like e.g. "id", "user.name", "items[].price"
  key: string;            // Field key e.g. "id", "name", "price"
  type: MockFieldCategory;
  min?: number;
  max?: number;
  decimals?: number;
  enumValues?: string[];
  customTemplate?: string;
  originalType?: string;
  isArray?: boolean;
  arrayLength?: number;
}

export type MockSourceType = 'sample' | 'schema' | 'preset';

export interface MockGeneratorConfig {
  sourceType: MockSourceType;
  recordCount: number; // 1 to 10,000
  seed?: number;
  asArray: boolean;
  rules: MockFieldRule[];
  rawSample?: string;
  rawSchema?: string;
  selectedPreset?: string;
}

export interface MockPresetTemplate {
  id: string;
  label: string;
  description: string;
  sample: any;
}

/**
 * JSON Schema Wizard Type Definitions
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

export type JsonSchemaDraft = 'draft-07' | '2019-09' | '2020-12';

export interface SchemaGeneratorOptions {
  draft: JsonSchemaDraft;
  title?: string;
  description?: string;
  includeRequired: boolean;
  detectEnums: boolean;
  enumMaxCount?: number;
  detectFormats: boolean;
}

export interface SchemaValidationError {
  path: string;
  message: string;
  keyword?: string;
  expected?: any;
  actual?: any;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
  evaluatedAt: number;
}

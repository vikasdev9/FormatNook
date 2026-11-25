export interface UuidFormatOptions {
  uppercase: boolean;
  hyphens: boolean;
  braces: boolean;
}

export interface UuidValidationResult {
  raw: string;
  normalized: string;
  isValid: boolean;
  version: number | null;
  variant: string | null;
  isV4: boolean;
  error?: string;
}

export interface UuidValidationSummary {
  results: UuidValidationResult[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
  v4Count: number;
}

export interface UuidDeduplicationResult {
  unique: string[];
  duplicates: string[];
  originalCount: number;
  uniqueCount: number;
  duplicateCount: number;
}

export type UuidTabType = 'generator' | 'validator' | 'converter' | 'deduplicator' | 'info';

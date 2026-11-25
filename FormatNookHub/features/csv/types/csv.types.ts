/**
 * CSV to JSON Converter Types
 * FormatNook Hub - Universal Developer Platform
 */

export type CsvDelimiter = ',' | ';' | '\t' | '|' | string;

export type HeaderMode = 'first-row' | 'none' | 'auto';

export type DuplicateHeaderStrategy = 'numeric-suffix' | 'rename-duplicates' | 'reject';

export type JsonOutputMode = 'array-of-objects' | 'array-of-arrays' | 'object-keyed';

export type TypeConversionMode = 'string' | 'auto' | 'custom';

export type ColumnType = 'string' | 'number' | 'integer' | 'boolean' | 'null';

export type EmptyValueHandling = 'empty-string' | 'null';

export type IndentationMode = '2' | '4' | 'compact';

export type DuplicateKeyStrategy = 'error' | 'append-suffix';

export interface ColumnConfig {
  name: string;
  targetKey: string;
  type: ColumnType;
  included: boolean;
  order: number;
}

export interface CsvParseOptions {
  delimiter?: CsvDelimiter;
  customDelimiter?: string;
  headerMode?: HeaderMode;
  duplicateStrategy?: DuplicateHeaderStrategy;
  trimWhitespace?: boolean;
  skipEmptyRows?: boolean;
  emptyValueHandling?: EmptyValueHandling;
  typeConversionMode?: TypeConversionMode;
  columnConfigs?: Record<string, ColumnConfig>;
  outputMode?: JsonOutputMode;
  keyColumn?: string;
  duplicateKeyStrategy?: DuplicateKeyStrategy;
  nestedJson?: boolean;
  indent?: IndentationMode;
}

export interface CsvRowError {
  rowIndex: number;
  lineNumber: number;
  message: string;
  rawText?: string;
}

export interface CsvParseResult {
  rawRows: string[][];
  headers: string[];
  detectedDelimiter: string;
  hasDetectedHeader: boolean;
  detectedHeaderReason: string;
  totalRows: number;
  totalColumns: number;
  emptyCellsCount: number;
  errors: CsvRowError[];
  warnings: string[];
}

export interface CsvConversionResult {
  jsonOutput: string;
  previewData: any;
  stats: {
    totalRows: number;
    totalColumns: number;
    outputBytes: number;
    executionTimeMs: number;
  };
  errors: string[];
  warnings: string[];
}

export type CsvTabType = 'editor' | 'preview' | 'settings' | 'output';

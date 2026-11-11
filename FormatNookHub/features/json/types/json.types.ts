import { IndentOption } from '@/types/tool';

export type JsonViewMode = 'code' | 'tree' | 'table';

export type JsonDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'object'
  | 'array';

export interface JsonStats {
  totalObjects: number;
  totalArrays: number;
  totalKeys: number;
  totalValues: number;
  maxDepth: number;
  stringsCount: number;
  numbersCount: number;
  booleansCount: number;
  nullsCount: number;
  emptyObjects: number;
  emptyArrays: number;
  fileSizeBytes: number;
  characterCount: number;
  lineCount: number;
}

export interface JsonPathMatch {
  path: string;
  value: any;
  key?: string | number;
}

export interface JsonTreeNode {
  id: string;
  key: string;
  value: any;
  type: JsonDataType;
  path: string;
  depth: number;
  isLeaf: boolean;
  childCount?: number;
  children?: JsonTreeNode[];
  isExpanded?: boolean;
}

export type JsonTransformType =
  | 'csv'
  | 'tsv'
  | 'xml'
  | 'yaml'
  | 'text'
  | 'flatten'
  | 'unflatten'
  | 'sort-keys'
  | 'sort-array'
  | 'filter'
  | 'deduplicate'
  | 'extract'
  | 'merge'
  | 'split'
  | 'escape'
  | 'unescape';

export interface JsonTransformResult {
  output: string;
  format: 'json' | 'csv' | 'xml' | 'yaml' | 'text';
  isLossy?: boolean;
  notes?: string;
}

export interface JsonRepairProposal {
  original: string;
  repaired: string;
  changesSummary: string[];
}

export interface CsvOptions {
  delimiter?: ',' | ';' | '\t';
  customColumns?: string[];
  nestedStrategy?: 'flatten' | 'json-string' | 'discard';
}

export interface XmlOptions {
  rootTag?: string;
  itemTag?: string;
}

export interface FlattenOptions {
  separator?: string;
}

export interface SortKeysOptions {
  direction?: 'asc' | 'desc';
  caseSensitive?: boolean;
  preserveArrayOrder?: boolean;
}

export interface SortArrayOptions {
  sortProperty?: string;
  direction?: 'asc' | 'desc';
  propertyType?: 'auto' | 'string' | 'number' | 'boolean' | 'date';
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'type';
  value: string;
  caseSensitive?: boolean;
}

export interface FilterOptions {
  conditions: FilterCondition[];
  matchAll?: boolean; // true = AND, false = OR
}

export interface DeduplicateOptions {
  propertyKey?: string;
}

export interface ExtractFieldsOptions {
  fields: string[];
  keepStructure?: boolean;
}

export interface MergeObjectsOptions {
  strategy?: 'shallow' | 'deep';
}

export interface SplitArrayOptions {
  chunkSize?: number;
}

export type CodeGenLanguage =
  | 'typescript'
  | 'javascript'
  | 'java'
  | 'python'
  | 'kotlin'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'swift'
  | 'ruby'
  | 'dart'
  | 'php';

export interface CodeGenOptions {
  language: CodeGenLanguage;
  rootClassName?: string;
  optionalFields?: boolean;
  useInterfaces?: boolean;
}

export interface Json5ValidationResult {
  isValid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

export interface JsonSnippet {
  id: string;
  title: string;
  description: string;
  tags: string[];
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface JsonRecentFile {
  id: string;
  name: string;
  sizeBytes: number;
  lineCount: number;
  timestamp: number;
  previewSnippet: string;
}

export interface JsonEditorPreferences {
  theme: 'system' | 'light' | 'dark';
  viewMode: JsonViewMode;
  fontSize: number;
  indent: IndentOption;
  wordWrap: boolean;
  panelsRatio: number;
  autoFormat?: boolean;
}

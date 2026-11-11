import { ValidationIssue } from '@/types/tool';

export type YamlViewMode = 'code' | 'tree' | 'structured';

export type YamlDataType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export interface YamlTreeNode {
  id: string;
  key: string;
  value: any;
  type: YamlDataType;
  path: string;
  docIndex: number;
  depth: number;
  children?: YamlTreeNode[];
  itemCount?: number;
  isExpanded?: boolean;
}

export interface YamlDocumentInfo {
  index: number;
  raw: string;
  data: any;
  isValid: boolean;
  issues: ValidationIssue[];
  startLine: number;
  endLine: number;
}

export interface YamlFormatOptions {
  indent?: number;
  quoteStyle?: '"' | "'" | 'auto';
  lineWidth?: number;
  noArrayIndent?: boolean;
  sortKeys?: boolean;
  flowLevel?: number;
}

export type YamlConversionFormat = 'json' | 'xml' | 'csv' | 'tsv' | 'string';

export type YamlConfigType = 'kubernetes' | 'compose' | 'github-actions' | 'ansible' | 'generic';

export interface YamlConfigAnalysis {
  type: YamlConfigType;
  title: string;
  summary: {
    documentsCount: number;
    primaryKind?: string;
    servicesCount?: number;
    jobsCount?: number;
    tasksCount?: number;
    version?: string;
  };
  details: { label: string; value: string | number }[];
  warnings: string[];
  suggestions: string[];
}


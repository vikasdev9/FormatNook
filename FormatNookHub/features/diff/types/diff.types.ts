export type DiffGranularity = 'line' | 'word' | 'char';

export type DiffViewMode = 'side-by-side' | 'inline';

export type DiffChangeType = 'equal' | 'insert' | 'delete';

export type DiffFormat =
  | 'text'
  | 'json'
  | 'xml'
  | 'yaml'
  | 'html'
  | 'css'
  | 'javascript'
  | 'sql'
  | 'auto';

export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreBlankLines: boolean;
  ignoreTrailingWhitespace: boolean;
  granularity: DiffGranularity;
  viewMode: DiffViewMode;
  format: DiffFormat;
  prettifyBeforeCompare: boolean;
  sortKeys: boolean;
}

export interface DiffChange<T = string> {
  type: DiffChangeType;
  value: T;
  oldIndex?: number;
  newIndex?: number;
}

export interface InlineDiffToken {
  type: DiffChangeType;
  text: string;
}

export interface DiffLineItem {
  id: string;
  type: 'equal' | 'insert' | 'delete' | 'modify';
  originalLineNumber?: number;
  modifiedLineNumber?: number;
  originalContent?: string;
  modifiedContent?: string;
  originalTokens?: InlineDiffToken[];
  modifiedTokens?: InlineDiffToken[];
  inlineTokens?: InlineDiffToken[];
}

export interface DiffStatistics {
  totalLines: number;
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  unchangedLines: number;
  differencePercentage: number;
}

export interface DiffResultData {
  lines: DiffLineItem[];
  statistics: DiffStatistics;
  isIdentical: boolean;
  isEmpty: boolean;
  unifiedDiffText: string;
  detectedFormat?: DiffFormat;
  formatWarnings?: {
    original?: string;
    modified?: string;
  };
}

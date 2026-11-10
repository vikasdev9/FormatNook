import {
  DiffFormat,
  DiffLineItem,
  DiffOptions,
  DiffResultData,
  DiffStatistics,
} from '../../types/diff.types';

export interface DiffEngineInput {
  originalText: string;
  modifiedText: string;
  options: DiffOptions;
}

export interface DiffEngineResult extends DiffResultData {
  format: DiffFormat;
  isValid: {
    original: boolean;
    modified: boolean;
  };
  errors: {
    original?: string;
    modified?: string;
  };
  structuredData?: {
    type: DiffFormat;
    summary?: string;
    details?: any;
  };
}

export interface DiffEngine {
  readonly format: DiffFormat;
  compare(input: DiffEngineInput): DiffEngineResult;
}


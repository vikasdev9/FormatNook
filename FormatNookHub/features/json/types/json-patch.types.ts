/**
 * JSON Patch (RFC 6902) & Merge Patch (RFC 7386) Type Definitions
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

export type JsonPatchOpType = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

export interface JsonPatchOperation {
  op: JsonPatchOpType;
  path: string;
  from?: string;
  value?: any;
}

export type JsonPatchFormat = 'rfc6902' | 'rfc7386';

export interface JsonPatchDiffSummary {
  addedCount: number;
  removedCount: number;
  replacedCount: number;
  totalOps: number;
  paths: { path: string; op: JsonPatchOpType }[];
}

export interface JsonPatchApplyResult<T = any> {
  success: boolean;
  doc?: T;
  error?: string;
  opIndex?: number;
}

'use client';

import React, { useRef } from 'react';
import { CheckCircle2, FileQuestion, AlertTriangle, Loader2 } from 'lucide-react';
import { DiffResultData, DiffViewMode } from '../types/diff.types';
import { DiffEngineResult } from '../services/engines/types';
import { DiffLine } from './DiffLine';
import { StructuredDiffViewer } from './StructuredDiffViewer';

interface DiffResultProps {
  diffResult: DiffResultData | DiffEngineResult | null;
  viewMode: DiffViewMode;
  isComparing?: boolean;
}

export function DiffResult({ diffResult, viewMode, isComparing = false }: DiffResultProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (isComparing) {
    return (
      <div className="diff-loading-state" data-testid="diff-loading-state">
        <Loader2 size={32} className="spin-animation text-accent" />
        <span className="diff-loading-text">Comparing documents...</span>
      </div>
    );
  }

  if (!diffResult || diffResult.isEmpty) {
    return (
      <div className="diff-empty-state" data-testid="diff-empty-state">
        <div className="diff-empty-icon">
          <FileQuestion size={36} />
        </div>
        <h3 className="diff-empty-title">Ready for Comparison</h3>
        <p className="diff-empty-description">
          Enter or paste text in both editors above, or load sample data to inspect differences.
        </p>
      </div>
    );
  }

  const engineRes = diffResult as DiffEngineResult;
  const originalError = engineRes.errors?.original || diffResult.formatWarnings?.original;
  const modifiedError = engineRes.errors?.modified || diffResult.formatWarnings?.modified;
  const hasErrors = Boolean(originalError || modifiedError);

  const formatBadge = diffResult.detectedFormat && diffResult.detectedFormat !== 'text' ? (
    <span className="badge badge-accent diff-format-badge" data-testid="detected-format-badge">
      {diffResult.detectedFormat.toUpperCase()}
    </span>
  ) : null;

  return (
    <div className="diff-result-wrapper" data-testid="diff-result-wrapper">
      {/* Identical Documents State */}
      {diffResult.isIdentical && !hasErrors && (
        <div
          className="diff-banner-identical"
          data-testid="banner-identical-text"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={18} className="text-success" />
          <span className="diff-banner-text">
            <strong>No differences found!</strong> The two documents are identical.
          </span>
          {formatBadge}
        </div>
      )}

      {/* Validation / Parsing Error State */}
      {hasErrors && (
        <div
          className="diff-banner-warning diff-banner-error"
          data-testid="banner-format-warning"
          role="alert"
        >
          <AlertTriangle size={18} className="text-warning" />
          <div className="diff-banner-warning-content">
            <div className="diff-banner-warning-title">
              <strong>Syntax Notice:</strong> Falling back to line-by-line comparison due to parsing issues:
            </div>
            {originalError && <div>Original: {originalError}</div>}
            {modifiedError && <div>Modified: {modifiedError}</div>}
          </div>
        </div>
      )}

      {/* Hierarchical Structured Inspector for Structured Formats */}
      {engineRes.structuredData && (
        <StructuredDiffViewer
          structuredData={engineRes.structuredData}
          format={engineRes.format || diffResult.detectedFormat || 'text'}
        />
      )}

      {/* Visual Line-by-Line Diff Viewer */}
      <div className="diff-viewer-card">
        <div className="diff-viewer-header">
          {viewMode === 'side-by-side' ? (
            <div className="diff-header-split">
              <div className="diff-header-pane-title">
                <span>Original Text</span>
                {formatBadge}
              </div>
              <div className="diff-header-pane-title">
                <span>Modified Text</span>
                {formatBadge}
              </div>
            </div>
          ) : (
            <div className="diff-header-unified">
              <span className="diff-header-pane-title">Unified Comparison Result</span>
              {formatBadge}
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          className={`diff-viewer-body ${
            viewMode === 'side-by-side' ? 'diff-view-side-by-side' : 'diff-view-inline'
          }`}
          data-testid={viewMode === 'side-by-side' ? 'view-split-container' : 'view-inline-container'}
        >
          {diffResult.lines.map((item) => (
            <DiffLine key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      </div>
    </div>
  );
}

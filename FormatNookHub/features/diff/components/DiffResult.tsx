'use client';

import React, { useRef } from 'react';
import { CheckCircle2, FileQuestion, AlertTriangle } from 'lucide-react';
import { DiffResultData, DiffViewMode } from '../types/diff.types';
import { DiffLine } from './DiffLine';

interface DiffResultProps {
  diffResult: DiffResultData | null;
  viewMode: DiffViewMode;
}

export function DiffResult({ diffResult, viewMode }: DiffResultProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  const formatBadge = diffResult.detectedFormat && diffResult.detectedFormat !== 'text' ? (
    <span className="badge badge-accent diff-format-badge" data-testid="detected-format-badge">
      {diffResult.detectedFormat.toUpperCase()}
    </span>
  ) : null;

  return (
    <div className="diff-result-wrapper" data-testid="diff-result-wrapper">
      {diffResult.isIdentical && (
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

      {diffResult.formatWarnings && (
        <div className="diff-banner-warning" data-testid="banner-format-warning" role="alert">
          <AlertTriangle size={18} className="text-warning" />
          <div className="diff-banner-warning-content">
            {diffResult.formatWarnings.original && (
              <div>Original: {diffResult.formatWarnings.original}</div>
            )}
            {diffResult.formatWarnings.modified && (
              <div>Modified: {diffResult.formatWarnings.modified}</div>
            )}
          </div>
        </div>
      )}

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

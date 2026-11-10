'use client';

import React, { useRef } from 'react';
import { CheckCircle2, FileQuestion, ArrowRight } from 'lucide-react';
import { DiffLineItem, DiffResultData, DiffViewMode } from '../types/diff.types';
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
            <strong>No differences found!</strong> The two texts are identical.
          </span>
        </div>
      )}

      <div className="diff-viewer-card">
        <div className="diff-viewer-header">
          {viewMode === 'side-by-side' ? (
            <div className="diff-header-split">
              <div className="diff-header-pane-title">
                <span>Original Text</span>
              </div>
              <div className="diff-header-pane-title">
                <span>Modified Text</span>
              </div>
            </div>
          ) : (
            <div className="diff-header-unified">
              <span className="diff-header-pane-title">Unified Comparison Result</span>
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


'use client';

import React from 'react';
import { DiffLineItem, InlineDiffToken } from '../types/diff.types';

interface DiffLineProps {
  item: DiffLineItem;
  viewMode: 'side-by-side' | 'inline';
}

function renderTokens(tokens?: InlineDiffToken[], fallbackText?: string) {
  if (!tokens || tokens.length === 0) {
    return <span>{fallbackText ?? ''}</span>;
  }

  return (
    <>
      {tokens.map((token, idx) => {
        if (token.type === 'delete') {
          return (
            <mark key={idx} className="diff-token-removed">
              {token.text}
            </mark>
          );
        }
        if (token.type === 'insert') {
          return (
            <mark key={idx} className="diff-token-added">
              {token.text}
            </mark>
          );
        }
        return <span key={idx}>{token.text}</span>;
      })}
    </>
  );
}

export function DiffLine({ item, viewMode }: DiffLineProps) {
  if (viewMode === 'side-by-side') {
    return (
      <div className={`diff-line-row diff-row-${item.type}`} data-testid={`diff-line-${item.id}`}>
        {/* Left column (Original) */}
        <div className={`diff-pane-cell diff-pane-left ${item.type === 'insert' ? 'diff-cell-empty' : ''}`}>
          <div className="diff-gutter" aria-hidden="true">
            {item.originalLineNumber ?? ''}
          </div>
          <div className="diff-marker" aria-hidden="true">
            {item.type === 'delete' ? '-' : item.type === 'modify' ? '~' : ' '}
          </div>
          <div className="diff-content">
            {item.type !== 'insert' ? renderTokens(item.originalTokens, item.originalContent) : null}
          </div>
        </div>

        {/* Right column (Modified) */}
        <div className={`diff-pane-cell diff-pane-right ${item.type === 'delete' ? 'diff-cell-empty' : ''}`}>
          <div className="diff-gutter" aria-hidden="true">
            {item.modifiedLineNumber ?? ''}
          </div>
          <div className="diff-marker" aria-hidden="true">
            {item.type === 'insert' ? '+' : item.type === 'modify' ? '~' : ' '}
          </div>
          <div className="diff-content">
            {item.type !== 'delete' ? renderTokens(item.modifiedTokens, item.modifiedContent) : null}
          </div>
        </div>
      </div>
    );
  }

  // Inline view
  if (item.type === 'modify') {
    return (
      <>
        <div className="diff-line-row diff-row-delete" data-testid={`diff-line-${item.id}-del`}>
          <div className="diff-gutter-group" aria-hidden="true">
            <span className="diff-gutter">{item.originalLineNumber ?? ''}</span>
            <span className="diff-gutter diff-gutter-empty" />
          </div>
          <div className="diff-marker" aria-hidden="true">-</div>
          <div className="diff-content">
            {renderTokens(item.originalTokens, item.originalContent)}
          </div>
        </div>
        <div className="diff-line-row diff-row-insert" data-testid={`diff-line-${item.id}-ins`}>
          <div className="diff-gutter-group" aria-hidden="true">
            <span className="diff-gutter diff-gutter-empty" />
            <span className="diff-gutter">{item.modifiedLineNumber ?? ''}</span>
          </div>
          <div className="diff-marker" aria-hidden="true">+</div>
          <div className="diff-content">
            {renderTokens(item.modifiedTokens, item.modifiedContent)}
          </div>
        </div>
      </>
    );
  }

  const isInsert = item.type === 'insert';
  const isDelete = item.type === 'delete';

  return (
    <div className={`diff-line-row diff-row-${item.type}`} data-testid={`diff-line-${item.id}`}>
      <div className="diff-gutter-group" aria-hidden="true">
        <span className="diff-gutter">{isInsert ? '' : (item.originalLineNumber ?? '')}</span>
        <span className="diff-gutter">{isDelete ? '' : (item.modifiedLineNumber ?? '')}</span>
      </div>
      <div className="diff-marker" aria-hidden="true">
        {isInsert ? '+' : isDelete ? '-' : ' '}
      </div>
      <div className="diff-content">
        {isDelete
          ? renderTokens(item.originalTokens, item.originalContent)
          : isInsert
          ? renderTokens(item.modifiedTokens, item.modifiedContent)
          : renderTokens(item.originalTokens, item.originalContent)}
      </div>
    </div>
  );
}


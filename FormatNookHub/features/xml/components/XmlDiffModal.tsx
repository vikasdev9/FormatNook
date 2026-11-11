'use client';

import React, { useState, useMemo } from 'react';
import { X, GitCompare, Copy, Check } from 'lucide-react';
import { computeDiff, DEFAULT_DIFF_OPTIONS } from '@/features/diff/services/diff-service';
import { DiffLineItem } from '@/features/diff/types/diff.types';
import { useClipboard } from '@/hooks/useClipboard';

interface XmlDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalXml: string;
  modifiedXml?: string;
}

export function XmlDiffModal({
  isOpen,
  onClose,
  originalXml,
  modifiedXml: initialModified = '',
}: XmlDiffModalProps) {
  const [leftXml, setLeftXml] = useState(originalXml);
  const [rightXml, setRightXml] = useState(initialModified || originalXml);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const { copy, copied } = useClipboard();

  React.useEffect(() => {
    if (isOpen) {
      setLeftXml(originalXml);
      setRightXml(initialModified || originalXml);
    }
  }, [isOpen, originalXml, initialModified]);

  const diffResult = useMemo(() => {
    if (!isOpen) return null;
    return computeDiff(leftXml || '', rightXml || '', {
      ...DEFAULT_DIFF_OPTIONS,
      format: 'xml',
      ignoreWhitespace,
    });
  }, [isOpen, leftXml, rightXml, ignoreWhitespace]);

  if (!isOpen) return null;

  return (
    <div className="json-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="xml-diff-title">
      <div className="json-modal-card json-transform-modal-card" style={{ maxWidth: '1080px', width: '95%' }}>
        {/* Header */}
        <div className="json-modal-header">
          <div className="json-modal-title-group">
            <GitCompare size={20} className="modal-title-icon" />
            <div>
              <h2 id="xml-diff-title" className="json-modal-title">
                XML Compare &amp; Diff
              </h2>
              <p className="json-modal-subtitle">
                Side-by-side Myers diff comparison of two XML documents
              </p>
            </div>
          </div>
          <button
            type="button"
            className="json-modal-close-btn"
            onClick={onClose}
            aria-label="Close XML compare modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '12px' }}>
            {diffResult && (
              <>
                <span style={{ color: 'var(--color-success, #22c55e)', fontWeight: 600 }}>
                  +{diffResult.statistics.addedLines} added
                </span>
                <span style={{ color: 'var(--color-danger, #ef4444)', fontWeight: 600 }}>
                  -{diffResult.statistics.removedLines} removed
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {diffResult.statistics.modifiedLines} modified
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              />
              <span>Ignore whitespace</span>
            </label>
          </div>
        </div>

        {/* Diff View Body */}
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', maxHeight: '520px', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', lineHeight: 1.6, background: '#090d16', color: '#e6edf3' }}>
          {diffResult && diffResult.lines.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Both XML documents are identical.
            </div>
          ) : (
            diffResult?.lines.map((line: DiffLineItem, idx: number) => {
              let bg = 'transparent';
              let color = '#e6edf3';
              let prefix = ' ';
              if (line.type === 'insert') {
                bg = 'rgba(34, 197, 94, 0.15)';
                color = '#4ade80';
                prefix = '+';
              } else if (line.type === 'delete') {
                bg = 'rgba(239, 68, 68, 0.15)';
                color = '#f87171';
                prefix = '-';
              } else if (line.type === 'modify') {
                bg = 'rgba(234, 179, 8, 0.15)';
                color = '#facc15';
                prefix = '~';
              }

              const lineText = line.type === 'delete' ? (line.originalContent || '') : (line.modifiedContent || line.originalContent || '');

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    background: bg,
                    color,
                    padding: '1px 8px',
                    borderRadius: '2px',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <span style={{ width: '45px', color: '#64748b', userSelect: 'none', textAlign: 'right', paddingRight: '12px' }}>
                    {line.originalLineNumber || ''}
                  </span>
                  <span style={{ width: '45px', color: '#64748b', userSelect: 'none', textAlign: 'right', paddingRight: '12px' }}>
                    {line.modifiedLineNumber || ''}
                  </span>
                  <span style={{ width: '20px', fontWeight: 'bold', userSelect: 'none' }}>
                    {prefix}
                  </span>
                  <span style={{ flex: 1 }}>{lineText}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="json-modal-footer">
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Real-time Myers diff algorithm executed locally in the browser.
          </div>
          <div className="json-modal-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                copy(diffResult?.unifiedDiffText || '');
              }}
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Unified Diff'}</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


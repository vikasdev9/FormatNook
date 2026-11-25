'use client';

import React, { useState, useMemo } from 'react';
import {
  trimWhitespace,
  removeExtraSpaces,
  removeDuplicateLines,
  removeEmptyLines,
  normalizeLineBreaks,
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toSentenceCase,
} from '../services/text-cleaner';
import { Sparkles, Copy, Download, ArrowRight, Check } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

interface TextCleanerPanelProps {
  originalText: string;
  onApplyToEditor: (newText: string) => void;
}

type CleanerAction =
  | 'trim'
  | 'extra-spaces'
  | 'duplicate-lines'
  | 'empty-lines'
  | 'normalize-breaks'
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'sentencecase';

export function TextCleanerPanel({ originalText, onApplyToEditor }: TextCleanerPanelProps) {
  const [selectedAction, setSelectedAction] = useState<CleanerAction>('trim');
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);
  const { copied, copy } = useClipboard();

  const cleanedText = useMemo(() => {
    switch (selectedAction) {
      case 'trim':
        return trimWhitespace(originalText);
      case 'extra-spaces':
        return removeExtraSpaces(originalText);
      case 'duplicate-lines':
        return removeDuplicateLines(originalText);
      case 'empty-lines':
        return removeEmptyLines(originalText);
      case 'normalize-breaks':
        return normalizeLineBreaks(originalText);
      case 'uppercase':
        return toUpperCase(originalText);
      case 'lowercase':
        return toLowerCase(originalText);
      case 'titlecase':
        return toTitleCase(originalText);
      case 'sentencecase':
        return toSentenceCase(originalText);
      default:
        return originalText;
    }
  }, [originalText, selectedAction]);

  const handleApply = () => {
    onApplyToEditor(cleanedText);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  const handleDownload = () => {
    downloadFile(cleanedText, 'cleaned-text.txt', 'text/plain');
  };

  const actionButtons: { id: CleanerAction; label: string; desc: string }[] = [
    { id: 'trim', label: 'Trim Whitespace', desc: 'Remove leading and trailing spaces from text and lines' },
    { id: 'extra-spaces', label: 'Remove Extra Spaces', desc: 'Collapse multiple consecutive spaces into one' },
    { id: 'empty-lines', label: 'Remove Empty Lines', desc: 'Delete all blank and whitespace-only lines' },
    { id: 'duplicate-lines', label: 'Remove Duplicate Lines', desc: 'Deduplicate identical lines across document' },
    { id: 'normalize-breaks', label: 'Normalize Line Breaks', desc: 'Standardize Windows CRLF or Mac CR to Unix LF' },
    { id: 'uppercase', label: 'UPPERCASE', desc: 'Convert all characters to capital letters' },
    { id: 'lowercase', label: 'lowercase', desc: 'Convert all characters to lowercase letters' },
    { id: 'titlecase', label: 'Title Case', desc: 'Capitalize the first letter of each significant word' },
    { id: 'sentencecase', label: 'Sentence case', desc: 'Capitalize the first character of each sentence' },
  ];

  const charDiff = cleanedText.length - originalText.length;

  return (
    <div className="text-cleaner-container" data-testid="text-cleaner-panel">
      {/* Transformation Selector */}
      <div className="cleaner-actions-grid">
        {actionButtons.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`btn btn-sm ${selectedAction === action.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedAction(action.id)}
            data-testid={`action-${action.id}`}
            title={action.desc}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Difference Summary */}
      <div className="cleaner-summary-bar">
        <div className="cleaner-diff-badge">
          <span>Original: {originalText.length} chars</span>
          <span className="diff-arrow">→</span>
          <span>Cleaned: {cleanedText.length} chars</span>
          <span className={`badge ${charDiff < 0 ? 'badge-success' : charDiff > 0 ? 'badge-warning' : 'badge-ghost'}`}>
            {charDiff > 0 ? `+${charDiff}` : charDiff} chars
          </span>
        </div>

        <div className="cleaner-buttons-group">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleApply}
            disabled={!originalText || originalText === cleanedText}
            data-testid="btn-apply-cleaned"
          >
            {appliedNotice ? <Check size={14} /> : <ArrowRight size={14} />}
            <span>{appliedNotice ? 'Applied to Editor!' : 'Apply to Editor'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => copy(cleanedText)}
            disabled={!cleanedText}
            data-testid="btn-copy-cleaned"
          >
            <Copy size={14} />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDownload}
            disabled={!cleanedText}
            data-testid="btn-download-cleaned"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Live Preview Area */}
      <div className="cleaner-preview-wrap">
        <div className="cleaner-preview-header">
          <span className="preview-label">Cleaned Preview</span>
          <span className="preview-sub">Your original editor text remains untouched until you click Apply.</span>
        </div>
        <textarea
          readOnly
          value={cleanedText}
          className="cleaner-preview-textarea"
          placeholder="Cleaned preview will appear here..."
          data-testid="cleaner-preview-text"
        />
      </div>
    </div>
  );
}

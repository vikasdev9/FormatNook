'use client';

import React, { useRef } from 'react';
import { AlertCircle, Copy, Check, Trash2 } from 'lucide-react';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { formatByteSize } from '@/lib/file-reader';
import { useClipboard } from '@/hooks/useClipboard';

interface TextEditorProps {
  id: string;
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onScrollSync?: (scrollTop: number, scrollLeft: number) => void;
  scrollRef?: React.RefObject<HTMLTextAreaElement>;
  readOnly?: boolean;
  testId?: string;
  error?: string;
  formatBadge?: string;
  acceptExtensions?: string[];
  className?: string;
  onClear?: () => void;
}

export function TextEditor({
  id,
  title,
  value,
  onChange,
  placeholder = 'Enter or paste text here...',
  onScrollSync,
  scrollRef,
  readOnly = false,
  testId,
  error,
  formatBadge,
  acceptExtensions = ['.txt', '.json', '.xml', '.yaml', '.yml', '.csv', '.sql', '.html', '.css', '.js', '.ts', '.md', '.diff'],
  className,
  onClear,
}: TextEditorProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = scrollRef || localRef;
  const gutterRef = useRef<HTMLDivElement>(null);
  const { copied, copy } = useClipboard();

  const lines = (value || '').split('\n');
  const lineCount = Math.max(lines.length, 1);
  const charCount = (value || '').length;
  const byteCount = new Blob([value || '']).size;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
    if (onScrollSync) {
      onScrollSync(target.scrollTop, target.scrollLeft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const tabSpaces = '  ';

      const updated = value.substring(0, start) + tabSpaces + value.substring(end);
      onChange(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
      }, 0);
    }
  };

  return (
    <div
      className={`editor-panel diff-editor-panel ${error ? 'panel-has-error' : ''} ${className || ''}`}
      data-testid={testId || `editor-${id}`}
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-title-text diff-editor-title">{title}</span>
          {formatBadge && (
            <span className="badge badge-accent diff-editor-format-badge">
              {formatBadge}
            </span>
          )}
          {error && (
            <span
              className="badge badge-error diff-editor-error-badge"
              title={error}
              data-testid={`error-badge-${id}`}
            >
              <AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
              {error}
            </span>
          )}
          <span className="panel-stats">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'} • {charCount} chars ({formatByteSize(byteCount)})
          </span>
        </div>
        <div className="panel-actions">
          <FileDropzone
            onFileLoaded={(content) => onChange(content)}
            acceptExtensions={acceptExtensions}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => copy(value)}
            disabled={!value}
            title={`Copy ${title}`}
            aria-label={`Copy ${title}`}
            data-testid={`btn-copy-${id}`}
          >
            {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => (onClear ? onClear() : onChange(''))}
            disabled={!value || readOnly}
            title={`Clear ${title}`}
            aria-label={`Clear ${title}`}
            data-testid={`btn-clear-${id}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="panel-body">
        <div className="custom-editor-container">
          <div ref={gutterRef} className="editor-line-gutter" aria-hidden="true">
            {Array.from({ length: Math.min(lineCount, 10000) }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
          <textarea
            id={id}
            ref={textareaRef}
            className={`editor-textarea diff-textarea ${error ? 'textarea-has-error' : ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            spellCheck="false"
            autoCapitalize="none"
            autoComplete="off"
            readOnly={readOnly}
            data-testid={`textarea-${id}`}
            aria-label={title}
          />
        </div>
      </div>
    </div>
  );
}

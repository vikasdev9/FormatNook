'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { formatByteSize } from '@/lib/file-reader';

// Lazy load Monaco Editor for optional rich mode with offline resilience
const MonacoEditor = dynamic(
  () =>
    import('@monaco-editor/react').catch(() => {
      return () => <div className="editor-loading">Monaco unavailable (offline mode).</div>;
    }),
  {
    ssr: false,
    loading: () => <div className="editor-loading">Loading editor engine...</div>,
  }
);

// Accurate logical line count helper for any LF/CRLF/empty text
export function countLogicalLines(text: string): number {
  if (!text || text.length === 0) return 0;
  return text.split(/\r\n|\r|\n/).length;
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  placeholder?: string;
  useMonaco?: boolean;
  fontSize?: number;
  wordWrap?: boolean;
  footerLabel?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  placeholder = 'Paste or type code here...',
  useMonaco = false,
  fontSize = 13,
  wordWrap = true,
  footerLabel = 'Editor',
}: CodeEditorProps) {
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const totalLines = countLogicalLines(value);
  const totalChars = (value || '').length;
  const totalBytes = new Blob([value || '']).size;
  const visibleGutterLines = Math.max(totalLines, 1);

  const updateCursor = (el: HTMLTextAreaElement) => {
    const selStart = el.selectionStart || 0;
    const before = el.value.slice(0, selStart);
    const lines = before.split(/\r\n|\r|\n/);
    setCursor({
      line: Math.max(1, lines.length),
      col: Math.max(1, (lines[lines.length - 1] || '').length + 1),
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const tabSpaces = '  ';

      const updated = value.substring(0, start) + tabSpaces + value.substring(end);
      onChange?.(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
        updateCursor(textarea);
      }, 0);
    }
  };

  if (useMonaco) {
    return (
      <div className="custom-editor-with-footer">
        <div className="custom-editor-container">
          <MonacoEditor
            height="100%"
            language={language}
            value={value}
            onChange={(val) => onChange?.(val || '')}
            onMount={(editor) => {
              editor.onDidChangeCursorPosition((e: any) => {
                setCursor({
                  line: e.position.lineNumber,
                  col: e.position.column,
                });
              });
            }}
            loading={<div className="editor-loading">Loading editor engine...</div>}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: wordWrap ? 'on' : 'off',
              automaticLayout: true,
            }}
            theme="vs-dark"
          />
        </div>
        <div className="editor-status-bar" data-testid={`${footerLabel.toLowerCase()}-status-bar`}>
          <div className="status-bar-left">
            <span data-testid="status-cursor-line">Ln: {cursor.line}</span>
            <span className="status-sep">|</span>
            <span data-testid="status-cursor-col">Col: {cursor.col}</span>
            <span className="status-sep">|</span>
            <span data-testid="status-total-lines">Total Lines: {totalLines}</span>
          </div>
          <div className="status-bar-right">
            <span>{totalChars.toLocaleString()} chars</span>
            <span className="status-sep">|</span>
            <span>{formatByteSize(totalBytes)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fast, accessible, robust editor with synchronized line numbers and real-time status bar
  return (
    <div className="custom-editor-with-footer">
      <div className="custom-editor-container">
        <div ref={gutterRef} className="editor-line-gutter" aria-hidden="true">
          {Array.from({ length: Math.min(visibleGutterLines, 10000) }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            updateCursor(e.target);
          }}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onClick={(e) => updateCursor(e.currentTarget)}
          onKeyUp={(e) => updateCursor(e.currentTarget)}
          onSelect={(e) => updateCursor(e.currentTarget)}
          onFocus={(e) => updateCursor(e.currentTarget)}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck="false"
          autoCapitalize="none"
          autoComplete="off"
          aria-label="Code editor"
          style={{
            fontSize: `${fontSize}px`,
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            wordBreak: wordWrap ? 'break-all' : 'normal',
            overflowWrap: wordWrap ? 'anywhere' : 'normal',
          }}
        />
      </div>
      <div className="editor-status-bar" data-testid={`${footerLabel.toLowerCase()}-status-bar`}>
        <div className="status-bar-left">
          <span data-testid="status-cursor-line">Ln: {cursor.line}</span>
          <span className="status-sep">|</span>
          <span data-testid="status-cursor-col">Col: {cursor.col}</span>
          <span className="status-sep">|</span>
          <span data-testid="status-total-lines">Total Lines: {totalLines}</span>
        </div>
        <div className="status-bar-right">
          <span>{totalChars.toLocaleString()} chars</span>
          <span className="status-sep">|</span>
          <span>{formatByteSize(totalBytes)}</span>
        </div>
      </div>
    </div>
  );
}

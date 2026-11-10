'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { formatByteSize } from '@/lib/file-reader';

// Lazy load Monaco Editor for optional rich mode
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading editor engine...</div>,
});

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  placeholder?: string;
  useMonaco?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  placeholder = 'Paste or type code here...',
  useMonaco = false,
}: CodeEditorProps) {
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const lines = (value || '').split('\n').length;
    setLineCount(Math.max(lines, 1));
  }, [value]);

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
      }, 0);
    }
  };

  if (useMonaco) {
    return (
      <div className="custom-editor-container">
        <MonacoEditor
          height="100%"
          language={language}
          value={value}
          onChange={(val) => onChange?.(val || '')}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
          theme="vs-dark"
        />
      </div>
    );
  }

  // Fast, accessible, robust editor with synchronized line numbers
  return (
    <div className="custom-editor-container">
      <div className="editor-line-gutter" aria-hidden="true">
        {Array.from({ length: Math.min(lineCount, 5000) }, (_, i) => (
          <div key={i + 1}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck="false"
        autoCapitalize="none"
        autoComplete="off"
        aria-label="Code editor"
      />
    </div>
  );
}

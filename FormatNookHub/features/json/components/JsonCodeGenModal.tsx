'use client';

import React, { useState, useMemo } from 'react';
import { X, Code2, Copy, Check, Download, Settings2, FileCode2 } from 'lucide-react';
import { CodeGenLanguage, CodeGenOptions } from '../types/json.types';
import { generateCodeFromData } from '../services/json-codegen-service';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

interface JsonCodeGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonContent: string;
}

const LANGUAGES: { id: CodeGenLanguage; name: string; ext: string; mime: string }[] = [
  { id: 'typescript', name: 'TypeScript', ext: 'ts', mime: 'text/typescript' },
  { id: 'python', name: 'Python', ext: 'py', mime: 'text/x-python' },
  { id: 'java', name: 'Java', ext: 'java', mime: 'text/x-java-source' },
  { id: 'kotlin', name: 'Kotlin', ext: 'kt', mime: 'text/x-kotlin' },
  { id: 'csharp', name: 'C#', ext: 'cs', mime: 'text/plain' },
  { id: 'go', name: 'Go', ext: 'go', mime: 'text/plain' },
  { id: 'rust', name: 'Rust', ext: 'rs', mime: 'text/rust' },
  { id: 'swift', name: 'Swift', ext: 'swift', mime: 'text/plain' },
  { id: 'dart', name: 'Dart', ext: 'dart', mime: 'text/plain' },
  { id: 'php', name: 'PHP', ext: 'php', mime: 'application/x-php' },
  { id: 'ruby', name: 'Ruby', ext: 'rb', mime: 'text/x-ruby' },
  { id: 'javascript', name: 'JavaScript (JSDoc)', ext: 'js', mime: 'application/javascript' },
];

export function JsonCodeGenModal({ isOpen, onClose, jsonContent }: JsonCodeGenModalProps) {
  const [selectedLang, setSelectedLang] = useState<CodeGenLanguage>('typescript');
  const [rootClassName, setRootClassName] = useState<string>('Root');
  const [optionalFields, setOptionalFields] = useState<boolean>(false);
  const [useInterfaces, setUseInterfaces] = useState<boolean>(true);

  const { copy, copied } = useClipboard();

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(jsonContent);
    } catch {
      return null;
    }
  }, [jsonContent]);

  const generatedCode = useMemo(() => {
    if (!parsedData) {
      return '// Please provide valid JSON in the editor to generate type models.';
    }

    const options: CodeGenOptions = {
      language: selectedLang,
      rootClassName: rootClassName || 'Root',
      optionalFields,
      useInterfaces,
    };

    try {
      return generateCodeFromData(parsedData, options);
    } catch (err: any) {
      return `// Error generating code: ${err?.message || 'Unknown error'}`;
    }
  }, [parsedData, selectedLang, rootClassName, optionalFields, useInterfaces]);

  if (!isOpen) return null;

  const currentLangMeta = LANGUAGES.find((l) => l.id === selectedLang) || LANGUAGES[0];

  const handleDownload = () => {
    downloadFile(
      generatedCode,
      `${rootClassName.toLowerCase() || 'model'}.${currentLangMeta.ext}`,
      currentLangMeta.mime
    );
  };

  return (
    <div className="json-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="codegen-title">
      <div className="json-modal-card json-transform-modal-card" style={{ maxWidth: '960px' }}>
        {/* Header */}
        <div className="json-modal-header">
          <div className="json-modal-title-group">
            <FileCode2 size={20} className="modal-title-icon" />
            <div>
              <h2 id="codegen-title" className="json-modal-title">
                JSON to Code &amp; Class Models
              </h2>
              <p className="json-modal-subtitle">
                Generate clean, type-safe data models and interfaces for 12 programming languages
              </p>
            </div>
          </div>
          <button
            type="button"
            className="json-modal-close-btn"
            onClick={onClose}
            aria-label="Close code generation modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="json-transform-tabs" style={{ overflowX: 'auto', flexWrap: 'wrap' }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className={`transform-tab-btn ${selectedLang === lang.id ? 'active' : ''}`}
              onClick={() => setSelectedLang(lang.id)}
            >
              <span>{lang.name}</span>
            </button>
          ))}
        </div>

        {/* Configuration Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 1.25rem', background: 'var(--color-bg-secondary, #1e293b)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Root Class Name:</label>
            <input
              type="text"
              value={rootClassName}
              onChange={(e) => setRootClassName(e.target.value)}
              className="form-control"
              style={{ width: '150px', padding: '0.25rem 0.5rem', fontSize: '12px', height: '30px' }}
              placeholder="Root"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={optionalFields}
              onChange={(e) => setOptionalFields(e.target.checked)}
            />
            <span>Make fields optional</span>
          </label>

          {selectedLang === 'typescript' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useInterfaces}
                onChange={(e) => setUseInterfaces(e.target.checked)}
              />
              <span>Use <code>interface</code> instead of <code>type</code></span>
            </label>
          )}
        </div>

        {/* Code Preview Area */}
        <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
          <pre
            style={{
              flex: 1,
              background: '#0d1117',
              color: '#e6edf3',
              padding: '1rem',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              lineHeight: 1.5,
              overflow: 'auto',
              maxHeight: '420px',
              border: '1px solid var(--color-border)',
            }}
          >
            <code>{generatedCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="json-modal-footer">
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Client-side type inference. Nested structures and primitive types detected automatically.
          </div>
          <div className="json-modal-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => copy(generatedCode)}
              disabled={!parsedData}
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={!parsedData}
            >
              <Download size={14} />
              <span>Download .{currentLangMeta.ext}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


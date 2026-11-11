'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Copy,
  Check,
  Download,
  AlertTriangle,
} from 'lucide-react';
import {
  xmlToJson,
  xmlToYaml,
  xmlToCsv,
  xmlToStringLiteral,
  jsonToXmlString,
} from '../services/xml-converter-service';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

interface XmlConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXml: string;
  onApplyToWorkspace: (newContent: string) => void;
}

type Direction =
  | 'xml-to-json'
  | 'json-to-xml'
  | 'xml-to-yaml'
  | 'xml-to-csv'
  | 'xml-to-tsv'
  | 'xml-to-string';

export function XmlConverterModal({
  isOpen,
  onClose,
  currentXml,
  onApplyToWorkspace,
}: XmlConverterModalProps) {
  const [direction, setDirection] = useState<Direction>('xml-to-json');
  const [sourceText, setSourceText] = useState(currentXml);
  const [convertedText, setConvertedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { copy } = useClipboard();

  useEffect(() => {
    if (isOpen) {
      setSourceText(currentXml);
    }
  }, [isOpen, currentXml]);

  useEffect(() => {
    if (!sourceText.trim()) {
      setConvertedText('');
      setError(null);
      setNotes(null);
      return;
    }

    try {
      setError(null);
      setNotes(null);
      let res;
      switch (direction) {
        case 'xml-to-json':
          res = xmlToJson(sourceText);
          break;
        case 'json-to-xml':
          res = jsonToXmlString(sourceText);
          break;
        case 'xml-to-yaml':
          res = xmlToYaml(sourceText);
          break;
        case 'xml-to-csv':
          res = xmlToCsv(sourceText, ',');
          break;
        case 'xml-to-tsv':
          res = xmlToCsv(sourceText, '\t');
          break;
        case 'xml-to-string':
          res = xmlToStringLiteral(sourceText);
          break;
      }

      if (res.error) {
        setError(res.error);
        setConvertedText('');
      } else {
        setConvertedText(res.output);
        setNotes(res.notes || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Conversion failed');
      setConvertedText('');
    }
  }, [direction, sourceText]);

  if (!isOpen) return null;

  const handleCopy = () => {
    copy(convertedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getTargetMeta = () => {
    switch (direction) {
      case 'xml-to-json':
        return { ext: 'json', mime: 'application/json' };
      case 'json-to-xml':
        return { ext: 'xml', mime: 'application/xml' };
      case 'xml-to-yaml':
        return { ext: 'yaml', mime: 'text/yaml' };
      case 'xml-to-csv':
        return { ext: 'csv', mime: 'text/csv' };
      case 'xml-to-tsv':
        return { ext: 'tsv', mime: 'text/tab-separated-values' };
      default:
        return { ext: 'txt', mime: 'text/plain' };
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '920px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ArrowRightLeft size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>XML Converters &amp; Transformers</h3>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 1.25rem' }}>
          {/* Format Selection Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'xml-to-json' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('xml-to-json')}
            >
              XML &rarr; JSON
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'json-to-xml' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('json-to-xml')}
            >
              JSON &rarr; XML
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'xml-to-yaml' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('xml-to-yaml')}
            >
              XML &rarr; YAML
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'xml-to-csv' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('xml-to-csv')}
            >
              XML &rarr; CSV
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'xml-to-tsv' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('xml-to-tsv')}
            >
              XML &rarr; TSV
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'xml-to-string' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('xml-to-string')}
            >
              XML &rarr; String Literal
            </button>
          </div>

          {/* Dual Panel Conversion Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minHeight: '360px' }}>
            {/* Input Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '0.8125rem' }}>
                Source Input ({direction.startsWith('json') ? 'JSON' : 'XML'})
              </div>
              <textarea
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8125rem',
                  resize: 'none',
                }}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter source content here..."
              />
            </div>

            {/* Output Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                }}
              >
                <span>Converted Output</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleCopy}
                    disabled={!convertedText}
                  >
                    {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => {
                      const meta = getTargetMeta();
                      downloadFile(convertedText, `converted.${meta.ext}`, meta.mime);
                    }}
                    disabled={!convertedText}
                  >
                    <Download size={12} />
                  </button>
                </div>
              </div>

              {error ? (
                <div style={{ padding: '1rem', color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              ) : (
                <textarea
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.8125rem',
                    resize: 'none',
                  }}
                  value={convertedText}
                  placeholder="Converted output will appear here..."
                />
              )}
            </div>
          </div>

          {notes && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {direction === 'json-to-xml' && convertedText && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onApplyToWorkspace(convertedText);
                onClose();
              }}
            >
              Apply to Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


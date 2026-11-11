'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Copy,
  Check,
  Download,
  AlertTriangle,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import {
  yamlToJson,
  jsonToYaml,
  yamlToXml,
  xmlToYaml,
  yamlToCsv,
  csvToYaml,
} from '../services/yaml-converter-service';
import { escapeYaml, unescapeYaml } from '../services/yaml-service';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

interface YamlConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYaml: string;
  onApplyToWorkspace: (newContent: string) => void;
}

type Direction =
  | 'yaml-to-json'
  | 'json-to-yaml'
  | 'yaml-to-xml'
  | 'xml-to-yaml'
  | 'yaml-to-csv'
  | 'csv-to-yaml'
  | 'yaml-to-tsv'
  | 'escape-string';

export function YamlConverterModal({
  isOpen,
  onClose,
  currentYaml,
  onApplyToWorkspace,
}: YamlConverterModalProps) {
  const [direction, setDirection] = useState<Direction>('yaml-to-json');
  const [sourceText, setSourceText] = useState(currentYaml);
  const [convertedText, setConvertedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { copy } = useClipboard();

  useEffect(() => {
    if (isOpen) {
      setSourceText(currentYaml);
    }
  }, [isOpen, currentYaml]);

  useEffect(() => {
    if (!sourceText.trim()) {
      setConvertedText('');
      setError(null);
      return;
    }

    try {
      setError(null);
      let res = '';
      switch (direction) {
        case 'yaml-to-json':
          res = yamlToJson(sourceText, 2);
          break;
        case 'json-to-yaml':
          res = jsonToYaml(sourceText, 2);
          break;
        case 'yaml-to-xml':
          res = yamlToXml(sourceText, 'root');
          break;
        case 'xml-to-yaml':
          res = xmlToYaml(sourceText, 2);
          break;
        case 'yaml-to-csv':
          res = yamlToCsv(sourceText, ',');
          break;
        case 'yaml-to-tsv':
          res = yamlToCsv(sourceText, '\t');
          break;
        case 'csv-to-yaml':
          res = csvToYaml(sourceText, ',');
          break;
        case 'escape-string':
          res = escapeYaml(sourceText);
          break;
      }
      setConvertedText(res);
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
      case 'yaml-to-json':
        return { ext: 'json', mime: 'application/json' };
      case 'json-to-yaml':
      case 'xml-to-yaml':
      case 'csv-to-yaml':
        return { ext: 'yaml', mime: 'text/yaml' };
      case 'yaml-to-xml':
        return { ext: 'xml', mime: 'application/xml' };
      case 'yaml-to-csv':
        return { ext: 'csv', mime: 'text/csv' };
      case 'yaml-to-tsv':
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
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ArrowRightLeft size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>YAML Bidirectional Converters</h3>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 1.25rem' }}>
          {/* Format Selection Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'yaml-to-json' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('yaml-to-json')}
            >
              YAML &rarr; JSON
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'json-to-yaml' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('json-to-yaml')}
            >
              JSON &rarr; YAML
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'yaml-to-xml' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('yaml-to-xml')}
            >
              YAML &rarr; XML
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
              className={`btn btn-xs ${direction === 'yaml-to-csv' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('yaml-to-csv')}
            >
              YAML &rarr; CSV
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'csv-to-yaml' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('csv-to-yaml')}
            >
              CSV &rarr; YAML
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'yaml-to-tsv' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('yaml-to-tsv')}
            >
              YAML &rarr; TSV
            </button>
            <button
              type="button"
              className={`btn btn-xs ${direction === 'escape-string' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDirection('escape-string')}
            >
              Escape String
            </button>
          </div>

          {/* Dual Panel Conversion Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minHeight: '360px' }}>
            {/* Input Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '0.8125rem' }}>
                Source Input ({direction.split('-')[0].toUpperCase()})
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

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Note: Multi-document YAML streams converted to JSON produce an array of document objects. Complex nested objects converted to CSV will serialize values as JSON strings.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {['json-to-yaml', 'xml-to-yaml', 'csv-to-yaml'].includes(direction) && convertedText && (
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


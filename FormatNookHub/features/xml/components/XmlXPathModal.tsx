'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Search,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import { evaluateXPath, COMMON_XPATH_PRESETS } from '../services/xml-xpath-service';
import { XPathQueryResult } from '../types/xml.types';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

interface XmlXPathModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlInput: string;
}

export function XmlXPathModal({ isOpen, onClose, xmlInput }: XmlXPathModalProps) {
  const [query, setQuery] = useState('//*');
  const [result, setResult] = useState<XPathQueryResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { copy } = useClipboard();

  useEffect(() => {
    if (isOpen && xmlInput) {
      const res = evaluateXPath(xmlInput, query);
      setResult(res);
    }
  }, [isOpen, xmlInput, query]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    copy(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '960px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Compass size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>XPath Expression Explorer</h3>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Query Input & Presets */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
              <input
                type="text"
                className="input-control"
                style={{ width: '100%', fontFamily: 'var(--font-mono, monospace)', paddingLeft: '2rem' }}
                placeholder="Enter XPath query (e.g., //item[@id='1'])..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="xpath-input"
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            {/* Presets */}
            <select
              className="select-control"
              style={{ width: '220px' }}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  setQuery(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>
                XPath Presets...
              </option>
              {COMMON_XPATH_PRESETS.map((p, idx) => (
                <option key={idx} value={p.query} title={p.description}>
                  {p.label} ({p.query})
                </option>
              ))}
            </select>
          </div>

          {/* Results Summary Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Matches Found:</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: result?.isValid && result.matchCount > 0 ? 'var(--status-success-bg, rgba(34,197,94,0.1))' : 'var(--bg-tertiary)',
                  color: result?.isValid && result.matchCount > 0 ? 'var(--status-success)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {result?.matchCount || 0}
              </span>
            </div>

            {result && result.matches.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  const combined = result.matches.map((m) => m.xml).join('\n');
                  downloadFile(combined, 'xpath-results.xml', 'application/xml');
                }}
              >
                <Download size={12} />
                <span>Export XML</span>
              </button>
            )}
          </div>

          {/* Error Message if any */}
          {result?.error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                color: 'var(--status-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
              }}
            >
              <AlertTriangle size={15} />
              <span>{result.error}</span>
            </div>
          )}

          {/* Results List */}
          <div style={{ flex: 1, minHeight: '320px', overflowY: 'auto' }}>
            {result?.matches.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                {result.error ? 'Fix the XPath expression above to view matches.' : 'No nodes matched this XPath expression.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result?.matches.map((match, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-card)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {match.xpath}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleCopy(match.xpath, `xp-${idx}`)}
                          title="Copy XPath"
                        >
                          {copiedId === `xp-${idx}` ? <Check size={11} className="text-success" /> : 'Copy XPath'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleCopy(match.xml, `xml-${idx}`)}
                          title="Copy XML"
                        >
                          {copiedId === `xml-${idx}` ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.5rem 0.75rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {match.xml}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


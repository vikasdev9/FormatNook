'use client';

import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Wrench, Copy, ArrowRight } from 'lucide-react';
import { validateBase64, Base64ValidationResult } from '../services/base64-validator.service';
import { CopyButton } from '@/components/workspace/CopyButton';

interface Base64ValidatorViewProps {
  initialPayload?: string;
  onSendToRepair?: (payload: string) => void;
}

const SAMPLE_VALIDATOR_INPUTS = [
  {
    name: 'Valid Standard',
    value: 'SGVsbG8sIEZvcm1hdE5vb2sgRGV2ZWxvcGVyIQ==',
  },
  {
    name: 'Missing Padding',
    value: 'SGVsbG8sIEZvcm1hdE5vb2sgRGV2ZWxvcGVyIQ', // missing ==
  },
  {
    name: 'URL-Safe Unpadded',
    value: 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ',
  },
  {
    name: 'Corrupted Char ($)',
    value: 'SGVsbG8$IEZvcm1hdE5vb2s=',
  },
  {
    name: 'Data URI Header',
    value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
];

export function Base64ValidatorView({ initialPayload = '', onSendToRepair }: Base64ValidatorViewProps) {
  const [input, setInput] = useState<string>(initialPayload);

  const result = useMemo<Base64ValidationResult | null>(() => {
    if (!input) return null;
    return validateBase64(input);
  }, [input]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Input panel */}
      <div className="editor-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <ShieldCheck size={16} />
            <span>Base64 Syntax & Structure Validator</span>
          </div>
          <div className="panel-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Samples:</span>
            {SAMPLE_VALIDATOR_INPUTS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setInput(sample.value)}
              >
                {sample.name}
              </button>
            ))}
            {input && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setInput('')}>Clear</button>}
          </div>
        </div>

        <div className="panel-body">
          <textarea
            className="editor-textarea wrap-text"
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste any Base64 string to check compliance against RFC 4648..."
            spellCheck="false"
            style={{
              minHeight: '120px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              overflowWrap: 'anywhere',
              overflowY: 'auto',
            }}
          />
        </div>
      </div>

      {/* Validation Output */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Status Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: result.isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${result.isValid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {result.isValid ? (
                <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />
              ) : (
                <XCircle size={24} style={{ color: 'var(--color-error)' }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: result.isValid ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {result.isValid ? 'Valid RFC 4648 Base64 String' : 'Base64 Validation Errors Found'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {result.isValid
                    ? `Compliant ${result.variant.toUpperCase()} alphabet. Expected ${result.estimatedDecodedBytes.toLocaleString()} decoded bytes.`
                    : `${result.errors.length} issue(s) detected. See actionable diagnostics below.`}
                </div>
              </div>
            </div>

            {!result.isValid && onSendToRepair && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => onSendToRepair(input)}
              >
                <Wrench size={14} />
                <span>Fix in Base64 Repair</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Alphabet Variant</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', textTransform: 'capitalize' }}>
                {result.variant}
              </div>
            </div>

            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Padding Status</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', textTransform: 'capitalize' }}>
                {result.paddingStatus}
              </div>
            </div>

            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Clean Length</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
                {result.cleanLength.toLocaleString()} chars
              </div>
            </div>

            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Estimated Decoded Size</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
                {result.estimatedDecodedBytes.toLocaleString()} B
              </div>
            </div>
          </div>

          {/* Errors List */}
          {result.errors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-error)' }}>
                Validation Errors ({result.errors.length}):
              </div>
              {result.errors.map((err, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#151F31',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#F8FAFC' }}>
                    <span style={{ fontWeight: 600 }}>{err.message}</span>
                    {err.line && (
                      <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>
                        Line {err.line}, Col {err.column}
                      </span>
                    )}
                  </div>
                  {err.suggestion && (
                    <div style={{ color: '#22C3EE', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                      Suggested Fix: {err.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Warnings List */}
          {result.warnings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-warning)' }}>
                Informational Warnings ({result.warnings.length}):
              </div>
              {result.warnings.map((warn, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#151F31',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ color: '#F8FAFC' }}>{warn.message}</div>
                  {warn.suggestion && (
                    <div style={{ color: '#A6B4C8', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                      Tip: {warn.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


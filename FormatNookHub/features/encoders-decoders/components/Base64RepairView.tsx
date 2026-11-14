'use client';

import React, { useState, useMemo } from 'react';
import { Wrench, CheckCircle2, AlertTriangle, Copy, Download, RefreshCw, ArrowRight } from 'lucide-react';
import { repairBase64, Base64RepairOptions, DEFAULT_REPAIR_OPTIONS } from '../services/base64-repair.service';
import { CopyButton } from '@/components/workspace/CopyButton';
import { downloadFile } from '@/lib/download';

interface Base64RepairViewProps {
  initialPayload?: string;
  onSendToDecode?: (payload: string) => void;
}

const SAMPLE_REPAIR_INPUTS = [
  {
    name: 'Embedded Newlines & Data URI',
    value: 'data:image/png;base64,\niVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk\n+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  {
    name: 'Missing Padding (=)',
    value: 'SGVsbG8gV29ybGQ', // missing =
  },
  {
    name: 'URL-Safe to Standard',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  {
    name: 'Foreign Characters ($#@)',
    value: 'SGVsbG8$IEZvcm1hdE5vb2s@IQ==',
  },
];

export function Base64RepairView({ initialPayload = '', onSendToDecode }: Base64RepairViewProps) {
  const [input, setInput] = useState<string>(initialPayload);
  const [options, setOptions] = useState<Base64RepairOptions>({ ...DEFAULT_REPAIR_OPTIONS });

  const result = useMemo(() => {
    if (!input) return null;
    return repairBase64(input, options);
  }, [input, options]);

  const handleDownload = () => {
    if (!result || !result.repairedOutput) return;
    downloadFile(result.repairedOutput, 'repaired-base64.txt', 'text/plain');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Repair Configuration Options Toolbar */}
      <div
        style={{
          backgroundColor: '#151F31',
          border: '1px solid #263449',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F8FAFC' }}>
          Safe Normalization & Repair Rules:
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: '#A6B4C8' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.stripDataUriPrefix}
              onChange={(e) => setOptions({ ...options, stripDataUriPrefix: e.target.checked })}
            />
            <span>Strip Data URI header (data:...;base64,)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.removeWhitespace}
              onChange={(e) => setOptions({ ...options, removeWhitespace: e.target.checked })}
            />
            <span>Remove Whitespace & Line Breaks</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.fixPadding}
              onChange={(e) => setOptions({ ...options, fixPadding: e.target.checked })}
            />
            <span>Repair Missing Padding (= / ==)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.convertUrlSafeToStandard}
              onChange={(e) =>
                setOptions({
                  ...options,
                  convertUrlSafeToStandard: e.target.checked,
                  convertStandardToUrlSafe: e.target.checked ? false : options.convertStandardToUrlSafe,
                })
              }
            />
            <span>Convert URL-Safe (- _) to Standard (+ /)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: options.stripInvalidChars ? '#EF4444' : undefined }}>
            <input
              type="checkbox"
              checked={options.stripInvalidChars}
              onChange={(e) => setOptions({ ...options, stripInvalidChars: e.target.checked })}
            />
            <span>Strip Invalid Non-Alphabet Characters</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Line Wrapping:</span>
            <select
              className="select-control"
              value={options.lineWrap}
              onChange={(e) => setOptions({ ...options, lineWrap: e.target.value as any })}
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            >
              <option value="none">None (Single Line)</option>
              <option value="64">64 Chars (MIME standard)</option>
              <option value="76">76 Chars (PEM standard)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor Grid: Left = Original, Right = Repaired */}
      <div className="editor-workspace-grid">
        {/* Left Column: Original Input */}
        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-title-group">Original Base64 Input</span>
            <div className="panel-actions" style={{ display: 'flex', gap: '0.4rem' }}>
              {SAMPLE_REPAIR_INPUTS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setInput(sample.value)}
                >
                  {sample.name}
                </button>
              ))}
              <CopyButton text={input} label="Copy" />
            </div>
          </div>
          <div className="panel-body">
            <textarea
              className="editor-textarea wrap-text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste malformed, unpadded, or whitespace-polluted Base64 here..."
              spellCheck="false"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                overflowY: 'auto',
              }}
            />
          </div>
        </div>

        {/* Right Column: Repaired Output */}
        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-title-group">Repaired & Normalized Output</span>
            <div className="panel-actions" style={{ display: 'flex', gap: '0.4rem' }}>
              <CopyButton text={result?.repairedOutput || ''} label="Copy Repaired" />
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={handleDownload}
                disabled={!result?.repairedOutput}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
              {onSendToDecode && result?.repairedOutput && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => onSendToDecode(result.repairedOutput)}
                >
                  <ArrowRight size={14} />
                  <span>Decode</span>
                </button>
              )}
            </div>
          </div>
          <div className="panel-body">
            <textarea
              className="editor-textarea wrap-text"
              readOnly
              value={result?.repairedOutput || ''}
              placeholder="Repaired output will appear here..."
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                overflowY: 'auto',
              }}
            />
          </div>
        </div>
      </div>

      {/* Transformation Log & Warnings */}
      {result && (
        <div
          style={{
            backgroundColor: '#151F31',
            border: '1px solid #263449',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F8FAFC' }}>
              Repair Transformations Summary ({result.transformations.length} applied)
            </span>
            <span
              className={`badge ${result.isSuccessfullyDecodable ? 'badge-success' : 'badge-warning'}`}
            >
              {result.isSuccessfullyDecodable ? 'Successfully Decodable' : 'Attention Needed'}
            </span>
          </div>

          {result.transformations.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#A6B4C8' }}>
              {result.transformations.map((t, idx) => (
                <li key={idx} style={{ marginTop: '0.2rem' }}>
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: '#A6B4C8' }}>
              No transformations needed. The string was already normalized under active options.
            </div>
          )}

          {result.warnings.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {result.warnings.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-warning)',
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


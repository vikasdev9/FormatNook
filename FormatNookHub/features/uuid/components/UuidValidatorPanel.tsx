'use client';

import React, { useState, useMemo } from 'react';
import { validateMultipleUuids } from '../services/uuid-service';
import { CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

export function UuidValidatorPanel() {
  const [input, setInput] = useState<string>(
    '550e8400-e29b-41d4-a716-446655440000\n{6ba7b810-9dad-11d1-80b4-00c04fd430c8}\nnot-a-valid-uuid\n4f65342a1234456789abcdef01234567'
  );

  const { copied, copy } = useClipboard();

  const summary = useMemo(() => validateMultipleUuids(input), [input]);

  const validUuids = useMemo(() => {
    return summary.results.filter((r) => r.isValid).map((r) => r.normalized);
  }, [summary]);

  const handleCopyValid = () => {
    copy(validUuids.join('\n'));
  };

  return (
    <div className="uuid-validator-container" data-testid="uuid-validator-panel">
      <div className="validator-input-group">
        <div className="validator-header">
          <label htmlFor="uuid-validator-textarea" className="uuid-label">
            Paste UUIDs to Validate (One per line or comma-separated)
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleCopyValid}
            disabled={validUuids.length === 0}
            data-testid="btn-copy-valid"
          >
            <Copy size={13} />
            <span>{copied ? 'Copied!' : 'Copy Valid UUIDs'}</span>
          </button>
        </div>
        <textarea
          id="uuid-validator-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste UUIDs here (e.g. 550e8400-e29b-41d4-a716-446655440000)..."
          className="uuid-textarea"
          rows={5}
          data-testid="validator-textarea"
          spellCheck="false"
        />
      </div>

      {/* Validation Summary Cards */}
      <div className="validator-stats-grid">
        <div className="validator-stat-card">
          <span className="validator-stat-label">Total Input</span>
          <span className="validator-stat-val" data-testid="stat-total">{summary.totalCount}</span>
        </div>
        <div className="validator-stat-card">
          <span className="validator-stat-label">Valid UUIDs</span>
          <span className="validator-stat-val text-success" data-testid="stat-valid">{summary.validCount}</span>
        </div>
        <div className="validator-stat-card">
          <span className="validator-stat-label">Invalid / Malformed</span>
          <span className="validator-stat-val text-error" data-testid="stat-invalid">{summary.invalidCount}</span>
        </div>
        <div className="validator-stat-card">
          <span className="validator-stat-label">RFC 4122 v4</span>
          <span className="validator-stat-val text-accent" data-testid="stat-v4">{summary.v4Count}</span>
        </div>
      </div>

      {/* Results Table */}
      {summary.results.length > 0 && (
        <div className="validator-table-wrap">
          <table className="validator-table" data-testid="validator-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Input Value</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Status</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Version</th>
                <th style={{ textAlign: 'left', width: '160px' }}>Variant</th>
              </tr>
            </thead>
            <tbody>
              {summary.results.map((res, idx) => (
                <tr key={`${res.raw}-${idx}`} data-testid={`validator-row-${idx}`}>
                  <td className="validator-cell-raw">
                    <code>{res.raw}</code>
                    {res.error && <span className="validator-row-error">{res.error}</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {res.isValid ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Valid
                      </span>
                    ) : (
                      <span className="badge badge-error">
                        <AlertCircle size={12} /> Invalid
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {res.version !== null ? (
                      <span className={`badge ${res.isV4 ? 'badge-accent' : 'badge-secondary'}`}>
                        v{res.version}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className="variant-label">{res.variant || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

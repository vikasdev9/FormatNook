'use client';

import React from 'react';
import { JwtDecodeResult } from '../types/jwt.types';
import { ShieldAlert, CheckCircle2, Clock, Key, AlertTriangle, Copy } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

interface JwtOverviewPanelProps {
  decoded: JwtDecodeResult;
}

export function JwtOverviewPanel({ decoded }: JwtOverviewPanelProps) {
  const { copy } = useClipboard();
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopyClaim = (val: string, keyName: string) => {
    copy(val);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const alg = decoded.header?.alg ? String(decoded.header.alg) : 'None';
  const typ = decoded.header?.typ ? String(decoded.header.typ) : 'JWT';

  return (
    <div className="jwt-panel-container" data-testid="jwt-overview-panel">
      {/* Prominent Security Notice Banner */}
      <div className="jwt-security-banner" data-testid="jwt-security-warning">
        <div className="security-banner-icon">
          <ShieldAlert size={20} />
        </div>
        <div className="security-banner-content">
          <span className="security-banner-title">Security Notice: Decoding is NOT Verification</span>
          <p className="security-banner-desc">
            Decoding a JWT does not verify its signature. Anyone can modify a JWT payload. Never trust decoded claims
            until the token&apos;s signature and claims are verified by a trusted backend.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="jwt-summary-grid">
        <div className="jwt-summary-card">
          <span className="summary-card-label">Algorithm</span>
          <span className={`summary-card-val ${decoded.isUnsigned ? 'text-error' : 'text-accent'}`} data-testid="overview-alg">
            {alg}
          </span>
          {decoded.isUnsigned && (
            <span className="badge badge-error" style={{ marginTop: '0.25rem' }}>
              Unsigned Token
            </span>
          )}
        </div>

        <div className="jwt-summary-card">
          <span className="summary-card-label">Token Type</span>
          <span className="summary-card-val" data-testid="overview-typ">{typ}</span>
          <span className="summary-card-sub">RFC 7519 Format</span>
        </div>

        <div className="jwt-summary-card">
          <span className="summary-card-label">Expiry Status</span>
          <span
            className={`summary-card-val ${
              decoded.isExpired ? 'text-error' : decoded.payload?.exp ? 'text-success' : 'text-muted'
            }`}
            data-testid="overview-expiry-status"
          >
            {decoded.isExpired ? 'Expired' : decoded.payload?.exp ? 'Active' : 'No Exp Claim'}
          </span>
          <span className="summary-card-sub">
            {decoded.timeRemaining ? decoded.timeRemaining : 'No exp timestamp'}
          </span>
        </div>

        <div className="jwt-summary-card">
          <span className="summary-card-label">Signature Segment</span>
          <span
            className={`summary-card-val ${decoded.signature ? 'text-success' : 'text-warning'}`}
            data-testid="overview-signature-status"
          >
            {decoded.signature ? 'Present' : 'None'}
          </span>
          <span className="summary-card-sub">
            {decoded.signature ? `${decoded.signature.length} bytes` : 'Unsigned / No Signature'}
          </span>
        </div>
      </div>

      {/* Claims Inspector Table */}
      {decoded.payload && (
        <div className="jwt-claims-card">
          <div className="claims-card-header">
            <span className="claims-card-title">Standard & Custom Claims</span>
            <span className="badge badge-secondary">
              {Object.keys(decoded.payload).length} claims detected
            </span>
          </div>

          <div className="claims-table-wrap">
            <table className="jwt-claims-table" data-testid="claims-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Claim</th>
                  <th>Value</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Copy</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(decoded.payload).map(([key, val]) => {
                  const displayVal =
                    typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
                  const isCopied = copiedKey === key;

                  return (
                    <tr key={key} data-testid={`claim-row-${key}`}>
                      <td className="claim-key-cell">
                        <code>{key}</code>
                      </td>
                      <td className="claim-val-cell">
                        <span className="claim-value-text">{displayVal}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleCopyClaim(displayVal, key)}
                          title={`Copy ${key} value`}
                          aria-label={`Copy ${key} value`}
                          data-testid={`copy-claim-${key}`}
                        >
                          {isCopied ? <CheckCircle2 size={13} color="var(--color-success)" /> : <Copy size={13} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

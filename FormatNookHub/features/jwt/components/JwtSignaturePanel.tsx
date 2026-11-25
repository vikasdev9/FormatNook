'use client';

import React from 'react';
import { Copy, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

interface JwtSignaturePanelProps {
  signature: string;
  alg: string;
  isUnsigned: boolean;
}

export function JwtSignaturePanel({ signature, alg, isUnsigned }: JwtSignaturePanelProps) {
  const { copied, copy } = useClipboard();

  return (
    <div className="jwt-panel-container" data-testid="jwt-signature-panel">
      {/* Security Advisory */}
      <div className="jwt-security-banner">
        <div className="security-banner-icon">
          <Lock size={20} />
        </div>
        <div className="security-banner-content">
          <span className="security-banner-title">Signature Integrity & Cryptographic Boundary</span>
          <p className="security-banner-desc">
            The signature segment guarantees that the token was signed by the private key holder or shared secret.
            Signatures are binary HMAC digests or cryptographic signatures (RSA / ECDSA) and are not JSON-decodable.
          </p>
        </div>
      </div>

      <div className="jwt-code-card">
        <div className="jwt-code-header">
          <div className="code-header-meta">
            <span className="code-header-title">Raw Signature Segment</span>
            <span className="badge badge-accent">Algorithm: {alg || 'none'}</span>
            <span className="badge badge-secondary">
              {signature ? `${signature.length} chars` : 'Empty signature'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => copy(signature)}
            disabled={!signature}
            data-testid="btn-copy-signature"
          >
            <Copy size={12} />
            <span>{copied ? 'Copied!' : 'Copy Signature'}</span>
          </button>
        </div>

        <div className="signature-display-wrap">
          <code className="signature-code-text" data-testid="signature-code">
            {signature || (isUnsigned ? '// Token is unsigned (alg: none)' : '// No signature segment found')}
          </code>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { JwtHeader } from '../types/jwt.types';
import { Copy, Key, ShieldAlert } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

interface JwtHeaderPanelProps {
  header: JwtHeader | null;
  headerJson: string;
  isUnsigned: boolean;
}

export function JwtHeaderPanel({ header, headerJson, isUnsigned }: JwtHeaderPanelProps) {
  const { copied, copy } = useClipboard();

  return (
    <div className="jwt-panel-container" data-testid="jwt-header-panel">
      {isUnsigned && (
        <div className="jwt-warning-card">
          <ShieldAlert size={16} className="text-error" />
          <span>
            <strong>Warning:</strong> Token algorithm is set to <code>none</code>. This token has no cryptographic
            signature and cannot be verified for integrity.
          </span>
        </div>
      )}

      <div className="jwt-code-card">
        <div className="jwt-code-header">
          <div className="code-header-meta">
            <Key size={15} className="text-accent-icon" />
            <span className="code-header-title">Decoded Header (JOSE)</span>
            {header?.alg && (
              <span className="badge badge-accent">alg: {String(header.alg)}</span>
            )}
            {header?.typ && (
              <span className="badge badge-secondary">typ: {String(header.typ)}</span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => copy(headerJson)}
            disabled={!headerJson}
            data-testid="btn-copy-header"
          >
            <Copy size={12} />
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>
        </div>
        <textarea
          readOnly
          value={headerJson || '// No header parsed'}
          className="jwt-json-textarea"
          rows={10}
          data-testid="header-json-textarea"
        />
      </div>
    </div>
  );
}

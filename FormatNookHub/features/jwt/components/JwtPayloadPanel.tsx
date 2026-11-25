'use client';

import React from 'react';
import { JwtPayload } from '../types/jwt.types';
import { Copy, FileJson } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

interface JwtPayloadPanelProps {
  payload: JwtPayload | null;
  payloadJson: string;
}

export function JwtPayloadPanel({ payload, payloadJson }: JwtPayloadPanelProps) {
  const { copied, copy } = useClipboard();

  return (
    <div className="jwt-panel-container" data-testid="jwt-payload-panel">
      <div className="jwt-code-card">
        <div className="jwt-code-header">
          <div className="code-header-meta">
            <FileJson size={15} className="text-accent-icon" />
            <span className="code-header-title">Decoded Payload (Claims)</span>
            {payload && (
              <span className="badge badge-secondary">
                {Object.keys(payload).length} claims
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => copy(payloadJson)}
            disabled={!payloadJson}
            data-testid="btn-copy-payload"
          >
            <Copy size={12} />
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>
        </div>
        <textarea
          readOnly
          value={payloadJson || '// No payload parsed'}
          className="jwt-json-textarea"
          rows={14}
          data-testid="payload-json-textarea"
        />
      </div>
    </div>
  );
}

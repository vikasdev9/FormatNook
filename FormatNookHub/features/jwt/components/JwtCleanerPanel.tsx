'use client';

import React, { useState, useMemo } from 'react';
import { cleanJwtToken } from '../services/jwt-service';
import { Copy, Sparkles, Check } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

interface JwtCleanerPanelProps {
  onApplyToWorkspace: (cleaned: string) => void;
}

export function JwtCleanerPanel({ onApplyToWorkspace }: JwtCleanerPanelProps) {
  const [dirtyToken, setDirtyToken] = useState<string>('');
  const { copied, copy } = useClipboard();
  const [applied, setApplied] = useState<boolean>(false);

  const cleanedToken = useMemo(() => cleanJwtToken(dirtyToken), [dirtyToken]);

  const handleApply = () => {
    onApplyToWorkspace(cleanedToken);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="jwt-panel-container" data-testid="jwt-cleaner-panel">
      <div className="jwt-code-card">
        <div className="jwt-code-header">
          <div className="code-header-meta">
            <Sparkles size={16} className="text-accent-icon" />
            <span className="code-header-title">Token Sanitizer & Cleaner</span>
          </div>
          <div className="converter-actions">
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={handleApply}
              disabled={!cleanedToken}
              data-testid="btn-apply-cleaned-jwt"
            >
              {applied ? <Check size={12} /> : null}
              <span>{applied ? 'Applied to Workspace!' : 'Apply to Decoder'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => copy(cleanedToken)}
              disabled={!cleanedToken}
              data-testid="btn-copy-cleaned-jwt"
            >
              <Copy size={12} />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="jwt-card-body">
          <label htmlFor="dirty-jwt-input" className="uuid-label">
            Paste messy token (with quotes, Bearer prefixes, or rogue whitespace)
          </label>
          <textarea
            id="dirty-jwt-input"
            value={dirtyToken}
            onChange={(e) => setDirtyToken(e.target.value)}
            placeholder='e.g. "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."'
            className="uuid-textarea"
            rows={5}
            data-testid="dirty-token-input"
            spellCheck="false"
          />

          {cleanedToken && (
            <div style={{ marginTop: '1rem' }}>
              <span className="uuid-label">Sanitized Token</span>
              <textarea
                readOnly
                value={cleanedToken}
                className="uuid-textarea output-readonly"
                rows={4}
                data-testid="cleaned-token-output"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { SocialLimitStatus } from '../types/text.types';
import { Share2, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

interface SocialMediaPanelProps {
  limits: SocialLimitStatus[];
  text: string;
}

export function SocialMediaPanel({ limits, text }: SocialMediaPanelProps) {
  const { copied, copy } = useClipboard();

  return (
    <div className="text-social-container" data-testid="social-media-panel">
      <div className="social-top-actions">
        <span className="social-header-desc">
          Compare your text length against standard character limits across social networks in real time.
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => copy(text)}
          disabled={!text}
          aria-label="Copy text for social media"
          data-testid="copy-social-text"
        >
          <Copy size={14} />
          <span>{copied ? 'Copied!' : 'Copy Text'}</span>
        </button>
      </div>

      <div className="social-cards-grid">
        {limits.map((item) => (
          <div
            key={item.id}
            className={`social-card ${item.isOverLimit ? 'card-over-limit' : ''}`}
            data-testid={`social-card-${item.id}`}
          >
            <div className="social-card-header">
              <div className="social-platform-title">
                <span className="social-platform-name">{item.name}</span>
                {item.isOverLimit ? (
                  <span className="badge badge-error" data-testid={`badge-over-${item.id}`}>
                    <AlertTriangle size={12} /> Limit Exceeded
                  </span>
                ) : (
                  <span className="badge badge-success">
                    <CheckCircle size={12} /> Within Limit
                  </span>
                )}
              </div>
              <span className="social-count-badge">
                <strong>{item.currentChars.toLocaleString()}</strong> / {item.maxChars.toLocaleString()}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="social-progress-track">
              <div
                className={`social-progress-fill ${
                  item.isOverLimit ? 'fill-error' : item.percentage > 85 ? 'fill-warning' : 'fill-primary'
                }`}
                style={{ width: `${item.percentage}%` }}
                role="progressbar"
                aria-valuenow={item.currentChars}
                aria-valuemin={0}
                aria-valuemax={item.maxChars}
              />
            </div>

            <div className="social-card-footer">
              <span className={`social-remaining ${item.isOverLimit ? 'text-error' : 'text-muted'}`}>
                {item.isOverLimit
                  ? `${Math.abs(item.remainingChars).toLocaleString()} characters over limit`
                  : `${item.remainingChars.toLocaleString()} characters remaining`}
              </span>
              <p className="social-notes">{item.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

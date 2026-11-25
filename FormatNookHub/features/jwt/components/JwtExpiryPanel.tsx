'use client';

import React from 'react';
import { JwtTimestampAnalysis } from '../types/jwt.types';
import { Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface JwtExpiryPanelProps {
  timestamps: JwtTimestampAnalysis[];
  clockSkewSec: number;
  onClockSkewChange: (seconds: number) => void;
}

export function JwtExpiryPanel({
  timestamps,
  clockSkewSec,
  onClockSkewChange,
}: JwtExpiryPanelProps) {
  const getStatusBadge = (status: JwtTimestampAnalysis['status']) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Active / Valid</span>;
      case 'expired':
        return <span className="badge badge-error"><ShieldAlert size={12} /> Expired</span>;
      case 'future':
        return <span className="badge badge-warning"><Clock size={12} /> Not Yet Valid</span>;
      case 'missing':
        return <span className="badge badge-secondary">Not Present</span>;
      case 'invalid':
        return <span className="badge badge-error"><AlertCircle size={12} /> Invalid NumericDate</span>;
    }
  };

  return (
    <div className="jwt-panel-container" data-testid="jwt-expiry-panel">
      {/* Clock Skew Tolerance Control */}
      <div className="jwt-clockskew-bar">
        <div className="clockskew-info">
          <span className="clockskew-title">Clock Skew Tolerance: {clockSkewSec} seconds</span>
          <span className="clockskew-sub">
            Compensates for minor server clock drift between issuing party and client application.
          </span>
        </div>
        <div className="clockskew-slider-wrap">
          <input
            type="range"
            min={0}
            max={300}
            step={5}
            value={clockSkewSec}
            onChange={(e) => onClockSkewChange(Number(e.target.value))}
            className="text-slider"
            aria-label="Clock skew tolerance in seconds"
            data-testid="clock-skew-slider"
          />
        </div>
      </div>

      {/* Timestamps Grid */}
      <div className="jwt-timestamps-grid">
        {timestamps.map((t) => (
          <div key={t.claim} className="jwt-timestamp-card" data-testid={`timestamp-card-${t.claim}`}>
            <div className="timestamp-card-header">
              <span className="timestamp-claim-name">{t.label}</span>
              {getStatusBadge(t.status)}
            </div>

            <div className="timestamp-details">
              <div className="timestamp-row">
                <span className="timestamp-meta-label">Unix Seconds:</span>
                <span className="timestamp-meta-val">
                  {t.rawSeconds !== null ? <code>{t.rawSeconds}</code> : <span className="text-muted">—</span>}
                </span>
              </div>
              <div className="timestamp-row">
                <span className="timestamp-meta-label">Local Time:</span>
                <span className="timestamp-meta-val">{t.dateLocal || <span className="text-muted">—</span>}</span>
              </div>
              <div className="timestamp-row">
                <span className="timestamp-meta-label">UTC Time:</span>
                <span className="timestamp-meta-val">{t.dateUtc || <span className="text-muted">—</span>}</span>
              </div>
            </div>

            <div className="timestamp-card-footer">
              <p className="timestamp-msg">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

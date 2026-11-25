'use client';

import React, { useState } from 'react';
import { Clock, ArrowRightLeft, Copy } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

export function JwtConverterPanel() {
  const [secondsInput, setSecondsInput] = useState<string>(() =>
    Math.floor(Date.now() / 1000).toString()
  );
  const [dateInput, setDateInput] = useState<string>(() => new Date().toISOString().slice(0, 16));

  const { copy } = useClipboard();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const numSecs = Number(secondsInput);
  const dateFromSecs = !isNaN(numSecs) && isFinite(numSecs) ? new Date(numSecs * 1000) : null;

  const secsFromDate = dateInput ? Math.floor(new Date(dateInput).getTime() / 1000) : null;

  const handleCopy = (text: string, key: string) => {
    copy(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="jwt-panel-container" data-testid="jwt-converter-panel">
      <div className="converter-columns">
        {/* Seconds -> Date */}
        <div className="jwt-code-card">
          <div className="jwt-code-header">
            <span className="code-header-title">Unix Seconds $\to$ Human Date</span>
          </div>
          <div className="jwt-card-body">
            <label htmlFor="sec-input" className="uuid-label">
              JWT NumericDate (Seconds since epoch)
            </label>
            <input
              id="sec-input"
              type="number"
              value={secondsInput}
              onChange={(e) => setSecondsInput(e.target.value)}
              className="select-control"
              style={{ width: '100%', marginBottom: '1rem' }}
              placeholder="e.g. 1711234567"
              data-testid="input-seconds"
            />

            {dateFromSecs && !isNaN(dateFromSecs.getTime()) ? (
              <div className="timestamp-details">
                <div className="timestamp-row">
                  <span className="timestamp-meta-label">Local Time:</span>
                  <span className="timestamp-meta-val">{dateFromSecs.toLocaleString()}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleCopy(dateFromSecs.toLocaleString(), 'local')}
                  >
                    {copiedKey === 'local' ? 'Copied' : <Copy size={12} />}
                  </button>
                </div>
                <div className="timestamp-row">
                  <span className="timestamp-meta-label">UTC Time:</span>
                  <span className="timestamp-meta-val">{dateFromSecs.toUTCString()}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleCopy(dateFromSecs.toUTCString(), 'utc')}
                  >
                    {copiedKey === 'utc' ? 'Copied' : <Copy size={12} />}
                  </button>
                </div>
                <div className="timestamp-row">
                  <span className="timestamp-meta-label">ISO 8601:</span>
                  <span className="timestamp-meta-val">{dateFromSecs.toISOString()}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleCopy(dateFromSecs.toISOString(), 'iso')}
                  >
                    {copiedKey === 'iso' ? 'Copied' : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-error" style={{ fontSize: '0.8125rem' }}>
                Please enter a valid numeric timestamp.
              </div>
            )}
          </div>
        </div>

        {/* Date -> Seconds */}
        <div className="jwt-code-card">
          <div className="jwt-code-header">
            <span className="code-header-title">Human Date $\to$ Unix Seconds</span>
          </div>
          <div className="jwt-card-body">
            <label htmlFor="date-input" className="uuid-label">
              Date & Time (Local)
            </label>
            <input
              id="date-input"
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="select-control"
              style={{ width: '100%', marginBottom: '1rem' }}
              data-testid="input-date"
            />

            {secsFromDate !== null && !isNaN(secsFromDate) ? (
              <div className="timestamp-details">
                <div className="timestamp-row">
                  <span className="timestamp-meta-label">Unix Seconds:</span>
                  <span className="timestamp-meta-val">
                    <code>{secsFromDate}</code>
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleCopy(String(secsFromDate), 'sec')}
                  >
                    {copiedKey === 'sec' ? 'Copied' : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-error" style={{ fontSize: '0.8125rem' }}>
                Please select a valid date.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

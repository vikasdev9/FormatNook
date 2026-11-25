'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  COMMON_TIMEZONES,
  TimestampUnit,
  timestampToDate,
  dateToTimestamp,
} from '../services/timestamp-service';
import { useClipboard } from '@/hooks/useClipboard';

import {
  Clock,
  ArrowRightLeft,
  Calendar,
  Copy,
  Check,
  Play,
  Pause,
  BookOpen,
  ClipboardPaste,
  Globe,
  Hash,
} from 'lucide-react';

export function TimestampWorkspace() {
  // Live ticking epoch clock
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [isClockRunning, setIsClockRunning] = useState<boolean>(true);

  useEffect(() => {
    if (!isClockRunning) return;
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockRunning]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'ts-to-date' | 'date-to-ts' | 'cheat-sheet'>('ts-to-date');

  // Timestamp to Date State
  const [tsInput, setTsInput] = useState<string>(() => Math.floor(Date.now() / 1000).toString());
  const [unit, setUnit] = useState<TimestampUnit>('auto');
  const [selectedTz, setSelectedTz] = useState<string>('UTC');

  // Date to Timestamp State
  const [dateInput, setDateInput] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 19);
  });

  const { copy } = useClipboard();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = useCallback(
    (text: string, key: string) => {
      copy(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    },
    [copy]
  );

  // Conversion calculations
  const tsToDateResult = useMemo(() => {
    return timestampToDate(tsInput, unit, selectedTz);
  }, [tsInput, unit, selectedTz]);

  const dateToTsResult = useMemo(() => {
    return dateToTimestamp(dateInput);
  }, [dateInput]);

  return (
    <div className="timestamp-workspace-wrapper" data-testid="timestamp-workspace">
      {/* Live Current Epoch Clock Header Card */}
      <div className="timestamp-live-clock-card" data-testid="live-epoch-clock">
        <div className="live-clock-left">
          <div className="live-clock-label-wrap">
            <Clock size={16} color="var(--accent-primary)" />
            <span className="live-clock-label">Current Unix Epoch Timestamp</span>
          </div>
          <div className="live-clock-counter-wrap">
            <span className="live-clock-seconds" data-testid="live-epoch-seconds">
              {now}
            </span>
            <span className="live-clock-unit">seconds</span>
          </div>
        </div>

        <div className="live-clock-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsClockRunning((r) => !r)}
            aria-label={isClockRunning ? 'Pause live clock' : 'Resume live clock'}
          >
            {isClockRunning ? <Pause size={14} /> : <Play size={14} />}
            <span>{isClockRunning ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleCopy(String(now), 'live-now')}
            aria-label="Copy current timestamp"
          >
            {copiedKey === 'live-now' ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
            <span>{copiedKey === 'live-now' ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="csv-tabs-bar" role="tablist" aria-label="Timestamp tools navigation">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ts-to-date'}
          className={`csv-tab-btn ${activeTab === 'ts-to-date' ? 'active' : ''}`}
          onClick={() => setActiveTab('ts-to-date')}
          data-testid="tab-ts-to-date"
        >
          <ArrowRightLeft size={15} />
          <span>Timestamp to Date</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'date-to-ts'}
          className={`csv-tab-btn ${activeTab === 'date-to-ts' ? 'active' : ''}`}
          onClick={() => setActiveTab('date-to-ts')}
          data-testid="tab-date-to-ts"
        >
          <Calendar size={15} />
          <span>Date to Timestamp</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cheat-sheet'}
          className={`csv-tab-btn ${activeTab === 'cheat-sheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('cheat-sheet')}
          data-testid="tab-cheat-sheet"
        >
          <BookOpen size={15} />
          <span>Epoch Cheat Sheet</span>
        </button>
      </div>

      {/* Tab 1: Timestamp -> Date */}
      {activeTab === 'ts-to-date' && (
        <div className="timestamp-tab-panel" data-testid="panel-ts-to-date">
          <div className="jwt-code-card">
            <div className="jwt-code-header">
              <span className="code-header-title">Convert Unix Timestamp to Human Date</span>
            </div>
            <div className="jwt-card-body">
              {/* Controls Row */}
              <div className="timestamp-controls-row">
                <div style={{ flex: 1 }}>
                  <label htmlFor="ts-input" className="uuid-label">
                    Unix Timestamp
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      id="ts-input"
                      type="text"
                      value={tsInput}
                      onChange={(e) => setTsInput(e.target.value)}
                      placeholder="e.g. 1711234567 or 1711234567000"
                      className="select-control"
                      style={{ flex: 1, fontFamily: 'var(--font-mono, monospace)' }}
                      data-testid="input-timestamp"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setTsInput(String(Math.floor(Date.now() / 1000)))}
                      aria-label="Set timestamp to current time"
                    >
                      Now
                    </button>
                  </div>
                </div>

                <div style={{ width: '160px' }}>
                  <label htmlFor="unit-select" className="uuid-label">
                    Unit
                  </label>
                  <select
                    id="unit-select"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as TimestampUnit)}
                    className="select-control"
                    style={{ width: '100%' }}
                    data-testid="select-unit"
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="s">Seconds (s)</option>
                    <option value="ms">Milliseconds (ms)</option>
                    <option value="us">Microseconds (µs)</option>
                  </select>
                </div>

                <div style={{ width: '220px' }}>
                  <label htmlFor="tz-select" className="uuid-label">
                    Target Timezone
                  </label>
                  <select
                    id="tz-select"
                    value={selectedTz}
                    onChange={(e) => setSelectedTz(e.target.value)}
                    className="select-control"
                    style={{ width: '100%' }}
                    data-testid="select-timezone"
                  >
                    {COMMON_TIMEZONES.map((c) => (
                      <option key={c.tz} value={c.tz}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Result Cards */}
              {tsToDateResult.valid ? (
                <div className="timestamp-results-grid" data-testid="ts-results-container">
                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">Relative Time:</span>
                    <span className="timestamp-meta-val" style={{ fontWeight: 600 }}>
                      {tsToDateResult.relativeTime}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(tsToDateResult.relativeTime, 'rel')}
                    >
                      {copiedKey === 'rel' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>

                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">UTC Time (GMT):</span>
                    <span className="timestamp-meta-val">{tsToDateResult.utcString}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(tsToDateResult.utcString, 'utc')}
                    >
                      {copiedKey === 'utc' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>

                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">ISO 8601:</span>
                    <span className="timestamp-meta-val">{tsToDateResult.isoString}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(tsToDateResult.isoString, 'iso')}
                    >
                      {copiedKey === 'iso' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>

                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">Selected Timezone ({selectedTz}):</span>
                    <span className="timestamp-meta-val" data-testid="target-tz-result">
                      {tsToDateResult.targetTzString}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(tsToDateResult.targetTzString, 'target-tz')}
                    >
                      {copiedKey === 'target-tz' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>

                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">Your Local System Time:</span>
                    <span className="timestamp-meta-val">{tsToDateResult.localString}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(tsToDateResult.localString, 'local')}
                    >
                      {copiedKey === 'local' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-error" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                  {tsToDateResult.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Date -> Timestamp */}
      {activeTab === 'date-to-ts' && (
        <div className="timestamp-tab-panel" data-testid="panel-date-to-ts">
          <div className="jwt-code-card">
            <div className="jwt-code-header">
              <span className="code-header-title">Convert Human Date to Unix Epoch Timestamp</span>
            </div>
            <div className="jwt-card-body">
              <label htmlFor="date-input" className="uuid-label">
                Date & Time String (ISO 8601, RFC 2822, or YYYY-MM-DDTHH:mm:ss)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  id="date-input"
                  type="text"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  placeholder="2026-11-25T12:00:00"
                  className="select-control"
                  style={{ flex: 1, fontFamily: 'var(--font-mono, monospace)' }}
                  data-testid="input-date"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const d = new Date();
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    setDateInput(d.toISOString().slice(0, 19));
                  }}
                  aria-label="Set date to current time"
                >
                  Now
                </button>
              </div>

              {dateToTsResult.valid ? (
                <div className="timestamp-results-grid" data-testid="date-results-container">
                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">Unix Seconds:</span>
                    <span
                      className="timestamp-meta-val"
                      style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--accent-primary)' }}
                      data-testid="result-seconds"
                    >
                      {dateToTsResult.seconds}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(String(dateToTsResult.seconds), 'res-sec')}
                    >
                      {copiedKey === 'res-sec' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>

                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">Unix Milliseconds:</span>
                    <span className="timestamp-meta-val">{dateToTsResult.milliseconds}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(String(dateToTsResult.milliseconds), 'res-ms')}
                    >
                      {copiedKey === 'res-ms' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>

                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">Hexadecimal Value:</span>
                    <span className="timestamp-meta-val">{dateToTsResult.hexSeconds}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(dateToTsResult.hexSeconds, 'res-hex')}
                    >
                      {copiedKey === 'res-hex' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>

                  <div className="timestamp-result-row">
                    <span className="timestamp-meta-label">Normalized UTC:</span>
                    <span className="timestamp-meta-val">{dateToTsResult.utcString}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(dateToTsResult.utcString, 'res-utc')}
                    >
                      {copiedKey === 'res-utc' ? 'Copied' : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-error" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                  {dateToTsResult.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cheat Sheet */}
      {activeTab === 'cheat-sheet' && (
        <div className="timestamp-tab-panel" data-testid="panel-cheat-sheet">
          <div className="jwt-code-card">
            <div className="jwt-code-header">
              <span className="code-header-title">Common Epoch Durations & Reference</span>
            </div>
            <div className="jwt-card-body">
              <div className="timestamp-table-wrap">
                <table className="csv-table">
                  <thead>
                    <tr>
                      <th>Time Interval</th>
                      <th>Seconds</th>
                      <th>Milliseconds</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>1 Minute</td>
                      <td><code>60</code></td>
                      <td><code>60,000</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>1 Hour</td>
                      <td><code>3,600</code></td>
                      <td><code>3,600,000</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>1 Day (24 hours)</td>
                      <td><code>86,400</code></td>
                      <td><code>86,400,000</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>1 Week (7 days)</td>
                      <td><code>604,800</code></td>
                      <td><code>604,800,000</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>1 Month (30.44 days)</td>
                      <td><code>2,629,743</code></td>
                      <td><code>2,629,743,000</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>1 Year (365.24 days)</td>
                      <td><code>31,556,926</code></td>
                      <td><code>31,556,926,000</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: 'var(--color-warning)' }}>
                        Year 2038 Overflow (32-bit INT_MAX)
                      </td>
                      <td><code>2,147,483,647</code></td>
                      <td>19 Jan 2038 03:14:07 UTC</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

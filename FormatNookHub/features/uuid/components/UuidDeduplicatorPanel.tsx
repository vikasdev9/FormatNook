'use client';

import React, { useState, useMemo } from 'react';
import { deduplicateUuids } from '../services/uuid-service';
import { Copy, Download, Layers } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

export function UuidDeduplicatorPanel() {
  const [input, setInput] = useState<string>(
    '550e8400-e29b-41d4-a716-446655440000\n550E8400-E29B-41D4-A716-446655440000\n{550e8400-e29b-41d4-a716-446655440000}\nc73bcdcc-2669-4bf6-81d3-e4ae73fb11fd'
  );

  const { copied, copy } = useClipboard();

  const dedupResult = useMemo(() => {
    const lines = input.split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean);
    return deduplicateUuids(lines);
  }, [input]);

  const outputText = useMemo(() => dedupResult.unique.join('\n'), [dedupResult]);

  const handleDownload = () => {
    downloadFile(outputText, 'unique-uuids.txt', 'text/plain');
  };

  return (
    <div className="uuid-dedup-container" data-testid="uuid-deduplicator-panel">
      {/* Metrics Cards */}
      <div className="dedup-stats-grid">
        <div className="dedup-stat-card">
          <span className="dedup-stat-label">Total Input</span>
          <span className="dedup-stat-val" data-testid="stat-dedup-original">
            {dedupResult.originalCount}
          </span>
        </div>
        <div className="dedup-stat-card">
          <span className="dedup-stat-label">Unique UUIDs</span>
          <span className="dedup-stat-val text-success" data-testid="stat-dedup-unique">
            {dedupResult.uniqueCount}
          </span>
        </div>
        <div className="dedup-stat-card">
          <span className="dedup-stat-label">Duplicates Removed</span>
          <span className="dedup-stat-val text-warning" data-testid="stat-dedup-duplicates">
            {dedupResult.duplicateCount}
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="converter-columns">
        <div className="converter-col">
          <label htmlFor="dedup-input-area" className="uuid-label">
            Input UUID List (Case-insensitive comparison)
          </label>
          <textarea
            id="dedup-input-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste duplicate UUIDs to filter..."
            className="uuid-textarea"
            rows={8}
            data-testid="dedup-input-area"
            spellCheck="false"
          />
        </div>

        <div className="converter-col">
          <div className="converter-output-header">
            <span className="uuid-label">Unique UUIDs Output</span>
            <div className="converter-actions">
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => copy(outputText)}
                disabled={!outputText}
                data-testid="btn-copy-unique"
              >
                <Copy size={12} />
                <span>{copied ? 'Copied!' : 'Copy Unique'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleDownload}
                disabled={!outputText}
                data-testid="btn-download-unique"
              >
                <Download size={12} />
                <span>Download</span>
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={outputText}
            placeholder="Deduplicated UUIDs will appear here..."
            className="uuid-textarea output-readonly"
            rows={8}
            data-testid="dedup-output-area"
          />
        </div>
      </div>
    </div>
  );
}

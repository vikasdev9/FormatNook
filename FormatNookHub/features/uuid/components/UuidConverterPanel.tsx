'use client';

import React, { useState, useMemo } from 'react';
import { UuidFormatOptions } from '../types/uuid.types';
import { formatUuid } from '../services/uuid-service';
import { Copy, Download, ArrowRight } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

export function UuidConverterPanel() {
  const [input, setInput] = useState<string>(
    '550e8400-e29b-41d4-a716-446655440000\nc73bcdcc-2669-4bf6-81d3-e4ae73fb11fd'
  );

  const [options, setOptions] = useState<UuidFormatOptions>({
    uppercase: true,
    hyphens: true,
    braces: false,
  });

  const { copied, copy } = useClipboard();

  const convertedText = useMemo(() => {
    if (!input) return '';
    const lines = input.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
    return lines.map((line) => formatUuid(line, options)).join('\n');
  }, [input, options]);

  const handleDownload = () => {
    downloadFile(convertedText, 'converted-uuids.txt', 'text/plain');
  };

  return (
    <div className="uuid-converter-container" data-testid="uuid-converter-panel">
      {/* Transformation Options */}
      <div className="converter-toolbar">
        <span className="uuid-label">Target Format</span>
        <div className="uuid-options-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
              className="checkbox-control"
              data-testid="conv-uppercase"
            />
            <span>UPPERCASE</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.hyphens}
              onChange={(e) => setOptions({ ...options, hyphens: e.target.checked })}
              className="checkbox-control"
              data-testid="conv-hyphens"
            />
            <span>Hyphens (8-4-4-4-12)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.braces}
              onChange={(e) => setOptions({ ...options, braces: e.target.checked })}
              className="checkbox-control"
              data-testid="conv-braces"
            />
            <span>Curly Braces {'{}'}</span>
          </label>
        </div>
      </div>

      {/* Two Column Input vs Converted Output */}
      <div className="converter-columns">
        <div className="converter-col">
          <label htmlFor="conv-input-area" className="uuid-label">
            Original Input
          </label>
          <textarea
            id="conv-input-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste UUIDs to reformat..."
            className="uuid-textarea"
            rows={8}
            data-testid="converter-input-area"
            spellCheck="false"
          />
        </div>

        <div className="converter-col">
          <div className="converter-output-header">
            <span className="uuid-label">Formatted Output</span>
            <div className="converter-actions">
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => copy(convertedText)}
                disabled={!convertedText}
                data-testid="btn-copy-converted"
              >
                <Copy size={12} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleDownload}
                disabled={!convertedText}
                data-testid="btn-download-converted"
              >
                <Download size={12} />
                <span>Download</span>
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={convertedText}
            placeholder="Formatted UUIDs will appear here..."
            className="uuid-textarea output-readonly"
            rows={8}
            data-testid="converter-output-area"
          />
        </div>
      </div>
    </div>
  );
}

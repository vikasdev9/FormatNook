'use client';

import React, { useState, useMemo } from 'react';
import { UuidFormatOptions } from '../types/uuid.types';
import { generateBulkUuids, formatUuid } from '../services/uuid-service';
import { Copy, Download, RefreshCw, Trash2, Check, FileText } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

interface UuidGeneratorPanelProps {
  initialCount?: number;
}

export function UuidGeneratorPanel({ initialCount = 10 }: UuidGeneratorPanelProps) {
  const [quantity, setQuantity] = useState<number>(initialCount);
  const [rawUuids, setRawUuids] = useState<string[]>(() => generateBulkUuids(initialCount));
  const [formatOptions, setFormatOptions] = useState<UuidFormatOptions>({
    uppercase: false,
    hyphens: true,
    braces: false,
  });

  // Copied states
  const { copied: copiedAll, copy: copyAll } = useClipboard();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Pagination for high batch sizes
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  // Formatted UUIDs derived on the fly without changing underlying raw randomness
  const formattedUuids = useMemo(() => {
    return rawUuids.map((u) => formatUuid(u, formatOptions));
  }, [rawUuids, formatOptions]);

  const totalPages = Math.ceil(formattedUuids.length / pageSize) || 1;
  const paginatedUuids = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return formattedUuids.slice(start, start + pageSize);
  }, [formattedUuids, currentPage, pageSize]);

  const handleGenerate = () => {
    const validCount = Math.max(1, Math.min(10000, quantity || 1));
    const newBatch = generateBulkUuids(validCount);
    setRawUuids(newBatch);
    setCurrentPage(1);
  };

  const handleCopySingle = (uuid: string, idx: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(uuid).then(() => {
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 1500);
      });
    }
  };

  const handleCopyNewline = () => {
    copyAll(formattedUuids.join('\n'));
  };

  const handleCopyComma = () => {
    copyAll(formattedUuids.join(', '));
  };

  const handleDownloadTxt = () => {
    downloadFile(formattedUuids.join('\n'), 'uuids.txt', 'text/plain');
  };

  const handleDownloadCsv = () => {
    const csvContent = 'uuid\n' + formattedUuids.map((u) => `"${u}"`).join('\n');
    downloadFile(csvContent, 'uuids.csv', 'text/csv');
  };

  const handleClear = () => {
    setRawUuids([]);
    setCurrentPage(1);
  };

  const presets = [1, 5, 10, 25, 50, 100, 500, 1000];

  return (
    <div className="uuid-generator-container" data-testid="uuid-generator-panel">
      {/* Controls Bar */}
      <div className="uuid-controls-bar">
        <div className="uuid-quantity-group">
          <label htmlFor="uuid-qty-input" className="uuid-label">
            Quantity (1 – 10,000)
          </label>
          <div className="uuid-qty-input-wrap">
            <input
              id="uuid-qty-input"
              type="number"
              min={1}
              max={10000}
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="select-control uuid-qty-input"
              data-testid="uuid-quantity-input"
              aria-label="Number of UUIDs to generate"
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerate}
              data-testid="btn-generate-uuids"
            >
              <RefreshCw size={15} />
              <span>Generate UUIDs</span>
            </button>
          </div>

          <div className="uuid-presets">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`btn btn-xs ${quantity === preset ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setQuantity(preset);
                  const newBatch = generateBulkUuids(preset);
                  setRawUuids(newBatch);
                  setCurrentPage(1);
                }}
                data-testid={`preset-${preset}`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Presentation Formatting Options */}
        <div className="uuid-options-group">
          <span className="uuid-label">Formatting Options</span>
          <div className="uuid-options-grid">
            <label className="checkbox-label" title="Render hexadecimal letters in uppercase (e.g. 4F2A)">
              <input
                type="checkbox"
                checked={formatOptions.uppercase}
                onChange={(e) =>
                  setFormatOptions({ ...formatOptions, uppercase: e.target.checked })
                }
                className="checkbox-control"
                data-testid="opt-uppercase"
              />
              <span>Uppercase</span>
            </label>

            <label className="checkbox-label" title="Include standard hyphens at 8-4-4-4-12 positions">
              <input
                type="checkbox"
                checked={formatOptions.hyphens}
                onChange={(e) =>
                  setFormatOptions({ ...formatOptions, hyphens: e.target.checked })
                }
                className="checkbox-control"
                data-testid="opt-hyphens"
              />
              <span>Hyphens</span>
            </label>

            <label className="checkbox-label" title="Wrap generated UUIDs in curly braces {...}">
              <input
                type="checkbox"
                checked={formatOptions.braces}
                onChange={(e) =>
                  setFormatOptions({ ...formatOptions, braces: e.target.checked })
                }
                className="checkbox-control"
                data-testid="opt-braces"
              />
              <span>Curly Braces {'{}'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Header Actions */}
      <div className="uuid-results-header">
        <div className="uuid-header-meta">
          <span className="uuid-results-heading">Generated UUIDs</span>
          <span className="badge badge-accent" data-testid="badge-total-uuids">
            {formattedUuids.length.toLocaleString()} total
          </span>
        </div>

        <div className="uuid-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyNewline}
            disabled={formattedUuids.length === 0}
            data-testid="btn-copy-all"
            title="Copy all UUIDs separated by newlines"
          >
            <Copy size={14} />
            <span>{copiedAll ? 'Copied!' : 'Copy All'}</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm hide-on-mobile"
            onClick={handleCopyComma}
            disabled={formattedUuids.length === 0}
            data-testid="btn-copy-comma"
            title="Copy all UUIDs as comma-separated values"
          >
            <span>Copy as CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadTxt}
            disabled={formattedUuids.length === 0}
            data-testid="btn-download-txt"
            title="Download plain text file"
          >
            <Download size={14} />
            <span>TXT</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadCsv}
            disabled={formattedUuids.length === 0}
            data-testid="btn-download-csv"
            title="Download CSV spreadsheet"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleClear}
            disabled={formattedUuids.length === 0}
            data-testid="btn-clear-uuids"
            title="Clear current results"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Scrollable Results List */}
      {formattedUuids.length > 0 ? (
        <div className="uuid-results-list" data-testid="uuid-results-container">
          {paginatedUuids.map((item, idx) => {
            const globalIdx = (currentPage - 1) * pageSize + idx;
            const isCopied = copiedIndex === globalIdx;

            return (
              <div
                key={`${item}-${globalIdx}`}
                className="uuid-result-row"
                data-testid={`uuid-row-${globalIdx}`}
              >
                <span className="uuid-index">{globalIdx + 1}.</span>
                <code className="uuid-value" data-testid={`uuid-value-${globalIdx}`}>{item}</code>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs uuid-row-copy"
                  onClick={() => handleCopySingle(item, globalIdx)}
                  aria-label={`Copy UUID ${item}`}
                  data-testid={`copy-uuid-${globalIdx}`}
                  title="Copy UUID to clipboard"
                >
                  {isCopied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            );
          })}

          {/* Pagination Controls for Large Batches */}
          {totalPages > 1 && (
            <div className="uuid-pagination-bar">
              <span className="pagination-info">
                Showing {((currentPage - 1) * pageSize + 1).toLocaleString()} –{' '}
                {Math.min(currentPage * pageSize, formattedUuids.length).toLocaleString()} of{' '}
                {formattedUuids.length.toLocaleString()}
              </span>
              <div className="pagination-buttons">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-current">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="uuid-empty-state">
          <FileText size={28} className="text-muted-icon" />
          <p>No UUIDs generated yet.</p>
          <span className="empty-sub">Choose a quantity and click Generate UUIDs to begin.</span>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { CsvParseResult } from '../types/csv.types';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Hash, FileSpreadsheet } from 'lucide-react';

interface CsvPreviewTableProps {
  parseResult: CsvParseResult;
}

export function CsvPreviewTable({ parseResult }: CsvPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const { rawRows, headers, totalRows, totalColumns, emptyCellsCount, errors, warnings } = parseResult;

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return rawRows.slice(startIdx, startIdx + pageSize);
  }, [rawRows, safeCurrentPage, pageSize]);

  const errorRowIndices = useMemo(() => {
    return new Set(errors.map((e) => e.rowIndex));
  }, [errors]);

  if (rawRows.length === 0) {
    return (
      <div className="csv-empty-state">
        <FileSpreadsheet size={36} color="var(--text-muted)" />
        <p className="csv-empty-title">No Table Data to Preview</p>
        <p className="csv-empty-desc">Paste CSV text or upload a CSV file to inspect parsed tabular rows and columns.</p>
      </div>
    );
  }

  return (
    <div className="csv-preview-card" data-testid="csv-preview-table-container">
      {/* Table Statistics Bar */}
      <div className="csv-preview-meta-bar">
        <div className="csv-meta-item">
          <span className="csv-meta-label">Total Rows:</span>
          <span className="csv-meta-val" data-testid="meta-total-rows">{totalRows}</span>
        </div>
        <div className="csv-meta-item">
          <span className="csv-meta-label">Columns:</span>
          <span className="csv-meta-val" data-testid="meta-total-cols">{totalColumns}</span>
        </div>
        <div className="csv-meta-item">
          <span className="csv-meta-label">Empty Cells:</span>
          <span className="csv-meta-val">{emptyCellsCount}</span>
        </div>
        <div className="csv-meta-item">
          <span className="csv-meta-label">Status:</span>
          {errors.length > 0 ? (
            <span className="badge badge-error" data-testid="badge-csv-errors">
              <AlertTriangle size={12} /> {errors.length} Issues Detected
            </span>
          ) : (
            <span className="badge badge-success" data-testid="badge-csv-healthy">
              <CheckCircle2 size={12} /> Valid RFC 4180
            </span>
          )}
        </div>
      </div>

      {/* Warnings & Errors Display */}
      {errors.length > 0 && (
        <div className="csv-alert-box csv-alert-error" role="alert">
          <AlertTriangle size={16} />
          <div>
            <strong>Parsing Diagnostics:</strong>
            <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
              {errors.map((err, i) => (
                <li key={i}>
                  Row {err.rowIndex} (line {err.lineNumber}): {err.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="csv-alert-box csv-alert-warning" role="alert">
          <AlertTriangle size={16} />
          <div>
            <strong>Structural Warnings:</strong>
            <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
              {warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Spreadsheet Table Container */}
      <div className="csv-table-scroll-wrap">
        <table className="csv-table" data-testid="csv-table">
          <thead>
            <tr>
              <th className="csv-th-index">
                <Hash size={13} style={{ display: 'inline', verticalAlign: '-1px' }} />
              </th>
              {headers.map((h, i) => (
                <th key={i} className="csv-th-col" title={`Column ${i + 1}: ${h}`}>
                  <div className="csv-th-content">
                    <span className="csv-th-name">{h}</span>
                    <span className="csv-th-index-badge">#{i + 1}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, rIdx) => {
              const actualRowIndex = (safeCurrentPage - 1) * pageSize + rIdx + 1;
              const hasError = errorRowIndices.has(actualRowIndex);

              return (
                <tr key={rIdx} className={hasError ? 'csv-row-error' : ''}>
                  <td className="csv-td-index">{actualRowIndex}</td>
                  {headers.map((_, cIdx) => {
                    const cellVal = row[cIdx];
                    const isEmpty = cellVal === undefined || cellVal === '';

                    return (
                      <td key={cIdx} className={`csv-td-cell ${isEmpty ? 'csv-cell-empty' : ''}`}>
                        {isEmpty ? (
                          <span className="csv-empty-pill">(empty)</span>
                        ) : (
                          <span className="csv-cell-text">{cellVal}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="csv-pagination-bar">
        <div className="csv-pagination-info">
          Showing {(safeCurrentPage - 1) * pageSize + 1} to{' '}
          {Math.min(safeCurrentPage * pageSize, totalRows)} of {totalRows} rows
        </div>

        <div className="csv-pagination-actions">
          <label htmlFor="csv-page-size" className="csv-pagination-label">
            Rows per page:
          </label>
          <select
            id="csv-page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="select-control csv-page-size-select"
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            aria-label="Previous page"
            data-testid="btn-prev-page"
          >
            <ChevronLeft size={14} /> Prev
          </button>

          <span className="csv-page-num" data-testid="page-indicator">
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            aria-label="Next page"
            data-testid="btn-next-page"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

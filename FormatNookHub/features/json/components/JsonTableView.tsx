'use client';

import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Download, Copy, Check, ChevronLeft, ChevronRight, Table as TableIcon } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';
import { jsonToCsv } from '../services/json-transform-service';

interface JsonTableViewProps {
  data: any;
}

export function JsonTableView({ data }: JsonTableViewProps) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const { copy } = useClipboard();

  // Normalize data into rows and columns
  const { headers, rows, isArrayOfObjects } = useMemo(() => {
    if (!data || typeof data !== 'object') {
      return { headers: ['Value'], rows: [{ Value: String(data) }], isArrayOfObjects: false };
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { headers: [], rows: [], isArrayOfObjects: true };
      }

      // Check if items are objects
      const firstIsObj = typeof data[0] === 'object' && data[0] !== null;
      if (firstIsObj) {
        const headerSet = new Set<string>();
        for (const item of data) {
          if (item && typeof item === 'object') {
            for (const k of Object.keys(item)) {
              headerSet.add(k);
            }
          }
        }
        return { headers: Array.from(headerSet), rows: data, isArrayOfObjects: true };
      } else {
        // Array of primitives
        return {
          headers: ['Index', 'Value'],
          rows: data.map((v, i) => ({ Index: i, Value: String(v) })),
          isArrayOfObjects: false,
        };
      }
    }

    // Single object: Key, Value table
    const objRows = Object.entries(data).map(([k, v]) => ({
      Property: k,
      Value: typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v),
    }));
    return { headers: ['Property', 'Value'], rows: objRows, isArrayOfObjects: false };
  }, [data]);

  // Filtered and sorted rows
  const processedRows = useMemo(() => {
    let result = [...rows];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    // Sorting
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [rows, search, sortCol, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc((prev) => !prev);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
    setPage(1);
  };

  const handleCopyCell = (val: any, cellId: string) => {
    const text = typeof val === 'object' ? JSON.stringify(val) : String(val);
    copy(text);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const handleExportCsv = () => {
    const csvResult = jsonToCsv(data);
    downloadFile(csvResult.output, 'export.csv', 'text/csv');
  };

  return (
    <div className="json-table-container" data-testid="json-table-view">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="table-search-box">
          <Search size={14} className="table-search-icon" />
          <input
            type="text"
            className="table-search-input"
            placeholder="Filter table rows..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            data-testid="table-search-input"
          />
        </div>

        <div className="table-stats-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>
            <strong>{processedRows.length}</strong> {processedRows.length === 1 ? 'row' : 'rows'}
          </span>

          {processedRows.length > 25 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px' }}>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="select-control select-xs"
                style={{ padding: '2px 4px', height: '26px' }}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={250}>250 / page</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  title="Previous page"
                  style={{ padding: '2px 6px', height: '26px' }}
                >
                  <ChevronLeft size={13} />
                </button>
                <span style={{ fontSize: '11px', padding: '0 4px' }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  title="Next page"
                  style={{ padding: '2px 6px', height: '26px' }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCsv}
            title="Export as CSV"
            data-testid="btn-export-table-csv"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="json-table-scroll-wrapper">
        {headers.length === 0 ? (
          <div className="table-empty-message">No tabular data to display.</div>
        ) : (
          <table className="json-data-table" data-testid="json-data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                {headers.map((h) => (
                  <th
                    key={h}
                    onClick={() => handleSort(h)}
                    className="table-header-cell"
                    data-testid={`th-${h}`}
                  >
                    <div className="table-header-content">
                      <span>{h}</span>
                      <ArrowUpDown size={12} className="sort-icon" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, rIdx) => {
                const rowNum = (currentPage - 1) * pageSize + rIdx + 1;
                return (
                  <tr key={rowNum}>
                    <td className="row-number-cell">{rowNum}</td>
                  {headers.map((h) => {
                    const val = row[h];
                    const isObj = typeof val === 'object' && val !== null;
                    const cellId = `${rIdx}-${h}`;
                    return (
                      <td
                        key={h}
                        className="table-data-cell"
                        onClick={() => handleCopyCell(val, cellId)}
                        title="Click to copy cell value"
                      >
                        {isObj ? (
                          <span className="nested-pill">{JSON.stringify(val)}</span>
                        ) : val !== undefined && val !== null ? (
                          <span className="cell-text">{String(val)}</span>
                        ) : (
                          <span className="cell-null">—</span>
                        )}
                        {copiedCell === cellId && <span className="cell-copied-badge">Copied!</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


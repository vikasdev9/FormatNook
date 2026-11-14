'use client';

import React, { useState, useMemo } from 'react';
import { Copy, ChevronLeft, ChevronRight, FileCode, Check, AlertCircle } from 'lucide-react';
import { detectMimeFromBytes } from '../services/mime-detection.service';
import { copyToClipboard } from '@/lib/clipboard';

interface HexViewerProps {
  bytes: Uint8Array | null;
  filename?: string;
  bytesPerPage?: number;
}

export function HexViewer({ bytes, filename = 'payload.bin', bytesPerPage = 512 }: HexViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const totalBytes = bytes ? bytes.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalBytes / bytesPerPage));

  // Auto-detect file signature for the header badge
  const detected = useMemo(() => {
    if (!bytes || bytes.length === 0) return null;
    return detectMimeFromBytes(bytes);
  }, [bytes]);

  const rows = useMemo(() => {
    if (!bytes || totalBytes === 0) return [];

    const start = currentPage * bytesPerPage;
    const end = Math.min(totalBytes, start + bytesPerPage);
    const slice = bytes.slice(start, end);

    const resultRows: Array<{ offset: string; hex: string[]; ascii: string }> = [];

    for (let i = 0; i < slice.length; i += 16) {
      const rowOffset = (start + i).toString(16).padStart(8, '0').toUpperCase();
      const rowBytes = slice.slice(i, i + 16);
      const hex: string[] = [];
      let ascii = '';

      for (let j = 0; j < 16; j++) {
        if (j < rowBytes.length) {
          const b = rowBytes[j];
          hex.push(b.toString(16).padStart(2, '0').toUpperCase());
          ascii += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
        } else {
          hex.push('  ');
          ascii += ' ';
        }
      }

      resultRows.push({ offset: rowOffset, hex, ascii });
    }

    return resultRows;
  }, [bytes, totalBytes, currentPage, bytesPerPage]);

  const handleCopyHex = async () => {
    if (!bytes || bytes.length === 0) return;
    const hexParts: string[] = [];
    const limit = Math.min(bytes.length, 16384);
    for (let i = 0; i < limit; i++) {
      hexParts.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
    }
    const textToCopy = hexParts.join(' ');
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  };

  if (!bytes || totalBytes === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
        <FileCode size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
        <p>No binary data available to inspect. Decode or paste a Base64 string to view its hex dump.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Binary Hex Dump ({totalBytes.toLocaleString()} bytes)
          </span>
          {detected && detected.confidence === 'high' && (
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {detected.mimeType}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleCopyHex}
            title={copyFailed ? 'Failed to copy to clipboard' : 'Copy hex bytes to clipboard'}
          >
            {copied ? (
              <Check size={14} style={{ color: 'var(--color-success)' }} />
            ) : copyFailed ? (
              <AlertCircle size={14} style={{ color: 'var(--color-danger, #ef4444)' }} />
            ) : (
              <Copy size={14} />
            )}
            <span>{copied ? 'Copied' : copyFailed ? 'Copy Failed' : 'Copy Hex'}</span>
          </button>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                aria-label="Previous hex page"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0 0.25rem' }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label="Next hex page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hex Table Container */}
      <div
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.8125rem',
          backgroundColor: '#0B1120',
          border: '1px solid #263449',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          overflowX: 'auto',
          lineHeight: '1.6',
        }}
      >
        <div style={{ display: 'table', width: '100%', minWidth: '580px' }}>
          {/* Table Header */}
          <div style={{ display: 'table-row', color: '#A6B4C8', borderBottom: '1px solid #263449', fontWeight: 600, fontSize: '0.75rem' }}>
            <div style={{ display: 'table-cell', paddingRight: '1.25rem', width: '90px' }}>Offset</div>
            <div style={{ display: 'table-cell', paddingRight: '1.25rem' }}>
              00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F
            </div>
            <div style={{ display: 'table-cell', width: '140px' }}>Decoded ASCII</div>
          </div>

          {/* Table Rows */}
          {rows.map((row, idx) => (
            <div key={idx} style={{ display: 'table-row', borderBottom: '1px solid rgba(38, 52, 73, 0.4)' }}>
              {/* Offset Column */}
              <div style={{ display: 'table-cell', color: '#22C3EE', paddingRight: '1.25rem' }}>
                {row.offset}
              </div>

              {/* Hex Column */}
              <div style={{ display: 'table-cell', paddingRight: '1.25rem', color: '#F8FAFC' }}>
                {row.hex.slice(0, 8).join(' ')}
                <span style={{ display: 'inline-block', width: '12px' }} />
                {row.hex.slice(8, 16).join(' ')}
              </div>

              {/* ASCII Column */}
              <div style={{ display: 'table-cell', color: '#A6B4C8', letterSpacing: '0.05em' }}>
                {row.ascii}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


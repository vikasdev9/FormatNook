'use client';

import React from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { formatFileSize } from '../utils/byte-conversion.utils';

interface LargeOutputNoticeProps {
  totalBytes: number;
  onDownload: () => void;
  fileName?: string;
}

export function LargeOutputNotice({ totalBytes, onDownload, fileName = 'output.txt' }: LargeOutputNoticeProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-warning-bg)',
        border: '1px solid var(--color-warning-border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.75rem',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
      role="status"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)' }}>
        <AlertTriangle size={18} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
          <strong>Large Payload ({formatFileSize(totalBytes)}):</strong> Display is truncated to preserve browser responsiveness. Use direct download for the full file.
        </span>
      </div>

      <button className="btn btn-primary btn-sm" onClick={onDownload} aria-label={`Download full ${fileName}`}>
        <Download size={14} />
        <span>Download Full File ({formatFileSize(totalBytes)})</span>
      </button>
    </div>
  );
}

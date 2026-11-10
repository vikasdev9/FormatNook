import React from 'react';
import { File, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { formatFileSize } from '../utils/byte-conversion.utils';
import { calculateBase64Expansion } from '../utils/output-size.utils';
import { FileMetadataInfo } from '../types/encoder-decoder.types';

interface FileMetadataProps {
  metadata: FileMetadataInfo;
  showExpansionEstimate?: boolean;
}

export function FileMetadata({ metadata, showExpansionEstimate = true }: FileMetadataProps) {
  const expansion = calculateBase64Expansion(metadata.size);

  return (
    <div
      style={{
        padding: '0.875rem 1rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.8125rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{ color: 'var(--accent-primary)' }}>
          <File size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{metadata.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span>{formatFileSize(metadata.size)}</span> &bull; <span>{metadata.mimeType}</span>
            {metadata.dimensions && (
              <span> &bull; {metadata.dimensions.width}&times;{metadata.dimensions.height}px</span>
            )}
            {metadata.duration && (
              <span> &bull; {Math.round(metadata.duration)}s</span>
            )}
          </div>
        </div>
      </div>

      {showExpansionEstimate && metadata.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            Base64 Size &asymp; {formatFileSize(expansion.base64Bytes)} (+{expansion.percentIncrease}%)
          </span>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileUp, AlertCircle } from 'lucide-react';
import { formatFileSize } from '../utils/byte-conversion.utils';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedExtensions?: string[];
  maxSizeBytes?: number;
  label?: string;
  sublabel?: string;
}

export function FileUploadZone({
  onFileSelect,
  acceptedExtensions,
  maxSizeBytes = 25 * 1024 * 1024,
  label = 'Click to select or drag and drop a file',
  sublabel,
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndPass = (file: File) => {
    setError(null);
    if (file.size > maxSizeBytes) {
      setError(`File size (${formatFileSize(file.size)}) exceeds the maximum browser limit of ${formatFileSize(maxSizeBytes)}.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept={acceptedExtensions?.join(',')}
        onChange={handleChange}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragOver ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-default)',
          backgroundColor: isDragOver ? 'var(--accent-soft)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <div className="tool-card-icon" style={{ margin: 0 }}>
          <Upload size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            {label}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {sublabel || (acceptedExtensions ? `Supported: ${acceptedExtensions.join(', ')}` : 'Any supported file')}
            {' '}&bull; Max {formatFileSize(maxSizeBytes)}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { downloadFile, downloadDataUrl } from '@/lib/download';

interface DownloadButtonProps {
  content?: string | Blob;
  fileName?: string;
  mimeType?: string;
  isDataUrl?: boolean;
  label?: string;
  className?: string;
  disabled?: boolean;
  onDownload?: () => void;
}

export function DownloadButton({
  content,
  fileName = 'download.txt',
  mimeType,
  isDataUrl = false,
  label = 'Download',
  className = 'btn btn-secondary btn-sm',
  disabled = false,
  onDownload,
}: DownloadButtonProps) {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!content) return;
    if (isDataUrl && typeof content === 'string') {
      downloadDataUrl(content, fileName);
    } else {
      downloadFile(content, fileName, mimeType);
    }
  };

  const isDisabled = disabled || (!content && !onDownload);

  return (
    <button
      type="button"
      className={className}
      onClick={handleDownload}
      disabled={isDisabled}
      title={`Download ${fileName}`}
      aria-label="Download output"
    >
      <Download size={14} />
      {label && <span>{label}</span>}
    </button>
  );
}

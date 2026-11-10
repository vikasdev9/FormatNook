'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { readTextFile, readDataUrlFile } from '@/lib/file-reader';

interface FileDropzoneProps {
  onFileLoaded: (content: string, fileName: string, fileType: string, fileSize: number) => void;
  acceptExtensions?: string[];
  readAsDataUrl?: boolean;
  maxSizeInBytes?: number;
}

export function FileDropzone({
  onFileLoaded,
  acceptExtensions,
  readAsDataUrl = false,
  maxSizeInBytes,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setError(null);
    try {
      if (readAsDataUrl) {
        const result = await readDataUrlFile(file, { maxSizeInBytes });
        onFileLoaded(result.dataUrl, result.name, result.mimeType, result.size);
      } else {
        const result = await readTextFile(file, { maxSizeInBytes });
        onFileLoaded(result.content, result.name, result.mimeType, result.size);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to read file.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept={acceptExtensions?.join(',')}
        onChange={handleFileChange}
      />

      <div
        className="file-dropzone-wrapper"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload file"
        >
          <Upload size={14} />
          <span>Upload File</span>
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}

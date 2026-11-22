'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, ShieldCheck, Sparkles } from 'lucide-react';

interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSample: () => void;
  isProcessing?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onFilesSelected,
  onLoadSample,
  isProcessing = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(file.name)
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      e.target.value = ''; // Reset input so same file can be re-selected if desired
    }
  };

  return (
    <div
      className={`image-dropzone-container ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="image-dropzone"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.avif"
        multiple
        className="hidden"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        data-testid="image-file-input"
      />

      <div className="image-dropzone-content">
        <div className="image-dropzone-icon-wrap">
          <UploadCloud className="w-10 h-10 text-accent-primary" />
        </div>

        <h3 className="image-dropzone-title">
          Drag and drop images here, or{' '}
          <button
            type="button"
            className="image-dropzone-browse-link"
            onClick={() => fileInputRef.current?.click()}
          >
            browse files
          </button>
        </h3>

        <p className="image-dropzone-subtitle">
          Supports PNG, JPG, WebP, AVIF, GIF, SVG, BMP (Single or Multi-file Batch)
        </p>

        <div className="image-dropzone-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            data-testid="btn-browse-files"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Browse Images</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLoadSample}
            disabled={isProcessing}
            data-testid="btn-load-sample"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Demo Sample</span>
          </button>
        </div>

        <div className="image-dropzone-privacy-badge">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Client-Side Privacy • Zero bytes leave your browser</span>
        </div>
      </div>
    </div>
  );
};

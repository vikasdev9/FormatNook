'use client';

import React, { useState } from 'react';
import { Download, Music, FileText, Loader2, ZoomIn } from 'lucide-react';
import { formatFileSize } from '../utils/byte-conversion.utils';
import { ImagePreviewDialog } from '@/components/workspace/ImagePreviewDialog';

interface FilePreviewProps {
  mediaUrl: string; // Object URL or Data URI
  mimeType: string;
  fileName: string;
  fileSize: number;
  onDownload: () => void;
  dimensions?: { width: number; height: number };
  isConverting?: boolean;
}

export function FilePreview({
  mediaUrl,
  mimeType,
  fileName,
  fileSize,
  onDownload,
  dimensions,
  isConverting = false,
}: FilePreviewProps) {
  const [loadError, setLoadError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const cleanMime = mimeType.toLowerCase();
  const isImage = cleanMime.startsWith('image/');
  const isAudio = cleanMime.startsWith('audio/');
  const isVideo = cleanMime.startsWith('video/');
  const isPdf = cleanMime === 'application/pdf';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        width: '100%',
        minHeight: '340px',
        position: 'relative',
      }}
    >
      {/* Loading Overlay during Format Re-encoding */}
      {isConverting && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            zIndex: 10,
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff' }}>
            Converting Image Format...
          </span>
        </div>
      )}

      {isImage && !loadError && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsPreviewOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsPreviewOpen(true);
              }
            }}
            title="Click to enlarge"
            aria-label="Open image preview"
            data-testid="btn-open-preview-dialog"
            className="preview-thumbnail-wrapper"
          >
            {/* Safe image preview: Using <img> prevents SVG script execution in main DOM */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt={fileName}
              onError={() => setLoadError(true)}
              className="preview-thumbnail-img"
            />
            <div className="click-to-enlarge-hint" data-testid="click-to-enlarge-hint">
              <ZoomIn size={12} style={{ color: 'var(--accent-primary, #38BDF8)' }} />
              <span>Click to enlarge</span>
            </div>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            <span>{fileName}</span> &bull; <span>{mimeType}</span> &bull; <span>{formatFileSize(fileSize)}</span>
            {dimensions && dimensions.width > 0 && dimensions.height > 0 && (
              <span> &bull; {dimensions.width} &times; {dimensions.height} px</span>
            )}
          </div>
          <ImagePreviewDialog
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            imageUrl={mediaUrl}
            alt={fileName}
            initialDimensions={dimensions}
          />
        </div>
      )}

      {isAudio && !loadError && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: '420px' }}>
          <div className="tool-card-icon" style={{ width: '56px', height: '56px', margin: 0 }}>
            <Music size={28} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fileName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mimeType} &bull; {formatFileSize(fileSize)}</div>
          </div>
          <audio controls src={mediaUrl} style={{ width: '100%' }} onError={() => setLoadError(true)}>
            Your browser does not support the audio player.
          </audio>
        </div>
      )}

      {isVideo && !loadError && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <video
            controls
            src={mediaUrl}
            style={{ maxHeight: '280px', maxWidth: '100%', borderRadius: 'var(--radius-md)', backgroundColor: '#000' }}
            onError={() => setLoadError(true)}
          >
            Your browser does not support video playback.
          </video>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span>{fileName}</span> &bull; <span>{mimeType}</span> &bull; <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>
      )}

      {isPdf && !loadError && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <div style={{ width: '100%', height: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <object
              data={mediaUrl}
              type="application/pdf"
              width="100%"
              height="100%"
            >
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                PDF preview not supported directly by this browser. Please download below.
              </div>
            </object>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span>{fileName}</span> &bull; <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>
      )}

      {(!isImage && !isAudio && !isVideo && !isPdf) || loadError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <div className="tool-card-icon" style={{ width: '56px', height: '56px', margin: 0 }}>
            <FileText size={28} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{fileName}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {mimeType} &bull; {formatFileSize(fileSize)}
            </div>
          </div>
          <button className="btn btn-primary" onClick={onDownload}>
            <Download size={15} />
            <span>Download Decoded File</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, AlertCircle, Loader2, ZoomIn } from 'lucide-react';
import { Base64RepairCandidate } from '../types/base64-repair.types';
import { ImagePreviewDialog } from '@/components/workspace/ImagePreviewDialog';

interface Base64RepairImagePreviewProps {
  candidate: Base64RepairCandidate | null;
  blobUrl: string | null;
}

export function Base64RepairImagePreview({ candidate, blobUrl }: Base64RepairImagePreviewProps) {
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!blobUrl) {
      setImgStatus('loading');
      return;
    }
    setImgStatus('loading');
  }, [blobUrl]);

  const hasCandidate = Boolean(candidate);
  const isValidImage = candidate?.isImageValid && Boolean(blobUrl);

  return (
    <div
      className="repair-preview-card"
      data-testid="base64-repair-preview-card"
      style={{
        backgroundColor: '#151F31',
        border: '1px solid #263449',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ImageIcon size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
            Decoded Image Preview
          </span>
          {candidate && (
            <span
              className={`badge ${
                candidate.isImageValid
                  ? 'badge-success'
                  : candidate.isBase64Valid
                  ? 'badge-info'
                  : 'badge-warning'
              }`}
              style={{ fontSize: '0.7rem' }}
            >
              {candidate.isImageValid
                ? `${candidate.detectedFormat || 'Image'} Decoded Successfully`
                : candidate.isBase64Valid
                ? 'Valid Base64 (Non-Image)'
                : 'Corrupted'}
            </span>
          )}
        </div>

        {/* Metadata Badges */}
        {isValidImage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            {candidate.detectedMimeType && (
              <span className="badge badge-neutral" style={{ padding: '0.2rem 0.5rem' }}>
                {candidate.detectedMimeType}
              </span>
            )}
            {candidate.imageDimensions && (
              <span className="badge badge-neutral" style={{ padding: '0.2rem 0.5rem' }}>
                {candidate.imageDimensions.width} × {candidate.imageDimensions.height} px
                {candidate.imageDimensions.aspectRatio ? ` (${candidate.imageDimensions.aspectRatio})` : ''}
              </span>
            )}
            <span className="badge badge-neutral" style={{ padding: '0.2rem 0.5rem' }}>
              {(candidate.decodedByteLength / 1024).toFixed(1)} KB ({candidate.decodedByteLength.toLocaleString()} bytes)
            </span>
          </div>
        )}
      </div>

      {/* Preview Viewport Container */}
      <div
        style={{
          width: '100%',
          minHeight: '220px',
          maxHeight: '360px',
          borderRadius: '6px',
          border: '1px solid #334155',
          backgroundColor: '#0F172A',
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 8px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          padding: '1rem',
        }}
      >
        {!candidate && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', textAlign: 'center' }}>
            <ImageIcon size={32} opacity={0.4} />
            <span style={{ fontSize: '0.8125rem' }}>No Base64 candidate selected</span>
          </div>
        )}

        {candidate && !candidate.isBase64Valid && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#EF4444', textAlign: 'center', maxWidth: '360px' }}>
            <AlertCircle size={32} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Unrecoverable Malformation</span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              The payload contains irreversible syntax damage or unpadded single-character remainder.
            </span>
          </div>
        )}

        {candidate && candidate.isBase64Valid && !candidate.isImageValid && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#E2E8F0', textAlign: 'center', maxWidth: '380px' }}>
            <ImageIcon size={32} opacity={0.5} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Decoded Data is Not an Image</span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Base64 repaired successfully ({candidate.decodedByteLength.toLocaleString()} bytes), but magic byte signature does not match PNG, JPEG, WEBP, GIF, SVG, BMP, or ICO.
            </span>
          </div>
        )}

        {isValidImage && blobUrl && (
          <>
            {imgStatus === 'loading' && (
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8' }}>
                <Loader2 size={18} className="spin-animation" />
                <span style={{ fontSize: '0.75rem' }}>Rendering preview...</span>
              </div>
            )}
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
              data-testid="btn-open-repair-preview-dialog"
              className="preview-thumbnail-wrapper"
              style={{ maxHeight: '320px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobUrl}
                alt="Decoded Repaired Preview"
                onLoad={() => setImgStatus('loaded')}
                onError={() => setImgStatus('error')}
                className="preview-thumbnail-img"
                style={{
                  maxHeight: '310px',
                  opacity: imgStatus === 'loaded' ? 1 : 0,
                }}
              />
              {imgStatus === 'loaded' && (
                <div className="click-to-enlarge-hint" data-testid="click-to-enlarge-hint">
                  <ZoomIn size={12} style={{ color: 'var(--accent-primary, #38BDF8)' }} />
                  <span>Click to enlarge</span>
                </div>
              )}
            </div>
            <ImagePreviewDialog
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              imageUrl={blobUrl}
              alt="Decoded Repaired Preview"
              initialDimensions={candidate?.imageDimensions}
            />
            {imgStatus === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#EF4444' }}>
                <AlertCircle size={28} />
                <span style={{ fontSize: '0.8125rem' }}>Failed to render decoded image stream</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

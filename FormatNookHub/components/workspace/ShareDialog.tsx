'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Download,
  Copy,
  Check,
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
  FileCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SharePayload, ShareFormatOption } from '@/features/shared/types/share.types';
import { ShareService } from '@/features/shared/services/share.service';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payload: SharePayload | null;
}

export function ShareDialog({ isOpen, onClose, payload }: ShareDialogProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const webShareSupported = ShareService.isWebShareSupported();

  // Reset or initialize selected option when payload changes
  useEffect(() => {
    if (payload && payload.options.length > 0) {
      setSelectedId(payload.options[0].id);
      setNotification(null);
      setCopied(false);
    }
  }, [payload, isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !payload) return null;

  const currentOption = payload.options.find((o) => o.id === selectedId) || payload.options[0];

  const handleAction = async (mode: 'share' | 'download' | 'copy') => {
    if (!currentOption) return;

    setIsProcessing(true);
    setNotification(null);

    try {
      const result = await ShareService.executeShareOption(currentOption, mode);

      if (result.cancelled) {
        // User dismissed system share dialog; do not treat as error, no action needed
        return;
      }

      if (result.success) {
        if (mode === 'copy') {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
        setNotification({
          type: 'success',
          message: result.message || (mode === 'download' ? 'Download started.' : 'Action completed.'),
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to complete action.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getFormatIcon = (opt: ShareFormatOption) => {
    if (opt.extension === '.pdf') return <FileCheck size={18} style={{ color: '#EF4444' }} />;
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(opt.extension)) {
      return <ImageIcon size={18} style={{ color: '#10B981' }} />;
    }
    if (['.json', '.yaml', '.yml', '.patch', '.diff'].includes(opt.extension)) {
      return <FileCode size={18} style={{ color: '#38BDF8' }} />;
    }
    return <FileText size={18} style={{ color: '#94A3B8' }} />;
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="share-output-dialog"
      style={{ zIndex: 9999 }}
    >
      <div
        ref={dialogRef}
        className="modal-content"
        style={{
          maxWidth: '560px',
          width: '94%',
          backgroundColor: '#111927',
          border: '1px solid #263449',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Dialog Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#151F31',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Share2 size={18} />
            </div>
            <div>
              <h3
                id="share-dialog-title"
                style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}
              >
                Share Output
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {payload.toolTitle} · Pure client-side zero-telemetry export
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close share dialog"
            data-testid="btn-close-share-dialog"
            style={{ padding: '0.3rem', borderRadius: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dialog Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#E2E8F0',
                marginBottom: '0.5rem',
              }}
            >
              Select Export Format:
            </label>
            <div
              role="radiogroup"
              aria-label="Export format options"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              {payload.options.map((opt) => {
                const isSelected = opt.id === currentOption?.id;
                return (
                  <div
                    key={opt.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => {
                      setSelectedId(opt.id);
                      setNotification(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setSelectedId(opt.id);
                        setNotification(null);
                      }
                    }}
                    data-testid={`share-option-${opt.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : '#263449'}`,
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : '#0F172A',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>{getFormatIcon(opt)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
                          {opt.label}
                        </span>
                        <code
                          style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#1E293B',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            color: '#94A3B8',
                          }}
                        >
                          {opt.extension}
                        </code>
                        {opt.badge && (
                          <span
                            className="badge badge-neutral"
                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#94A3B8',
                          marginTop: '0.15rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {opt.description}
                      </div>
                    </div>
                    {opt.estimatedSize && (
                      <span style={{ fontSize: '0.75rem', color: '#64748B', flexShrink: 0 }}>
                        {opt.estimatedSize}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback & Notification banner */}
          {notification && (
            <div
              data-testid="share-notification"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                backgroundColor:
                  notification.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${
                  notification.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                }`,
                color: notification.type === 'success' ? '#10B981' : '#EF4444',
              }}
            >
              {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{notification.message}</span>
            </div>
          )}
        </div>

        {/* Dialog Actions Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #1E293B',
            backgroundColor: '#151F31',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Copy Option */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleAction('copy')}
            disabled={isProcessing}
            data-testid="btn-share-copy"
            title="Copy content to clipboard"
          >
            {copied ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Direct Download Option */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleAction('download')}
            disabled={isProcessing}
            data-testid="btn-share-download"
            title="Download file directly to disk"
          >
            <Download size={14} />
            <span>Download</span>
          </button>

          {/* Web Share (Device Native Share) */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleAction('share')}
            disabled={isProcessing}
            data-testid="btn-share-native"
            title={
              webShareSupported
                ? 'Share using your operating system or mobile share sheet'
                : 'Share content (falls back to direct download)'
            }
          >
            {isProcessing ? (
              <Loader2 size={14} className="spin-animation" />
            ) : (
              <Share2 size={14} />
            )}
            <span>{webShareSupported ? 'Share via Device' : 'Share / Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

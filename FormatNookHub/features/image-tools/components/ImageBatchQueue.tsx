'use client';

import React, { useRef } from 'react';
import {
  Layers,
  X,
  UploadCloud,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive,
  RotateCcw,
  StopCircle,
  Play,
} from 'lucide-react';
import { BatchItem, BatchProgress } from '../types/image-tools.types';
import { formatByteSize } from '@/lib/file-reader';

interface ImageBatchQueueProps {
  isOpen: boolean;
  onClose: () => void;
  items: BatchItem[];
  activeId: string | null;
  onSelectActive: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onAddFiles: (files: File[]) => void;
  onDownloadItem: (item: BatchItem) => void;
  onDownloadAllZip: () => void;
  onStartBatchProcessing?: () => void;
  onCancelBatchProcessing?: () => void;
  onRetryItem?: (id: string) => void;
  isProcessingBatch?: boolean;
  batchProgress?: BatchProgress | null;
}

export const ImageBatchQueue: React.FC<ImageBatchQueueProps> = ({
  isOpen,
  onClose,
  items,
  activeId,
  onSelectActive,
  onRemoveItem,
  onClearAll,
  onAddFiles,
  onDownloadItem,
  onDownloadAllZip,
  onStartBatchProcessing,
  onCancelBatchProcessing,
  onRetryItem,
  isProcessingBatch = false,
  batchProgress = null,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const completedItems = items.filter((it) => it.status === 'done');
  const hasCompleted = completedItems.length > 0;
  const hasPending = items.some((it) => it.status === 'idle' || it.status === 'error' || it.status === 'cancelled');

  return (
    <div className="image-batch-drawer" data-testid="image-batch-drawer">
      {/* 40px Standard Panel Header */}
      <div className="panel-header" style={{ height: '40px', minHeight: '40px' }}>
        <div className="panel-header-left">
          <Layers className="w-4 h-4 text-accent-primary" />
          <span className="panel-title font-medium text-sm">Batch Queue</span>
          <span className="panel-badge">{items.length} items</span>
        </div>

        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => fileInputRef.current?.click()}
            title="Add images to queue"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add More</span>
          </button>

          {items.length > 0 && !isProcessingBatch && hasPending && onStartBatchProcessing && (
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={onStartBatchProcessing}
              data-testid="btn-start-batch"
              title="Process all images in batch"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Process All</span>
            </button>
          )}

          {isProcessingBatch && onCancelBatchProcessing && (
            <button
              type="button"
              className="btn btn-secondary btn-xs text-danger"
              onClick={onCancelBatchProcessing}
              data-testid="btn-cancel-batch"
              title="Cancel batch processing"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={onDownloadAllZip}
              disabled={isProcessingBatch}
              data-testid="btn-download-all-zip"
              title={
                hasCompleted && completedItems.length < items.length
                  ? `Download ${completedItems.length} processed files as ZIP`
                  : 'Download All (ZIP)'
              }
            >
              <Archive className="w-3.5 h-3.5" />
              <span>
                {hasCompleted && completedItems.length < items.length
                  ? `Download Completed (${completedItems.length})`
                  : 'Download All (ZIP)'}
              </span>
            </button>
          )}

          {items.length > 0 && !isProcessingBatch && (
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={onClearAll}
              title="Clear all images"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            className="panel-action-btn"
            onClick={onClose}
            title="Close Queue Drawer"
            aria-label="Close Queue Drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress & Throughput ETA Bar */}
      {(isProcessingBatch || batchProgress) && (
        <div className="batch-progress-strip" data-testid="batch-progress-strip">
          <div className="batch-progress-header">
            <span className="batch-progress-label">
              {isProcessingBatch ? 'Processing batch...' : 'Batch finished'} (
              {batchProgress ? `${batchProgress.completed + batchProgress.failed} of ${batchProgress.total}` : '0 of 0'})
            </span>
            <span className="batch-progress-eta">
              {batchProgress?.etaSeconds !== null && batchProgress?.etaSeconds !== undefined
                ? `About ${batchProgress.etaSeconds}s remaining`
                : `${batchProgress?.percent || 0}%`}
            </span>
          </div>
          <div className="batch-progress-track">
            <div
              className="batch-progress-fill"
              style={{ width: `${batchProgress?.percent || 0}%` }}
              role="progressbar"
              aria-valuenow={batchProgress?.percent || 0}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) {
            onAddFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      <div className="image-batch-list">
        {items.length === 0 ? (
          <div className="image-batch-empty">
            <p className="text-sm text-muted">No images currently in batch queue.</p>
          </div>
        ) : (
          items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <div
                key={item.id}
                className={`image-batch-item-card ${isActive ? 'active' : ''}`}
                onClick={() => onSelectActive(item.id)}
                data-testid={`batch-item-${item.id}`}
              >
                <div className="batch-item-info">
                  <span className="batch-item-name" title={item.name}>
                    {item.name}
                  </span>
                  <span className="batch-item-meta">
                    {item.width}×{item.height} px • {formatByteSize(item.sizeBytes)}
                    {item.outputSize ? ` → ${formatByteSize(item.outputSize)}` : ''}
                  </span>
                  {item.error && (
                    <span className="batch-item-error-msg" title={item.error}>
                      {item.error}
                    </span>
                  )}
                </div>

                <div className="batch-item-status">
                  {item.status === 'processing' && (
                    <span className="batch-badge processing">
                      <Clock className="w-3 h-3 animate-spin" /> Processing
                    </span>
                  )}
                  {item.status === 'done' && (
                    <span className="batch-badge done">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="batch-badge error">
                      <AlertCircle className="w-3 h-3" /> Error
                    </span>
                  )}
                  {item.status === 'cancelled' && (
                    <span className="batch-badge cancelled">
                      Cancelled
                    </span>
                  )}
                  {item.status === 'idle' && (
                    <span className="batch-badge idle">Queued</span>
                  )}
                </div>

                <div className="batch-item-actions" onClick={(e) => e.stopPropagation()}>
                  {(item.status === 'error' || item.status === 'cancelled') && onRetryItem && (
                    <button
                      type="button"
                      className="panel-action-btn"
                      onClick={() => onRetryItem(item.id)}
                      title="Retry processing this item"
                      data-testid={`btn-retry-${item.id}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {item.status === 'done' && item.outputBlob && (
                    <button
                      type="button"
                      className="panel-action-btn"
                      onClick={() => onDownloadItem(item)}
                      title="Download processed file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    className="panel-action-btn"
                    onClick={() => onRemoveItem(item.id)}
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

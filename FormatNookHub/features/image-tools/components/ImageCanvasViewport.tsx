'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Image as ImageIcon, Columns, Maximize2, RefreshCw } from 'lucide-react';
import {
  ImageFileItem,
  PipelineRenderResult,
  ImageToolTab,
  CropSettings,
  CropRect,
} from '../types/image-tools.types';
import { ImageCropOverlay } from './ImageCropOverlay';
import { formatByteSize } from '@/lib/file-reader';

interface ImageCanvasViewportProps {
  currentFile: ImageFileItem;
  renderResult: PipelineRenderResult | null;
  zoom: number;
  isCompareActive: boolean;
  onToggleCompare: () => void;
  onResetZoom: () => void;
  isRendering?: boolean;
  activeTab?: ImageToolTab;
  cropSettings?: CropSettings;
  onChangeCropRect?: (rect: CropRect) => void;
  onCommitCropRect?: (rect: CropRect) => void;
}

export const ImageCanvasViewport: React.FC<ImageCanvasViewportProps> = ({
  currentFile,
  renderResult,
  zoom,
  isCompareActive,
  onToggleCompare,
  onResetZoom,
  isRendering = false,
  activeTab,
  cropSettings,
  onChangeCropRect,
  onCommitCropRect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [renderedSize, setRenderedSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0-100
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  // Active display values
  const activeWidth = renderResult?.width || currentFile.width;
  const activeHeight = renderResult?.height || currentFile.height;
  const activeSize = renderResult?.sizeBytes || currentFile.sizeBytes;
  const activeUrl = renderResult?.objectUrl || currentFile.originalUrl;

  const displayW =
    renderedSize.width ||
    (imgRef.current?.clientWidth ? imgRef.current.clientWidth : 0) ||
    Math.min(600, currentFile.width);
  const displayH =
    renderedSize.height ||
    (imgRef.current?.clientHeight ? imgRef.current.clientHeight : 0) ||
    Math.round((displayW * currentFile.height) / (currentFile.width || 1));

  useEffect(() => {
    if (!imgRef.current) return;
    const el = imgRef.current;
    const updateSize = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setRenderedSize({ width: el.clientWidth, height: el.clientHeight });
      }
    };
    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [activeUrl]);

  const handlePointerDownSplit = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveSplit = (e: React.PointerEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPos(pct);
  };

  const handlePointerUpSplit = (e: React.PointerEvent) => {
    if (isDraggingSplit) {
      setIsDraggingSplit(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore if already released
      }
    }
  };

  return (
    <div className="panel image-viewport-panel" data-testid="image-canvas-viewport">
      {/* Standardized 40px Panel Header */}
      <div className="panel-header" style={{ height: '40px', minHeight: '40px' }}>
        <div className="panel-header-left">
          <ImageIcon className="w-4 h-4 text-accent-primary" />
          <span className="panel-title font-medium text-sm">Preview Canvas</span>
          <span className="panel-badge">{currentFile.name}</span>
        </div>

        <div className="panel-stats" data-testid="viewport-stats">
          <span>{activeWidth} × {activeHeight} px</span>
          <span className="stat-separator">•</span>
          <span>{formatByteSize(activeSize)}</span>
          <span className="stat-separator">•</span>
          <span>{currentFile.aspectRatio}</span>
          <span className="stat-separator">•</span>
          <span>{Math.round(zoom)}%</span>
        </div>

        <div className="panel-actions">
          <button
            type="button"
            className={`panel-action-btn ${isCompareActive ? 'active' : ''}`}
            onClick={onToggleCompare}
            title="Toggle Split Comparison"
            aria-label="Toggle Split Comparison"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="panel-action-btn"
            onClick={onResetZoom}
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Viewport Area */}
      <div
        ref={containerRef}
        className="image-viewport-stage image-checkerboard"
        onPointerMove={isDraggingSplit ? handlePointerMoveSplit : undefined}
        onPointerUp={isDraggingSplit ? handlePointerUpSplit : undefined}
      >
        {isRendering && (
          <div className="image-viewport-rendering-overlay">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-primary" />
            <span>Rendering adjustments...</span>
          </div>
        )}

        <div
          className="image-viewport-transform-layer"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
        >
          {!isCompareActive ? (
            // Standard Single Output Preview with interactive crop overlay
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                ref={imgRef}
                src={activeTab === 'crop' ? currentFile.originalUrl : activeUrl}
                alt="Processed Preview"
                className="image-preview-element"
                data-testid="image-preview-single"
                draggable={false}
                onLoad={(e) => {
                  setRenderedSize({
                    width: e.currentTarget.clientWidth,
                    height: e.currentTarget.clientHeight,
                  });
                }}
              />
              {activeTab === 'crop' && cropSettings && onChangeCropRect && onCommitCropRect && (
                <ImageCropOverlay
                  rect={cropSettings.rect}
                  imageWidth={currentFile.width}
                  imageHeight={currentFile.height}
                  renderedWidth={displayW}
                  renderedHeight={displayH}
                  aspectPreset={cropSettings.aspectPreset}
                  onChangeRect={onChangeCropRect}
                  onCommitRect={onCommitCropRect}
                />
              )}
            </div>
          ) : (
            // Split Comparison View (Original vs Processed)
            <div className="image-compare-wrapper" data-testid="image-compare-view">
              {/* Original Image (Left side) */}
              <div
                className="image-compare-pane original"
                style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
              >
                <img
                  src={currentFile.originalUrl}
                  alt="Original Master"
                  className="image-preview-element"
                  draggable={false}
                />
                <span className="image-compare-tag original">Original</span>
              </div>

              {/* Processed Image (Right side) */}
              <div
                className="image-compare-pane processed"
                style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
              >
                <img
                  src={activeUrl}
                  alt="Processed Result"
                  className="image-preview-element"
                  draggable={false}
                />
                <span className="image-compare-tag processed">Processed</span>
              </div>

              {/* Draggable Divider Handle */}
              <div
                className="image-compare-divider"
                style={{ left: `${splitPos}%` }}
                onPointerDown={handlePointerDownSplit}
                role="separator"
                aria-valuenow={splitPos}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
              >
                <div className="image-compare-handle">
                  <div className="image-compare-arrows">⇄</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

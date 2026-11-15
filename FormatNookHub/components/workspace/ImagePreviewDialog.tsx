'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Minus, Plus, X } from 'lucide-react';

export interface ImagePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  initialDimensions?: { width: number; height: number };
}

export function ImagePreviewDialog({
  isOpen,
  onClose,
  imageUrl,
  alt = 'Image Preview',
  initialDimensions,
}: ImagePreviewDialogProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: initialDimensions?.width || 0,
    height: initialDimensions?.height || 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialFitCalculatedRef = useRef<boolean>(false);
  const touchDistanceRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(100);

  // Compute scale needed to fit the image inside the viewing container
  const computeFitZoom = useCallback((): number => {
    if (!containerRef.current) return 100;
    const rect = containerRef.current.getBoundingClientRect();
    const nw = naturalSize.width;
    const nh = naturalSize.height;

    if (!nw || !nh || !rect.width || !rect.height) {
      return 100;
    }

    const padding = 32;
    const availW = Math.max(rect.width - padding, 40);
    const availH = Math.max(rect.height - padding, 40);

    const scale = Math.min(availW / nw, availH / nh);
    // If image exceeds container, scale it down to fit. If smaller, display at 100% crisp.
    const targetScale = Math.min(scale, 1);
    return Math.min(Math.max(Math.round(targetScale * 100), 25), 500);
  }, [naturalSize]);

  // Reset state and calculate initial fit when dialog opens or image changes
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      initialFitCalculatedRef.current = false;
      setPan({ x: 0, y: 0 });

      if (initialDimensions?.width && initialDimensions?.height) {
        setNaturalSize({ width: initialDimensions.width, height: initialDimensions.height });
      }

      // Focus close button on open for accessibility
      const focusTimer = setTimeout(() => {
        const closeBtn = dialogRef.current?.querySelector<HTMLElement>('[data-testid="btn-close-preview-dialog"]');
        closeBtn?.focus();
      }, 50);

      return () => clearTimeout(focusTimer);
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen, imageUrl, initialDimensions]);

  // Initialize zoom once dimensions and container are available
  useEffect(() => {
    if (isOpen && !initialFitCalculatedRef.current && naturalSize.width > 0 && naturalSize.height > 0) {
      const fit = computeFitZoom();
      setZoom(fit);
      initialFitCalculatedRef.current = true;
    }
  }, [isOpen, naturalSize, computeFitZoom]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(500, Math.floor(prev / 25) * 25 + 25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(25, Math.ceil(prev / 25) * 25 - 25));
  }, []);

  const handleFit = useCallback(() => {
    const fit = computeFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  }, [computeFitZoom]);

  const handleActualSize = useCallback(() => {
    setZoom(100);
  }, []);

  const handleReset = useCallback(() => {
    const fit = computeFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  }, [computeFitZoom]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleFit();
      } else if (e.key === '1') {
        e.preventDefault();
        handleActualSize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleFit, handleActualSize]);

  // Non-passive wheel listener for smooth zooming on image viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const isZoomIn = e.deltaY < 0;
      setZoom((prev) => {
        if (isZoomIn) {
          return Math.min(500, Math.floor(prev / 25) * 25 + 25);
        } else {
          return Math.max(25, Math.ceil(prev / 25) * 25 - 25);
        }
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  // Mouse and Pointer drag handling for pan
  const startDrag = (clientX: number, clientY: number, button = 0) => {
    if (button !== 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX - pan.x,
      y: clientY - pan.y,
    };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    });
  };

  const endDrag = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    startDrag(e.clientX, e.clientY, e.button);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    moveDrag(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    endDrag();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startDrag(e.clientX, e.clientY, e.button);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    moveDrag(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    endDrag();
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Touch pinch-to-zoom support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistanceRef.current;
      const targetZoom = Math.min(500, Math.max(25, Math.round(touchStartZoomRef.current * factor)));
      setZoom(targetZoom);
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  // Focus trap inside modal
  const handleKeyDownTrap = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="image-preview-backdrop"
      data-testid="image-preview-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 2.5vw, 24px)',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Image Preview"
        onKeyDown={handleKeyDownTrap}
        data-testid="image-preview-dialog"
        className="image-preview-dialog"
        style={{
          position: 'relative',
          width: 'min(90vw, 1100px)',
          maxHeight: '85vh',
          height: 'min(85vh, 760px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '12px',
          border: '1px solid var(--border-default, rgba(255, 255, 255, 0.12))',
          backgroundColor: 'var(--bg-card, #0F172A)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          userSelect: 'none',
        }}
      >
        {/* Header: Title and Close button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#111827',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#F1F5F9',
              letterSpacing: '-0.01em',
            }}
          >
            Image Preview
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            data-testid="btn-close-preview-dialog"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewing Controls Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            flexWrap: 'wrap',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            zIndex: 10,
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 25}
            aria-label="Zoom Out"
            title="Zoom Out (-)"
            data-testid="btn-zoom-out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: zoom <= 25 ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
              cursor: zoom <= 25 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Minus size={16} />
          </button>

          {/* Zoom Percentage */}
          <span
            data-testid="zoom-percentage"
            style={{
              minWidth: '56px',
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#F8FAFC',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {zoom}%
          </span>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 500}
            aria-label="Zoom In"
            title="Zoom In (+)"
            data-testid="btn-zoom-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: zoom >= 500 ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
              cursor: zoom >= 500 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} />
          </button>

          {/* Divider */}
          <div
            style={{
              width: '1px',
              height: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              margin: '0 0.35rem',
            }}
          />

          {/* Fit to Screen */}
          <button
            type="button"
            onClick={handleFit}
            aria-label="Fit to Screen"
            title="Fit to Screen (0)"
            data-testid="btn-zoom-fit"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Fit
          </button>

          {/* Actual Size (100%) */}
          <button
            type="button"
            onClick={handleActualSize}
            aria-label="Actual Size (100%)"
            title="Actual Size 100% (1)"
            data-testid="btn-zoom-100"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            100%
          </button>

          {/* Reset Zoom */}
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset Zoom"
            title="Reset Zoom"
            data-testid="btn-zoom-reset"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Reset
          </button>
        </div>

        {/* Main Image Viewport Area */}
        <div
          ref={containerRef}
          data-testid="preview-viewport-container"
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#070A11',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={() => {
            if (zoom === 100) {
              handleFit();
            } else {
              handleActualSize();
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            draggable={false}
            data-testid="preview-image-element"
            onLoad={(e) => {
              const img = e.currentTarget;
              const nw = img.naturalWidth || img.width;
              const nh = img.naturalHeight || img.height;
              if (nw && nh) {
                setNaturalSize({ width: nw, height: nh });
              }
            }}
            style={{
              maxWidth: 'none',
              maxHeight: 'none',
              width: naturalSize.width > 0 ? `${naturalSize.width}px` : 'auto',
              height: naturalSize.height > 0 ? `${naturalSize.height}px` : 'auto',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              userSelect: 'none',
              pointerEvents: 'none',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}

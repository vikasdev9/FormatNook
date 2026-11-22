'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CropRect, AspectRatioPreset } from '../types/image-tools.types';
import { CropHandle, computeHandleDrag } from '../services/image-crop.service';

interface ImageCropOverlayProps {
  rect: CropRect;
  imageWidth: number;
  imageHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  aspectPreset: AspectRatioPreset;
  onChangeRect: (rect: CropRect) => void;
  onCommitRect: (rect: CropRect) => void;
}

export const ImageCropOverlay: React.FC<ImageCropOverlayProps> = ({
  rect,
  imageWidth,
  imageHeight,
  renderedWidth,
  renderedHeight,
  aspectPreset,
  onChangeRect,
  onCommitRect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag interaction state
  const [activeHandle, setActiveHandle] = useState<CropHandle | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startRect: CropRect } | null>(null);
  const latestRectRef = useRef<CropRect>(rect);
  latestRectRef.current = rect;

  // Coordinate conversion factors
  const scaleX = renderedWidth > 0 && imageWidth > 0 ? renderedWidth / imageWidth : 1;
  const scaleY = renderedHeight > 0 && imageHeight > 0 ? renderedHeight / imageHeight : 1;

  // Viewport box coordinates
  const viewX = Math.round(rect.x * scaleX);
  const viewY = Math.round(rect.y * scaleY);
  const viewW = Math.round(rect.width * scaleX);
  const viewH = Math.round(rect.height * scaleY);

  const handlePointerDown = (e: React.PointerEvent, handle: CropHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handle);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startRect: { ...rect },
    };
    latestRectRef.current = { ...rect };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !dragStartRef.current) return;
    const deltaScreenX = e.clientX - dragStartRef.current.clientX;
    const deltaScreenY = e.clientY - dragStartRef.current.clientY;

    const deltaImgX = deltaScreenX / scaleX;
    const deltaImgY = deltaScreenY / scaleY;

    const nextRect = computeHandleDrag(
      dragStartRef.current.startRect,
      activeHandle,
      deltaImgX,
      deltaImgY,
      imageWidth,
      imageHeight,
      aspectPreset
    );

    latestRectRef.current = nextRect;
    onChangeRect(nextRect);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveHandle(null);
      dragStartRef.current = null;
      onCommitRect(latestRectRef.current);
    }
  };

  // Keyboard navigation for precision pixel nudge
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    let nextX = rect.x;
    let nextY = rect.y;

    if (e.key === 'ArrowLeft') nextX = Math.max(0, rect.x - step);
    else if (e.key === 'ArrowRight') nextX = Math.min(imageWidth - rect.width, rect.x + step);
    else if (e.key === 'ArrowUp') nextY = Math.max(0, rect.y - step);
    else if (e.key === 'ArrowDown') nextY = Math.min(imageHeight - rect.height, rect.y + step);
    else return;

    e.preventDefault();
    const updated = { ...rect, x: nextX, y: nextY };
    onChangeRect(updated);
    onCommitRect(updated);
  };

  const handles: { id: CropHandle; className: string }[] = [
    { id: 'nw', className: 'handle-nw' },
    { id: 'n', className: 'handle-n' },
    { id: 'ne', className: 'handle-ne' },
    { id: 'e', className: 'handle-e' },
    { id: 'se', className: 'handle-se' },
    { id: 's', className: 'handle-s' },
    { id: 'sw', className: 'handle-sw' },
    { id: 'w', className: 'handle-w' },
  ];

  return (
    <div
      ref={containerRef}
      className="image-crop-overlay-root"
      style={{ width: renderedWidth, height: renderedHeight }}
      onPointerMove={activeHandle ? handlePointerMove : undefined}
      onPointerUp={activeHandle ? handlePointerUp : undefined}
      data-testid="image-crop-overlay"
    >
      {/* Dimmed Scrim Outside Active Crop Window */}
      <svg className="crop-scrim-svg" width={renderedWidth} height={renderedHeight}>
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.55)"
          mask="url(#crop-mask)"
        />
      </svg>

      {/* Active Crop Box */}
      <div
        className="crop-box"
        style={{
          left: viewX,
          top: viewY,
          width: viewW,
          height: viewH,
        }}
        tabIndex={0}
        role="region"
        aria-label="Active Crop Box. Use arrow keys to adjust position."
        onKeyDown={handleKeyDown}
      >
        {/* Draggable Interior Area */}
        <div
          className="crop-box-interior"
          onPointerDown={(e) => handlePointerDown(e, 'move')}
          title="Drag to reposition crop area"
        >
          {/* Rule of Thirds 3x3 Guidelines */}
          <div className="crop-guideline-h line-1" />
          <div className="crop-guideline-h line-2" />
          <div className="crop-guideline-v line-1" />
          <div className="crop-guideline-v line-2" />
        </div>

        {/* 8 Resize Handles */}
        {handles.map((h) => (
          <div
            key={h.id}
            className={`crop-handle ${h.className}`}
            onPointerDown={(e) => handlePointerDown(e, h.id)}
            data-testid={`crop-handle-${h.id}`}
          />
        ))}

        {/* Crop Dimension Badge */}
        <div className="crop-dimension-badge">
          {Math.round(rect.width)} × {Math.round(rect.height)} px
        </div>
      </div>
    </div>
  );
};

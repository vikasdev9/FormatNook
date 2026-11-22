'use client';

import React from 'react';
import {
  Crop,
  Maximize2,
  RotateCw,
  Minimize2,
  RefreshCw,
  Stamp,
  Info,
  Pipette,
  Undo2,
  Redo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Columns,
  Layers,
  Download,
} from 'lucide-react';
import { ImageToolTab } from '../types/image-tools.types';

interface ImageToolbarProps {
  activeTab: ImageToolTab;
  onTabChange: (tab: ImageToolTab) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onDownload: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  isCompareActive: boolean;
  onToggleCompare: () => void;
  batchCount: number;
  isBatchOpen: boolean;
  onToggleBatch: () => void;
  isProcessing?: boolean;
}

const TABS: { id: ImageToolTab; label: string; icon: React.ElementType }[] = [
  { id: 'crop', label: 'Crop', icon: Crop },
  { id: 'resize', label: 'Resize', icon: Maximize2 },
  { id: 'rotate', label: 'Rotate & Flip', icon: RotateCw },
  { id: 'compress', label: 'Compress', icon: Minimize2 },
  { id: 'convert', label: 'Convert', icon: RefreshCw },
  { id: 'watermark', label: 'Watermark', icon: Stamp },
  { id: 'metadata', label: 'Metadata', icon: Info },
  { id: 'colors', label: 'Color Picker', icon: Pipette },
];

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
  activeTab,
  onTabChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onDownload,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  isCompareActive,
  onToggleCompare,
  batchCount,
  isBatchOpen,
  onToggleBatch,
  isProcessing = false,
}) => {
  return (
    <div className="image-toolbar-container" data-testid="image-toolbar">
      {/* Tier 1: Primary Navigation & Key Actions */}
      <div className="image-toolbar-primary">
        <div className="image-toolbar-tabs" role="tablist" aria-label="Image Tools">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                data-testid={`tab-${tab.id}`}
                className={`image-tool-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="image-toolbar-actions">
          <div className="image-toolbar-history-group">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onUndo}
              disabled={!canUndo || isProcessing}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
              data-testid="btn-undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onRedo}
              disabled={!canRedo || isProcessing}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
              data-testid="btn-redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onReset}
            disabled={isProcessing}
            title="Reset All Adjustments"
            data-testid="btn-reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onDownload}
            disabled={isProcessing}
            title="Download Processed Image"
            data-testid="btn-download-primary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Tier 2: Viewport & Secondary Controls */}
      <div className="image-toolbar-secondary">
        <div className="image-secondary-left">
          <div className="image-zoom-controls">
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={onZoomOut}
              disabled={zoom <= 25}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="image-zoom-display"
              onClick={onZoomReset}
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom)}%
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={onZoomIn}
              disabled={zoom >= 500}
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={onZoomReset}
              title="Fit to Screen"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-xs">Fit</span>
            </button>
          </div>

          <div className="toolbar-divider" />

          <button
            type="button"
            className={`btn btn-ghost btn-xs ${isCompareActive ? 'active' : ''}`}
            onClick={onToggleCompare}
            title="Toggle Split Comparison (Before / After)"
            data-testid="btn-toggle-compare"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
        </div>

        <div className="image-secondary-right">
          <button
            type="button"
            className={`btn btn-ghost btn-xs ${isBatchOpen ? 'active' : ''}`}
            onClick={onToggleBatch}
            title="Batch Queue Drawer"
            data-testid="btn-toggle-batch"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Queue</span>
            {batchCount > 0 && (
              <span className="image-batch-counter-badge">{batchCount}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

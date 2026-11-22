'use client';

import React from 'react';
import {
  Sliders,
  RotateCcw,
  Check,
  Lock,
  Unlock,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Layers,
  Sparkles,
  Info,
  Shield,
  Pipette,
  Upload,
} from 'lucide-react';
import {
  ImageToolTab,
  PipelineSettings,
  AspectRatioPreset,
  ImageOutputFormat,
  WatermarkPosition,
  ImageFileItem,
  PipelineRenderResult,
} from '../types/image-tools.types';
import { applyAspectRatioPreset, clampCropRect } from '../services/image-crop.service';
import { calculateResizeDimensions, scaleByPercentage } from '../services/image-resize.service';
import { normalizeAngle } from '../services/image-transform.service';
import { calculateRecommendedQuality } from '../services/image-compression.service';
import { formatByteSize } from '@/lib/file-reader';

interface ImageInspectorProps {
  activeTab: ImageToolTab;
  settings: PipelineSettings;
  onUpdateSettings: (updater: (prev: PipelineSettings) => PipelineSettings) => void;
  onCommitSettings?: (updater: (prev: PipelineSettings) => PipelineSettings) => void;
  currentFile: ImageFileItem;
  renderResult: PipelineRenderResult | null;
  onResetTabSettings: (tab: ImageToolTab) => void;
  onDownload: () => void;
  onApplyToBatch?: () => void;
  batchCount: number;
  isProcessing?: boolean;
}

const ASPECT_RATIO_PRESETS: { id: AspectRatioPreset; label: string }[] = [
  { id: 'free', label: 'Freeform' },
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Screen' },
  { id: '4:3', label: '4:3 Standard' },
  { id: '3:2', label: '3:2 Photo' },
  { id: '9:16', label: '9:16 Reel/Story' },
  { id: '4:5', label: '4:5 Portrait' },
];

const WATERMARK_POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'TL' },
  { id: 'top-center', label: 'TC' },
  { id: 'top-right', label: 'TR' },
  { id: 'center-left', label: 'ML' },
  { id: 'center', label: 'C' },
  { id: 'center-right', label: 'MR' },
  { id: 'bottom-left', label: 'BL' },
  { id: 'bottom-center', label: 'BC' },
  { id: 'bottom-right', label: 'BR' },
];

export const ImageInspector: React.FC<ImageInspectorProps> = ({
  activeTab,
  settings,
  onUpdateSettings,
  onCommitSettings,
  currentFile,
  renderResult,
  onResetTabSettings,
  onDownload,
  onApplyToBatch,
  batchCount,
  isProcessing = false,
}) => {
  const commit = onCommitSettings || onUpdateSettings;

  // Output size diff calculation
  const originalSize = currentFile.sizeBytes;
  const outputSize = renderResult?.sizeBytes || originalSize;
  const sizeDiff = outputSize - originalSize;
  const percentDiff = Math.round((sizeDiff / originalSize) * 100);

  return (
    <div className="panel image-inspector-panel" data-testid="image-inspector">
      {/* 40px Standard Header */}
      <div className="panel-header" style={{ height: '40px', minHeight: '40px' }}>
        <div className="panel-header-left">
          <Sliders className="w-4 h-4 text-accent-primary" />
          <span className="panel-title font-medium text-sm">Adjustment Inspector</span>
          <span className="panel-badge uppercase text-xs tracking-wider">{activeTab}</span>
        </div>

        <div className="panel-actions">
          <button
            type="button"
            className="panel-action-btn"
            onClick={() => onResetTabSettings(activeTab)}
            title="Reset this tool"
            aria-label="Reset this tool"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inspector Body */}
      <div className="panel-body image-inspector-body">
        {/* TAB 1: CROP */}
        {activeTab === 'crop' && (
          <div className="inspector-section" data-testid="inspector-crop">
            <div className="inspector-control-group">
              <label className="inspector-label">Aspect Ratio Presets</label>
              <div className="inspector-pill-grid">
                {ASPECT_RATIO_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`inspector-pill ${settings.crop.aspectPreset === p.id ? 'active' : ''}`}
                    onClick={() => {
                      commit((prev) => {
                        const { width, height } = applyAspectRatioPreset(
                          prev.crop.rect.width,
                          prev.crop.rect.height,
                          p.id,
                          currentFile.width,
                          currentFile.height
                        );
                        return {
                          ...prev,
                          crop: {
                            ...prev.crop,
                            enabled: true,
                            aspectPreset: p.id,
                            rect: clampCropRect(
                              { ...prev.crop.rect, width, height },
                              currentFile.width,
                              currentFile.height
                            ),
                          },
                        };
                      });
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="inspector-control-group">
              <label className="inspector-label">Crop Bounds (Pixels)</label>
              <div className="inspector-inputs-row">
                <div className="inspector-input-field">
                  <span className="inspector-input-addon">W</span>
                  <input
                    type="number"
                    min={10}
                    max={currentFile.width}
                    value={Math.round(settings.crop.rect.width)}
                    onChange={(e) => {
                      const val = Math.max(10, Math.min(parseInt(e.target.value) || 10, currentFile.width));
                      onUpdateSettings((prev) => ({
                        ...prev,
                        crop: {
                          ...prev.crop,
                          enabled: true,
                          rect: { ...prev.crop.rect, width: val },
                        },
                      }));
                    }}
                  />
                </div>
                <div className="inspector-input-field">
                  <span className="inspector-input-addon">H</span>
                  <input
                    type="number"
                    min={10}
                    max={currentFile.height}
                    value={Math.round(settings.crop.rect.height)}
                    onChange={(e) => {
                      const val = Math.max(10, Math.min(parseInt(e.target.value) || 10, currentFile.height));
                      onUpdateSettings((prev) => ({
                        ...prev,
                        crop: {
                          ...prev.crop,
                          enabled: true,
                          rect: { ...prev.crop.rect, height: val },
                        },
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="inspector-toggle-row">
              <label className="inspector-checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.crop.enabled}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      crop: { ...prev.crop, enabled: e.target.checked },
                    }))
                  }
                />
                <span>Apply Crop to Output</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: RESIZE */}
        {activeTab === 'resize' && (
          <div className="inspector-section" data-testid="inspector-resize">
            <div className="inspector-control-group">
              <label className="inspector-label">Target Dimensions</label>
              <div className="inspector-inputs-row">
                <div className="inspector-input-field">
                  <span className="inspector-input-addon">W</span>
                  <input
                    type="number"
                    min={1}
                    max={8192}
                    value={Math.round(settings.resize.width)}
                    onChange={(e) => {
                      const newW = parseInt(e.target.value) || 1;
                      onUpdateSettings((prev) => {
                        const { width, height } = calculateResizeDimensions(
                          currentFile.width,
                          currentFile.height,
                          'width',
                          newW,
                          prev.resize.maintainAspectRatio
                        );
                        return {
                          ...prev,
                          resize: {
                            ...prev.resize,
                            enabled: true,
                            width,
                            height,
                            scalePercent: Math.round((width / currentFile.width) * 100),
                          },
                        };
                      });
                    }}
                    onBlur={() => commit((prev) => prev)}
                  />
                </div>

                <button
                  type="button"
                  className={`inspector-lock-btn ${settings.resize.maintainAspectRatio ? 'locked' : ''}`}
                  title={settings.resize.maintainAspectRatio ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                  onClick={() =>
                    commit((prev) => ({
                      ...prev,
                      resize: {
                        ...prev.resize,
                        maintainAspectRatio: !prev.resize.maintainAspectRatio,
                      },
                    }))
                  }
                >
                  {settings.resize.maintainAspectRatio ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                </button>

                <div className="inspector-input-field">
                  <span className="inspector-input-addon">H</span>
                  <input
                    type="number"
                    min={1}
                    max={8192}
                    value={Math.round(settings.resize.height)}
                    onChange={(e) => {
                      const newH = parseInt(e.target.value) || 1;
                      onUpdateSettings((prev) => {
                        const { width, height } = calculateResizeDimensions(
                          currentFile.width,
                          currentFile.height,
                          'height',
                          newH,
                          prev.resize.maintainAspectRatio
                        );
                        return {
                          ...prev,
                          resize: {
                            ...prev.resize,
                            enabled: true,
                            width,
                            height,
                            scalePercent: Math.round((height / currentFile.height) * 100),
                          },
                        };
                      });
                    }}
                    onBlur={() => commit((prev) => prev)}
                  />
                </div>
              </div>
            </div>

            <div className="inspector-control-group">
              <label className="inspector-label">Scale Presets</label>
              <div className="inspector-pill-grid">
                {[25, 50, 75, 100, 200].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className={`inspector-pill ${settings.resize.scalePercent === pct ? 'active' : ''}`}
                    onClick={() => {
                      commit((prev) => {
                        const { width, height } = scaleByPercentage(
                          currentFile.width,
                          currentFile.height,
                          pct
                        );
                        return {
                          ...prev,
                          resize: {
                            ...prev.resize,
                            enabled: pct !== 100,
                            width,
                            height,
                            scalePercent: pct,
                          },
                        };
                      });
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="inspector-control-group">
              <label className="inspector-label">Resampling Algorithm</label>
              <div className="inspector-pill-grid">
                {[
                  { id: 'high', label: 'Bicubic (High)' },
                  { id: 'medium', label: 'Bilinear (Fast)' },
                  { id: 'low', label: 'Nearest (Pixelated)' },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`inspector-pill ${settings.resize.algorithm === a.id ? 'active' : ''}`}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        resize: { ...prev.resize, algorithm: a.id as 'high' | 'medium' | 'low' },
                      }))
                    }
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROTATE & FLIP */}
        {activeTab === 'rotate' && (
          <div className="inspector-section" data-testid="inspector-rotate">
            <div className="inspector-control-group">
              <label className="inspector-label">Quick Rotate</label>
              <div className="inspector-button-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() =>
                    commit((prev) => ({
                      ...prev,
                      orientation: {
                        ...prev.orientation,
                        rotateAngle: normalizeAngle(prev.orientation.rotateAngle + 90),
                      },
                    }))
                  }
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>+90° CW</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() =>
                    commit((prev) => ({
                      ...prev,
                      orientation: {
                        ...prev.orientation,
                        rotateAngle: normalizeAngle(prev.orientation.rotateAngle - 90),
                      },
                    }))
                  }
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>-90° CCW</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() =>
                    commit((prev) => ({
                      ...prev,
                      orientation: {
                        ...prev.orientation,
                        rotateAngle: normalizeAngle(prev.orientation.rotateAngle + 180),
                      },
                    }))
                  }
                >
                  <span>180°</span>
                </button>
              </div>
            </div>

            <div className="inspector-control-group">
              <div className="inspector-label-row">
                <label className="inspector-label">Fine Rotation Angle</label>
                <span className="inspector-value">{settings.orientation.rotateAngle}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={settings.orientation.rotateAngle}
                className="w-full"
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    orientation: {
                      ...prev.orientation,
                      rotateAngle: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                onPointerUp={() => commit((prev) => prev)}
              />
            </div>

            <div className="inspector-control-group">
              <label className="inspector-label">Flip Canvas</label>
              <div className="inspector-button-row">
                <button
                  type="button"
                  className={`btn btn-secondary btn-sm flex-1 ${settings.orientation.flipHorizontal ? 'active' : ''}`}
                  onClick={() =>
                    commit((prev) => ({
                      ...prev,
                      orientation: {
                        ...prev.orientation,
                        flipHorizontal: !prev.orientation.flipHorizontal,
                      },
                    }))
                  }
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip H</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-secondary btn-sm flex-1 ${settings.orientation.flipVertical ? 'active' : ''}`}
                  onClick={() =>
                    commit((prev) => ({
                      ...prev,
                      orientation: {
                        ...prev.orientation,
                        flipVertical: !prev.orientation.flipVertical,
                      },
                    }))
                  }
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip V</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPRESS */}
        {activeTab === 'compress' && (
          <div className="inspector-section" data-testid="inspector-compress">
            <div className="inspector-control-group">
              <div className="inspector-label-row">
                <label className="inspector-label">Compression Quality</label>
                <span className="inspector-value">{Math.round(settings.export.quality * 100)}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(settings.export.quality * 100)}
                className="w-full"
                onChange={(e) => {
                  const q = (parseInt(e.target.value) || 85) / 100;
                  onUpdateSettings((prev) => ({
                    ...prev,
                    export: { ...prev.export, quality: q },
                  }));
                }}
                onPointerUp={() => commit((prev) => prev)}
              />
            </div>

            <div className="inspector-control-group">
              <div className="inspector-label-row">
                <label className="inspector-label">Target File Size</label>
                <span className="inspector-value text-xs text-muted">Auto-calculates quality</span>
              </div>
              <div className="inspector-inputs-row">
                <div className="inspector-input-field flex-1">
                  <span className="inspector-input-addon">KB</span>
                  <input
                    type="number"
                    min={10}
                    max={50000}
                    placeholder="e.g. 200"
                    onChange={(e) => {
                      const kb = parseInt(e.target.value);
                      if (kb && kb > 0) {
                        const targetBytes = kb * 1024;
                        const recommended = calculateRecommendedQuality(
                          targetBytes,
                          currentFile.width,
                          currentFile.height,
                          settings.export.format
                        );
                        onUpdateSettings((prev) => ({
                          ...prev,
                          export: { ...prev.export, quality: recommended },
                        }));
                      }
                    }}
                    onBlur={() => commit((prev) => prev)}
                  />
                </div>
              </div>
            </div>

            <div className="inspector-control-group">
              <label className="inspector-label">Export Format</label>
              <div className="inspector-pill-grid">
                {[
                  { id: 'auto', label: 'Auto (Original)' },
                  { id: 'image/webp', label: 'WebP (Modern)' },
                  { id: 'image/jpeg', label: 'JPEG (Smallest)' },
                  { id: 'image/png', label: 'PNG (Lossless)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`inspector-pill ${settings.export.format === f.id ? 'active' : ''}`}
                    onClick={() =>
                      commit((prev) => ({
                        ...prev,
                        export: { ...prev.export, format: f.id as ImageOutputFormat },
                      }))
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Savings Card */}
            <div className="inspector-savings-card">
              <div className="savings-row">
                <span className="savings-label">Original:</span>
                <span className="savings-val">{formatByteSize(originalSize)}</span>
              </div>
              <div className="savings-row">
                <span className="savings-label">Estimated Output:</span>
                <span className="savings-val font-semibold">{formatByteSize(outputSize)}</span>
              </div>
              <div className="savings-row highlight">
                <span className="savings-label">Difference:</span>
                <span className={`savings-badge ${percentDiff <= 0 ? 'good' : 'warning'}`}>
                  {percentDiff > 0 ? `+${percentDiff}%` : `${percentDiff}%`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONVERT */}
        {activeTab === 'convert' && (
          <div className="inspector-section" data-testid="inspector-convert">
            <div className="inspector-control-group">
              <label className="inspector-label">Target Format</label>
              <div className="inspector-pill-grid">
                {[
                  { id: 'image/png', label: 'PNG (.png)' },
                  { id: 'image/jpeg', label: 'JPEG (.jpg)' },
                  { id: 'image/webp', label: 'WebP (.webp)' },
                  { id: 'image/avif', label: 'AVIF (.avif)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`inspector-pill ${settings.export.format === f.id ? 'active' : ''}`}
                    onClick={() =>
                      commit((prev) => ({
                        ...prev,
                        export: { ...prev.export, format: f.id as ImageOutputFormat },
                      }))
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {settings.export.format === 'image/jpeg' && (
              <div className="inspector-control-group">
                <label className="inspector-label">Transparency Background Fill</label>
                <div className="inspector-color-input-wrap">
                  <input
                    type="color"
                    value={settings.export.backgroundColor}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        export: { ...prev.export, backgroundColor: e.target.value },
                      }))
                    }
                    onBlur={() => commit((prev) => prev)}
                  />
                  <span>{settings.export.backgroundColor}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: WATERMARK */}
        {activeTab === 'watermark' && (
          <div className="inspector-section" data-testid="inspector-watermark">
            <div className="inspector-toggle-row">
              <label className="inspector-checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.watermark.enabled}
                  onChange={(e) =>
                    commit((prev) => ({
                      ...prev,
                      watermark: { ...prev.watermark, enabled: e.target.checked },
                    }))
                  }
                />
                <span>Enable Watermark</span>
              </label>
            </div>

            {/* Watermark Type Selector */}
            <div className="inspector-control-group">
              <label className="inspector-label">Watermark Type</label>
              <div className="inspector-pill-grid">
                <button
                  type="button"
                  className={`inspector-pill ${settings.watermark.type === 'text' ? 'active' : ''}`}
                  onClick={() =>
                    commit((prev) => ({
                      ...prev,
                      watermark: { ...prev.watermark, type: 'text', enabled: true },
                    }))
                  }
                >
                  Text Watermark
                </button>
                <button
                  type="button"
                  className={`inspector-pill ${settings.watermark.type === 'image' ? 'active' : ''}`}
                  onClick={() =>
                    commit((prev) => ({
                      ...prev,
                      watermark: { ...prev.watermark, type: 'image', enabled: true },
                    }))
                  }
                >
                  Logo Image
                </button>
              </div>
            </div>

            {settings.watermark.type === 'text' ? (
              <div className="inspector-control-group">
                <label className="inspector-label">Watermark Text</label>
                <input
                  type="text"
                  className="workspace-input"
                  value={settings.watermark.text}
                  placeholder="© Your Brand / Creator"
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      watermark: { ...prev.watermark, text: e.target.value, enabled: true },
                    }))
                  }
                  onBlur={() => commit((prev) => prev)}
                />
              </div>
            ) : (
              <div className="inspector-control-group">
                <label className="inspector-label">Logo Image Upload</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: 'none' }}
                  id="logo-watermark-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      commit((prev) => ({
                        ...prev,
                        watermark: {
                          ...prev.watermark,
                          enabled: true,
                          type: 'image',
                          imageBlob: file,
                          imageUrl: url,
                        },
                      }));
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm w-full"
                  onClick={() => document.getElementById('logo-watermark-input')?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{settings.watermark.imageUrl ? 'Change Logo Image' : 'Upload Logo Image (PNG / SVG)'}</span>
                </button>
                {settings.watermark.imageUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-secondary rounded" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <img
                      src={settings.watermark.imageUrl}
                      alt="Watermark preview"
                      style={{ maxHeight: '32px', maxWidth: '48px', objectFit: 'contain' }}
                    />
                    <span className="text-xs text-muted truncate flex-1" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Logo Image Active
                    </span>
                  </div>
                )}
                <div className="inspector-label-row mt-2">
                  <label className="inspector-label">Logo Scale</label>
                  <span className="inspector-value">{settings.watermark.imageScale || 20}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={settings.watermark.imageScale || 20}
                  className="w-full"
                  onChange={(e) => {
                    const sc = parseInt(e.target.value) || 20;
                    onUpdateSettings((prev) => ({
                      ...prev,
                      watermark: { ...prev.watermark, imageScale: sc },
                    }));
                  }}
                  onPointerUp={() => commit((prev) => prev)}
                />
              </div>
            )}

            <div className="inspector-control-group">
              <div className="inspector-label-row">
                <label className="inspector-label">Opacity</label>
                <span className="inspector-value">{Math.round(settings.watermark.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(settings.watermark.opacity * 100)}
                className="w-full"
                onChange={(e) => {
                  const op = (parseInt(e.target.value) || 80) / 100;
                  onUpdateSettings((prev) => ({
                    ...prev,
                    watermark: { ...prev.watermark, opacity: op },
                  }));
                }}
                onPointerUp={() => commit((prev) => prev)}
              />
            </div>

            <div className="inspector-control-group">
              <label className="inspector-label">Grid Position</label>
              <div className="inspector-grid-3x3">
                {WATERMARK_POSITIONS.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    className={`inspector-grid-cell ${settings.watermark.position === pos.id ? 'active' : ''}`}
                    onClick={() =>
                      commit((prev) => ({
                        ...prev,
                        watermark: { ...prev.watermark, position: pos.id },
                      }))
                    }
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="inspector-compliance-notice">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>For authorized creator asset marking and ownership management.</span>
            </div>
          </div>
        )}

        {/* TAB 7: METADATA */}
        {activeTab === 'metadata' && (
          <div className="inspector-section" data-testid="inspector-metadata">
            <div className="inspector-meta-table">
              <div className="meta-row">
                <span className="meta-key">File Name</span>
                <span className="meta-val">{currentFile.name}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Original Size</span>
                <span className="meta-val">{formatByteSize(currentFile.sizeBytes)}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Native Resolution</span>
                <span className="meta-val">{currentFile.width} × {currentFile.height} px</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Aspect Ratio</span>
                <span className="meta-val">{currentFile.aspectRatio}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Megapixels</span>
                <span className="meta-val">{((currentFile.width * currentFile.height) / 1_000_000).toFixed(2)} MP</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">MIME Type</span>
                <span className="meta-val">{currentFile.mimeType}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: COLOR PICKER */}
        {activeTab === 'colors' && (
          <div className="inspector-section" data-testid="inspector-colors">
            <p className="text-xs text-muted mb-3">
              Sample colors directly or review dominant palette swatches.
            </p>
            <div className="inspector-palette-swatches">
              {['#0f172a', '#0369a1', '#38bdf8', '#10b981', '#f59e0b', '#ffffff'].map((color) => (
                <div
                  key={color}
                  className="inspector-swatch-card"
                  onClick={() => navigator.clipboard.writeText(color)}
                  title={`Copy ${color}`}
                >
                  <span className="swatch-color" style={{ backgroundColor: color }} />
                  <span className="swatch-label">{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inspector Bottom Actions */}
      <div className="inspector-footer">
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onDownload}
          disabled={isProcessing}
          data-testid="btn-download-inspector"
        >
          <Download className="w-4 h-4" />
          <span>Download Image</span>
        </button>

        {batchCount > 1 && onApplyToBatch && (
          <button
            type="button"
            className="btn btn-secondary w-full mt-2"
            onClick={onApplyToBatch}
            disabled={isProcessing}
            data-testid="btn-apply-batch"
          >
            <Layers className="w-4 h-4" />
            <span>Apply to All in Queue ({batchCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

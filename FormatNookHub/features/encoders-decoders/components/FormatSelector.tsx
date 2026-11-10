'use client';

import React from 'react';
import { Sliders, AlertCircle, Info, Sparkles } from 'lucide-react';
import {
  ImageConversionOptions,
  ImageOutputFormat,
} from '../types/file-metadata.types';
import { SUPPORTED_OUTPUT_FORMATS } from '../services/image-conversion.service';

interface FormatSelectorProps {
  options: ImageConversionOptions;
  onChange: (options: ImageConversionOptions) => void;
  detectedMime?: string;
  disabled?: boolean;
}

const PRESET_BG_COLORS = [
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Black', hex: '#000000' },
  { label: 'Slate', hex: '#0F172A' },
  { label: 'Light Gray', hex: '#F3F4F6' },
];

export function FormatSelector({
  options,
  onChange,
  detectedMime,
  disabled = false,
}: FormatSelectorProps) {
  const isJpeg = options.format === 'image/jpeg';
  const isWebp = options.format === 'image/webp';
  const isGif = options.format === 'image/gif';
  const isAuto = options.format === 'auto';

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value as ImageOutputFormat;
    onChange({
      ...options,
      format: newFormat,
      // Reset default qualities when switching
      quality: newFormat === 'image/jpeg' ? 0.92 : newFormat === 'image/webp' ? 0.90 : options.quality,
    });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...options,
      quality: parseFloat(e.target.value),
    });
  };

  const handleBgColorChange = (hex: string) => {
    onChange({
      ...options,
      backgroundColor: hex,
    });
  };

  return (
    <div className="format-selector-bar">
      {/* Format Selector Dropdown */}
      <div className="format-selector-group">
        <label htmlFor="image-format-select" style={{ fontWeight: 500 }}>
          Output Format:
        </label>
        <select
          id="image-format-select"
          className="select-control"
          value={options.format}
          onChange={handleFormatChange}
          disabled={disabled}
          style={{ minWidth: '150px' }}
        >
          {SUPPORTED_OUTPUT_FORMATS.map((fmt) => (
            <option key={fmt.id} value={fmt.id}>
              {fmt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quality Slider for JPEG and WebP */}
      {(isJpeg || isWebp) && (
        <div className="format-selector-group" title="Adjust compression quality (lossy)">
          <Sliders size={14} style={{ color: 'var(--text-muted)' }} />
          <span>Quality:</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={options.quality}
            onChange={handleQualityChange}
            disabled={disabled}
            className="format-range-slider"
          />
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '36px' }}>
            {Math.round(options.quality * 100)}%
          </span>
        </div>
      )}

      {/* Background Color for JPEG Transparency Replacement */}
      {isJpeg && (
        <div className="format-selector-group" title="JPEG does not support transparency. Select fill color.">
          <span>BG:</span>
          <div className="color-swatches-group">
            {PRESET_BG_COLORS.map((bg) => (
              <button
                key={bg.hex}
                type="button"
                className={`color-swatch-btn ${options.backgroundColor.toUpperCase() === bg.hex ? 'active' : ''}`}
                style={{ backgroundColor: bg.hex }}
                onClick={() => handleBgColorChange(bg.hex)}
                title={`Fill with ${bg.label} (${bg.hex})`}
                disabled={disabled}
              />
            ))}
            <input
              type="color"
              value={options.backgroundColor}
              onChange={(e) => handleBgColorChange(e.target.value)}
              disabled={disabled}
              style={{
                width: '22px',
                height: '22px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                padding: 0,
                background: 'transparent',
              }}
              title="Custom Hex Color"
            />
          </div>
        </div>
      )}

      {/* Small informative status badge */}
      {isAuto && detectedMime && (
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Preserves original ({detectedMime})
        </div>
      )}
      {isJpeg && (
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Info size={12} />
          <span>No alpha support (filled with {options.backgroundColor})</span>
        </div>
      )}
      {isGif && (
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <AlertCircle size={12} />
          <span>Static GIF frame</span>
        </div>
      )}
    </div>
  );
}

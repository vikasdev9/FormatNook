'use client';

import React, { useEffect, useState } from 'react';
import { Palette, X, RotateCcw, Check, Sparkles, Sun, Moon } from 'lucide-react';
import {
  JsonColorPalette,
  BuiltInThemeId,
  StoredPalettePreferences,
} from '../types/palette.types';
import {
  BUILT_IN_THEMES,
  validateHexColor,
  normalizeHexColor,
  loadStoredPreferences,
  setActiveThemeId,
  updateCustomColor,
  resetPaletteToDefault,
} from '../services/json-palette-service';

interface JsonColorPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: 'light' | 'dark';
  preferences: StoredPalettePreferences;
  activePalette: JsonColorPalette;
  onPreferencesChange: (newPrefs: StoredPalettePreferences) => void;
}

interface CategoryMeta {
  key: keyof JsonColorPalette;
  label: string;
  example: string;
  description: string;
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'object', label: 'Object', example: '{ }', description: 'Object braces and structural delimiters' },
  { key: 'array', label: 'Array', example: '[ ]', description: 'Array brackets and structural delimiters' },
  { key: 'property', label: 'Property / Key', example: '"name"', description: 'Object property keys' },
  { key: 'string', label: 'String', example: '"Alex"', description: 'String literals and text values' },
  { key: 'number', label: 'Number', example: '101', description: 'Integers, floats, and numeric values' },
  { key: 'boolean', label: 'Boolean', example: 'true, false', description: 'Boolean literals true and false' },
  { key: 'null', label: 'Null', example: 'null', description: 'Null literal value' },
  { key: 'punctuation', label: 'Punctuation', example: ': ,', description: 'Colons and separating commas' },
  { key: 'activeBracket', label: 'Active Bracket', example: 'Matching', description: 'Matching bracket pair highlight' },
  { key: 'selection', label: 'Selection / Focus', example: 'Selected', description: 'Editor text selection highlight' },
];

export function JsonColorPaletteModal({
  isOpen,
  onClose,
  currentTheme,
  preferences,
  activePalette,
  onPreferencesChange,
}: JsonColorPaletteModalProps) {
  const [localHexInputs, setLocalHexInputs] = useState<Record<keyof JsonColorPalette, string>>({
    ...activePalette,
  });

  // Synchronize inputs whenever activePalette or theme changes
  useEffect(() => {
    setLocalHexInputs({ ...activePalette });
  }, [activePalette, currentTheme]);

  // Handle ESC key to close
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

  if (!isOpen) return null;

  const activeThemeId = preferences.activeThemeId[currentTheme];
  const defaultTheme = BUILT_IN_THEMES[0][currentTheme];

  const handleThemeSelect = (themeId: BuiltInThemeId) => {
    const updated = setActiveThemeId(currentTheme, themeId);
    onPreferencesChange(updated);
  };

  const handleColorChange = (key: keyof JsonColorPalette, hex: string) => {
    setLocalHexInputs((prev) => ({ ...prev, [key]: hex }));
    if (validateHexColor(hex)) {
      const normalized = normalizeHexColor(hex);
      const updated = updateCustomColor(currentTheme, key, normalized);
      onPreferencesChange(updated);
    }
  };

  const handleResetSingleColor = (key: keyof JsonColorPalette) => {
    const defaultColor = defaultTheme[key];
    handleColorChange(key, defaultColor);
  };

  const handleResetAllToDefault = () => {
    const updated = resetPaletteToDefault(currentTheme);
    onPreferencesChange(updated);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="json-palette-modal-title"
      data-testid="json-palette-modal"
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="modal-search-header"
          style={{ justifyContent: 'space-between', padding: '1rem 1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
              }}
            >
              <Palette size={17} />
            </div>
            <div>
              <h2
                id="json-palette-modal-title"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                JSON Syntax Color Palette
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.2rem',
                }}
              >
                <span>Live editor preview</span>
                <span>•</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                  }}
                >
                  {currentTheme === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
                  {currentTheme === 'dark' ? 'Dark Palette' : 'Light Palette'}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close color palette modal"
            data-testid="close-palette-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            flex: 1,
          }}
        >
          {/* Theme Preset Selection */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <label
                htmlFor="theme-preset-select"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Built-in Theme Presets
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeThemeId === 'custom' ? 'Customized' : 'Preset active'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                id="theme-preset-select"
                className="select-control"
                value={activeThemeId}
                onChange={(e) => handleThemeSelect(e.target.value as BuiltInThemeId)}
                style={{ flex: 1, minWidth: '200px' }}
                data-testid="palette-theme-select"
              >
                {BUILT_IN_THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
                <option value="custom">Custom (User-Defined)</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetAllToDefault}
                title="Reset active mode palette to FormatNook defaults"
                data-testid="reset-all-palette-btn"
              >
                <RotateCcw size={13} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Syntax Elements Customization Grid */}
          <div>
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.65rem',
              }}
            >
              Syntax Element Colors ({currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'})
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {CATEGORIES.map((cat) => {
                const colorValue = localHexInputs[cat.key] || activePalette[cat.key];
                const isValid = validateHexColor(colorValue);

                return (
                  <div
                    key={cat.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      gap: '0.5rem',
                    }}
                    data-testid={`palette-row-${cat.key}`}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {cat.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card)',
                          color: colorValue,
                          border: '1px solid var(--border-subtle)',
                          fontWeight: 600,
                        }}
                      >
                        {cat.example}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.725rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.3,
                      }}
                    >
                      {cat.description}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: 'auto',
                      }}
                    >
                      {/* Color Picker Swatch */}
                      <label
                        style={{
                          position: 'relative',
                          width: '32px',
                          height: '28px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isValid ? normalizeHexColor(colorValue) : '#cccccc',
                          border: '1px solid var(--border-default)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                          flexShrink: 0,
                        }}
                        title={`Pick ${cat.label} color`}
                      >
                        <input
                          type="color"
                          value={isValid ? normalizeHexColor(colorValue) : '#000000'}
                          onChange={(e) => handleColorChange(cat.key, e.target.value)}
                          style={{
                            position: 'absolute',
                            opacity: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer',
                            inset: 0,
                          }}
                          data-testid={`color-picker-${cat.key}`}
                          aria-label={`${cat.label} color picker`}
                        />
                      </label>

                      {/* HEX Input */}
                      <input
                        type="text"
                        value={colorValue}
                        onChange={(e) => handleColorChange(cat.key, e.target.value)}
                        placeholder="#RRGGBB"
                        maxLength={7}
                        spellCheck={false}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.775rem',
                          padding: '0.25rem 0.5rem',
                          height: '28px',
                          borderRadius: 'var(--radius-sm)',
                          border: isValid
                            ? '1px solid var(--border-default)'
                            : '1px solid var(--color-error)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          width: '84px',
                          textTransform: 'uppercase',
                        }}
                        data-testid={`hex-input-${cat.key}`}
                        aria-label={`${cat.label} HEX color`}
                      />

                      {/* Reset Single Color */}
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleResetSingleColor(cat.key)}
                        title={`Reset ${cat.label} to default`}
                        aria-label={`Reset ${cat.label} to default`}
                        data-testid={`reset-color-${cat.key}`}
                        style={{ padding: '0.25rem', minWidth: '28px', minHeight: '28px' }}
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="modal-search-footer"
          style={{ justifyContent: 'space-between', padding: '0.85rem 1.25rem' }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Changes are saved locally and applied live.
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
            data-testid="palette-done-btn"
          >
            <Check size={14} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonColorPaletteModal } from '../components/JsonColorPaletteModal';
import { BUILT_IN_THEMES, loadStoredPreferences } from '../services/json-palette-service';

describe('JsonColorPaletteModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockPrefs = loadStoredPreferences();
  const mockPalette = BUILT_IN_THEMES[0].dark;

  it('does not render when isOpen is false', () => {
    render(
      <JsonColorPaletteModal
        isOpen={false}
        onClose={vi.fn()}
        currentTheme="dark"
        preferences={mockPrefs}
        activePalette={mockPalette}
        onPreferencesChange={vi.fn()}
      />
    );

    expect(screen.queryByTestId('json-palette-modal')).not.toBeInTheDocument();
  });

  it('renders all 10 syntax element categories when isOpen is true', () => {
    render(
      <JsonColorPaletteModal
        isOpen={true}
        onClose={vi.fn()}
        currentTheme="dark"
        preferences={mockPrefs}
        activePalette={mockPalette}
        onPreferencesChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('json-palette-modal')).toBeInTheDocument();

    const expectedKeys = [
      'object',
      'array',
      'property',
      'string',
      'number',
      'boolean',
      'null',
      'punctuation',
      'activeBracket',
      'selection',
    ];

    expectedKeys.forEach((key) => {
      expect(screen.getByTestId(`palette-row-${key}`)).toBeInTheDocument();
      expect(screen.getByTestId(`hex-input-${key}`)).toBeInTheDocument();
      expect(screen.getByTestId(`color-picker-${key}`)).toBeInTheDocument();
      expect(screen.getByTestId(`reset-color-${key}`)).toBeInTheDocument();
    });
  });

  it('calls onPreferencesChange when built-in theme is switched', () => {
    const onPreferencesChange = vi.fn();
    render(
      <JsonColorPaletteModal
        isOpen={true}
        onClose={vi.fn()}
        currentTheme="dark"
        preferences={mockPrefs}
        activePalette={mockPalette}
        onPreferencesChange={onPreferencesChange}
      />
    );

    const themeSelect = screen.getByTestId('palette-theme-select');
    fireEvent.change(themeSelect, { target: { value: 'dracula' } });

    expect(onPreferencesChange).toHaveBeenCalledTimes(1);
    const updated = onPreferencesChange.mock.calls[0][0];
    expect(updated.activeThemeId.dark).toBe('dracula');
  });

  it('updates custom color and calls onPreferencesChange on valid hex input', () => {
    const onPreferencesChange = vi.fn();
    render(
      <JsonColorPaletteModal
        isOpen={true}
        onClose={vi.fn()}
        currentTheme="dark"
        preferences={mockPrefs}
        activePalette={mockPalette}
        onPreferencesChange={onPreferencesChange}
      />
    );

    const propInput = screen.getByTestId('hex-input-property');
    fireEvent.change(propInput, { target: { value: '#ff5500' } });

    expect(onPreferencesChange).toHaveBeenCalled();
    const updated = onPreferencesChange.mock.calls[onPreferencesChange.mock.calls.length - 1][0];
    expect(updated.custom.dark.property).toBe('#ff5500');
    expect(updated.activeThemeId.dark).toBe('custom');
  });

  it('resets a single category to default on clicking reset button', () => {
    const onPreferencesChange = vi.fn();
    render(
      <JsonColorPaletteModal
        isOpen={true}
        onClose={vi.fn()}
        currentTheme="dark"
        preferences={mockPrefs}
        activePalette={mockPalette}
        onPreferencesChange={onPreferencesChange}
      />
    );

    const resetBtn = screen.getByTestId('reset-color-string');
    fireEvent.click(resetBtn);

    expect(onPreferencesChange).toHaveBeenCalled();
    const updated = onPreferencesChange.mock.calls[onPreferencesChange.mock.calls.length - 1][0];
    expect(updated.custom.dark.string).toBe(BUILT_IN_THEMES[0].dark.string);
  });

  it('resets all categories to default on clicking Reset Defaults button', () => {
    const onPreferencesChange = vi.fn();
    render(
      <JsonColorPaletteModal
        isOpen={true}
        onClose={vi.fn()}
        currentTheme="dark"
        preferences={mockPrefs}
        activePalette={mockPalette}
        onPreferencesChange={onPreferencesChange}
      />
    );

    const resetAllBtn = screen.getByTestId('reset-all-palette-btn');
    fireEvent.click(resetAllBtn);

    expect(onPreferencesChange).toHaveBeenCalled();
    const updated = onPreferencesChange.mock.calls[0][0];
    expect(updated.activeThemeId.dark).toBe('formatnook');
  });

  it('calls onClose when close button or Done button is clicked', () => {
    const onClose = vi.fn();
    render(
      <JsonColorPaletteModal
        isOpen={true}
        onClose={onClose}
        currentTheme="dark"
        preferences={mockPrefs}
        activePalette={mockPalette}
        onPreferencesChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('close-palette-modal-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('palette-done-btn'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <JsonColorPaletteModal
        isOpen={true}
        onClose={onClose}
        currentTheme="dark"
        preferences={mockPrefs}
        activePalette={mockPalette}
        onPreferencesChange={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

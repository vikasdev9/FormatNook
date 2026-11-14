import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BUILT_IN_THEMES,
  validateHexColor,
  normalizeHexColor,
  getDefaultPreferences,
  loadStoredPreferences,
  saveStoredPreferences,
  getEffectivePalette,
  setActiveThemeId,
  updateCustomColor,
  resetPaletteToDefault,
  PALETTE_STORAGE_KEY,
} from '../services/json-palette-service';

describe('JSON Palette Service', () => {
  beforeEach(() => {
    try {
      localStorage.removeItem(PALETTE_STORAGE_KEY);
    } catch {
      // ignore
    }
  });

  it('validates 3 and 6 digit hex colors correctly', () => {
    expect(validateHexColor('#fff')).toBe(true);
    expect(validateHexColor('#FFF')).toBe(true);
    expect(validateHexColor('#38bdf8')).toBe(true);
    expect(validateHexColor('#AABBCC')).toBe(true);

    expect(validateHexColor('')).toBe(false);
    expect(validateHexColor('red')).toBe(false);
    expect(validateHexColor('#12')).toBe(false);
    expect(validateHexColor('#12345')).toBe(false);
    expect(validateHexColor('#gggggg')).toBe(false);
    expect(validateHexColor('38bdf8')).toBe(false);
  });

  it('normalizes 3-character hex to 6-character hex', () => {
    expect(normalizeHexColor('#fff', '#000000')).toBe('#ffffff');
    expect(normalizeHexColor('#38bdf8', '#000000')).toBe('#38bdf8');
    expect(normalizeHexColor('invalid', '#112233')).toBe('#112233');
  });

  it('provides all 7 built-in themes plus custom support', () => {
    const ids = BUILT_IN_THEMES.map((t) => t.id);
    expect(ids).toContain('formatnook');
    expect(ids).toContain('vscode');
    expect(ids).toContain('github');
    expect(ids).toContain('dracula');
    expect(ids).toContain('monokai');
    expect(ids).toContain('solarized');
    expect(ids).toContain('high-contrast');

    BUILT_IN_THEMES.forEach((t) => {
      expect(t.light.property).toBeDefined();
      expect(t.light.string).toBeDefined();
      expect(t.light.number).toBeDefined();
      expect(t.light.boolean).toBeDefined();
      expect(t.light.null).toBeDefined();
      expect(t.light.object).toBeDefined();
      expect(t.light.array).toBeDefined();
      expect(t.light.punctuation).toBeDefined();
      expect(t.light.activeBracket).toBeDefined();
      expect(t.light.selection).toBeDefined();

      expect(t.dark.property).toBeDefined();
      expect(t.dark.string).toBeDefined();
    });
  });

  it('loads and saves preferences in localStorage independently for light and dark modes', () => {
    const def = loadStoredPreferences();
    expect(def.activeThemeId.light).toBe('formatnook');
    expect(def.activeThemeId.dark).toBe('formatnook');

    // Switch light to github and dark to dracula
    setActiveThemeId('light', 'github');
    setActiveThemeId('dark', 'dracula');

    const updated = loadStoredPreferences();
    expect(updated.activeThemeId.light).toBe('github');
    expect(updated.activeThemeId.dark).toBe('dracula');

    const lightPalette = getEffectivePalette('light');
    expect(lightPalette.themeId).toBe('github');

    const darkPalette = getEffectivePalette('dark');
    expect(darkPalette.themeId).toBe('dracula');
  });

  it('allows customizing individual colors and marks activeTheme as custom', () => {
    updateCustomColor('dark', 'property', '#ff00aa');

    const dark = getEffectivePalette('dark');
    expect(dark.themeId).toBe('custom');
    expect(dark.palette.property).toBe('#ff00aa');

    // Light theme should remain untouched
    const light = getEffectivePalette('light');
    expect(light.themeId).toBe('formatnook');
  });

  it('resets active theme to FormatNook defaults cleanly', () => {
    updateCustomColor('light', 'string', '#ff0000');
    expect(getEffectivePalette('light').themeId).toBe('custom');

    resetPaletteToDefault('light');
    const reset = getEffectivePalette('light');
    expect(reset.themeId).toBe('formatnook');
    expect(reset.palette.string).toBe(BUILT_IN_THEMES[0].light.string);
  });

  it('handles localStorage quota exhaustion gracefully without throwing', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    try {
      const saved = saveStoredPreferences(getDefaultPreferences());
      expect(saved).toBe(false);
    } finally {
      setItemSpy.mockRestore();
    }
  });
});

import {
  JsonColorPalette,
  BuiltInThemeId,
  PaletteThemeDefinition,
  StoredPalettePreferences,
} from '../types/palette.types';

export const PALETTE_STORAGE_KEY = 'formatnook_json_color_palette';
export const CURRENT_PALETTE_VERSION = 1;

export const BUILT_IN_THEMES: PaletteThemeDefinition[] = [
  {
    id: 'formatnook',
    name: 'FormatNook Default',
    light: {
      object: '#0369a1',
      array: '#0f766e',
      property: '#0284c7',
      string: '#15803d',
      number: '#b45309',
      boolean: '#be185d',
      null: '#475569',
      punctuation: '#64748b',
      activeBracket: '#0369a1',
      selection: '#bae6fd',
    },
    dark: {
      object: '#38bdf8',
      array: '#2dd4bf',
      property: '#7dd3fc',
      string: '#34d399',
      number: '#fbbf24',
      boolean: '#f472b6',
      null: '#94a3b8',
      punctuation: '#64748b',
      activeBracket: '#38bdf8',
      selection: '#1e3a8a',
    },
  },
  {
    id: 'vscode',
    name: 'VS Code Inspired',
    light: {
      object: '#0451a5',
      array: '#098658',
      property: '#001080',
      string: '#a31515',
      number: '#098658',
      boolean: '#0000ff',
      null: '#0000ff',
      punctuation: '#24292e',
      activeBracket: '#0451a5',
      selection: '#add6ff',
    },
    dark: {
      object: '#4ec9b0',
      array: '#c586c0',
      property: '#9cdcfe',
      string: '#ce9178',
      number: '#b5cea8',
      boolean: '#569cd6',
      null: '#569cd6',
      punctuation: '#d4d4d4',
      activeBracket: '#ffd700',
      selection: '#264f78',
    },
  },
  {
    id: 'github',
    name: 'GitHub Inspired',
    light: {
      object: '#6f42c1',
      array: '#005cc5',
      property: '#24292e',
      string: '#032f62',
      number: '#005cc5',
      boolean: '#d73a49',
      null: '#d73a49',
      punctuation: '#586069',
      activeBracket: '#e36209',
      selection: '#c8e1ff',
    },
    dark: {
      object: '#d2a8ff',
      array: '#79c0ff',
      property: '#c9d1d9',
      string: '#a5d6ff',
      number: '#79c0ff',
      boolean: '#ff7b72',
      null: '#ff7b72',
      punctuation: '#8b949e',
      activeBracket: '#ffa657',
      selection: '#1f6feb',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula Inspired',
    light: {
      object: '#6272a4',
      array: '#0284c7',
      property: '#7c3aed',
      string: '#16a34a',
      number: '#d97706',
      boolean: '#db2777',
      null: '#64748b',
      punctuation: '#475569',
      activeBracket: '#db2777',
      selection: '#e9d5ff',
    },
    dark: {
      object: '#bd93f9',
      array: '#8be9fd',
      property: '#ff79c6',
      string: '#f1fa8c',
      number: '#bd93f9',
      boolean: '#ffb86c',
      null: '#6272a4',
      punctuation: '#f8f8f2',
      activeBracket: '#50fa7b',
      selection: '#44475a',
    },
  },
  {
    id: 'monokai',
    name: 'Monokai Inspired',
    light: {
      object: '#9c27b0',
      array: '#0288d1',
      property: '#e91e63',
      string: '#2e7d32',
      number: '#7b1fa2',
      boolean: '#c2185b',
      null: '#616161',
      punctuation: '#424242',
      activeBracket: '#f57c00',
      selection: '#ffe082',
    },
    dark: {
      object: '#66d9ef',
      array: '#a6e22e',
      property: '#f92672',
      string: '#e6db74',
      number: '#ae81ff',
      boolean: '#ae81ff',
      null: '#75715e',
      punctuation: '#f8f8f2',
      activeBracket: '#fd971f',
      selection: '#49483e',
    },
  },
  {
    id: 'solarized',
    name: 'Solarized Inspired',
    light: {
      object: '#268bd2',
      array: '#2aa198',
      property: '#b58900',
      string: '#859900',
      number: '#d33682',
      boolean: '#cb4b16',
      null: '#93a1a1',
      punctuation: '#586e75',
      activeBracket: '#dc322f',
      selection: '#eee8d5',
    },
    dark: {
      object: '#268bd2',
      array: '#2aa198',
      property: '#b58900',
      string: '#859900',
      number: '#d33682',
      boolean: '#cb4b16',
      null: '#586e75',
      punctuation: '#839496',
      activeBracket: '#dc322f',
      selection: '#073642',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    light: {
      object: '#0000ff',
      array: '#006600',
      property: '#000000',
      string: '#005500',
      number: '#770000',
      boolean: '#880000',
      null: '#333333',
      punctuation: '#000000',
      activeBracket: '#0000ff',
      selection: '#a0c0ff',
    },
    dark: {
      object: '#55ffff',
      array: '#55ff55',
      property: '#ffffff',
      string: '#ffff55',
      number: '#ff55ff',
      boolean: '#ff5555',
      null: '#aaaaaa',
      punctuation: '#ffffff',
      activeBracket: '#ffff55',
      selection: '#0000aa',
    },
  },
];

/**
 * Validates a 3 or 6 digit hex color (e.g. #FFF, #38bdf8).
 */
export function validateHexColor(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * Normalizes a hex color to 6 characters lowercase.
 */
export function normalizeHexColor(hex: string, fallback: string = '#000000'): string {
  if (!validateHexColor(hex)) return fallback;
  const clean = hex.trim().toLowerCase();
  if (clean.length === 4) {
    return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return clean;
}

export function getDefaultPreferences(): StoredPalettePreferences {
  const formatnookTheme = BUILT_IN_THEMES[0];
  return {
    version: CURRENT_PALETTE_VERSION,
    activeThemeId: {
      light: 'formatnook',
      dark: 'formatnook',
    },
    custom: {
      light: { ...formatnookTheme.light },
      dark: { ...formatnookTheme.dark },
    },
  };
}

export function loadStoredPreferences(): StoredPalettePreferences {
  if (typeof window === 'undefined') return getDefaultPreferences();

  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) return getDefaultPreferences();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== CURRENT_PALETTE_VERSION) {
      return getDefaultPreferences();
    }
    return {
      version: CURRENT_PALETTE_VERSION,
      activeThemeId: {
        light: parsed.activeThemeId?.light || 'formatnook',
        dark: parsed.activeThemeId?.dark || 'formatnook',
      },
      custom: {
        light: { ...BUILT_IN_THEMES[0].light, ...parsed.custom?.light },
        dark: { ...BUILT_IN_THEMES[0].dark, ...parsed.custom?.dark },
      },
    };
  } catch {
    return getDefaultPreferences();
  }
}

export function saveStoredPreferences(prefs: StoredPalettePreferences): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(prefs));
    return true;
  } catch (err) {
    console.warn('Failed to save color palette preferences to localStorage:', err);
    return false;
  }
}

/**
 * Retrieves the effective JsonColorPalette for the specified mode ('light' or 'dark').
 */
export function getEffectivePalette(
  mode: 'light' | 'dark',
  prefs: StoredPalettePreferences = loadStoredPreferences()
): { themeId: BuiltInThemeId; palette: JsonColorPalette } {
  const activeId = prefs.activeThemeId[mode];

  if (activeId === 'custom') {
    return {
      themeId: 'custom',
      palette: { ...prefs.custom[mode] },
    };
  }

  const def = BUILT_IN_THEMES.find((t) => t.id === activeId) || BUILT_IN_THEMES[0];
  return {
    themeId: def.id,
    palette: { ...def[mode] },
  };
}

/**
 * Updates the active theme ID for a mode ('light' | 'dark').
 */
export function setActiveThemeId(
  mode: 'light' | 'dark',
  themeId: BuiltInThemeId
): StoredPalettePreferences {
  const current = loadStoredPreferences();
  current.activeThemeId[mode] = themeId;
  saveStoredPreferences(current);
  return current;
}

/**
 * Updates a custom color in the user's custom palette.
 */
export function updateCustomColor(
  mode: 'light' | 'dark',
  key: keyof JsonColorPalette,
  colorHex: string
): StoredPalettePreferences {
  const current = loadStoredPreferences();
  if (validateHexColor(colorHex)) {
    current.custom[mode][key] = colorHex.trim();
    current.activeThemeId[mode] = 'custom';
    saveStoredPreferences(current);
  }
  return current;
}

/**
 * Resets the palette for a specific mode to FormatNook defaults.
 */
export function resetPaletteToDefault(mode: 'light' | 'dark'): StoredPalettePreferences {
  const current = loadStoredPreferences();
  current.activeThemeId[mode] = 'formatnook';
  current.custom[mode] = { ...BUILT_IN_THEMES[0][mode] };
  saveStoredPreferences(current);
  return current;
}

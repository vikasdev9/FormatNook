export interface JsonColorPalette {
  object: string;
  array: string;
  property: string;
  string: string;
  number: string;
  boolean: string;
  null: string;
  punctuation: string;
  activeBracket: string;
  selection: string;
}

export type BuiltInThemeId =
  | 'formatnook'
  | 'vscode'
  | 'github'
  | 'dracula'
  | 'monokai'
  | 'solarized'
  | 'high-contrast'
  | 'custom';

export interface PaletteThemeDefinition {
  id: BuiltInThemeId;
  name: string;
  light: JsonColorPalette;
  dark: JsonColorPalette;
}

export interface StoredPalettePreferences {
  version: number;
  activeThemeId: {
    light: BuiltInThemeId;
    dark: BuiltInThemeId;
  };
  custom: {
    light: JsonColorPalette;
    dark: JsonColorPalette;
  };
}

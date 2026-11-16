/**
 * Central Keyboard Shortcut Registry
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

import { KeyboardShortcut } from '../types/shortcut.types';

export function isMacPlatform(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const nav = navigator as any;
  if (nav.userAgentData?.platform) {
    return /mac/i.test(nav.userAgentData.platform);
  }
  return /macintosh|mac os x/i.test(nav.userAgent || '');
}

/**
 * Format individual key badges for rendering in modals or tooltips.
 */
export function formatShortcutBadges(shortcut: KeyboardShortcut, isMacOverride?: boolean): string[] {
  const isMac = isMacOverride !== undefined ? isMacOverride : isMacPlatform();
  const badges: string[] = [];
  const mods = shortcut.modifiers;

  if (mods) {
    if (mods.ctrlOrCmd) {
      badges.push(isMac ? '⌘' : 'Ctrl');
    } else {
      if (mods.ctrl) badges.push('Ctrl');
      if (mods.meta) badges.push(isMac ? '⌘' : 'Meta');
    }
    if (mods.alt) badges.push(isMac ? '⌥' : 'Alt');
    if (mods.shift) badges.push(isMac ? '⇧' : 'Shift');
  }

  // Format primary key display
  let keyDisplay = shortcut.key;
  if (keyDisplay === 'Escape') keyDisplay = 'Esc';
  else if (keyDisplay === ' ') keyDisplay = 'Space';
  else if (keyDisplay.length === 1) keyDisplay = keyDisplay.toUpperCase();

  badges.push(keyDisplay);
  return badges;
}

/**
 * Format key combo as a single text string (e.g. "Ctrl+Enter" or "⌘+Enter").
 */
export function formatKeyCombo(shortcut: KeyboardShortcut, isMacOverride?: boolean): string {
  const badges = formatShortcutBadges(shortcut, isMacOverride);
  return badges.join(' + ');
}

export const SHORTCUT_REGISTRY: KeyboardShortcut[] = [
  // ==========================================
  // GLOBAL SHORTCUTS
  // ==========================================
  {
    id: 'global-search',
    name: 'Command Menu & Search',
    description: 'Open utility search and command palette',
    key: 'k',
    modifiers: { ctrlOrCmd: true },
    scope: 'global',
    category: 'global',
    allowInInput: true,
  },
  {
    id: 'global-shortcuts',
    name: 'Keyboard Shortcuts Help',
    description: 'Open keyboard shortcuts cheat sheet modal',
    key: '?',
    secondaryKey: '/',
    secondaryModifiers: { ctrlOrCmd: true },
    scope: 'global',
    category: 'global',
    allowInInput: false,
  },
  {
    id: 'global-escape',
    name: 'Close Dialog / Cancel',
    description: 'Close active modal, dropdown, search, or exit fullscreen',
    key: 'Escape',
    scope: 'global',
    category: 'global',
    allowInInput: true,
  },

  // ==========================================
  // JSON WORKSPACE SHORTCUTS
  // ==========================================
  {
    id: 'json-format',
    name: 'Format JSON',
    description: 'Beautify and format JSON with chosen indentation',
    key: 'Enter',
    modifiers: { ctrlOrCmd: true },
    scope: 'workspace',
    category: 'json',
    tool: 'json-beautifier',
    allowInInput: true,
  },
  {
    id: 'json-format-alt',
    name: 'Format Code (VS Code standard)',
    description: 'Beautify JSON with VS Code standard keybinding',
    key: 'F',
    modifiers: { alt: true, shift: true },
    scope: 'workspace',
    category: 'json',
    tool: 'json-beautifier',
    allowInInput: true,
  },
  {
    id: 'json-minify',
    name: 'Minify JSON',
    description: 'Minify JSON payload into compact single-line format',
    key: 'M',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'json',
    tool: 'json-minifier',
    allowInInput: true,
  },
  {
    id: 'json-validate',
    name: 'Validate JSON',
    description: 'Validate JSON syntax, AST structures, and diagnostics',
    key: 'V',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'json',
    tool: 'json-validator',
    allowInInput: true,
  },
  {
    id: 'json-repair',
    name: 'Auto-Repair JSON',
    description: 'Open Auto-Repair preview for malformed JSON syntax',
    key: 'R',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'json',
    tool: 'json-validator',
    allowInInput: true,
  },
  {
    id: 'json-fold',
    name: 'Fold Region',
    description: 'Collapse current JSON object or array at cursor',
    key: '[',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'editor',
    category: 'json',
    allowInInput: true,
  },
  {
    id: 'json-unfold',
    name: 'Unfold Region',
    description: 'Expand current JSON object or array at cursor',
    key: ']',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'editor',
    category: 'json',
    allowInInput: true,
  },
  {
    id: 'json-fold-all',
    name: 'Fold All Regions',
    description: 'Collapse all collapsible regions across the document',
    key: '0',
    modifiers: { ctrlOrCmd: true, alt: true },
    scope: 'editor',
    category: 'json',
    allowInInput: true,
  },
  {
    id: 'json-unfold-all',
    name: 'Unfold All Regions',
    description: 'Expand all collapsed regions across the document',
    key: 'j',
    modifiers: { ctrlOrCmd: true, alt: true },
    scope: 'editor',
    category: 'json',
    allowInInput: true,
  },
  {
    id: 'json-find',
    name: 'Find in Editor',
    description: 'Search text within editor or tree view',
    key: 'f',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'json',
    allowInInput: true,
  },
  {
    id: 'json-replace',
    name: 'Find and Replace',
    description: 'Find and replace text within Monaco editor',
    key: 'h',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'json',
    allowInInput: true,
  },
  {
    id: 'json-undo',
    name: 'Undo Edit',
    description: 'Undo previous editor change',
    key: 'z',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'json',
    allowInInput: true,
  },
  {
    id: 'json-redo',
    name: 'Redo Edit',
    description: 'Redo previously undone editor change',
    key: 'y',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'json',
    allowInInput: true,
  },
  {
    id: 'json-shortcuts',
    name: 'JSON Shortcuts Guide',
    description: 'Open JSON shortcuts reference sheet',
    key: '?',
    secondaryKey: 'F1',
    scope: 'workspace',
    category: 'json',
    allowInInput: false,
  },

  // ==========================================
  // BASE64 WORKSPACE SHORTCUTS
  // ==========================================
  {
    id: 'base64-execute',
    name: 'Execute Encode / Decode',
    description: 'Run Base64 decoding or encoding on current payload',
    key: 'Enter',
    modifiers: { ctrlOrCmd: true },
    scope: 'workspace',
    category: 'base64',
    tool: 'base64',
    allowInInput: true,
  },
  {
    id: 'base64-copy',
    name: 'Copy Output',
    description: 'Copy decoded or encoded output payload to clipboard',
    key: 'C',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'base64',
    tool: 'base64',
    allowInInput: true,
  },
  {
    id: 'base64-clear',
    name: 'Clear Workspace',
    description: 'Clear input and reset workspace state',
    key: 'Backspace',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'base64',
    tool: 'base64',
    allowInInput: true,
  },
  {
    id: 'base64-repair',
    name: 'Repair & Normalize Tab',
    description: 'Switch to Repair & Normalize workspace tab',
    key: 'R',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'base64',
    tool: 'base64',
    allowInInput: true,
  },
  {
    id: 'base64-inspect',
    name: 'Inspector Tab',
    description: 'Switch to Base64 payload inspector tab',
    key: 'I',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'base64',
    tool: 'base64',
    allowInInput: true,
  },
  {
    id: 'base64-shortcuts',
    name: 'Base64 Shortcuts Guide',
    description: 'Open Base64 shortcuts reference sheet',
    key: '?',
    secondaryKey: 'F1',
    scope: 'workspace',
    category: 'base64',
    allowInInput: false,
  },

  // ==========================================
  // YAML WORKSPACE SHORTCUTS
  // ==========================================
  {
    id: 'yaml-format',
    name: 'Format YAML',
    description: 'Beautify and format current YAML document',
    key: 'Enter',
    modifiers: { ctrlOrCmd: true },
    scope: 'workspace',
    category: 'yaml',
    tool: 'yaml-beautifier',
    allowInInput: true,
  },
  {
    id: 'yaml-validate',
    name: 'Validate YAML',
    description: 'Validate YAML syntax and structure diagnostics',
    key: 'V',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'yaml',
    tool: 'yaml-validator',
    allowInInput: true,
  },
  {
    id: 'yaml-minify',
    name: 'Minify YAML',
    description: 'Minify YAML into compact flow-style representation',
    key: 'M',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'yaml',
    tool: 'yaml-beautifier',
    allowInInput: true,
  },
  {
    id: 'yaml-copy',
    name: 'Copy YAML Output',
    description: 'Copy formatted YAML output to clipboard',
    key: 'C',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'yaml',
    tool: 'yaml-beautifier',
    allowInInput: true,
  },
  {
    id: 'yaml-clear',
    name: 'Clear Workspace',
    description: 'Clear YAML editor input',
    key: 'Backspace',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'yaml',
    tool: 'yaml-beautifier',
    allowInInput: true,
  },
  {
    id: 'yaml-shortcuts',
    name: 'YAML Shortcuts Guide',
    description: 'Open YAML shortcuts reference sheet',
    key: '?',
    secondaryKey: 'F1',
    scope: 'workspace',
    category: 'yaml',
    allowInInput: false,
  },

  // ==========================================
  // XML WORKSPACE SHORTCUTS
  // ==========================================
  {
    id: 'xml-format',
    name: 'Format XML',
    description: 'Beautify and format XML markup with indentation',
    key: 'Enter',
    modifiers: { ctrlOrCmd: true },
    scope: 'workspace',
    category: 'xml',
    tool: 'xml-beautifier',
    allowInInput: true,
  },
  {
    id: 'xml-validate',
    name: 'Validate XML',
    description: 'Validate XML syntax and tag matching',
    key: 'V',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'xml',
    tool: 'xml-validator',
    allowInInput: true,
  },
  {
    id: 'xml-minify',
    name: 'Minify XML',
    description: 'Minify XML document by stripping whitespace',
    key: 'M',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'xml',
    tool: 'xml-minifier',
    allowInInput: true,
  },
  {
    id: 'xml-xpath',
    name: 'XPath Explorer',
    description: 'Open XPath expression query dialog',
    key: 'X',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'xml',
    tool: 'xml-beautifier',
    allowInInput: true,
  },
  {
    id: 'xml-copy',
    name: 'Copy XML Output',
    description: 'Copy formatted XML output to clipboard',
    key: 'C',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'xml',
    tool: 'xml-beautifier',
    allowInInput: true,
  },
  {
    id: 'xml-clear',
    name: 'Clear Workspace',
    description: 'Clear XML editor input',
    key: 'Backspace',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'xml',
    tool: 'xml-beautifier',
    allowInInput: true,
  },
  {
    id: 'xml-shortcuts',
    name: 'XML Shortcuts Guide',
    description: 'Open XML shortcuts reference sheet',
    key: '?',
    secondaryKey: 'F1',
    scope: 'workspace',
    category: 'xml',
    allowInInput: false,
  },

  // ==========================================
  // DIFF CHECKER SHORTCUTS
  // ==========================================
  {
    id: 'diff-compare',
    name: 'Compare Texts',
    description: 'Recompute side-by-side or inline text diff',
    key: 'Enter',
    modifiers: { ctrlOrCmd: true },
    scope: 'workspace',
    category: 'diff',
    tool: 'diff-checker',
    allowInInput: true,
  },
  {
    id: 'diff-swap',
    name: 'Swap Left & Right',
    description: 'Swap original and modified text inputs',
    key: 'S',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'diff',
    tool: 'diff-checker',
    allowInInput: true,
  },
  {
    id: 'diff-copy',
    name: 'Copy Diff Result',
    description: 'Copy unified diff text to clipboard',
    key: 'C',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'diff',
    tool: 'diff-checker',
    allowInInput: true,
  },
  {
    id: 'diff-clear',
    name: 'Clear Diff Inputs',
    description: 'Clear both original and modified inputs',
    key: 'Backspace',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'diff',
    tool: 'diff-checker',
    allowInInput: true,
  },
  {
    id: 'diff-shortcuts',
    name: 'Diff Shortcuts Guide',
    description: 'Open Diff Checker shortcuts reference sheet',
    key: '?',
    secondaryKey: 'F1',
    scope: 'workspace',
    category: 'diff',
    allowInInput: false,
  },

  // ==========================================
  // BEAUTIFIERS SHORTCUTS
  // ==========================================
  {
    id: 'beautifier-format',
    name: 'Format Code',
    description: 'Beautify HTML, CSS, JavaScript or SQL code',
    key: 'Enter',
    modifiers: { ctrlOrCmd: true },
    scope: 'workspace',
    category: 'beautifiers',
    allowInInput: true,
  },
  {
    id: 'beautifier-minify',
    name: 'Minify Code',
    description: 'Minify code for supported languages',
    key: 'M',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'beautifiers',
    allowInInput: true,
  },
  {
    id: 'beautifier-copy',
    name: 'Copy Formatted Output',
    description: 'Copy beautified output to clipboard',
    key: 'C',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'beautifiers',
    allowInInput: true,
  },
  {
    id: 'beautifier-clear',
    name: 'Clear Code Workspace',
    description: 'Clear input and output code editors',
    key: 'Backspace',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'workspace',
    category: 'beautifiers',
    allowInInput: true,
  },
  {
    id: 'beautifier-shortcuts',
    name: 'Beautifiers Shortcuts Guide',
    description: 'Open Beautifiers shortcuts reference sheet',
    key: '?',
    secondaryKey: 'F1',
    scope: 'workspace',
    category: 'beautifiers',
    allowInInput: false,
  },

  // ==========================================
  // EDITOR SHORTCUTS
  // ==========================================
  {
    id: 'editor-undo',
    name: 'Undo',
    description: 'Undo previous character or block modification',
    key: 'z',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'editor',
    allowInInput: true,
  },
  {
    id: 'editor-redo',
    name: 'Redo',
    description: 'Redo previously undone modification',
    key: 'y',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'editor',
    allowInInput: true,
  },
  {
    id: 'editor-select-all',
    name: 'Select All',
    description: 'Select all text within the active editor',
    key: 'a',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'editor',
    allowInInput: true,
  },
  {
    id: 'editor-find',
    name: 'Find Text',
    description: 'Open the find bar in the active editor',
    key: 'f',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'editor',
    allowInInput: true,
  },
  {
    id: 'editor-replace',
    name: 'Replace Text',
    description: 'Open the find and replace bar in Monaco editor',
    key: 'h',
    modifiers: { ctrlOrCmd: true },
    scope: 'editor',
    category: 'editor',
    allowInInput: true,
  },
  {
    id: 'editor-fold',
    name: 'Fold Block',
    description: 'Collapse the code region at cursor',
    key: '[',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'editor',
    category: 'editor',
    allowInInput: true,
  },
  {
    id: 'editor-unfold',
    name: 'Unfold Block',
    description: 'Expand the collapsed code region at cursor',
    key: ']',
    modifiers: { ctrlOrCmd: true, shift: true },
    scope: 'editor',
    category: 'editor',
    allowInInput: true,
  },
];

/**
 * Retrieve all shortcuts filtered by category or scope.
 */
export function getShortcutsByCategory(category?: string): KeyboardShortcut[] {
  if (!category || category === 'all') {
    return [...SHORTCUT_REGISTRY];
  }
  return SHORTCUT_REGISTRY.filter((s) => s.category === category);
}

/**
 * Retrieve a specific shortcut by ID from registry.
 */
export function getShortcutById(id: string): KeyboardShortcut | undefined {
  return SHORTCUT_REGISTRY.find((s) => s.id === id);
}

/**
 * Keyboard Shortcuts Type Definitions
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

export type ShortcutScope = 'global' | 'workspace' | 'editor' | 'modal';

export type ShortcutCategory =
  | 'global'
  | 'json'
  | 'base64'
  | 'yaml'
  | 'xml'
  | 'diff'
  | 'beautifiers'
  | 'editor';

export interface ShortcutModifiers {
  /** Explicit Control key */
  ctrl?: boolean;
  /** Explicit Meta (Command / Windows) key */
  meta?: boolean;
  /** Shift key */
  shift?: boolean;
  /** Alt / Option key */
  alt?: boolean;
  /** Platform-adaptive: Ctrl on Windows/Linux, Meta (Cmd) on macOS */
  ctrlOrCmd?: boolean;
}

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut (e.g. 'json-format', 'global-search') */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Detailed description of the shortcut action */
  description: string;
  /** Primary key name (e.g. 'Enter', 'k', 'v', 'm', 'c', '?', 'Escape', '[', ']') */
  key: string;
  /** Modifiers required for the primary key */
  modifiers?: ShortcutModifiers;
  /** Optional secondary key (e.g. 'F1' as secondary for '?') */
  secondaryKey?: string;
  /** Modifiers for the secondary key */
  secondaryModifiers?: ShortcutModifiers;
  /** Operational scope */
  scope: ShortcutScope;
  /** Category for documentation and modal grouping */
  category: ShortcutCategory;
  /** Specific tool slug if restricted to a single tool */
  tool?: string;
  /** Whether the shortcut is currently enabled */
  enabled?: boolean;
  /** If true, the shortcut will fire even if the focused element is an input, textarea, or editor */
  allowInInput?: boolean;
  /** Action handler callback (bound dynamically by workspace or hook) */
  action?: () => void;
}

export interface ModalEntry {
  id: string;
  onClose: () => void;
  triggerElement?: HTMLElement | null;
}

export interface ShortcutMatchEvent {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target?: EventTarget | null;
  defaultPrevented?: boolean;
}

export interface ShortcutManagerOptions {
  /** Custom platform override (useful for testing macOS behavior on Windows) */
  isMac?: boolean;
  /** Callback for when an unhandled shortcut error occurs */
  onError?: (error: Error, shortcutId: string) => void;
}

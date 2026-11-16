/**
 * Central Shortcut Manager Service
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

import {
  KeyboardShortcut,
  ModalEntry,
  ShortcutCategory,
  ShortcutManagerOptions,
  ShortcutMatchEvent,
  ShortcutScope,
} from '../types/shortcut.types';
import { SHORTCUT_REGISTRY, isMacPlatform } from '../config/shortcut-registry';

export function isTypingInInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toUpperCase();
  if (tagName === 'INPUT') {
    const inputType = (target as HTMLInputElement).type?.toLowerCase();
    const nonTextTypes = ['button', 'checkbox', 'radio', 'submit', 'reset', 'file', 'color', 'range'];
    if (nonTextTypes.includes(inputType)) {
      return false;
    }
    return true;
  }

  if (tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  if (
    target.isContentEditable ||
    target.contentEditable === 'true' ||
    target.getAttribute?.('contenteditable') === 'true'
  ) {
    return true;
  }

  // Monaco editor input text area or editor container
  if (target.closest('.monaco-editor') || target.classList.contains('inputarea')) {
    return true;
  }

  return false;
}

export class ShortcutManager {
  private bindings = new Map<string, () => void>();
  private customShortcuts = new Map<string, KeyboardShortcut>();
  private modalStack: ModalEntry[] = [];
  private activeCategories = new Set<ShortcutCategory>(['global', 'editor']);
  private isMac: boolean;
  private isListening = false;
  private onError?: (error: Error, shortcutId: string) => void;

  constructor(options?: ShortcutManagerOptions) {
    this.isMac = options?.isMac !== undefined ? options.isMac : isMacPlatform();
    this.onError = options?.onError;
  }

  public setPlatform(isMac: boolean) {
    this.isMac = isMac;
  }

  public getIsMac(): boolean {
    return this.isMac;
  }

  /**
   * Register a custom shortcut or override an existing one.
   */
  public register(shortcut: KeyboardShortcut, action?: () => void) {
    this.customShortcuts.set(shortcut.id, shortcut);
    if (action) {
      this.bindings.set(shortcut.id, action);
    }
  }

  /**
   * Unregister a custom shortcut.
   */
  public unregister(id: string) {
    this.customShortcuts.delete(id);
    this.bindings.delete(id);
  }

  /**
   * Bind an action callback to a registered shortcut ID.
   */
  public bindAction(id: string, action: () => void) {
    this.bindings.set(id, action);
  }

  /**
   * Unbind an action callback.
   */
  public unbindAction(id: string) {
    this.bindings.delete(id);
  }

  /**
   * Batch bind actions.
   */
  public bindActions(actions: Record<string, () => void>) {
    for (const [id, action] of Object.entries(actions)) {
      this.bindings.set(id, action);
    }
  }

  /**
   * Batch unbind actions.
   */
  public unbindActions(ids: string[]) {
    for (const id of ids) {
      this.bindings.delete(id);
    }
  }

  /**
   * Enable or disable an active category (e.g. 'json', 'yaml', etc.).
   */
  public setActiveCategory(category: ShortcutCategory, active = true) {
    if (active) {
      this.activeCategories.add(category);
    } else {
      this.activeCategories.delete(category);
    }
  }

  public getActiveCategories(): Set<ShortcutCategory> {
    return new Set(this.activeCategories);
  }

  /**
   * Modal Stack Management (LIFO - Topmost closes first on Escape).
   */
  public pushModal(id: string, onClose: () => void, triggerElement?: HTMLElement | null) {
    // Avoid duplicate pushing of same modal ID
    this.modalStack = this.modalStack.filter((m) => m.id !== id);
    this.modalStack.push({ id, onClose, triggerElement });
  }

  public popModal(id: string) {
    const idx = this.modalStack.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const [removed] = this.modalStack.splice(idx, 1);
      if (removed.triggerElement && typeof removed.triggerElement.focus === 'function') {
        try {
          removed.triggerElement.focus();
        } catch {
          // ignore focus errors
        }
      }
    }
  }

  public isModalActive(): boolean {
    return this.modalStack.length > 0;
  }

  public getTopModal(): ModalEntry | undefined {
    return this.modalStack[this.modalStack.length - 1];
  }

  public getModalStackCount(): number {
    return this.modalStack.length;
  }

  /**
   * Match an incoming keyboard event against registered shortcuts.
   */
  public matchEvent(e: KeyboardEvent | ShortcutMatchEvent): KeyboardShortcut | null {
    const isTyping = isTypingInInput(e.target || null);
    const hasModal = this.isModalActive();

    // Collect all candidates: custom shortcuts take precedence over registry
    const allShortcuts: KeyboardShortcut[] = [
      ...Array.from(this.customShortcuts.values()),
      ...SHORTCUT_REGISTRY.filter((s) => !this.customShortcuts.has(s.id)),
    ];

    for (const shortcut of allShortcuts) {
      if (shortcut.enabled === false) continue;

      // When modal is active: only allow modal scope, escape, or toggling active modal (e.g. Ctrl+K on command menu)
      if (
        hasModal &&
        shortcut.scope !== 'modal' &&
        shortcut.key !== 'Escape' &&
        !(shortcut.id === 'global-search' && this.getTopModal()?.id === 'command-menu')
      ) {
        continue;
      }

      // Check if shortcut category is active or if explicit binding exists
      const hasBinding = this.bindings.has(shortcut.id) || Boolean(shortcut.action);
      if (!hasBinding) continue;

      if (shortcut.scope === 'workspace' && !this.activeCategories.has(shortcut.category)) {
        continue;
      }

      // Input protection: if typing in input, disallow shortcuts unless allowInInput is true
      if (isTyping && !shortcut.allowInInput) {
        continue;
      }

      // Check primary key combination
      if (this.matchesCombination(e, shortcut.key, shortcut.modifiers)) {
        return shortcut;
      }

      // Check secondary key combination if defined
      if (shortcut.secondaryKey && this.matchesCombination(e, shortcut.secondaryKey, shortcut.secondaryModifiers)) {
        return shortcut;
      }
    }

    return null;
  }

  private matchesCombination(
    e: KeyboardEvent | ShortcutMatchEvent,
    key: string,
    modifiers?: KeyboardShortcut['modifiers']
  ): boolean {
    // Key match
    const eventKey = e.key;
    const targetKey = key;

    const keyMatches =
      targetKey.length === 1
        ? eventKey.toLowerCase() === targetKey.toLowerCase()
        : eventKey.toLowerCase() === targetKey.toLowerCase() ||
          (targetKey === 'Escape' && eventKey === 'Esc');

    if (!keyMatches) return false;

    // Modifiers matching
    const mods = modifiers || {};

    // CtrlOrCmd check
    if (mods.ctrlOrCmd) {
      if (this.isMac) {
        if (!e.metaKey || e.ctrlKey) return false;
      } else {
        if (!e.ctrlKey || e.metaKey) return false;
      }
    } else {
      const expectedCtrl = Boolean(mods.ctrl);
      const expectedMeta = Boolean(mods.meta);
      if (Boolean(e.ctrlKey) !== expectedCtrl) return false;
      if (Boolean(e.metaKey) !== expectedMeta) return false;
    }

    // Shift check
    const expectedShift = Boolean(mods.shift);
    if (Boolean(e.shiftKey) !== expectedShift) return false;

    // Alt check
    const expectedAlt = Boolean(mods.alt);
    if (Boolean(e.altKey) !== expectedAlt) return false;

    return true;
  }

  /**
   * Main keyboard event handler.
   * Returns true if a shortcut was executed, false otherwise.
   */
  public handleKeyDown = (e: KeyboardEvent | ShortcutMatchEvent): boolean => {
    // 1. Handle Escape key for modal stack first (topmost modal closes)
    if (e.key === 'Escape' && this.modalStack.length > 0) {
      const topModal = this.modalStack.pop();
      if (topModal) {
        if (typeof (e as KeyboardEvent).preventDefault === 'function') {
          (e as KeyboardEvent).preventDefault();
        }
        try {
          topModal.onClose();
          if (topModal.triggerElement && typeof topModal.triggerElement.focus === 'function') {
            topModal.triggerElement.focus();
          }
        } catch (err: any) {
          this.onError?.(err, 'modal-close');
        }
        return true;
      }
    }

    // 2. Find matching shortcut
    const matched = this.matchEvent(e);
    if (!matched) return false;

    // 3. Find registered action
    const action = this.bindings.get(matched.id) || matched.action;
    if (!action) return false;

    // 4. Prevent default browser action
    if (typeof (e as KeyboardEvent).preventDefault === 'function') {
      (e as KeyboardEvent).preventDefault();
    }

    // 5. Execute action safely
    try {
      action();
      return true;
    } catch (err: any) {
      this.onError?.(err, matched.id);
      return false;
    }
  };

  /**
   * Start listening to global window keydown events.
   */
  public startListening() {
    if (this.isListening || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown);
    this.isListening = true;
  }

  /**
   * Stop listening to global window keydown events.
   */
  public stopListening() {
    if (!this.isListening || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    this.isListening = false;
  }

  /**
   * Reset all state (useful in test teardown).
   */
  public reset() {
    this.bindings.clear();
    this.customShortcuts.clear();
    this.modalStack = [];
    this.activeCategories = new Set<ShortcutCategory>(['global', 'editor']);
    this.stopListening();
  }
}

// Global Singleton Instance
export const shortcutManager = new ShortcutManager();
if (typeof window !== 'undefined') {
  shortcutManager.startListening();
}

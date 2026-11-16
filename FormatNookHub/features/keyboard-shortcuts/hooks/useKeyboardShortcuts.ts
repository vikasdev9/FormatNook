/**
 * Keyboard Shortcuts React Hooks
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

'use client';

import { useEffect, useRef } from 'react';
import { shortcutManager } from '../services/shortcut-manager';
import { ShortcutCategory, ShortcutScope } from '../types/shortcut.types';

export interface UseKeyboardShortcutsOptions {
  scope?: ShortcutScope;
  category?: ShortcutCategory;
  bindings?: Record<string, () => void>;
  disabled?: boolean;
}

/**
 * Hook to bind shortcuts to a workspace or component with zero stale closures.
 */
export function useKeyboardShortcuts({
  category,
  bindings,
  disabled = false,
}: UseKeyboardShortcutsOptions) {
  const bindingsRef = useRef<Record<string, () => void>>(bindings || {});
  bindingsRef.current = bindings || {};

  useEffect(() => {
    if (disabled || !bindings) return;

    // Enable active category
    if (category) {
      shortcutManager.setActiveCategory(category, true);
    }

    // Bind proxy handlers that always delegate to latest ref
    const boundIds: string[] = [];
    for (const id of Object.keys(bindings)) {
      boundIds.push(id);
      shortcutManager.bindAction(id, () => {
        const handler = bindingsRef.current[id];
        if (handler) {
          handler();
        }
      });
    }

    return () => {
      shortcutManager.unbindActions(boundIds);
      if (category) {
        shortcutManager.setActiveCategory(category, false);
      }
    };
  }, [category, disabled]);
}

/**
 * Hook to register a dialog with the modal stack (LIFO Escape handling & focus restoration).
 */
export function useModalShortcuts(
  modalId: string,
  isOpen: boolean,
  onClose: () => void,
  triggerElement?: HTMLElement | null
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      shortcutManager.popModal(modalId);
      return;
    }

    shortcutManager.pushModal(
      modalId,
      () => onCloseRef.current(),
      triggerElement
    );

    return () => {
      shortcutManager.popModal(modalId);
    };
  }, [modalId, isOpen, triggerElement]);
}

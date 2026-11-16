import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShortcutManager, isTypingInInput } from '../services/shortcut-manager';
import { KeyboardShortcut } from '../types/shortcut.types';

describe('ShortcutManager Unit Tests', () => {
  let manager: ShortcutManager;

  beforeEach(() => {
    manager = new ShortcutManager({ isMac: false });
  });

  describe('Modifier Matching & Platform Adaptation', () => {
    it('matches Ctrl+Enter on Windows/Linux', () => {
      const formatFn = vi.fn();
      manager.bindAction('json-format', formatFn);
      manager.setActiveCategory('json', true);

      const event = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      const handled = manager.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(formatFn).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does NOT match Ctrl+Enter if metaKey is pressed on Windows', () => {
      const formatFn = vi.fn();
      manager.bindAction('json-format', formatFn);
      manager.setActiveCategory('json', true);

      const event = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: true,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      const handled = manager.handleKeyDown(event);
      expect(handled).toBe(false);
      expect(formatFn).not.toHaveBeenCalled();
    });

    it('matches Cmd+Enter on macOS when isMac is true', () => {
      const macManager = new ShortcutManager({ isMac: true });
      const formatFn = vi.fn();
      macManager.bindAction('json-format', formatFn);
      macManager.setActiveCategory('json', true);

      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      const handled = macManager.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(formatFn).toHaveBeenCalledTimes(1);
    });

    it('matches exact modifier combinations (e.g. Ctrl+Shift+V without extra modifiers)', () => {
      const validateFn = vi.fn();
      manager.bindAction('json-validate', validateFn);
      manager.setActiveCategory('json', true);

      // Matching: Ctrl + Shift + V
      const validEvent = {
        key: 'V',
        ctrlKey: true,
        metaKey: false,
        shiftKey: true,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      expect(manager.handleKeyDown(validEvent)).toBe(true);
      expect(validateFn).toHaveBeenCalledTimes(1);

      // Non-matching: Ctrl + V without Shift should NOT trigger json-validate
      const invalidEvent = {
        key: 'V',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      expect(manager.handleKeyDown(invalidEvent)).toBe(false);
      expect(validateFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input Focus Protection', () => {
    it('identifies input elements correctly via isTypingInInput', () => {
      const textInput = document.createElement('input');
      textInput.type = 'text';
      expect(isTypingInInput(textInput)).toBe(true);

      const textarea = document.createElement('textarea');
      expect(isTypingInInput(textarea)).toBe(true);

      const select = document.createElement('select');
      expect(isTypingInInput(select)).toBe(true);

      const button = document.createElement('input');
      button.type = 'button';
      expect(isTypingInInput(button)).toBe(false);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      expect(isTypingInInput(checkbox)).toBe(false);

      const div = document.createElement('div');
      expect(isTypingInInput(div)).toBe(false);

      div.contentEditable = 'true';
      expect(isTypingInInput(div)).toBe(true);
    });

    it('blocks single-character shortcuts like ? or f when typing in an input', () => {
      const helpFn = vi.fn();
      manager.bindAction('global-shortcuts', helpFn);

      const input = document.createElement('input');
      input.type = 'text';

      const typingEvent = {
        key: '?',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: input,
        preventDefault: vi.fn(),
      } as any;

      const handled = manager.handleKeyDown(typingEvent);
      expect(handled).toBe(false);
      expect(helpFn).not.toHaveBeenCalled();
      expect(typingEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('allows modifier shortcuts with allowInInput: true while typing in an editor', () => {
      const formatFn = vi.fn();
      manager.bindAction('json-format', formatFn);
      manager.setActiveCategory('json', true);

      const textarea = document.createElement('textarea');

      const editorFormatEvent = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: textarea,
        preventDefault: vi.fn(),
      } as any;

      const handled = manager.handleKeyDown(editorFormatEvent);
      expect(handled).toBe(true);
      expect(formatFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modal Stack & Escape Handling', () => {
    it('manages modal stack in LIFO order and closes topmost modal first on Escape', () => {
      const modal1Close = vi.fn();
      const modal2Close = vi.fn();

      manager.pushModal('modal-1', modal1Close);
      manager.pushModal('modal-2', modal2Close);

      expect(manager.getModalStackCount()).toBe(2);
      expect(manager.isModalActive()).toBe(true);

      // Press Escape once
      const escapeEvent1 = {
        key: 'Escape',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      manager.handleKeyDown(escapeEvent1);
      expect(modal2Close).toHaveBeenCalledTimes(1);
      expect(modal1Close).not.toHaveBeenCalled();
      expect(manager.getModalStackCount()).toBe(1);

      // Press Escape second time
      const escapeEvent2 = {
        key: 'Escape',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      manager.handleKeyDown(escapeEvent2);
      expect(modal1Close).toHaveBeenCalledTimes(1);
      expect(manager.getModalStackCount()).toBe(0);
      expect(manager.isModalActive()).toBe(false);
    });

    it('restores focus to triggerElement when modal is popped', () => {
      const triggerButton = document.createElement('button');
      triggerButton.focus = vi.fn();

      const modalClose = vi.fn();
      manager.pushModal('test-modal', modalClose, triggerButton);

      manager.popModal('test-modal');
      expect(triggerButton.focus).toHaveBeenCalledTimes(1);
    });

    it('blocks workspace shortcuts while a modal is active', () => {
      const formatFn = vi.fn();
      manager.bindAction('json-format', formatFn);
      manager.setActiveCategory('json', true);

      manager.pushModal('active-dialog', vi.fn());

      const formatEvent = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      const handled = manager.handleKeyDown(formatEvent);
      expect(handled).toBe(false);
      expect(formatFn).not.toHaveBeenCalled();
    });
  });

  describe('Workspace Scope and Categories', () => {
    it('does not execute workspace shortcut if category is inactive', () => {
      const formatFn = vi.fn();
      manager.bindAction('json-format', formatFn);
      // Category 'json' is NOT active
      manager.setActiveCategory('json', false);

      const event = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      const handled = manager.handleKeyDown(event);
      expect(handled).toBe(false);
      expect(formatFn).not.toHaveBeenCalled();
    });

    it('executes global shortcut regardless of active workspace category', () => {
      const searchFn = vi.fn();
      manager.bindAction('global-search', searchFn);

      const event = {
        key: 'k',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      const handled = manager.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(searchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Shortcut Registration & Disabling', () => {
    it('allows registering custom shortcuts and unregistering them', () => {
      const customAction = vi.fn();
      const customShortcut: KeyboardShortcut = {
        id: 'custom-action',
        name: 'Custom Action',
        description: 'Test custom action',
        key: 'p',
        modifiers: { ctrlOrCmd: true, alt: true },
        scope: 'global',
        category: 'global',
        action: customAction,
      };

      manager.register(customShortcut);

      const event = {
        key: 'p',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: true,
        preventDefault: vi.fn(),
      } as any;

      expect(manager.handleKeyDown(event)).toBe(true);
      expect(customAction).toHaveBeenCalledTimes(1);

      // Unregister
      manager.unregister('custom-action');
      expect(manager.handleKeyDown(event)).toBe(false);
      expect(customAction).toHaveBeenCalledTimes(1);
    });

    it('does not execute disabled shortcuts', () => {
      const disabledAction = vi.fn();
      const disabledShortcut: KeyboardShortcut = {
        id: 'disabled-action',
        name: 'Disabled Action',
        description: 'Should not fire',
        key: 'd',
        modifiers: { ctrlOrCmd: true },
        scope: 'global',
        category: 'global',
        enabled: false,
        action: disabledAction,
      };

      manager.register(disabledShortcut);

      const event = {
        key: 'd',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as any;

      expect(manager.handleKeyDown(event)).toBe(false);
      expect(disabledAction).not.toHaveBeenCalled();
    });
  });
});

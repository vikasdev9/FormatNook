'use client';

import React from 'react';
import { KeyboardShortcutsModal } from '@/features/keyboard-shortcuts';

interface JsonShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JsonShortcutsModal({ isOpen, onClose }: JsonShortcutsModalProps) {
  return (
    <KeyboardShortcutsModal
      isOpen={isOpen}
      onClose={onClose}
      initialCategory="json"
      testId="json-shortcuts-modal"
    />
  );
}

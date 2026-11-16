'use client';

import React from 'react';
import { KeyboardShortcutsModal } from '@/features/keyboard-shortcuts';

interface YamlShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YamlShortcutsModal({ isOpen, onClose }: YamlShortcutsModalProps) {
  return (
    <KeyboardShortcutsModal
      isOpen={isOpen}
      onClose={onClose}
      initialCategory="yaml"
      testId="yaml-shortcuts-modal"
    />
  );
}

'use client';

import React from 'react';
import { KeyboardShortcutsModal } from '@/features/keyboard-shortcuts';

interface XmlShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function XmlShortcutsModal({ isOpen, onClose }: XmlShortcutsModalProps) {
  return (
    <KeyboardShortcutsModal
      isOpen={isOpen}
      onClose={onClose}
      initialCategory="xml"
      testId="xml-shortcuts-modal"
    />
  );
}

'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function CopyButton({ text, label = 'Copy', className = 'btn btn-secondary btn-sm', disabled = false }: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  return (
    <button
      className={className}
      onClick={() => copy(text)}
      disabled={disabled || !text}
      title={copied ? 'Copied to clipboard' : 'Copy content'}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}

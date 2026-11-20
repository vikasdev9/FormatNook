'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

interface ResetButtonProps {
  onReset: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

export function ResetButton({
  onReset,
  label = 'Clear',
  className = 'btn btn-ghost btn-sm',
  disabled = false,
  'data-testid': dataTestId = 'btn-reset',
}: ResetButtonProps) {
  return (
    <button
      className={className}
      onClick={onReset}
      disabled={disabled}
      title="Clear editor contents"
      aria-label="Clear contents"
      data-testid={dataTestId}
    >
      <Trash2 size={14} />
      {label && <span>{label}</span>}
    </button>
  );
}

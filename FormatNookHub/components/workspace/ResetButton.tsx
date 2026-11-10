'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

interface ResetButtonProps {
  onReset: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ResetButton({ onReset, label = 'Clear', className = 'btn btn-ghost btn-sm', disabled = false }: ResetButtonProps) {
  return (
    <button
      className={className}
      onClick={onReset}
      disabled={disabled}
      title="Clear editor contents"
      aria-label="Clear contents"
    >
      <Trash2 size={14} />
      {label && <span>{label}</span>}
    </button>
  );
}

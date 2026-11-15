'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { SharePayload } from '@/features/shared/types/share.types';
import { ShareDialog } from './ShareDialog';

interface ShareButtonProps {
  getPayload: () => SharePayload | null;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function ShareButton({
  getPayload,
  disabled = false,
  className = 'btn btn-secondary btn-sm',
  label = 'Share',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activePayload, setActivePayload] = useState<SharePayload | null>(null);

  const handleClick = () => {
    const payload = getPayload();
    if (!payload || payload.options.length === 0) return;
    setActivePayload(payload);
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={disabled}
        aria-haspopup="dialog"
        title="Share or export output in multiple formats"
        aria-label="Share output"
        data-testid="btn-share-output"
      >
        <Share2 size={14} />
        {label && <span>{label}</span>}
      </button>

      {isOpen && (
        <ShareDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          payload={activePayload}
        />
      )}
    </>
  );
}

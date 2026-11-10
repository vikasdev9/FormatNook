'use client';

import { useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    }
    return success;
  };

  return { copied, copy };
}

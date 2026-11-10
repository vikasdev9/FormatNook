'use client';

import React from 'react';
import Link from 'next/link';

interface ToolModeTabsProps {
  currentSlug: string;
  pairedSlug?: string;
  pairedName?: string;
  activeDirection: 'encode' | 'decode';
}

export function ToolModeTabs({ currentSlug, pairedSlug, pairedName, activeDirection }: ToolModeTabsProps) {
  if (!pairedSlug || !pairedName) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <button
        className={`btn btn-sm ${activeDirection === 'encode' ? 'btn-primary' : 'btn-secondary'}`}
        disabled={activeDirection === 'encode'}
        style={{ cursor: activeDirection === 'encode' ? 'default' : 'pointer' }}
      >
        <span>Encoder Mode</span>
      </button>

      <Link
        href={`/tools/${pairedSlug}`}
        className={`btn btn-sm ${activeDirection === 'decode' ? 'btn-primary' : 'btn-secondary'}`}
      >
        <span>Switch to {pairedName}</span>
      </Link>
    </div>
  );
}

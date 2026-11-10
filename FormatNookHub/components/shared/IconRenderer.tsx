'use client';

import React from 'react';
import * as Icons from 'lucide-react';

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export function IconRenderer({ name, size = 20, className }: IconRendererProps) {
  // @ts-expect-error Lucide icons index
  const IconComponent = Icons[name] || Icons.Wrench;
  return <IconComponent size={size} className={className} />;
}

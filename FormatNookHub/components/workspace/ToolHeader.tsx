'use client';

import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import { ToolDefinition } from '@/types/tool';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { useToolHistory } from '@/hooks/useToolHistory';

interface ToolHeaderProps {
  tool: ToolDefinition;
}

export function ToolHeader({ tool }: ToolHeaderProps) {
  const { isFavorite, toggleFavorite } = useToolHistory(tool.id);

  return (
    <header className="tool-header">
      <div className="tool-header-top">
        <div className="tool-header-meta">
          <div className="tool-header-icon">
            <IconRenderer name={tool.icon} size={28} />
          </div>
          <div className="tool-header-title-wrap">
            <h1 className="tool-title">
              {tool.name}
              <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
                {tool.category.toUpperCase()}
              </span>
            </h1>
            <p className="tool-subtitle">{tool.description}</p>
          </div>
        </div>

        <div className="tool-header-actions">
          <button
            className={`btn btn-secondary ${isFavorite ? 'favorite-active' : ''}`}
            onClick={() => toggleFavorite(tool.id)}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              size={16}
              fill={isFavorite ? 'var(--color-warning)' : 'none'}
              color={isFavorite ? 'var(--color-warning)' : 'currentColor'}
            />
            <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

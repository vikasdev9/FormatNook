'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Clock, ArrowRight } from 'lucide-react';
import { useToolHistory } from '@/hooks/useToolHistory';
import { toolRegistry } from '@/config/tools';
import { IconRenderer } from '@/components/shared/IconRenderer';

export function RecentAndFavoriteTools() {
  const { recentIds, favoriteIds } = useToolHistory();
  const [tab, setTab] = useState<'favorites' | 'recents'>('favorites');

  const favoriteTools = toolRegistry.filter((t) => favoriteIds.includes(t.id));
  const recentTools = toolRegistry.filter((t) => recentIds.includes(t.id));

  const displayTools = tab === 'favorites' ? favoriteTools : recentTools;

  if (favoriteIds.length === 0 && recentIds.length === 0) {
    return null;
  }

  return (
    <section className="home-section" aria-label="Favorites and Recent Tools">
      <div className="container">
        <div className="home-section-header">
          <div className="home-section-title-wrap">
            <h2 className="home-section-title">Your Workspace</h2>
            <p className="home-section-desc">Quickly return to your preferred and recently launched tools.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${tab === 'favorites' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('favorites')}
            >
              <Star size={14} />
              <span>Favorites ({favoriteTools.length})</span>
            </button>
            <button
              className={`btn btn-sm ${tab === 'recents' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('recents')}
            >
              <Clock size={14} />
              <span>Recently Used ({recentTools.length})</span>
            </button>
          </div>
        </div>

        {displayTools.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
            No tools in your {tab} list yet. Star any tool or launch one to populate your workspace!
          </div>
        ) : (
          <div className="tool-cards-grid">
            {displayTools.map((tool) => (
              <Link key={tool.id} href={tool.route} className="tool-card">
                <div className="tool-card-icon">
                  <IconRenderer name={tool.icon} size={20} />
                </div>
                <div className="tool-card-title">{tool.name}</div>
                <div className="tool-card-desc">{tool.description}</div>
                <div className="tool-card-footer">
                  <span className="badge badge-accent">
                    {tool.category.toUpperCase()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    Launch <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { toolRegistry } from '@/config/tools';
import { categoryList } from '@/config/categories';
import { IconRenderer } from '@/components/shared/IconRenderer';

export function AllToolsDirectory() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    return toolRegistry.filter((tool) => {
      const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q)) ||
        tool.searchAliases.some((a) => a.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className="home-section" id="directory" aria-label="All Tools Directory">
      <div className="container">
        <div className="home-section-header">
          <div className="home-section-title-wrap">
            <h2 className="home-section-title">All Developer Tools Directory</h2>
            <p className="home-section-desc">Browse our complete catalogue of utilities and planned modules.</p>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Filter tools by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="select-control"
              style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', height: '38px', borderRadius: 'var(--radius-full)' }}
            />
          </div>
        </div>

        <div className="directory-filters">
          <button
            className={`filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Categories ({toolRegistry.length})
          </button>
          {categoryList.map((cat) => {
            const count = toolRegistry.filter((t) => t.category === cat.id).length;
            return (
              <button
                key={cat.id}
                className={`filter-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="tool-cards-grid">
          {filteredTools.map((tool) => {
            const isImplemented = tool.status === 'implemented';
            const CardContent = (
              <>
                <div className="tool-card-icon">
                  <IconRenderer name={tool.icon} size={22} />
                </div>
                <div className="tool-card-title">{tool.name}</div>
                <div className="tool-card-desc">{tool.description}</div>
                <div className="tool-card-footer">
                  <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                    {tool.category.toUpperCase()}
                  </span>
                  {isImplemented ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)', fontWeight: 500 }}>
                      <CheckCircle2 size={12} /> Available
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-subtle)' }}>
                      <Clock size={12} /> In Roadmap
                    </span>
                  )}
                </div>
              </>
            );

            if (isImplemented) {
              return (
                <Link key={tool.id} href={tool.route} className="tool-card">
                  {CardContent}
                </Link>
              );
            }

            return (
              <div key={tool.id} className="tool-card" style={{ opacity: 0.75, cursor: 'default' }}>
                {CardContent}
              </div>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No utilities match your search. Try resetting your category filter or search query.
          </div>
        )}
      </div>
    </section>
  );
}

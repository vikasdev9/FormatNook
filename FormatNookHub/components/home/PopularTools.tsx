import React from 'react';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { implementedTools } from '@/config/tools';
import { IconRenderer } from '@/components/shared/IconRenderer';

export function PopularTools() {
  // Select top popular tools
  const popularSlugs = [
    'diff-checker',
    'json-formatter',
    'json-validator',
    'sql-formatter',
    'xml-formatter',
    'yaml-formatter',
    'image-to-base64',
    'base64-to-image',
    'javascript-formatter',
  ];

  const popular = implementedTools.filter((t) => popularSlugs.includes(t.slug));

  return (
    <section className="home-section" aria-label="Popular Developer Tools">
      <div className="container">
        <div className="home-section-header">
          <div className="home-section-title-wrap">
            <h2 className="home-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={24} color="#f97316" />
              <span>Popular Developer Utilities</span>
            </h2>
            <p className="home-section-desc">Our most utilized formatters, validators, and converters.</p>
          </div>
        </div>

        <div className="tool-cards-grid">
          {popular.map((tool) => (
            <Link key={tool.id} href={tool.route} className="tool-card">
              <div className="tool-card-icon">
                <IconRenderer name={tool.icon} size={22} />
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
      </div>
    </section>
  );
}

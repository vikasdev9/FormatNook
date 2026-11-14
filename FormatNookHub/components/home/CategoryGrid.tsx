import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categoryList } from '@/config/categories';
import { toolRegistry } from '@/config/tools';
import { IconRenderer } from '@/components/shared/IconRenderer';

export function CategoryGrid() {
  return (
    <section className="home-section" aria-label="Browse Tools by Category">
      <div className="container">
        <div className="home-section-header">
          <div className="home-section-title-wrap">
            <h2 className="home-section-title">Explore by Category</h2>
            <p className="home-section-desc">Streamlined workflows organized by syntax, language, and transformation.</p>
          </div>
        </div>

        <div className="category-cards-grid">
          {categoryList.map((cat) => {
            const count = toolRegistry.filter((t) => t.category === cat.id).length;
            const implementedCount = toolRegistry.filter((t) => t.category === cat.id && t.status === 'implemented').length;

            return (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="category-card">
                <div className="category-card-icon">
                  <IconRenderer name={cat.icon} size={24} />
                </div>
                <h3 className="category-card-name">{cat.name}</h3>
                <p className="category-card-desc">{cat.description}</p>
                <div className="category-card-tool-count">
                  <span>{implementedCount} available</span>
                  {count > implementedCount && (
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>({count - implementedCount} planned)</span>
                  )}
                  <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

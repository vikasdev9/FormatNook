import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { categories, categoryList } from '@/config/categories';
import { getToolsByCategory } from '@/config/tools';
import { siteConfig } from '@/config/site';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { AdSlot } from '@/components/shared/AdSlot';
import { ToolCategory } from '@/types/tool';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return categoryList.map((cat) => ({
    slug: cat.slug,
  }));
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  const cat = categories[params.slug as ToolCategory];
  if (!cat) {
    return {
      title: 'Category Not Found - FormatNook',
    };
  }

  const catUrl = `${siteConfig.url}/category/${cat.slug}`;

  return {
    title: `${cat.name} - Free Online Utilities & Formatters`,
    description: cat.description,
    alternates: {
      canonical: catUrl,
    },
    openGraph: {
      title: `${cat.name} - FormatNook`,
      description: cat.description,
      url: catUrl,
    },
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const cat = categories[params.slug as ToolCategory];
  if (!cat) {
    notFound();
  }

  const tools = getToolsByCategory(cat.id);
  const implementedTools = tools.filter((t) => t.status === 'implemented');
  const plannedTools = tools.filter((t) => t.status === 'planned');

  return (
    <div className="tool-page-wrapper">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Categories', href: '/#directory' },
            { label: cat.name },
          ]}
        />

        <div className="tool-header">
          <div className="tool-header-top">
            <div className="tool-header-meta">
              <div className="tool-header-icon">
                <IconRenderer name={cat.icon} size={28} />
              </div>
              <div className="tool-header-title-wrap">
                <h1 className="tool-title">{cat.name}</h1>
                <p className="tool-subtitle">{cat.description}</p>
              </div>
            </div>
          </div>
        </div>

        <AdSlot placement="tool-top" slotId="category-top-ad" />

        <section style={{ marginBottom: '3rem' }}>
          <h2 className="section-heading-sm">
            Available Tools ({implementedTools.length})
          </h2>
          <div className="tool-cards-grid">
            {implementedTools.map((tool) => (
              <Link key={tool.id} href={tool.route} className="tool-card">
                <div className="tool-card-icon">
                  <IconRenderer name={tool.icon} size={22} />
                </div>
                <div className="tool-card-title">{tool.name}</div>
                <div className="tool-card-desc">{tool.description}</div>
                <div className="tool-card-footer">
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} /> Available
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                    Launch <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {plannedTools.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 className="section-heading-sm" style={{ color: 'var(--text-muted)' }}>
              Upcoming in Roadmap ({plannedTools.length})
            </h2>
            <div className="tool-cards-grid">
              {plannedTools.map((tool) => (
                <div key={tool.id} className="tool-card" style={{ opacity: 0.75, cursor: 'default' }}>
                  <div className="tool-card-icon">
                    <IconRenderer name={tool.icon} size={22} />
                  </div>
                  <div className="tool-card-title">{tool.name}</div>
                  <div className="tool-card-desc">{tool.description}</div>
                  <div className="tool-card-footer">
                    <span className="badge badge-neutral">
                      <Clock size={12} /> Planned
                    </span>
                    <span style={{ color: 'var(--text-subtle)' }}>
                      In Development
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

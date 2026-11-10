import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ToolDefinition } from '@/types/tool';
import { IconRenderer } from '@/components/shared/IconRenderer';

interface RelatedToolsProps {
  tools: ToolDefinition[];
}

export function RelatedTools({ tools }: RelatedToolsProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <section className="related-tools-section" aria-label="Related Developer Tools">
      <h3 className="section-heading-sm">Related Utilities</h3>
      <div className="tool-cards-grid">
        {tools.map((tool) => (
          <Link key={tool.id} href={tool.route} className="tool-card">
            <div className="tool-card-icon">
              <IconRenderer name={tool.icon} size={20} />
            </div>
            <div className="tool-card-title">{tool.name}</div>
            <div className="tool-card-desc">{tool.description}</div>
            <div className="tool-card-footer">
              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                {tool.category.toUpperCase()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                Open Tool <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

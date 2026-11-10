import React from 'react';
import { ToolDefinition } from '@/types/tool';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ToolHeader } from './ToolHeader';
import { ToolDescription } from './ToolDescription';
import { RelatedTools } from './RelatedTools';
import { AdSlot } from '@/components/shared/AdSlot';
import { getRelatedTools } from '@/config/tools';
import { generateToolJsonLd } from '@/lib/seo';

interface ToolPageLayoutProps {
  tool: ToolDefinition;
  children: React.ReactNode;
}

export function ToolPageLayout({ tool, children }: ToolPageLayoutProps) {
  const relatedTools = getRelatedTools(tool.id, 4);
  const jsonLd = generateToolJsonLd(tool);

  return (
    <div className="tool-page-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container">
        <Breadcrumbs
          items={[
            { label: tool.category.toUpperCase(), href: `/category/${tool.category}` },
            { label: tool.name },
          ]}
        />

        <ToolHeader tool={tool} />

        <AdSlot placement="tool-top" slotId="top-ad" />

        <main role="main">
          {children}
        </main>

        <AdSlot placement="tool-bottom" slotId="bottom-ad" />

        <ToolDescription tool={tool} />

        <RelatedTools tools={relatedTools} />
      </div>
    </div>
  );
}

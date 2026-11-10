import { ToolDefinition } from '@/types/tool';
import { siteConfig } from '@/config/site';

export function generateToolJsonLd(tool: ToolDefinition) {
  const toolUrl = `${siteConfig.url}${tool.route}`;

  const schemas: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      url: toolUrl,
      description: tool.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteConfig.url,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: tool.category.toUpperCase(),
          item: `${siteConfig.url}/category/${tool.category}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: tool.name,
          item: toolUrl,
        },
      ],
    },
  ];

  if (tool.educationalContent?.faqs && tool.educationalContent.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: tool.educationalContent.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return schemas;
}

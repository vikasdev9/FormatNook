import { ShareFormatOption, SharePayload } from '@/features/shared/types/share.types';

function computeXmlMetrics(xmlText: string): {
  valid: boolean;
  tagCount: number;
  attributeCount: number;
  byteSize: number;
} {
  const byteSize = new Blob([xmlText]).size;
  // Match tags
  const tags = xmlText.match(/<[a-zA-Z0-9_:-]+(\s|>|\/)/g) || [];
  // Match attributes
  const attrs = xmlText.match(/\s[a-zA-Z0-9_:-]+=(["']).*?\1/g) || [];

  return {
    valid: true,
    tagCount: tags.length,
    attributeCount: attrs.length,
    byteSize,
  };
}

export function createXmlSharePayload(outputXml: string): SharePayload | null {
  if (!outputXml || !outputXml.trim()) return null;

  const metrics = computeXmlMetrics(outputXml);
  const minifiedXml = outputXml.replace(/>\s+</g, '><').trim();

  const options: ShareFormatOption[] = [];

  // Option 1: Clean Formatted XML
  options.push({
    id: 'formatted-xml',
    label: 'Formatted XML Document',
    description: 'Cleanly indented, validated XML document with 2-space indentation',
    extension: '.xml',
    mimeType: 'application/xml',
    badge: 'Pretty',
    estimatedSize: `${(metrics.byteSize / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: outputXml,
      fileName: 'formatted.xml',
      mimeType: 'application/xml;charset=utf-8',
      textForClipboard: outputXml,
    }),
  });

  // Option 2: Minified XML
  options.push({
    id: 'minified-xml',
    label: 'Minified XML',
    description: 'Stripped of formatting whitespace for compact network payload transfer',
    extension: '.xml',
    mimeType: 'application/xml',
    badge: 'Compact',
    estimatedSize: `${(new Blob([minifiedXml]).size / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: minifiedXml,
      fileName: 'minified.xml',
      mimeType: 'application/xml;charset=utf-8',
      textForClipboard: minifiedXml,
    }),
  });

  // Option 3: XML Metrics & Structure Report
  options.push({
    id: 'xml-metrics',
    label: 'XML Structure & Metrics Report',
    description: 'Detailed analysis of XML tag counts, attribute frequencies, and payload sizes',
    extension: '.json',
    mimeType: 'application/json',
    badge: 'Analytics',
    estimatedSize: '< 2 KB',
    generate: () => {
      const report = {
        tool: 'FormatNook XML Workspace',
        timestamp: new Date().toISOString(),
        metrics: {
          tagCount: metrics.tagCount,
          attributeCount: metrics.attributeCount,
          formattedBytes: metrics.byteSize,
          minifiedBytes: new Blob([minifiedXml]).size,
          compressionSavingsPercent: `${Math.round(((metrics.byteSize - new Blob([minifiedXml]).size) / metrics.byteSize) * 100)}%`,
        },
      };
      const jsonStr = JSON.stringify(report, null, 2);
      return {
        content: jsonStr,
        fileName: 'xml-metrics-report.json',
        mimeType: 'application/json;charset=utf-8',
        textForClipboard: jsonStr,
      };
    },
  });

  return {
    toolTitle: 'XML Workspace',
    defaultFileName: 'formatted.xml',
    options,
    metadata: {
      tags: metrics.tagCount,
      attributes: metrics.attributeCount,
      bytes: metrics.byteSize,
    },
  };
}

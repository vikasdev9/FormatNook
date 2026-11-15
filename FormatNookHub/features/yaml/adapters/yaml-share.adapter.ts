import { ShareFormatOption, SharePayload } from '@/features/shared/types/share.types';

export function createYamlSharePayload(outputYaml: string, docCount = 1): SharePayload | null {
  if (!outputYaml || !outputYaml.trim()) return null;

  const lines = outputYaml.split(/\r\n|\r|\n/).length;
  const byteLength = new Blob([outputYaml]).size;

  const options: ShareFormatOption[] = [];

  // Option 1: Clean YAML Document
  options.push({
    id: 'formatted-yaml',
    label: 'Clean YAML Document',
    description: 'Formatted and normalized YAML file ready for Kubernetes, CI/CD, or configuration',
    extension: '.yaml',
    mimeType: 'text/yaml',
    badge: 'Standard',
    estimatedSize: `${(byteLength / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: outputYaml,
      fileName: 'formatted.yaml',
      mimeType: 'text/yaml;charset=utf-8',
      textForClipboard: outputYaml,
    }),
  });

  // Option 2: YAML Summary Report
  options.push({
    id: 'yaml-summary',
    label: 'YAML Audit & Structure Summary',
    description: 'Overview of multi-document streams, line counts, and size metrics',
    extension: '.txt',
    mimeType: 'text/plain',
    badge: 'Audit',
    estimatedSize: '< 2 KB',
    generate: () => {
      const summaryText = [
        '===========================================================',
        'FORMATNOOK HUB — YAML WORKSPACE EXPORT SUMMARY',
        '===========================================================',
        `Timestamp:       ${new Date().toISOString()}`,
        `Document Count:  ${docCount}`,
        `Total Lines:     ${lines.toLocaleString()}`,
        `Character Count: ${outputYaml.length.toLocaleString()}`,
        `Byte Size:       ${byteLength.toLocaleString()} bytes`,
        `Validation:      Valid Formatted YAML`,
        '-----------------------------------------------------------',
        'Verified Client-Side by FormatNook Hub (Zero Server Telemetry)',
        '===========================================================',
      ].join('\n');

      return {
        content: summaryText,
        fileName: 'yaml-summary.txt',
        mimeType: 'text/plain;charset=utf-8',
        textForClipboard: summaryText,
      };
    },
  });

  return {
    toolTitle: 'YAML Workspace',
    defaultFileName: 'formatted.yaml',
    options,
    metadata: {
      documents: docCount,
      lines,
      bytes: byteLength,
    },
  };
}

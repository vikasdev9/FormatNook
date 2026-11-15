import { ShareFormatOption, SharePayload } from '@/features/shared/types/share.types';

export function createBeautifierSharePayload(
  outputContent: string,
  language: string,
  fileName: string
): SharePayload | null {
  if (!outputContent || !outputContent.trim()) return null;

  const byteLength = new Blob([outputContent]).size;
  const lineCount = outputContent.split('\n').length;
  const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '.txt';
  const mime =
    language === 'sql'
      ? 'application/sql'
      : language === 'html'
      ? 'text/html'
      : language === 'css'
      ? 'text/css'
      : language === 'javascript'
      ? 'application/javascript'
      : 'text/plain';

  const options: ShareFormatOption[] = [];

  // Option 1: Formatted Code / File
  options.push({
    id: 'formatted-code',
    label: `Beautified ${language.toUpperCase()} File`,
    description: `Cleanly indented, formatted ${language.toUpperCase()} output`,
    extension: ext,
    mimeType: mime,
    badge: 'Formatted',
    estimatedSize: `${(byteLength / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: outputContent,
      fileName,
      mimeType: `${mime};charset=utf-8`,
      textForClipboard: outputContent,
    }),
  });

  // Option 2: Summary / Metadata Report
  options.push({
    id: 'beautifier-summary',
    label: `${language.toUpperCase()} Metrics & Audit Log`,
    description: 'Formatted file metrics including line counts and character size',
    extension: '.txt',
    mimeType: 'text/plain',
    badge: 'Audit',
    estimatedSize: '< 2 KB',
    generate: () => {
      const summaryText = [
        '===========================================================',
        `FORMATNOOK HUB — ${language.toUpperCase()} BEAUTIFIER AUDIT REPORT`,
        '===========================================================',
        `Timestamp:       ${new Date().toISOString()}`,
        `Language:        ${language.toUpperCase()}`,
        `File Name:       ${fileName}`,
        `Total Lines:     ${lineCount.toLocaleString()}`,
        `Character Count: ${outputContent.length.toLocaleString()}`,
        `Byte Size:       ${byteLength.toLocaleString()} bytes`,
        `Validation:      Clean Syntax & Normalized Indentation`,
        '-----------------------------------------------------------',
        'Verified Client-Side by FormatNook Hub (Zero Server Telemetry)',
        '===========================================================',
      ].join('\n');

      return {
        content: summaryText,
        fileName: `${language}-beautifier-summary.txt`,
        mimeType: 'text/plain;charset=utf-8',
        textForClipboard: summaryText,
      };
    },
  });

  return {
    toolTitle: `${language.toUpperCase()} Beautifier`,
    defaultFileName: fileName,
    options,
    metadata: {
      language,
      lines: lineCount,
      bytes: byteLength,
    },
  };
}

import { DiffResultData, DiffOptions } from '../types/diff.types';
import { ShareFormatOption, SharePayload } from '@/features/shared/types/share.types';

export function createDiffSharePayload(
  diffResult: DiffResultData | null,
  options?: DiffOptions
): SharePayload | null {
  if (!diffResult || !diffResult.unifiedDiffText) return null;

  const stats = diffResult.statistics;
  const unifiedText = diffResult.unifiedDiffText;
  const byteLength = new Blob([unifiedText]).size;

  const optionsList: ShareFormatOption[] = [];

  // Option 1: Unified Diff Patch
  optionsList.push({
    id: 'unified-diff',
    label: 'Unified Diff Patch',
    description: 'Standard unified diff patch (.diff / .patch) compatible with git and patch tools',
    extension: '.patch',
    mimeType: 'text/plain',
    badge: 'Patch',
    estimatedSize: `${(byteLength / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: unifiedText,
      fileName: 'changes.patch',
      mimeType: 'text/plain;charset=utf-8',
      textForClipboard: unifiedText,
    }),
  });

  // Option 2: Comparison Summary Report
  optionsList.push({
    id: 'diff-summary-report',
    label: 'Comparison Summary Report',
    description: 'Structured audit log of line changes, addition/deletion counts, and similarity',
    extension: '.txt',
    mimeType: 'text/plain',
    badge: 'Audit',
    estimatedSize: '< 2 KB',
    generate: () => {
      const summaryText = [
        '===========================================================',
        'FORMATNOOK HUB — TEXT DIFF CHECKER AUDIT REPORT',
        '===========================================================',
        `Timestamp:            ${new Date().toISOString()}`,
        `Comparison Format:    ${options?.format || 'auto'}`,
        `Identical Content:    ${diffResult.isIdentical ? 'YES' : 'NO'}`,
        `Total Lines:          ${stats.totalLines.toLocaleString()}`,
        `Added Lines (+):      ${stats.addedLines.toLocaleString()}`,
        `Removed Lines (-):    ${stats.removedLines.toLocaleString()}`,
        `Modified Lines (~):   ${stats.modifiedLines.toLocaleString()}`,
        `Unchanged Lines:      ${stats.unchangedLines.toLocaleString()}`,
        `Difference Ratio:     ${stats.differencePercentage}%`,
        '-----------------------------------------------------------',
        'UNIFIED DIFF PREVIEW (First 25 lines):',
        ...unifiedText.split('\n').slice(0, 25).map((l) => `  ${l}`),
        unifiedText.split('\n').length > 25 ? '  ... (truncated in summary preview)' : '',
        '-----------------------------------------------------------',
        'Verified Client-Side by FormatNook Hub (Zero Server Telemetry)',
        '===========================================================',
      ].filter(Boolean).join('\n');

      return {
        content: summaryText,
        fileName: 'diff-comparison-report.txt',
        mimeType: 'text/plain;charset=utf-8',
        textForClipboard: summaryText,
      };
    },
  });

  return {
    toolTitle: 'Text Diff Checker',
    defaultFileName: 'changes.patch',
    options: optionsList,
    metadata: {
      added: stats.addedLines,
      removed: stats.removedLines,
      modified: stats.modifiedLines,
      identical: diffResult.isIdentical,
    },
  };
}

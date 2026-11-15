import { describe, it, expect } from 'vitest';
import { createDiffSharePayload } from '../adapters/diff-share.adapter';
import { DiffResultData, DiffOptions } from '../types/diff.types';

describe('diff-share.adapter', () => {
  const sampleDiffResult: DiffResultData = {
    lines: [],
    statistics: {
      totalLines: 10,
      addedLines: 2,
      removedLines: 1,
      modifiedLines: 1,
      unchangedLines: 6,
      differencePercentage: 40,
    },
    isIdentical: false,
    isEmpty: false,
    unifiedDiffText: '--- original\n+++ modified\n@@ -1,3 +1,4 @@\n line1\n-line2\n+line2 modified\n+line3',
  };

  const sampleOptions: DiffOptions = {
    format: 'text',
    viewMode: 'side-by-side',
    ignoreWhitespace: false,
    ignoreCase: false,
    wrapLines: true,
  };

  it('returns null when diffResult has no unified text', () => {
    expect(createDiffSharePayload(null)).toBeNull();
    expect(
      createDiffSharePayload({
        ...sampleDiffResult,
        unifiedDiffText: '',
      })
    ).toBeNull();
  });

  it('creates unified-diff and summary report options', async () => {
    const payload = createDiffSharePayload(sampleDiffResult, sampleOptions);
    expect(payload).not.toBeNull();
    expect(payload!.toolTitle).toBe('Text Diff Checker');
    expect(payload!.options).toHaveLength(2);

    const ids = payload!.options.map((o) => o.id);
    expect(ids).toEqual(['unified-diff', 'diff-summary-report']);

    // Patch option
    const patchOpt = payload!.options.find((o) => o.id === 'unified-diff')!;
    const pRes = await patchOpt.generate();
    expect(pRes.fileName).toBe('changes.patch');
    expect(pRes.content).toBe(sampleDiffResult.unifiedDiffText);

    // Summary option
    const summaryOpt = payload!.options.find((o) => o.id === 'diff-summary-report')!;
    const sRes = await summaryOpt.generate();
    expect(sRes.fileName).toBe('diff-comparison-report.txt');
    expect(sRes.content).toContain('FORMATNOOK HUB — TEXT DIFF CHECKER AUDIT REPORT');
    expect(sRes.content).toContain('Added Lines (+):      2');
    expect(sRes.content).toContain('Removed Lines (-):    1');
  });
});

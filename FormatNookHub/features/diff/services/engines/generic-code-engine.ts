import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff } from '../diff-service';

export interface CodeChangeAnalysis {
  codeLinesChanged: number;
  commentLinesChanged: number;
  blankLinesChanged: number;
}

export class GenericCodeEngine implements DiffEngine {
  readonly format = 'code';

  compare(input: DiffEngineInput): DiffEngineResult {
    const { originalText, modifiedText, options } = input;

    const isEmptyOriginal = !originalText || !originalText.trim();
    const isEmptyModified = !modifiedText || !modifiedText.trim();

    if (isEmptyOriginal && isEmptyModified) {
      return {
        lines: [],
        statistics: {
          totalLines: 0,
          addedLines: 0,
          removedLines: 0,
          modifiedLines: 0,
          unchangedLines: 0,
          differencePercentage: 0,
        },
        isIdentical: true,
        isEmpty: true,
        unifiedDiffText: '',
        format: 'code',
        detectedFormat: 'code',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    const diffResult = computeRawTextDiff(originalText, modifiedText, {
      ...options,
      format: 'code',
    });

    const analysis = this.analyzeCodeChanges(diffResult.lines);

    return {
      ...diffResult,
      format: 'code',
      detectedFormat: 'code',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'code',
        summary: `${analysis.codeLinesChanged} code lines changed, ${analysis.commentLinesChanged} comment lines changed.`,
        details: analysis,
      },
    };
  }

  private analyzeCodeChanges(lines: DiffEngineResult['lines']): CodeChangeAnalysis {
    let codeLinesChanged = 0;
    let commentLinesChanged = 0;
    let blankLinesChanged = 0;

    for (const line of lines) {
      if (line.type === 'equal') continue;

      const content = (line.type === 'delete' ? line.originalContent : line.modifiedContent) || '';
      const trimmed = content.trim();

      if (!trimmed) {
        blankLinesChanged++;
      } else if (this.isCommentLine(trimmed)) {
        commentLinesChanged++;
      } else {
        codeLinesChanged++;
      }
    }

    return {
      codeLinesChanged,
      commentLinesChanged,
      blankLinesChanged,
    };
  }

  private isCommentLine(line: string): boolean {
    return (
      line.startsWith('//') ||
      line.startsWith('#') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line.startsWith('--') ||
      line.startsWith(';') ||
      line.startsWith('<!--')
    );
  }
}

export const genericCodeEngine = new GenericCodeEngine();

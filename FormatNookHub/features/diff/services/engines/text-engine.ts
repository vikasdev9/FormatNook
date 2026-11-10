import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff } from '../diff-service';

export class TextEngine implements DiffEngine {
  readonly format = 'text';

  compare(input: DiffEngineInput): DiffEngineResult {
    const rawResult = computeRawTextDiff(input.originalText, input.modifiedText, {
      ...input.options,
      format: 'text',
    });

    return {
      ...rawResult,
      format: 'text',
      isValid: { original: true, modified: true },
      errors: {},
    };
  }
}

export const textEngine = new TextEngine();

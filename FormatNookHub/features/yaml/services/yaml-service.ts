import yaml from 'js-yaml';
import { IndentOption, ValidationIssue, ToolExecutionResult } from '@/types/tool';

export function getYamlIndentNumber(indent: IndentOption): number {
  if (indent === '4') return 4;
  return 2;
}

/**
 * Validates YAML strictly using js-yaml parser.
 */
export function validateYaml(input: string): { isValid: boolean; issues: ValidationIssue[] } {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      issues: [{ message: 'Input is empty. Please enter a YAML document.', severity: 'warning' }],
    };
  }

  // Check for tab characters in indentation
  const lines = input.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\t+/.test(line)) {
      return {
        isValid: false,
        issues: [
          {
            line: i + 1,
            column: 1,
            message: 'Tabs are strictly forbidden for indentation in YAML. Use spaces instead.',
            severity: 'error',
          },
        ],
      };
    }
  }

  try {
    yaml.loadAll(input);
    return { isValid: true, issues: [] };
  } catch (err: any) {
    const line = err?.mark?.line !== undefined ? err.mark.line + 1 : undefined;
    const column = err?.mark?.column !== undefined ? err.mark.column + 1 : undefined;
    const message = err?.reason || err?.message || 'Invalid YAML syntax';

    return {
      isValid: false,
      issues: [
        {
          line,
          column,
          message: `YAMLException: ${message}`,
          severity: 'error',
        },
      ],
    };
  }
}

/**
 * Formats YAML configuration with clean indentation and key standardization.
 */
export function formatYaml(input: string, indent: IndentOption = '2'): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  const validation = validateYaml(input);
  if (!validation.isValid) {
    return {
      output: input,
      isValid: false,
      issues: validation.issues,
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }

  try {
    const docs = yaml.loadAll(input);
    const indentNum = getYamlIndentNumber(indent);
    const dumpOptions: yaml.DumpOptions = {
      indent: indentNum,
      lineWidth: -1, // Do not wrap long lines automatically
      noRefs: true,
      quotingType: '"',
    };

    let formatted: string;

    if (docs.length === 0) {
      formatted = '';
    } else if (docs.length === 1) {
      // Single-document: preserve backward-compatibility without leading ---
      const singleDoc = docs[0];
      formatted = singleDoc == null ? '' : yaml.dump(singleDoc, dumpOptions).trimEnd() + '\n';
    } else {
      // Multi-document stream: format each document and join with --- separators
      const formattedDocs = docs.map((doc) => {
        if (doc == null) {
          return '';
        }
        return yaml.dump(doc, dumpOptions).trimEnd();
      });

      formatted = formattedDocs.join('\n---\n') + '\n';
    }

    const outputSize = new Blob([formatted]).size;

    return {
      output: formatted,
      isValid: true,
      issues: [],
      inputSize,
      outputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  } catch (err: any) {
    return {
      output: input,
      isValid: false,
      issues: [{ message: err?.message || 'Failed to format YAML', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

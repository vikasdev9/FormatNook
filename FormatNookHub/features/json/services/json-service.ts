import { IndentOption, ValidationIssue, ToolExecutionResult } from '@/types/tool';

export function getIndentString(indent: IndentOption): string | number {
  if (indent === 'tab') return '\t';
  if (indent === '4') return 4;
  return 2;
}

/**
 * Pinpoints line and column from JSON.parse error message or scans character position
 */
export function extractJsonErrorPosition(rawError: string, input: string): { line?: number; column?: number } {
  // Pattern 1: "at position 123"
  const posMatch = rawError.match(/at position (\d+)/i);
  if (posMatch) {
    const charPos = parseInt(posMatch[1], 10);
    const before = input.slice(0, charPos);
    const lines = before.split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }

  // Pattern 2: "line 2 column 5"
  const lineColMatch = rawError.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }

  return {};
}

/**
 * Validates JSON strictly without mutating input
 */
export function validateJson(input: string): { isValid: boolean; issues: ValidationIssue[] } {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      issues: [{ message: 'Input is empty. Please enter a JSON document.', severity: 'warning' }],
    };
  }

  try {
    JSON.parse(input);
    return { isValid: true, issues: [] };
  } catch (err: any) {
    const rawMsg = err?.message || 'Invalid JSON syntax';
    const { line, column } = extractJsonErrorPosition(rawMsg, input);

    let friendlyMessage = rawMsg;
    if (rawMsg.includes('Unexpected token')) {
      if (rawMsg.includes('}')) friendlyMessage = 'Unexpected token }. Likely a trailing comma or misplaced bracket.';
      else if (rawMsg.includes(']')) friendlyMessage = 'Unexpected token ]. Likely a trailing comma or misplaced bracket.';
      else if (rawMsg.includes('\'')) friendlyMessage = 'Single quotes are invalid in strict JSON. Strings must use double quotes (").';
    }

    return {
      isValid: false,
      issues: [
        {
          line,
          column,
          message: friendlyMessage,
          severity: 'error',
        },
      ],
    };
  }
}

/**
 * Formats JSON strictly. Invalid JSON will return validation issues without altering data.
 */
export function formatJson(input: string, indent: IndentOption = '2'): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  const validation = validateJson(input);
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
    const parsed = JSON.parse(input);
    const indentVal = getIndentString(indent);
    const formatted = JSON.stringify(parsed, null, indentVal);
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
      issues: [{ message: err?.message || 'Failed to format JSON', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Minifies JSON by stripping all outer whitespace without affecting string contents
 */
export function minifyJson(input: string): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  const validation = validateJson(input);
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
    const parsed = JSON.parse(input);
    const minified = JSON.stringify(parsed);
    const outputSize = new Blob([minified]).size;

    return {
      output: minified,
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
      issues: [{ message: err?.message || 'Failed to minify JSON', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Explicit repair helper to fix common JSON mistakes (trailing commas, single quotes, unquoted keys)
 */
export function repairJson(input: string): string {
  if (!input || !input.trim()) return input;

  let repaired = input;

  // Replace single quotes surrounding keys and string values with double quotes (basic heuristic)
  repaired = repaired.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Quote unquoted object keys (e.g. { name: "John" } -> { "name": "John" })
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');

  return repaired;
}

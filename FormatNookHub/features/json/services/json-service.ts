import { IndentOption, ValidationIssue, ToolExecutionResult } from '@/types/tool';

export function getIndentString(indent: IndentOption): string | number {
  if (indent === 'tab') return '\t';
  const num = parseInt(indent, 10);
  return isNaN(num) ? 2 : num;
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
 * Recursively sorts all keys in an object or nested objects alphabetically.
 */
export function sortObjectKeysRecursive(node: any): any {
  if (node === null || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(sortObjectKeysRecursive);
  const keys = Object.keys(node).sort((a, b) => a.localeCompare(b));
  const sorted: Record<string, any> = {};
  for (const k of keys) {
    sorted[k] = sortObjectKeysRecursive(node[k]);
  }
  return sorted;
}

/**
 * Formats JSON strictly. Invalid JSON will return validation issues without altering data.
 */
export function formatJson(
  input: string,
  indent: IndentOption = '2',
  options: { sortKeys?: boolean } = {}
): ToolExecutionResult {
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
    let parsed = JSON.parse(input);
    if (options.sortKeys) {
      parsed = sortObjectKeysRecursive(parsed);
    }
    const indentVal = getIndentString(indent);
    const formatted = JSON.stringify(parsed, null, indentVal);
    const cleanedOutput = formatted.split('\n').map((l) => l.trimEnd()).join('\n');
    const outputSize = new Blob([cleanedOutput]).size;

    return {
      output: cleanedOutput,
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
 * Strips single-line (//) and multi-line (/* ... *\/) comments only outside quoted strings.
 * Preserves URLs, escaped quotes, and string literals containing // or /*.
 */
export function stripCommentsOutsideStrings(input: string): { result: string; hasComments: boolean } {
  let result = '';
  let inString: '"' | "'" | null = null;
  let hasComments = false;
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    if (inString !== null) {
      result += ch;
      if (ch === '\\' && i + 1 < len) {
        // Escaped character: include escape character and the escaped char
        i++;
        result += input[i];
      } else if (ch === inString) {
        inString = null;
      }
      i++;
    } else {
      if (ch === '"' || ch === "'") {
        inString = ch;
        result += ch;
        i++;
      } else if (ch === '/' && i + 1 < len && input[i + 1] === '/') {
        // Single-line comment: skip until newline or EOF
        hasComments = true;
        i += 2;
        while (i < len && input[i] !== '\n' && input[i] !== '\r') {
          i++;
        }
      } else if (ch === '/' && i + 1 < len && input[i + 1] === '*') {
        // Multi-line comment: skip until */ or EOF
        hasComments = true;
        i += 2;
        while (i + 1 < len && !(input[i] === '*' && input[i + 1] === '/')) {
          i++;
        }
        if (i + 1 < len) {
          i += 2; // Skip closing * and /
        } else {
          i = len;
        }
      } else {
        result += ch;
        i++;
      }
    }
  }

  return { result, hasComments };
}

/**
 * Explicit repair helper to fix common JSON mistakes (trailing commas, single quotes, unquoted keys, comments)
 */
export function repairJson(input: string): string {
  if (!input || !input.trim()) return input;

  // 1. Strip comments outside of strings (preserves URLs and escaped strings)
  let repaired = stripCommentsOutsideStrings(input).result;

  // 2. Replace single quotes surrounding keys and string values with double quotes
  repaired = repaired.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  // 3. Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // 4. Quote unquoted object keys (e.g. { name: "John" } -> { "name": "John" })
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');

  return repaired;
}

/**
 * Returns a repair proposal with detected changes
 */
export function proposeJsonRepair(input: string): { repaired: string; changes: string[] } {
  const changes: string[] = [];
  if (!input || !input.trim()) return { repaired: input, changes: [] };

  const { hasComments } = stripCommentsOutsideStrings(input);
  if (hasComments) {
    changes.push('Removed JavaScript comments (// and /* */)');
  }
  if (/'([^'\\]*(?:\\.[^'\\]*)*)'/.test(input)) {
    changes.push('Replaced single quotes with valid JSON double quotes');
  }
  if (/,(\s*[}\]])/.test(input)) {
    changes.push('Removed invalid trailing commas in objects or arrays');
  }
  if (/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/.test(input)) {
    changes.push('Added double quotes to unquoted property keys');
  }

  const repaired = repairJson(input);
  if (changes.length === 0 && repaired !== input) {
    changes.push('Normalized JSON formatting and character encodings');
  }

  return { repaired, changes };
}

/**
 * Escapes/stringifies JSON into a string literal for embedding in code.
 */
export function stringifyJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(JSON.stringify(parsed));
  } catch {
    return JSON.stringify(input);
  }
}

/**
 * Unescapes/parses an escaped JSON string literal.
 */
export function unstringifyJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'string') {
      try {
        const inner = JSON.parse(parsed);
        return JSON.stringify(inner, null, 2);
      } catch {
        return parsed;
      }
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return input;
  }
}

/**
 * Compresses JSON into a single line without any newlines or extra whitespace.
 */
export function oneLineJson(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return input.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

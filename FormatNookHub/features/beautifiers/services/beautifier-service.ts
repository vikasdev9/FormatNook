import { format as formatSqlString } from 'sql-formatter';
import { IndentOption, ToolExecutionResult } from '@/types/tool';

function getIndentSpaces(indent: IndentOption): string {
  if (indent === 'tab') return '\t';
  if (indent === '4') return '    ';
  return '  ';
}

/**
 * Formats SQL with capitalized keywords and structured clauses.
 */
export function formatSql(input: string, indent: IndentOption = '2'): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    const formatted = formatSqlString(input, {
      language: 'sql',
      tabWidth: indent === '4' ? 4 : 2,
      useTabs: indent === 'tab',
      keywordCase: 'upper',
    });

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
      issues: [{ message: err?.message || 'Failed to format SQL query', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Formats HTML markup with hierarchical indentation.
 */
export function formatHtml(input: string, indent: IndentOption = '2'): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    const indentStr = getIndentSpaces(indent);
    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
    ]);

    // Tokenize tags and texts
    const tokens = input
      .replace(/>\s*</g, '><')
      .replace(/<([^>]+)>/g, '\n<$1>\n')
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let depth = 0;
    let formatted = '';

    for (const token of tokens) {
      if (token.startsWith('</')) {
        // Closing tag
        depth = Math.max(0, depth - 1);
        formatted += indentStr.repeat(depth) + token + '\n';
      } else if (token.startsWith('<')) {
        // Opening tag, self-closing, comment, or doctype
        const tagNameMatch = token.match(/^<([a-zA-Z0-9!:-]+)/);
        const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
        const isSelfClosing = token.endsWith('/>') || voidTags.has(tagName) || token.startsWith('<!--');

        formatted += indentStr.repeat(depth) + token + '\n';
        if (!isSelfClosing) {
          depth++;
        }
      } else {
        // Text node
        formatted += indentStr.repeat(depth) + token + '\n';
      }
    }

    const finalOutput = formatted.trimEnd();
    const outputSize = new Blob([finalOutput]).size;

    return {
      output: finalOutput,
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
      issues: [{ message: err?.message || 'Failed to format HTML', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Formats CSS rules, properties, and declarations.
 */
export function formatCss(input: string, indent: IndentOption = '2'): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    const indentStr = getIndentSpaces(indent);

    // Normalize spacing around braces, semicolons, and colons
    let clean = input
      .replace(/\s*\{\s*/g, ' {\n')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s*;\s*/g, ';\n')
      .replace(/\s*\}\s*/g, '\n}\n\n')
      .replace(/\s*,\s*/g, ', ');

    const lines = clean.split('\n');
    let depth = 0;
    let formatted = '';

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.includes('}')) {
        depth = Math.max(0, depth - 1);
      }

      formatted += indentStr.repeat(depth) + line + '\n';

      if (line.includes('{')) {
        depth++;
      }
    }

    const finalOutput = formatted.trimEnd();
    const outputSize = new Blob([finalOutput]).size;

    return {
      output: finalOutput,
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
      issues: [{ message: err?.message || 'Failed to format CSS', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Formats JavaScript code with block nesting and indentation.
 */
export function formatJavascript(input: string, indent: IndentOption = '2'): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    const indentStr = getIndentSpaces(indent);

    // Basic AST-free tokenizer for safe JS formatting
    let formatted = '';
    let depth = 0;
    let inString: string | null = null;
    let isEscaped = false;

    // Normalize statement linebreaks
    let normalized = input
      .replace(/;\s*/g, ';\n')
      .replace(/\{\s*/g, ' {\n')
      .replace(/\}\s*/g, '\n}\n');

    const lines = normalized.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('}') || line.startsWith(']')) {
        depth = Math.max(0, depth - 1);
      }

      formatted += indentStr.repeat(depth) + line + '\n';

      if (line.endsWith('{') || line.endsWith('[')) {
        depth++;
      }
    }

    const finalOutput = formatted.trimEnd();
    const outputSize = new Blob([finalOutput]).size;

    return {
      output: finalOutput,
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
      issues: [{ message: err?.message || 'Failed to format JavaScript', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

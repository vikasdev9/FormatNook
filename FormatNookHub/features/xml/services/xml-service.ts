import { IndentOption, ValidationIssue, ToolExecutionResult } from '@/types/tool';

export function getIndentSpaces(indent: IndentOption): string {
  if (indent === 'tab') return '\t';
  if (indent === '4') return '    ';
  return '  ';
}

/**
 * Validates XML syntax, tag pairing, and well-formedness.
 */
export function validateXml(input: string): { isValid: boolean; issues: ValidationIssue[] } {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      issues: [{ message: 'Input is empty. Please enter an XML document.', severity: 'warning' }],
    };
  }

  // If running in browser, DOMParser gives instant native XML validation
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'application/xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        const errorText = parserError.textContent || 'XML parsing error';
        const lineMatch = errorText.match(/line\s+(\d+)/i);
        const colMatch = errorText.match(/column\s+(\d+)/i);
        return {
          isValid: false,
          issues: [
            {
              line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
              column: colMatch ? parseInt(colMatch[1], 10) : undefined,
              message: errorText.split('\n')[0] || 'Malformed XML syntax',
              severity: 'error',
            },
          ],
        };
      }
      return { isValid: true, issues: [] };
    } catch {
      // Fallback to tokenizer below
    }
  }

  // Server-side / Node fallback tag validator
  const tagRegex = /<(\/?[a-zA-Z0-9_:-]+)([^>]*)>/g;
  const stack: { tag: string; line: number }[] = [];
  let match: RegExpExecArray | null;

  const lines = input.split('\n');
  const getLineNumber = (index: number) => {
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count > index) return i + 1;
    }
    return lines.length;
  };

  while ((match = tagRegex.exec(input)) !== null) {
    const rawTag = match[1];
    const attrs = match[2];
    const isSelfClosing = attrs.trim().endsWith('/') || rawTag.startsWith('?') || rawTag.startsWith('!');

    if (isSelfClosing) continue;

    if (rawTag.startsWith('/')) {
      const closingName = rawTag.substring(1);
      if (stack.length === 0) {
        return {
          isValid: false,
          issues: [
            {
              line: getLineNumber(match.index),
              message: `Unexpected closing tag </${closingName}> without matching opening tag.`,
              severity: 'error',
            },
          ],
        };
      }
      const last = stack.pop()!;
      if (last.tag !== closingName) {
        return {
          isValid: false,
          issues: [
            {
              line: getLineNumber(match.index),
              message: `Mismatched closing tag: expected </${last.tag}> (opened on line ${last.line}) but found </${closingName}>.`,
              severity: 'error',
            },
          ],
        };
      }
    } else {
      stack.push({ tag: rawTag, line: getLineNumber(match.index) });
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return {
      isValid: false,
      issues: [
        {
          line: unclosed.line,
          message: `Unclosed XML tag <${unclosed.tag}> opened on line ${unclosed.line}.`,
          severity: 'error',
        },
      ],
    };
  }

  return { isValid: true, issues: [] };
}

/**
 * Formats XML with indentation and tag alignment
 */
export function formatXml(input: string, indent: IndentOption = '2'): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  const validation = validateXml(input);
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

  const indentStr = getIndentSpaces(indent);
  let formatted = '';
  let depth = 0;

  // Split XML into tokens (tags, text, comments, CDATA)
  const tokens = input
    .replace(/(>)(<)(\/*)/g, '$1\r\n$2$3')
    .split('\r\n');

  for (let i = 0; i < tokens.length; i++) {
    const node = tokens[i].trim();
    if (!node) continue;

    // Check tag type
    const isClosing = node.startsWith('</');
    const isSelfClosing =
      node.endsWith('/>') ||
      node.startsWith('<?') ||
      node.startsWith('<!DOCTYPE') ||
      node.startsWith('<!--');
    const isOpening = node.startsWith('<') && !isClosing && !isSelfClosing;

    if (isClosing && depth > 0) {
      depth--;
    }

    formatted += indentStr.repeat(depth) + node + '\n';

    if (isOpening && !isClosing && !isSelfClosing) {
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
}

/**
 * Minifies XML by removing spaces between tags
 */
export function minifyXml(input: string): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  const validation = validateXml(input);
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

  const minified = input
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim();

  const outputSize = new Blob([minified]).size;

  return {
    output: minified,
    isValid: true,
    issues: [],
    inputSize,
    outputSize,
    executionTimeMs: Math.round(performance.now() - start),
  };
}

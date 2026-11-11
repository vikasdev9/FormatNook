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

interface JsToken {
  type: 'word' | 'string' | 'comment' | 'regex' | 'op' | 'punct';
  value: string;
}

function tokenizeJavascript(code: string): JsToken[] {
  const tokens: JsToken[] = [];
  let i = 0;
  const len = code.length;
  let lastNonWs = '';

  while (i < len) {
    const ch = code[i];

    // Whitespace: skip (formatting controls indentation and token spacing)
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Single-line comment // ...
    if (ch === '/' && i + 1 < len && code[i + 1] === '/') {
      let val = '';
      while (i < len && code[i] !== '\n' && code[i] !== '\r') {
        val += code[i++];
      }
      tokens.push({ type: 'comment', value: val });
      lastNonWs = 'comment';
      continue;
    }

    // Multi-line comment /* ... */
    if (ch === '/' && i + 1 < len && code[i + 1] === '*') {
      let val = '/*';
      i += 2;
      while (i + 1 < len && !(code[i] === '*' && code[i + 1] === '/')) {
        val += code[i++];
      }
      if (i < len) val += code[i++];
      if (i < len) val += code[i++];
      tokens.push({ type: 'comment', value: val });
      lastNonWs = 'comment';
      continue;
    }

    // Single or Double quoted strings
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = quote;
      i++;
      while (i < len) {
        const c = code[i++];
        str += c;
        if (c === '\\' && i < len) {
          str += code[i++];
        } else if (c === quote) {
          break;
        }
      }
      tokens.push({ type: 'string', value: str });
      lastNonWs = 'string';
      continue;
    }

    // Template literals `...`
    if (ch === '`') {
      let str = '`';
      i++;
      let exprDepth = 0;
      while (i < len) {
        const c = code[i++];
        str += c;
        if (c === '\\' && i < len) {
          str += code[i++];
        } else if (c === '$' && i < len && code[i] === '{') {
          str += code[i++];
          exprDepth++;
        } else if (c === '}' && exprDepth > 0) {
          exprDepth--;
        } else if (c === '`' && exprDepth === 0) {
          break;
        }
      }
      tokens.push({ type: 'string', value: str });
      lastNonWs = 'string';
      continue;
    }

    // Regular Expression: /.../flags
    const regexPreceders = new Set([
      '(', '[', '{', ';', ',', '=', ':', '!', '&', '|', '?', '=>',
      'return', 'case', 'typeof', 'delete', 'void', 'throw', 'yield', 'await', 'default'
    ]);
    if (ch === '/' && (!lastNonWs || regexPreceders.has(lastNonWs))) {
      let reg = '/';
      i++;
      let inCharClass = false;
      while (i < len) {
        const c = code[i++];
        reg += c;
        if (c === '\\' && i < len) {
          reg += code[i++];
        } else if (c === '[' && !inCharClass) {
          inCharClass = true;
        } else if (c === ']' && inCharClass) {
          inCharClass = false;
        } else if (c === '/' && !inCharClass) {
          break;
        }
      }
      // Trailing regex flags (g, i, m, s, u, y, d)
      while (i < len && /[a-z]/i.test(code[i])) {
        reg += code[i++];
      }
      tokens.push({ type: 'regex', value: reg });
      lastNonWs = 'regex';
      continue;
    }

    // Identifiers, keywords, and numbers
    if (/[a-zA-Z0-9_$]/.test(ch)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) {
        word += code[i++];
      }
      tokens.push({ type: 'word', value: word });
      lastNonWs = word;
      continue;
    }

    // Multi-character operators
    const three = code.slice(i, i + 3);
    if (three === '===' || three === '!==' || three === '>>>') {
      tokens.push({ type: 'op', value: three });
      i += 3;
      lastNonWs = three;
      continue;
    }

    const two = code.slice(i, i + 2);
    const twoCharOps = new Set([
      '==', '!=', '>=', '<=', '=>', '&&', '||', '++', '--',
      '+=', '-=', '*=', '/=', '%=', '<<', '>>', '??', '**'
    ]);
    if (twoCharOps.has(two)) {
      tokens.push({ type: 'op', value: two });
      i += 2;
      lastNonWs = two;
      continue;
    }

    // Single character operators and punctuation
    const singleCharOps = new Set(['=', '+', '-', '*', '/', '%', '<', '>', '!', '&', '|', '^', '~', '?']);
    if (singleCharOps.has(ch)) {
      tokens.push({ type: 'op', value: ch });
    } else {
      tokens.push({ type: 'punct', value: ch });
    }
    lastNonWs = ch;
    i++;
  }

  return tokens;
}

function formatJsTokens(tokens: JsToken[], indentStr: string): string {
  let output = '';
  let depth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  const forParenStack: number[] = [];
  let atLineStart = true;
  let prevToken: JsToken | null = null;

  for (let idx = 0; idx < tokens.length; idx++) {
    const t = tokens[idx];
    const nextToken: JsToken | null = idx + 1 < tokens.length ? tokens[idx + 1] : null;

    // Handle Opening Brace {
    if (t.value === '{') {
      if (!atLineStart && output && !output.endsWith(' ') && !output.endsWith('\n')) {
        output += ' ';
      }
      output += '{';
      depth++;
      output += '\n';
      atLineStart = true;
      prevToken = t;
      continue;
    }

    // Handle Closing Brace }
    if (t.value === '}') {
      depth = Math.max(0, depth - 1);
      if (!output.endsWith('\n')) {
        output += '\n';
      }
      output += indentStr.repeat(depth) + '}';
      const keepOnSameLine =
        nextToken &&
        (nextToken.value === ';' ||
          nextToken.value === ',' ||
          nextToken.value === ')' ||
          nextToken.value === 'else' ||
          nextToken.value === 'catch' ||
          nextToken.value === 'finally');

      if (keepOnSameLine) {
        atLineStart = false;
      } else {
        output += '\n';
        atLineStart = true;
      }
      prevToken = t;
      continue;
    }

    // Handle Opening Bracket [
    if (t.value === '[') {
      bracketDepth++;
      if (prevToken && (prevToken.type === 'word' || prevToken.value === '=') && !output.endsWith(' ') && !output.endsWith('\n') && output.length > 0) {
        if (prevToken.value === '=') output += ' ';
      }
      output += '[';
      prevToken = t;
      continue;
    }

    // Handle Closing Bracket ]
    if (t.value === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      output += ']';
      prevToken = t;
      continue;
    }

    // Line indentation
    if (atLineStart) {
      output += indentStr.repeat(depth);
      atLineStart = false;
    }

    // Handle Opening Parenthesis (
    if (t.value === '(') {
      const keywordBeforeParen =
        prevToken && prevToken.type === 'word' && ['if', 'for', 'while', 'switch', 'catch'].includes(prevToken.value);
      if (keywordBeforeParen) {
        output += ' ';
      }
      parenDepth++;
      if (prevToken && prevToken.value === 'for') {
        forParenStack.push(parenDepth);
      }
      output += '(';
      prevToken = t;
      continue;
    }

    // Handle Closing Parenthesis )
    if (t.value === ')') {
      if (forParenStack.length > 0 && forParenStack[forParenStack.length - 1] === parenDepth) {
        forParenStack.pop();
      }
      parenDepth = Math.max(0, parenDepth - 1);
      output += ')';
      prevToken = t;
      continue;
    }

    // Handle Semicolon ;
    if (t.value === ';') {
      output += ';';
      const isInsideForHeader = forParenStack.length > 0;
      if (isInsideForHeader) {
        output += ' ';
      } else {
        output += '\n';
        atLineStart = true;
      }
      prevToken = t;
      continue;
    }

    // Handle Comma ,
    if (t.value === ',') {
      if (depth > 0 && parenDepth === 0 && bracketDepth === 0) {
        output += ',\n';
        atLineStart = true;
      } else {
        output += ', ';
      }
      prevToken = t;
      continue;
    }

    // Handle Colon :
    if (t.value === ':') {
      output += ': ';
      prevToken = t;
      continue;
    }

    // Handle Comments
    if (t.type === 'comment') {
      if (t.value.startsWith('//')) {
        if (!atLineStart && !output.endsWith(' ')) {
          output += ' ';
        }
        output += t.value + '\n';
        atLineStart = true;
      } else {
        if (!atLineStart && !output.endsWith(' ')) {
          output += ' ';
        }
        output += t.value;
        if (nextToken && nextToken.value !== ';') {
          output += ' ';
        }
      }
      prevToken = t;
      continue;
    }

    // Handle Operators
    if (t.type === 'op') {
      if (t.value === '++' || t.value === '--') {
        output += t.value;
      } else {
        if (!output.endsWith(' ') && !output.endsWith('\n') && output.length > 0) {
          output += ' ';
        }
        output += t.value + ' ';
      }
      prevToken = t;
      continue;
    }

    // Handle Control Keywords (return, const, let, var, function, etc.)
    const spaceKeywords = new Set([
      'return', 'const', 'let', 'var', 'function', 'import', 'export',
      'default', 'case', 'throw', 'yield', 'await', 'else', 'class',
      'extends', 'typeof', 'instanceof', 'new', 'delete', 'in', 'of'
    ]);
    if (t.type === 'word' && spaceKeywords.has(t.value)) {
      if (
        !output.endsWith(' ') &&
        !output.endsWith('\n') &&
        !output.endsWith('(') &&
        !output.endsWith('[') &&
        output.length > 0
      ) {
        output += ' ';
      }
      output += t.value;
      if (nextToken && nextToken.value !== ';' && nextToken.value !== '(' && nextToken.value !== ',') {
        output += ' ';
      }
      prevToken = t;
      continue;
    }

    // Default Token
    if (
      prevToken &&
      !output.endsWith(' ') &&
      !output.endsWith('\n') &&
      !output.endsWith('(') &&
      !output.endsWith('[') &&
      (prevToken.type === 'word' || prevToken.type === 'string' || prevToken.type === 'regex') &&
      (t.type === 'word' || t.type === 'string' || t.type === 'regex')
    ) {
      output += ' ';
    }
    output += t.value;
    prevToken = t;
  }

  return output.trimEnd();
}

/**
 * Formats JavaScript code with state-aware tokenization and indentation.
 * Correctly preserves strings with semicolons/braces, regex literals, and for (...) headers.
 */
export function formatJavascript(input: string, indent: IndentOption = '2'): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    const indentStr = getIndentSpaces(indent);
    const tokens = tokenizeJavascript(input);
    const finalOutput = formatJsTokens(tokens, indentStr);
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

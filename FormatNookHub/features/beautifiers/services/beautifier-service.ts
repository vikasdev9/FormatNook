import { format as formatSqlString } from 'sql-formatter';
import { IndentOption, ToolExecutionResult, ValidationIssue } from '@/types/tool';

export type BeautifierLanguage = 'html' | 'css' | 'javascript' | 'sql';

export interface SqlFormatOptions {
  indent?: IndentOption;
  keywordCase?: 'upper' | 'lower' | 'preserve';
}

export interface JsFormatOptions {
  indent?: IndentOption;
  quotes?: 'as-is' | 'single' | 'double';
  semicolons?: 'always' | 'as-is';
}

export interface CssFormatOptions {
  indent?: IndentOption;
  preserveComments?: boolean;
}

export interface HtmlFormatOptions {
  indent?: IndentOption;
  preserveComments?: boolean;
}

function getIndentSpaces(indent: IndentOption): string {
  if (indent === 'tab') return '\t';
  if (indent === '4') return '    ';
  return '  ';
}

/**
 * Formats SQL with capitalized keywords and structured clauses.
 */
export function formatSql(
  input: string,
  indentOrOptions: IndentOption | SqlFormatOptions = '2'
): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  const options: SqlFormatOptions =
    typeof indentOrOptions === 'object'
      ? indentOrOptions
      : { indent: indentOrOptions, keywordCase: 'upper' };
  const indent = options.indent || '2';
  const keywordCase = options.keywordCase || 'upper';

  try {
    const formatted = formatSqlString(input, {
      language: 'sql',
      tabWidth: indent === '4' ? 4 : 2,
      useTabs: indent === 'tab',
      keywordCase,
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
 * Tokenizes HTML into tags, comments, CDATA, and text nodes with full quote awareness.
 * Correctly treats '>' inside quoted attributes as attribute value content, not tag closers.
 */
export function tokenizeHtml(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    if (input[i] === '<') {
      // HTML comment: <!-- ... -->
      if (input.startsWith('<!--', i)) {
        const endComment = input.indexOf('-->', i + 4);
        if (endComment === -1) {
          const val = input.slice(i).trim();
          if (val) tokens.push(val);
          break;
        } else {
          const val = input.slice(i, endComment + 3).trim();
          if (val) tokens.push(val);
          i = endComment + 3;
          continue;
        }
      }

      // CDATA: <![CDATA[ ... ]]>
      if (input.startsWith('<![CDATA[', i)) {
        const endCdata = input.indexOf(']]>', i + 9);
        if (endCdata === -1) {
          const val = input.slice(i).trim();
          if (val) tokens.push(val);
          break;
        } else {
          const val = input.slice(i, endCdata + 3).trim();
          if (val) tokens.push(val);
          i = endCdata + 3;
          continue;
        }
      }

      // Tag scanning with quote awareness
      let inDouble = false;
      let inSingle = false;
      let j = i + 1;

      while (j < len) {
        const c = input[j];
        if (c === '\\' && (inDouble || inSingle)) {
          j += 2;
          continue;
        }
        if (c === '"' && !inSingle) {
          inDouble = !inDouble;
        } else if (c === "'" && !inDouble) {
          inSingle = !inSingle;
        } else if (c === '>' && !inDouble && !inSingle) {
          j++;
          break;
        }
        j++;
      }

      const tagToken = input.slice(i, j).trim();
      if (tagToken) {
        tokens.push(tagToken);
      }
      i = j;
    } else {
      // Text node
      let j = i;
      while (j < len && input[j] !== '<') {
        j++;
      }
      const text = input.slice(i, j).trim();
      if (text) {
        tokens.push(text);
      }
      i = j;
    }
  }

  return tokens;
}

/**
 * Formats HTML markup with hierarchical indentation and quote-aware tag parsing.
 */
export function formatHtml(
  input: string,
  indentOrOptions: IndentOption | HtmlFormatOptions = '2'
): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  const options: HtmlFormatOptions =
    typeof indentOrOptions === 'object'
      ? indentOrOptions
      : { indent: indentOrOptions, preserveComments: true };
  const indent = options.indent || '2';
  const preserveComments = options.preserveComments !== false;

  try {
    const indentStr = getIndentSpaces(indent);
    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
    ]);

    const rawTokens = tokenizeHtml(input);
    const tokens = preserveComments ? rawTokens : rawTokens.filter((t) => !t.startsWith('<!--'));

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
        const isSelfClosing =
          token.endsWith('/>') ||
          voidTags.has(tagName) ||
          token.startsWith('<!--') ||
          token.startsWith('<!') ||
          token.startsWith('<?');

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
export function formatCss(
  input: string,
  indentOrOptions: IndentOption | CssFormatOptions = '2'
): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  const options: CssFormatOptions =
    typeof indentOrOptions === 'object'
      ? indentOrOptions
      : { indent: indentOrOptions, preserveComments: true };
  const indent = options.indent || '2';
  const preserveComments = options.preserveComments !== false;

  try {
    const indentStr = getIndentSpaces(indent);

    let cleanInput = input;
    if (!preserveComments) {
      cleanInput = cleanInput.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // Normalize spacing around braces, semicolons, and colons
    let clean = cleanInput
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

function formatJsTokens(tokens: JsToken[], indentStr: string, options?: JsFormatOptions): string {
  let output = '';
  let depth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  const forParenStack: number[] = [];
  let atLineStart = true;
  let prevToken: JsToken | null = null;
  const quotesOption = options?.quotes || 'as-is';

  for (let idx = 0; idx < tokens.length; idx++) {
    const rawT = tokens[idx];
    const nextToken: JsToken | null = idx + 1 < tokens.length ? tokens[idx + 1] : null;

    // Quote conversion if requested
    let tokenValue = rawT.value;
    if (rawT.type === 'string' && quotesOption !== 'as-is') {
      if (quotesOption === 'single' && tokenValue.startsWith('"') && tokenValue.endsWith('"')) {
        const inner = tokenValue.slice(1, -1);
        if (!inner.includes("'")) {
          tokenValue = `'${inner}'`;
        }
      } else if (quotesOption === 'double' && tokenValue.startsWith("'") && tokenValue.endsWith("'")) {
        const inner = tokenValue.slice(1, -1);
        if (!inner.includes('"')) {
          tokenValue = `"${inner}"`;
        }
      }
    }
    const t: JsToken = { type: rawT.type, value: tokenValue };

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
export function formatJavascript(
  input: string,
  indentOrOptions: IndentOption | JsFormatOptions = '2'
): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  const options: JsFormatOptions =
    typeof indentOrOptions === 'object'
      ? indentOrOptions
      : { indent: indentOrOptions, quotes: 'as-is', semicolons: 'always' };
  const indent = options.indent || '2';

  try {
    const indentStr = getIndentSpaces(indent);
    const tokens = tokenizeJavascript(input);
    const finalOutput = formatJsTokens(tokens, indentStr, options);
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

/**
 * Minifies JavaScript code using state-aware tokenization to preserve literals and regex.
 */
export function minifyJavascript(input: string): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    const tokens = tokenizeJavascript(input);
    let output = '';
    let prevToken: JsToken | null = null;

    for (const t of tokens) {
      if (t.type === 'comment') continue;

      if (
        prevToken &&
        (prevToken.type === 'word' || prevToken.type === 'regex' || prevToken.type === 'string') &&
        (t.type === 'word' || t.type === 'regex' || t.type === 'string')
      ) {
        output += ' ';
      } else if (
        prevToken &&
        ((prevToken.value === '+' && t.value === '+') ||
          (prevToken.value === '-' && t.value === '-'))
      ) {
        output += ' ';
      }

      output += t.value;
      prevToken = t;
    }

    const finalOutput = output.trim();
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
      issues: [{ message: err?.message || 'Failed to minify JavaScript', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Minifies HTML by removing comments and collapsing whitespace while preserving pre/code elements.
 */
export function minifyHtml(input: string): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    const tokens = tokenizeHtml(input);
    let minified = '';
    let inPre = false;

    for (const token of tokens) {
      if (/^<pre\b/i.test(token) || /^<code\b/i.test(token)) {
        inPre = true;
      }
      if (/^<\/pre>/i.test(token) || /^<\/code>/i.test(token)) {
        inPre = false;
        minified += token;
        continue;
      }

      if (token.startsWith('<!--')) {
        if (token.startsWith('<!--[if')) {
          minified += token;
        }
        continue;
      }

      if (inPre) {
        minified += token;
      } else if (token.startsWith('<')) {
        minified += token.replace(/\s+/g, ' ');
      } else {
        const collapsed = token.replace(/\s+/g, ' ');
        if (collapsed.trim()) {
          minified += collapsed;
        }
      }
    }

    minified = minified.replace(/>\s+</g, '><').trim();
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
      issues: [{ message: err?.message || 'Failed to minify HTML', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Minifies CSS by removing comments, newlines, and collapsing whitespace around delimiters.
 */
export function minifyCss(input: string): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    let minified = input
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      .replace(/;}/g, '}')
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
  } catch (err: any) {
    return {
      output: input,
      isValid: false,
      issues: [{ message: err?.message || 'Failed to minify CSS', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Minifies SQL queries by stripping comments and normalizing whitespace outside string literals.
 */
export function minifySql(input: string): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    let inSingleQuote = false;
    let minified = '';
    let i = 0;
    const len = input.length;

    while (i < len) {
      if (!inSingleQuote && input[i] === '-' && input[i + 1] === '-') {
        while (i < len && input[i] !== '\n' && input[i] !== '\r') {
          i++;
        }
        continue;
      }

      if (!inSingleQuote && input[i] === '/' && input[i + 1] === '*') {
        i += 2;
        while (i + 1 < len && !(input[i] === '*' && input[i + 1] === '/')) {
          i++;
        }
        i += 2;
        continue;
      }

      const ch = input[i];
      if (ch === "'") {
        inSingleQuote = !inSingleQuote;
        minified += ch;
        i++;
        continue;
      }

      if (!inSingleQuote && /\s/.test(ch)) {
        if (!minified.endsWith(' ') && minified.length > 0) {
          minified += ' ';
        }
        i++;
        continue;
      }

      minified += ch;
      i++;
    }

    minified = minified
      .replace(/\s*([,()])\s*/g, '$1 ')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
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
  } catch (err: any) {
    return {
      output: input,
      isValid: false,
      issues: [{ message: err?.message || 'Failed to minify SQL', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Validates syntax and structure across JavaScript, HTML, CSS, and SQL.
 */
export function validateCode(
  input: string,
  language: BeautifierLanguage
): ToolExecutionResult {
  const start = performance.now();
  const inputSize = new Blob([input]).size;

  if (!input || !input.trim()) {
    return {
      output: '',
      isValid: false,
      issues: [{ message: 'Input is empty.', severity: 'warning' }],
      inputSize,
      outputSize: 0,
      executionTimeMs: 0,
    };
  }

  const issues: ValidationIssue[] = [];

  try {
    if (language === 'sql') {
      try {
        formatSqlString(input, { language: 'sql' });
      } catch (err: any) {
        issues.push({
          message: err?.message || 'SQL syntax error',
          severity: 'error',
        });
      }
    } else if (language === 'javascript') {
      try {
        if (/^\s*(import|export)\b/m.test(input)) {
          const tokens = tokenizeJavascript(input);
          let braceCount = 0;
          let parenCount = 0;
          for (const t of tokens) {
            if (t.value === '{') braceCount++;
            if (t.value === '}') braceCount--;
            if (t.value === '(') parenCount++;
            if (t.value === ')') parenCount--;
          }
          if (braceCount !== 0) {
            issues.push({ message: `Mismatched braces: ${braceCount > 0 ? 'unclosed {' : 'unexpected }'}`, severity: 'error' });
          }
          if (parenCount !== 0) {
            issues.push({ message: `Mismatched parentheses: ${parenCount > 0 ? 'unclosed (' : 'unexpected )'}`, severity: 'error' });
          }
        } else {
          new Function(input);
        }
      } catch (err: any) {
        issues.push({
          message: err?.message || 'JavaScript syntax error',
          severity: 'error',
        });
      }
    } else if (language === 'html') {
      const tokens = tokenizeHtml(input);
      const voidTags = new Set([
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
      ]);
      const tagStack: string[] = [];

      for (const token of tokens) {
        if (token.startsWith('</')) {
          const match = token.match(/^<\/([a-zA-Z0-9:-]+)/);
          if (match) {
            const closingTag = match[1].toLowerCase();
            if (tagStack.length === 0) {
              issues.push({ message: `Unexpected closing tag </${closingTag}> with no matching open tag.`, severity: 'error' });
            } else {
              const lastOpen = tagStack.pop();
              if (lastOpen !== closingTag) {
                issues.push({ message: `Mismatched tag: expected </${lastOpen}> but found </${closingTag}>.`, severity: 'error' });
              }
            }
          }
        } else if (token.startsWith('<') && !token.startsWith('<!--') && !token.startsWith('<!')) {
          const match = token.match(/^<([a-zA-Z0-9:-]+)/);
          if (match) {
            const tagName = match[1].toLowerCase();
            const isSelfClosing = token.endsWith('/>') || voidTags.has(tagName);
            if (!isSelfClosing) {
              tagStack.push(tagName);
            }
          }
        }
      }

      if (tagStack.length > 0) {
        issues.push({ message: `Unclosed tag(s): <${tagStack.join('>, <')}> at end of document.`, severity: 'error' });
      }
    } else if (language === 'css') {
      let braceCount = 0;
      let inComment = false;
      for (let i = 0; i < input.length; i++) {
        if (!inComment && input[i] === '/' && input[i + 1] === '*') {
          inComment = true;
          i++;
        } else if (inComment && input[i] === '*' && input[i + 1] === '/') {
          inComment = false;
          i++;
        } else if (!inComment) {
          if (input[i] === '{') braceCount++;
          if (input[i] === '}') braceCount--;
        }
      }
      if (inComment) {
        issues.push({ message: 'Unclosed comment /* found.', severity: 'error' });
      }
      if (braceCount !== 0) {
        issues.push({ message: `Mismatched CSS braces: ${braceCount > 0 ? 'unclosed {' : 'unexpected }'}.`, severity: 'error' });
      }
    }
  } catch (err: any) {
    issues.push({ message: err?.message || 'Validation error', severity: 'error' });
  }

  const isValid = issues.length === 0;
  return {
    output: input,
    isValid,
    issues,
    inputSize,
    outputSize: inputSize,
    executionTimeMs: Math.round(performance.now() - start),
  };
}

import { Json5ValidationResult } from '../types/json.types';
import { extractJsonErrorPosition } from './json-service';

/**
 * Token types for JSON5 lexical analysis
 */
type TokenType =
  | 'PUNCT'
  | 'STRING'
  | 'NUMBER'
  | 'IDENTIFIER'
  | 'KEYWORD'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

/**
 * Strips comments and normalizes JSON5 into valid strict JSON.
 * Returns { valid: boolean, jsonString: string, error?: string, line?: number, col?: number }
 */
export function convertJson5ToStandardJson(input: string): {
  valid: boolean;
  jsonString: string;
  error?: string;
  line?: number;
  col?: number;
} {
  if (!input || !input.trim()) {
    return { valid: false, jsonString: '', error: 'Input is empty' };
  }

  let i = 0;
  const len = input.length;
  let line = 1;
  let col = 1;
  let out = '';

  while (i < len) {
    const ch = input[i];

    // Track line and column numbers
    if (ch === '\n') {
      line++;
      col = 1;
      out += '\n';
      i++;
      continue;
    }
    if (ch === '\r') {
      if (i + 1 < len && input[i + 1] === '\n') {
        i += 2;
        line++;
        col = 1;
        out += '\r\n';
        continue;
      }
      line++;
      col = 1;
      out += '\r';
      i++;
      continue;
    }

    // Whitespace
    if (/\s/.test(ch)) {
      out += ch;
      i++;
      col++;
      continue;
    }

    // Single-line comment: //
    if (ch === '/' && i + 1 < len && input[i + 1] === '/') {
      i += 2;
      while (i < len && input[i] !== '\n' && input[i] !== '\r') {
        i++;
      }
      continue;
    }

    // Multi-line comment: /* ... */
    if (ch === '/' && i + 1 < len && input[i + 1] === '*') {
      i += 2;
      while (i + 1 < len && !(input[i] === '*' && input[i + 1] === '/')) {
        if (input[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;
      }
      if (i + 1 < len) {
        i += 2;
      } else {
        return { valid: false, jsonString: '', error: 'Unterminated multiline comment', line, col };
      }
      continue;
    }

    // Double-quoted string: "..."
    if (ch === '"') {
      let strVal = '"';
      i++;
      col++;
      let closed = false;
      while (i < len) {
        const c = input[i];
        if (c === '\\' && i + 1 < len) {
          const next = input[i + 1];
          // Handle escaped newline (multi-line string in JSON5)
          if (next === '\n' || next === '\r') {
            i += next === '\r' && i + 2 < len && input[i + 2] === '\n' ? 3 : 2;
            line++;
            col = 1;
            continue;
          }
          strVal += '\\' + next;
          i += 2;
          col += 2;
          continue;
        }
        if (c === '"') {
          strVal += '"';
          i++;
          col++;
          closed = true;
          break;
        }
        if (c === '\n' || c === '\r') {
          return { valid: false, jsonString: '', error: 'Unescaped line break in string literal', line, col };
        }
        strVal += c;
        i++;
        col++;
      }
      if (!closed) {
        return { valid: false, jsonString: '', error: 'Unclosed string literal', line, col };
      }
      out += strVal;
      continue;
    }

    // Single-quoted string: '...' (convert to valid double-quoted JSON string)
    if (ch === "'") {
      let strContent = '';
      i++;
      col++;
      let closed = false;
      while (i < len) {
        const c = input[i];
        if (c === '\\' && i + 1 < len) {
          const next = input[i + 1];
          if (next === '\n' || next === '\r') {
            i += next === '\r' && i + 2 < len && input[i + 2] === '\n' ? 3 : 2;
            line++;
            col = 1;
            continue;
          }
          if (next === "'") {
            strContent += "'";
          } else if (next === '"') {
            strContent += '\\"';
          } else {
            strContent += '\\' + next;
          }
          i += 2;
          col += 2;
          continue;
        }
        if (c === "'") {
          i++;
          col++;
          closed = true;
          break;
        }
        if (c === '"') {
          strContent += '\\"';
          i++;
          col++;
          continue;
        }
        if (c === '\n' || c === '\r') {
          return { valid: false, jsonString: '', error: 'Unescaped line break in string literal', line, col };
        }
        strContent += c;
        i++;
        col++;
      }
      if (!closed) {
        return { valid: false, jsonString: '', error: 'Unclosed single-quote string', line, col };
      }
      out += '"' + strContent + '"';
      continue;
    }

    // Number with explicit positive sign: +123, +.5
    if (ch === '+' && i + 1 < len && (/[\d\.]/.test(input[i + 1]))) {
      i++;
      col++;
      continue;
    }

    // Hexadecimal number: 0x... or 0X...
    if (ch === '0' && i + 1 < len && (input[i + 1] === 'x' || input[i + 1] === 'X')) {
      let hex = '0' + input[i + 1];
      i += 2;
      col += 2;
      while (i < len && /[0-9a-fA-F]/.test(input[i])) {
        hex += input[i];
        i++;
        col++;
      }
      const numVal = parseInt(hex, 16);
      out += String(numVal);
      continue;
    }

    // Leading decimal number: .5 -> 0.5
    if (ch === '.' && i + 1 < len && /\d/.test(input[i + 1])) {
      let numStr = '0.';
      i++;
      col++;
      while (i < len && /\d/.test(input[i])) {
        numStr += input[i];
        i++;
        col++;
      }
      out += numStr;
      continue;
    }

    // Trailing decimal number: 5. -> 5.0
    if (/\d/.test(ch)) {
      let numStr = '';
      while (i < len && /[\d.eE+-]/.test(input[i])) {
        numStr += input[i];
        i++;
        col++;
      }
      if (numStr.endsWith('.')) {
        numStr += '0';
      }
      out += numStr;
      continue;
    }

    // Identifiers (Unquoted keys or keywords like Infinity, NaN, true, false, null)
    if (/[a-zA-Z_$]/.test(ch)) {
      let ident = '';
      const startCol = col;
      while (i < len && /[a-zA-Z0-9_$]/.test(input[i])) {
        ident += input[i];
        i++;
        col++;
      }

      // Check if followed by colon (unquoted object key)
      let lookahead = i;
      while (lookahead < len && /\s/.test(input[lookahead])) {
        lookahead++;
      }
      if (lookahead < len && input[lookahead] === ':') {
        out += `"${ident}"`;
        continue;
      }

      // Keywords
      if (ident === 'true' || ident === 'false' || ident === 'null') {
        out += ident;
        continue;
      }

      if (ident === 'Infinity') {
        out += '1e+999';
        continue;
      }
      if (ident === 'NaN') {
        out += 'null';
        continue;
      }

      // If neither, try double-quoting identifier
      out += `"${ident}"`;
      continue;
    }

    // Punctuation
    out += ch;
    i++;
    col++;
  }

  // Final cleanup: remove trailing commas before closing braces/brackets
  out = out.replace(/,(\s*[}\]])/g, '$1');

  try {
    JSON.parse(out);
    return { valid: true, jsonString: out };
  } catch (err: any) {
    const rawMsg = err?.message || 'Invalid JSON5 syntax';
    const pos = extractJsonErrorPosition(rawMsg, out);
    return {
      valid: false,
      jsonString: out,
      error: rawMsg,
      line: pos.line,
      col: pos.column,
    };
  }
}

/**
 * Validates a JSON5 string.
 */
export function validateJson5(input: string): Json5ValidationResult {
  const res = convertJson5ToStandardJson(input);
  if (res.valid) {
    return { isValid: true };
  }
  return {
    isValid: false,
    error: res.error || 'Syntax error in JSON5 document',
    line: res.line,
    column: res.col,
  };
}

/**
 * Parses JSON5 into a JavaScript object.
 */
export function parseJson5(input: string): any {
  const res = convertJson5ToStandardJson(input);
  if (!res.valid) {
    throw new Error(res.error || 'Failed to parse JSON5');
  }
  return JSON.parse(res.jsonString);
}

/**
 * Formats JSON5 into clean, readable JSON5 string.
 */
export function formatJson5(input: string, indent: number | string = 2): string {
  const parsed = parseJson5(input);
  const indentVal = indent === 'tab' ? '\t' : Number(indent);
  return JSON.stringify(parsed, null, indentVal);
}

/**
 * Converts JSON5 to standard strict JSON.
 */
export function json5ToStandardJson(input: string, indent: number | string = 2): string {
  const parsed = parseJson5(input);
  const indentVal = indent === 'tab' ? '\t' : Number(indent);
  return JSON.stringify(parsed, null, indentVal);
}


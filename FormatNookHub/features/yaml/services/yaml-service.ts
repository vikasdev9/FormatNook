import yaml from 'js-yaml';
import { IndentOption, ValidationIssue, ToolExecutionResult } from '@/types/tool';
import { YamlDocumentInfo, YamlFormatOptions } from '../types/yaml.types';

export function getYamlIndentNumber(indent: IndentOption | number | string): number {
  if (typeof indent === 'number') return indent > 0 ? indent : 2;
  if (indent === '4') return 4;
  if (indent === '3') return 3;
  if (indent === '6') return 6;
  if (indent === '8') return 8;
  if (indent === '1') return 1;
  return 2;
}

/**
 * Splits a YAML stream into individual documents with accurate line coordinates.
 */
export function splitYamlDocuments(input: string): YamlDocumentInfo[] {
  if (!input || !input.trim()) return [];

  const lines = input.split('\n');
  const docSegments: { rawLines: string[]; startLine: number }[] = [];
  let currentDocLines: string[] = [];
  let currentStartLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // A document boundary is '---' on its own line (with optional trailing spaces or comment)
    if (/^---(?:\s+.*)?$/.test(line)) {
      if (currentDocLines.length > 0) {
        docSegments.push({ rawLines: currentDocLines, startLine: currentStartLine });
        currentDocLines = [];
      }
      currentStartLine = i + 1;
    } else {
      currentDocLines.push(line);
    }
  }

  if (currentDocLines.length > 0) {
    docSegments.push({ rawLines: currentDocLines, startLine: currentStartLine });
  }

  // If no document boundaries were found, the entire input is one document
  if (docSegments.length === 0) {
    docSegments.push({ rawLines: lines, startLine: 1 });
  }

  return docSegments.map((segment, index) => {
    const raw = segment.rawLines.join('\n');
    const endLine = segment.startLine + segment.rawLines.length - 1;

    try {
      const data = yaml.load(raw);
      return {
        index,
        raw,
        data,
        isValid: true,
        issues: [],
        startLine: segment.startLine,
        endLine,
      };
    } catch (err: any) {
      const localLine = err?.mark?.line !== undefined ? err.mark.line + 1 : 1;
      const column = err?.mark?.column !== undefined ? err.mark.column + 1 : 1;
      const globalLine = segment.startLine + localLine - 1;
      const message = err?.reason || err?.message || 'Invalid YAML syntax';

      return {
        index,
        raw,
        data: null,
        isValid: false,
        issues: [
          {
            line: globalLine,
            column,
            message: `Doc #${index + 1}: ${message}`,
            severity: 'error',
          },
        ],
        startLine: segment.startLine,
        endLine,
      };
    }
  });
}

/**
 * Checks for duplicate keys in a YAML mapping at the same indentation level.
 */
function findDuplicateKeys(input: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = input.split('\n');
  
  // Track keys by indentation level and document
  let currentDoc = 0;
  let levelMap = new Map<number, Map<string, number>>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^---(?:\s+.*)?$/.test(line)) {
      currentDoc++;
      levelMap.clear();
      continue;
    }

    // Skip empty lines or pure comment lines
    if (!line.trim() || /^\s*#/.test(line)) continue;

    // Match mapping key: e.g. "  foo:" or "  'foo':" or "  \"foo\":"
    const match = line.match(/^(\s*)(["']?[a-zA-Z0-9_\-./]+["']?)\s*:(?:\s+.*)?$/);
    if (match) {
      const indentLength = match[1].length;
      let rawKey = match[2];
      if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
        rawKey = rawKey.slice(1, -1);
      }

      // Clear any deeper indentation levels
      for (const [lvl] of levelMap) {
        if (lvl > indentLength) {
          levelMap.delete(lvl);
        }
      }

      let keysAtLevel = levelMap.get(indentLength);
      if (!keysAtLevel) {
        keysAtLevel = new Map<string, number>();
        levelMap.set(indentLength, keysAtLevel);
      }

      if (keysAtLevel.has(rawKey)) {
        const prevLine = keysAtLevel.get(rawKey)!;
        issues.push({
          line: i + 1,
          column: indentLength + 1,
          message: `Duplicate key '${rawKey}' detected (previously defined at line ${prevLine}). Later values will overwrite earlier ones.`,
          severity: 'warning',
        });
      } else {
        keysAtLevel.set(rawKey, i + 1);
      }
    }
  }

  return issues;
}

/**
 * Validates YAML strictly using js-yaml parser and static lint rules.
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

  const issues: ValidationIssue[] = [];

  // Check duplicate keys (warning level)
  const duplicateIssues = findDuplicateKeys(input);
  issues.push(...duplicateIssues);

  try {
    yaml.loadAll(input, undefined, { json: false });
    return {
      isValid: issues.filter((iss) => iss.severity === 'error').length === 0,
      issues,
    };
  } catch (err: any) {
    const line = err?.mark?.line !== undefined ? err.mark.line + 1 : undefined;
    const column = err?.mark?.column !== undefined ? err.mark.column + 1 : undefined;
    const message = err?.reason || err?.message || 'Invalid YAML syntax';

    issues.unshift({
      line,
      column,
      message: `YAMLException: ${message}`,
      severity: 'error',
    });

    return {
      isValid: false,
      issues,
    };
  }
}

/**
 * Formats YAML configuration with clean indentation, quotes, and key standardization.
 */
export function formatYaml(
  input: string,
  indent: IndentOption = '2',
  options?: YamlFormatOptions
): ToolExecutionResult {
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
    const indentNum = options?.indent ?? getYamlIndentNumber(indent);
    const dumpOptions: yaml.DumpOptions = {
      indent: indentNum,
      lineWidth: options?.lineWidth ?? -1,
      noRefs: true,
      sortKeys: options?.sortKeys ?? false,
      noArrayIndent: options?.noArrayIndent ?? false,
    };

    if (options?.quoteStyle === '"') {
      dumpOptions.quotingType = '"';
      dumpOptions.forceQuotes = true;
    } else if (options?.quoteStyle === "'") {
      dumpOptions.quotingType = "'";
      dumpOptions.forceQuotes = true;
    } else {
      // Default clean quoting
      dumpOptions.quotingType = '"';
    }

    if (options?.flowLevel !== undefined) {
      dumpOptions.flowLevel = options.flowLevel;
    }

    let formatted: string;

    if (docs.length === 0) {
      formatted = '';
    } else if (docs.length === 1) {
      const singleDoc = docs[0];
      formatted = singleDoc == null ? '' : yaml.dump(singleDoc, dumpOptions).trimEnd() + '\n';
    } else {
      const formattedDocs = docs.map((doc) => {
        if (doc == null) return '';
        return yaml.dump(doc, dumpOptions).trimEnd();
      });
      formatted = formattedDocs.join('\n---\n') + '\n';
    }

    const outputSize = new Blob([formatted]).size;

    return {
      output: formatted,
      isValid: true,
      issues: validation.issues,
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

/**
 * Minifies YAML using flow-style collections and collapsed whitespace.
 */
export function minifyYaml(input: string): ToolExecutionResult {
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
    const dumpOptions: yaml.DumpOptions = {
      flowLevel: 0,
      condenseFlow: true,
      lineWidth: -1,
      noRefs: true,
    };

    const minified = docs
      .map((d) => (d == null ? '' : yaml.dump(d, dumpOptions).trim()))
      .filter(Boolean)
      .join('\n---\n');

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
      issues: [{ message: err?.message || 'Failed to minify YAML', severity: 'error' }],
      inputSize,
      outputSize: inputSize,
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Converts YAML to a single-line flow expression.
 */
export function oneLineYaml(input: string): string {
  try {
    const docs = yaml.loadAll(input);
    const dumpOptions: yaml.DumpOptions = {
      flowLevel: 0,
      condenseFlow: true,
      lineWidth: -1,
      noRefs: true,
    };

    return docs
      .map((d) => {
        if (d == null) return '';
        const dumped = yaml.dump(d, dumpOptions).trim();
        return dumped.replace(/\s*\n\s*/g, ' ');
      })
      .filter(Boolean)
      .join(' --- ');
  } catch {
    return input.replace(/\s*\n\s*/g, ' ').trim();
  }
}

/**
 * Escapes YAML for embedding inside JSON or string literals.
 */
export function escapeYaml(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Unescapes JSON or string-literal escaped YAML.
 */
export function unescapeYaml(input: string): string {
  try {
    if ((input.startsWith('"') && input.endsWith('"')) || (input.startsWith("'") && input.endsWith("'"))) {
      try {
        return JSON.parse(input);
      } catch {
        // Fall back to manual unescape
      }
    }
    return input
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  } catch {
    return input;
  }
}

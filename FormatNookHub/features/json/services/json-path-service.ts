import { JsonPathMatch } from '../types/json.types';

export interface JsonSearchOptions {
  searchKeys?: boolean;
  searchValues?: boolean;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  typeFilter?: 'all' | 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';
  scopePath?: string;
}

/**
 * Advanced search across JSON keys and values with filtering and matching options.
 */
export function searchJson(data: any, query: string, options: JsonSearchOptions = {}): JsonPathMatch[] {
  if (!query || !query.trim() || data === null || data === undefined) {
    return [];
  }

  const {
    searchKeys = true,
    searchValues = true,
    caseSensitive = false,
    exactMatch = false,
    typeFilter = 'all',
    scopePath,
  } = options;

  const results: JsonPathMatch[] = [];
  const targetQuery = caseSensitive ? query.trim() : query.toLowerCase().trim();

  function checkMatch(target: string): boolean {
    const val = caseSensitive ? target : target.toLowerCase();
    return exactMatch ? val === targetQuery : val.includes(targetQuery);
  }

  function matchesType(val: any): boolean {
    if (typeFilter === 'all') return true;
    if (val === null) return typeFilter === 'null';
    if (Array.isArray(val)) return typeFilter === 'array';
    return typeof val === typeFilter;
  }

  function traverse(node: any, path: string) {
    if (node === null || node === undefined) {
      if (searchValues && matchesType(node) && checkMatch('null')) {
        results.push({ path: path || '$', value: null });
      }
      return;
    }

    if (Array.isArray(node)) {
      if (searchValues && matchesType(node) && checkMatch(`array[${node.length}]`)) {
        results.push({ path, value: node });
      }
      for (let i = 0; i < node.length; i++) {
        traverse(node[i], `${path}[${i}]`);
      }
      return;
    }

    if (typeof node === 'object') {
      for (const [key, val] of Object.entries(node)) {
        const curPath = path ? `${path}.${key}` : key;

        // Key match
        if (searchKeys && checkMatch(key)) {
          results.push({ path: curPath, value: val, key });
        }

        // Subtree match
        traverse(val, curPath);
      }
      return;
    }

    // Leaf value check
    if (searchValues && matchesType(node)) {
      if (checkMatch(String(node))) {
        results.push({ path: path || '$', value: node });
      }
    }
  }

  // Resolve scope path if specified
  let rootNode = data;
  let rootPath = '$';
  if (scopePath && scopePath !== '$') {
    try {
      const scopeMatches = evaluateJsonPath(data, scopePath);
      if (scopeMatches.length > 0) {
        rootNode = scopeMatches[0].value;
        rootPath = scopeMatches[0].path;
      }
    } catch {
      // Fall back to entire document if scope cannot be resolved
    }
  }

  traverse(rootNode, rootPath);
  return results.slice(0, 500); // Guard limit to prevent memory bloat on giant matches
}

/**
 * Validates a JSONPath query string syntax. Returns null if valid, or an error message string.
 */
export function validateJsonPathSyntax(expression: string): string | null {
  const expr = expression.trim();
  if (!expr) return 'JSONPath expression cannot be empty.';
  if (!expr.startsWith('$')) {
    return "JSONPath expressions must start with '$' root symbol (e.g. '$' or '$.store.book[*]').";
  }

  // Check brackets balance
  let openBrackets = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === '[') openBrackets++;
    if (expr[i] === ']') openBrackets--;
    if (openBrackets < 0) return 'Unexpected closing bracket "]" without matching opening bracket.';
  }
  if (openBrackets > 0) return 'Unclosed bracket "[" in JSONPath expression.';

  // Check for trailing dots or invalid syntax like '$.' or '$...'
  if (expr.endsWith('.') && expr !== '$.') {
    return 'JSONPath cannot end with a trailing dot.';
  }
  if (expr.includes('...')) {
    return 'Invalid wildcard "..." in JSONPath. Use "$..property" for recursive descent.';
  }

  return null;
}

/**
 * Evaluates standard JSONPath expressions against data.
 * Throws an Error with descriptive message if expression is syntactically invalid.
 */
export function evaluateJsonPath(data: any, pathExpression: string): JsonPathMatch[] {
  const syntaxErr = validateJsonPathSyntax(pathExpression);
  if (syntaxErr) {
    throw new Error(syntaxErr);
  }

  const expr = pathExpression.trim();
  if (!expr || expr === '$') {
    return [{ path: '$', value: data }];
  }

  const results: JsonPathMatch[] = [];

  // 1. Recursive descent: $..fieldName
  if (expr.startsWith('$..')) {
    const targetKey = expr.slice(3).replace(/[\[\]'"]/g, '');
    if (!targetKey) return [];

    function searchRecursive(node: any, curPath: string) {
      if (node === null || typeof node !== 'object') return;

      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          searchRecursive(node[i], `${curPath}[${i}]`);
        }
        return;
      }

      for (const [k, v] of Object.entries(node)) {
        const subPath = `${curPath}.${k}`;
        if (k === targetKey) {
          results.push({ path: subPath, value: v, key: k });
        }
        searchRecursive(v, subPath);
      }
    }

    searchRecursive(data, '$');
    return results;
  }

  // 2. Step-by-step path navigation
  // Normalize path tokens: $.store.book[0].title -> ['store', 'book', '0', 'title']
  const normalized = expr
    .replace(/^\$\.?/, '')
    .replace(/\[['"]?([^'"]+?)['"]?\]/g, '.$1')
    .split('.')
    .filter((part) => part.length > 0);

  function resolvePath(nodes: Array<{ val: any; path: string }>, remainingTokens: string[]): Array<{ val: any; path: string }> {
    if (remainingTokens.length === 0) return nodes;
    const [token, ...rest] = remainingTokens;

    const nextNodes: Array<{ val: any; path: string }> = [];

    for (const { val, path } of nodes) {
      if (val === null || val === undefined) continue;

      if (token === '*') {
        if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            nextNodes.push({ val: val[i], path: `${path}[${i}]` });
          }
        } else if (typeof val === 'object') {
          for (const [k, v] of Object.entries(val)) {
            nextNodes.push({ val: v, path: `${path}.${k}` });
          }
        }
      } else if (Array.isArray(val) && /^\d+$/.test(token)) {
        const idx = parseInt(token, 10);
        if (idx in val) {
          nextNodes.push({ val: val[idx], path: `${path}[${idx}]` });
        }
      } else if (typeof val === 'object' && token in val) {
        nextNodes.push({ val: val[token], path: `${path}.${token}` });
      }
    }

    return resolvePath(nextNodes, rest);
  }

  const matches = resolvePath([{ val: data, path: '$' }], normalized);

  for (const m of matches) {
    results.push({ path: m.path, value: m.val });
  }

  return results;
}

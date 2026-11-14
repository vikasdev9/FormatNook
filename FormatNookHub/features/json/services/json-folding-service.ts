export interface JsonFoldingRange {
  startLine: number; // 1-based line number
  endLine: number;   // 1-based line number
  type: 'object' | 'array';
  depth: number;     // 1-based structural depth
  itemCount: number; // Number of direct properties (object) or elements (array)
}

/**
 * Fast, single-pass O(N) structural scanner to detect all collapsible object and array ranges.
 * Fully quote and escape-aware: accurately ignores braces, brackets, and colons inside string values.
 */
export function computeFoldingRanges(jsonText: string): JsonFoldingRange[] {
  if (!jsonText || typeof jsonText !== 'string') return [];

  const ranges: JsonFoldingRange[] = [];
  const stack: {
    type: 'object' | 'array';
    startLine: number;
    depth: number;
    itemCount: number;
    hasContent: boolean;
  }[] = [];

  let currentLine = 1;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < jsonText.length; i++) {
    const ch = jsonText[i];

    // Handle Newlines
    if (ch === '\n') {
      currentLine++;
      continue;
    }
    if (ch === '\r') {
      if (jsonText[i + 1] === '\n') {
        i++;
        currentLine++;
      } else {
        currentLine++;
      }
      continue;
    }

    // Handle String literals and escape sequences
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    // Ignore single-line comments in JSON5 or relaxed JSON
    if (ch === '/' && jsonText[i + 1] === '/') {
      while (i < jsonText.length && jsonText[i] !== '\n' && jsonText[i] !== '\r') {
        i++;
      }
      currentLine++;
      continue;
    }

    // Structural Open: Object
    if (ch === '{') {
      const parentDepth = stack.length > 0 ? stack[stack.length - 1].depth : 0;
      stack.push({
        type: 'object',
        startLine: currentLine,
        depth: parentDepth + 1,
        itemCount: 0,
        hasContent: false,
      });
      continue;
    }

    // Structural Open: Array
    if (ch === '[') {
      const parentDepth = stack.length > 0 ? stack[stack.length - 1].depth : 0;
      stack.push({
        type: 'array',
        startLine: currentLine,
        depth: parentDepth + 1,
        itemCount: 0,
        hasContent: false,
      });
      continue;
    }

    // Structural Close: Object
    if (ch === '}') {
      if (stack.length > 0 && stack[stack.length - 1].type === 'object') {
        const top = stack.pop()!;
        if (top.hasContent && top.itemCount === 0) {
          top.itemCount = 1;
        }
        if (currentLine > top.startLine) {
          ranges.push({
            startLine: top.startLine,
            endLine: currentLine,
            type: 'object',
            depth: top.depth,
            itemCount: top.itemCount,
          });
        }
      }
      continue;
    }

    // Structural Close: Array
    if (ch === ']') {
      if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
        const top = stack.pop()!;
        if (top.hasContent) {
          top.itemCount = top.itemCount + 1;
        }
        if (currentLine > top.startLine) {
          ranges.push({
            startLine: top.startLine,
            endLine: currentLine,
            type: 'array',
            depth: top.depth,
            itemCount: top.itemCount,
          });
        }
      }
      continue;
    }

    // Count properties / items inside current structure
    if (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (ch === ':') {
        // In an object, each colon indicates a key-value property
        if (current.type === 'object') {
          current.itemCount++;
          current.hasContent = true;
        }
      } else if (ch === ',') {
        // In an array, commas delimit items
        if (current.type === 'array') {
          current.itemCount++;
          current.hasContent = true;
        }
      } else if (!/\s/.test(ch)) {
        current.hasContent = true;
      }
    }
  }

  // Sort ranges by startLine ascending
  return ranges.sort((a, b) => a.startLine - b.startLine);
}

/**
 * Filter ranges that should be folded to achieve "Fold to Level N".
 * In Monaco / editor folding conventions:
 * - "Fold Level 1": folds nodes at depth >= 1
 * - "Fold Level 2": folds nodes at depth >= 2 (leaving level 1 expanded)
 * - "Fold Level 3": folds nodes at depth >= 3 (leaving levels 1 and 2 expanded)
 */
export function getRangesToFoldForLevel(
  ranges: JsonFoldingRange[],
  targetLevel: number
): JsonFoldingRange[] {
  if (targetLevel <= 0) return [];
  return ranges.filter((r) => r.depth >= targetLevel);
}

/**
 * Returns a readable inline badge summary for collapsed nodes (e.g. "{ 3 props }" or "[ 12 items ]").
 */
export function getCollapsedSummary(range: JsonFoldingRange): string {
  if (range.type === 'array') {
    return `[ ... ${range.itemCount} ${range.itemCount === 1 ? 'item' : 'items'} ]`;
  }
  return `{ ... ${range.itemCount} ${range.itemCount === 1 ? 'prop' : 'props'} }`;
}

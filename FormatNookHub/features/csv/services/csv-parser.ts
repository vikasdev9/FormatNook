/**
 * RFC 4180 Compliant CSV Parser Engine & Header Detection
 * FormatNook Hub - Universal Developer Platform
 */

import {
  CsvDelimiter,
  CsvParseOptions,
  CsvParseResult,
  CsvRowError,
  DuplicateHeaderStrategy,
  HeaderMode,
} from '../types/csv.types';

/**
 * Detect the most likely delimiter from sample lines of text.
 */
export function detectDelimiter(text: string): string {
  if (!text || !text.trim()) return ',';

  // Strip BOM if present
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const delimiters: CsvDelimiter[] = [',', ';', '\t', '|'];
  const lines = clean.split(/\r?\n/).slice(0, 10).filter((l) => l.trim().length > 0);

  if (lines.length === 0) return ',';

  let bestDelimiter = ',';
  let bestScore = -1;

  for (const d of delimiters) {
    let totalCount = 0;
    const counts: number[] = [];

    for (const line of lines) {
      // Ignore occurrences inside quotes for accurate delimiter detection
      let outsideCount = 0;
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQuote = !inQuote;
        } else if (line[i] === d && !inQuote) {
          outsideCount++;
        }
      }
      totalCount += outsideCount;
      counts.push(outsideCount);
    }

    if (totalCount > 0) {
      // Check consistency (low standard deviation across rows is preferred)
      const avg = totalCount / lines.length;
      const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / lines.length;
      const score = totalCount / (1 + variance);

      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = d;
      }
    }
  }

  return bestDelimiter;
}

/**
 * Heuristic to detect whether the first row contains headers.
 */
export function detectHeaders(rawRows: string[][]): {
  hasHeader: boolean;
  confidence: number;
  reason: string;
} {
  if (!rawRows || rawRows.length === 0) {
    return { hasHeader: false, confidence: 0, reason: 'Empty dataset' };
  }

  if (rawRows.length === 1) {
    return {
      hasHeader: true,
      confidence: 0.5,
      reason: 'Single row dataset; defaulting to treating as headers.',
    };
  }

  const row0 = rawRows[0];
  const dataRows = rawRows.slice(1, Math.min(rawRows.length, 10));

  if (row0.length === 0) {
    return { hasHeader: false, confidence: 0, reason: 'First row has no cells.' };
  }

  let row0NumericCount = 0;
  let row0BooleanCount = 0;
  let row0EmptyCount = 0;

  for (const cell of row0) {
    const trimmed = cell.trim();
    if (!trimmed) {
      row0EmptyCount++;
    } else if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
      row0NumericCount++;
    } else if (/^(true|false|yes|no)$/i.test(trimmed)) {
      row0BooleanCount++;
    }
  }

  // If first row has multiple numbers or booleans, it's very likely data, not headers
  if (row0NumericCount > 0 || row0BooleanCount > 0) {
    return {
      hasHeader: false,
      confidence: 0.9,
      reason: `First row contains numeric or boolean values (${row0NumericCount} numbers, ${row0BooleanCount} booleans), typical of data records.`,
    };
  }

  // Check subsequent rows for types
  let subsequentNumericCount = 0;
  let subsequentTotalCells = 0;

  for (const row of dataRows) {
    for (const cell of row) {
      const trimmed = cell.trim();
      subsequentTotalCells++;
      if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
        subsequentNumericCount++;
      }
    }
  }

  const subsequentNumericRatio = subsequentTotalCells > 0 ? subsequentNumericCount / subsequentTotalCells : 0;

  // Distinct values in row 0
  const uniqueNames = new Set(row0.map((c) => c.trim().toLowerCase()));
  const isAllUnique = uniqueNames.size === row0.length;

  if (row0NumericCount === 0 && subsequentNumericRatio > 0.1 && isAllUnique) {
    return {
      hasHeader: true,
      confidence: 0.95,
      reason: 'First row contains unique textual titles, while subsequent rows contain numeric records.',
    };
  }

  return {
    hasHeader: true,
    confidence: 0.75,
    reason: 'First row values appear textual and distinct; categorized as headers.',
  };
}

/**
 * Sanitize and resolve duplicate header names according to the selected strategy.
 */
export function resolveHeaders(
  rawHeaderRow: string[],
  strategy: DuplicateHeaderStrategy = 'numeric-suffix'
): { headers: string[]; errors: string[] } {
  const headers: string[] = [];
  const errors: string[] = [];
  const counts: Record<string, number> = {};

  for (let i = 0; i < rawHeaderRow.length; i++) {
    let name = rawHeaderRow[i].trim();
    if (!name) {
      name = `column_${i + 1}`;
    }

    const lower = name.toLowerCase();
    if (counts[lower] === undefined) {
      counts[lower] = 1;
      headers.push(name);
    } else {
      counts[lower]++;
      if (strategy === 'reject') {
        errors.push(`Duplicate header '${name}' detected at column ${i + 1}.`);
        headers.push(name);
      } else if (strategy === 'rename-duplicates') {
        headers.push(`${name}_dup${counts[lower] - 1}`);
      } else {
        // numeric-suffix default: 'name_2', 'name_3', etc.
        headers.push(`${name}_${counts[lower]}`);
      }
    }
  }

  return { headers, errors };
}

/**
 * State machine parser adhering to RFC 4180 specification.
 */
export function parseCsv(text: string, options: CsvParseOptions = {}): CsvParseResult {
  const errors: CsvRowError[] = [];
  const warnings: string[] = [];

  if (!text || text.length === 0) {
    return {
      rawRows: [],
      headers: [],
      detectedDelimiter: ',',
      hasDetectedHeader: false,
      detectedHeaderReason: 'Input is empty.',
      totalRows: 0,
      totalColumns: 0,
      emptyCellsCount: 0,
      errors: [],
      warnings: [],
    };
  }

  // 1. Strip UTF-8 BOM if present
  let input = text;
  if (input.charCodeAt(0) === 0xfeff) {
    input = input.slice(1);
  }

  // 2. Resolve delimiter
  const resolvedDelimiter =
    options.customDelimiter && options.customDelimiter.length > 0
      ? options.customDelimiter
      : options.delimiter || detectDelimiter(input);

  const trimWhitespace = options.trimWhitespace ?? false;
  const skipEmptyRows = options.skipEmptyRows ?? true;

  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let hasQuotesInCell = false;
  let currentLineNumber = 1;
  let rowStartLine = 1;
  let emptyCellsCount = 0;

  const pushCell = () => {
    let val = currentCell;
    if (trimWhitespace && !hasQuotesInCell) {
      val = val.trim();
    }
    if (val === '') {
      emptyCellsCount++;
    }
    currentRow.push(val);
    currentCell = '';
    hasQuotesInCell = false;
  };

  const pushRow = () => {
    pushCell();
    const isAllEmpty = currentRow.every((c) => c.trim().length === 0);
    if (!isAllEmpty || !skipEmptyRows) {
      rawRows.push(currentRow);
    }
    currentRow = [];
    rowStartLine = currentLineNumber + 1;
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (char === '\n') {
      currentLineNumber++;
    }

    if (char === '"') {
      hasQuotesInCell = true;
      if (inQuotes) {
        if (nextChar === '"') {
          // Escaped double-quote: "" -> "
          currentCell += '"';
          i++;
        } else {
          // End of quoted block
          inQuotes = false;
        }
      } else {
        // Start of quoted block
        inQuotes = true;
      }
    } else if (char === resolvedDelimiter && !inQuotes) {
      pushCell();
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
        currentLineNumber++;
      }
      pushRow();
    } else {
      currentCell += char;
    }
  }

  // Handle unclosed quotes at EOF
  if (inQuotes) {
    errors.push({
      rowIndex: rawRows.length + 1,
      lineNumber: rowStartLine,
      message: `Unclosed double-quote detected starting near line ${rowStartLine}.`,
    });
  }

  // Push remaining cells/rows
  if (currentCell.length > 0 || currentRow.length > 0) {
    pushRow();
  }

  // Calculate dimensions
  const totalRows = rawRows.length;
  let maxColumns = 0;
  for (const r of rawRows) {
    if (r.length > maxColumns) maxColumns = r.length;
  }

  // Check for ragged rows (inconsistent column counts)
  if (totalRows > 1) {
    const expectedCols = rawRows[0].length;
    for (let r = 1; r < totalRows; r++) {
      if (rawRows[r].length !== expectedCols) {
        warnings.push(
          `Row ${r + 1} has ${rawRows[r].length} columns (expected ${expectedCols}).`
        );
      }
    }
  }

  // 3. Resolve Header Mode
  const headerMode: HeaderMode = options.headerMode || 'first-row';
  const autoDetect = detectHeaders(rawRows);
  let effectiveHeaderMode = headerMode;

  if (headerMode === 'auto') {
    effectiveHeaderMode = autoDetect.hasHeader ? 'first-row' : 'none';
  }

  let headers: string[] = [];
  let dataRows = rawRows;

  if (effectiveHeaderMode === 'first-row' && rawRows.length > 0) {
    const { headers: sanitizedHeaders, errors: headerErrors } = resolveHeaders(
      rawRows[0],
      options.duplicateStrategy || 'numeric-suffix'
    );
    headers = sanitizedHeaders;
    for (const hErr of headerErrors) {
      errors.push({
        rowIndex: 1,
        lineNumber: 1,
        message: hErr,
      });
    }
    dataRows = rawRows.slice(1);
  } else {
    // Generate default column names column_1, column_2, ...
    for (let c = 0; c < maxColumns; c++) {
      headers.push(`column_${c + 1}`);
    }
  }

  return {
    rawRows: dataRows,
    headers,
    detectedDelimiter: resolvedDelimiter,
    hasDetectedHeader: autoDetect.hasHeader,
    detectedHeaderReason: autoDetect.reason,
    totalRows: dataRows.length,
    totalColumns: maxColumns,
    emptyCellsCount,
    errors,
    warnings,
  };
}

import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff } from '../diff-service';

export interface CsvCellDiff {
  rowIndex: number;
  column: string;
  oldValue: string;
  newValue: string;
}

export class CsvEngine implements DiffEngine {
  readonly format = 'csv';

  compare(input: DiffEngineInput): DiffEngineResult {
    const { originalText, modifiedText, options } = input;

    const isEmptyOriginal = !originalText || !originalText.trim();
    const isEmptyModified = !modifiedText || !modifiedText.trim();

    if (isEmptyOriginal && isEmptyModified) {
      return {
        lines: [],
        statistics: {
          totalLines: 0,
          addedLines: 0,
          removedLines: 0,
          modifiedLines: 0,
          unchangedLines: 0,
          differencePercentage: 0,
        },
        isIdentical: true,
        isEmpty: true,
        unifiedDiffText: '',
        format: 'csv',
        detectedFormat: 'csv',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    const delimiter = this.detectDelimiter(originalText) || this.detectDelimiter(modifiedText) || ',';

    const parsedOrig = this.parseCsv(originalText, delimiter);
    const parsedMod = this.parseCsv(modifiedText, delimiter);

    const headersA = parsedOrig[0] || [];
    const headersB = parsedMod[0] || [];

    const rowsA = parsedOrig.slice(1);
    const rowsB = parsedMod.slice(1);

    // Identify header changes
    const removedHeaders = headersA.filter((h) => !headersB.includes(h));
    const addedHeaders = headersB.filter((h) => !headersA.includes(h));

    // Compare rows & cells
    const cellChanges: CsvCellDiff[] = [];
    let addedRowCount = 0;
    let removedRowCount = 0;
    let modifiedRowCount = 0;
    let unchangedRowCount = 0;

    if (options.ignoreRowOrder) {
      // Set-based / hash matching for unordered rows
      const modRowsPool = rowsB.map((r, idx) => ({ row: r, idx, used: false, str: r.join(delimiter) }));
      const origRowsPool = rowsA.map((r, idx) => ({ row: r, idx, used: false, str: r.join(delimiter) }));

      // Exact matches
      for (const orig of origRowsPool) {
        const exactMatch = modRowsPool.find((m) => !m.used && m.str === orig.str);
        if (exactMatch) {
          orig.used = true;
          exactMatch.used = true;
          unchangedRowCount++;
        }
      }

      // Partial / modified matches
      for (const orig of origRowsPool.filter((o) => !o.used)) {
        let bestMatch: (typeof modRowsPool)[0] | null = null;
        let highestMatches = -1;

        for (const mod of modRowsPool.filter((m) => !m.used)) {
          let matchingCells = 0;
          const maxCols = Math.min(orig.row.length, mod.row.length);
          for (let c = 0; c < maxCols; c++) {
            if (orig.row[c] === mod.row[c]) matchingCells++;
          }
          if (matchingCells > highestMatches) {
            highestMatches = matchingCells;
            bestMatch = mod;
          }
        }

        if (bestMatch && highestMatches > 0) {
          orig.used = true;
          bestMatch.used = true;
          modifiedRowCount++;
          const maxCols = Math.max(orig.row.length, bestMatch.row.length);
          for (let c = 0; c < maxCols; c++) {
            const valA = orig.row[c] ?? '';
            const valB = bestMatch.row[c] ?? '';
            if (valA !== valB) {
              const colName = headersB[c] || headersA[c] || `Col ${c + 1}`;
              cellChanges.push({ rowIndex: orig.idx + 1, column: colName, oldValue: valA, newValue: valB });
            }
          }
        } else {
          removedRowCount++;
        }
      }

      addedRowCount = modRowsPool.filter((m) => !m.used).length;
    } else {
      // Ordered comparison
      const maxRows = Math.max(rowsA.length, rowsB.length);
      for (let r = 0; r < maxRows; r++) {
        const rowA = rowsA[r];
        const rowB = rowsB[r];

        if (!rowB) {
          removedRowCount++;
        } else if (!rowA) {
          addedRowCount++;
        } else {
          let hasDiff = false;
          const maxCols = Math.max(rowA.length, rowB.length);
          for (let c = 0; c < maxCols; c++) {
            const valA = rowA[c] ?? '';
            const valB = rowB[c] ?? '';
            if (valA !== valB) {
              hasDiff = true;
              const colName = headersB[c] || headersA[c] || `Col ${c + 1}`;
              cellChanges.push({ rowIndex: r + 1, column: colName, oldValue: valA, newValue: valB });
            }
          }
          if (hasDiff) {
            modifiedRowCount++;
          } else {
            unchangedRowCount++;
          }
        }
      }
    }

    // Format normalized CSV for clean line/word diff
    const normalizedOrig = this.formatRows(parsedOrig, delimiter);
    const normalizedMod = this.formatRows(parsedMod, delimiter);

    const diffResult = computeRawTextDiff(normalizedOrig, normalizedMod, {
      ...options,
      format: 'text',
    });

    return {
      ...diffResult,
      format: 'csv',
      detectedFormat: 'csv',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'csv',
        summary: `${cellChanges.length} cell differences found across ${Math.max(rowsA.length, rowsB.length)} rows.`,
        details: {
          delimiter,
          headers: {
            original: headersA,
            modified: headersB,
            added: addedHeaders,
            removed: removedHeaders,
          },
          rowStats: {
            addedRows: addedRowCount,
            removedRows: removedRowCount,
            modifiedRows: modifiedRowCount,
            unchangedRows: unchangedRowCount,
          },
          cellChanges: cellChanges.slice(0, 100), // First 100 cell changes
        },
      },
    };
  }

  /**
   * Detect most common CSV delimiter.
   */
  detectDelimiter(text: string): string {
    const delimiters = [',', ';', '\t', '|'];
    const lines = text.split('\n').slice(0, 5).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return ',';

    let bestDelimiter = ',';
    let maxCount = -1;

    for (const d of delimiters) {
      let total = 0;
      for (const line of lines) {
        total += (line.split(d).length - 1);
      }
      if (total > maxCount) {
        maxCount = total;
        bestDelimiter = d;
      }
    }

    return maxCount > 0 ? bestDelimiter : ',';
  }

  /**
   * RFC 4180 compliant CSV parser with quote escaping support.
   */
  parseCsv(text: string, delimiter = ','): string[][] {
    if (!text || !text.trim()) return [];
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  private formatRows(rows: string[][], delimiter: string): string {
    return rows
      .map((row) =>
        row
          .map((cell) => {
            if (cell.includes(delimiter) || cell.includes('"') || cell.includes('\n')) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(delimiter)
      )
      .join('\n');
  }
}

export const csvEngine = new CsvEngine();

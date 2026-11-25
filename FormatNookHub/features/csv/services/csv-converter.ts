/**
 * CSV to JSON Conversion Engine
 * FormatNook Hub - Universal Developer Platform
 */

import {
  ColumnType,
  CsvConversionResult,
  CsvParseOptions,
  CsvParseResult,
} from '../types/csv.types';

/**
 * Determine if a numeric-looking string has a significant leading zero (like zip codes or IDs)
 */
function hasSignificantLeadingZero(val: string): boolean {
  if (val.length <= 1) return false;
  if (val.startsWith('0') && val[1] >= '0' && val[1] <= '9') return true;
  if (val.startsWith('-0') && val[2] >= '0' && val[2] <= '9') return true;
  return false;
}

/**
 * Convert a single cell string to typed value according to mode and column type
 */
export function convertCellValue(
  val: string,
  targetType: ColumnType | 'auto',
  emptyAsNull = false
): any {
  // Empty value handling
  if (val === '') {
    return emptyAsNull ? null : '';
  }

  if (targetType === 'string') {
    return val;
  }

  if (targetType === 'null') {
    return null;
  }

  if (targetType === 'boolean') {
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
    return val; // If not valid boolean, do not destroy value
  }

  if (targetType === 'integer') {
    const trimmed = val.trim();
    if (/^-?\d+$/.test(trimmed) && !hasSignificantLeadingZero(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      return Number.isSafeInteger(parsed) ? parsed : val;
    }
    return val;
  }

  if (targetType === 'number') {
    const trimmed = val.trim();
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed) && !hasSignificantLeadingZero(trimmed)) {
      const parsed = Number(trimmed);
      return !isNaN(parsed) && isFinite(parsed) ? parsed : val;
    }
    return val;
  }

  // Automatic type detection
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();

  // Boolean auto-detection
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  // Null auto-detection
  if (lower === 'null') return null;

  // Number auto-detection (preserve leading zeros in identifiers e.g. "0123")
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    if (hasSignificantLeadingZero(trimmed)) {
      return val; // Preserve as string for zip codes/IDs
    }
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
  }

  return val;
}

/**
 * Set a nested property on an object using a dot-delimited path, detecting conflicts
 */
function setNestedProperty(
  target: Record<string, any>,
  path: string,
  value: any,
  errors: string[]
): void {
  const parts = path.split('.');
  let current = target;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    } else if (typeof current[part] !== 'object' || current[part] === null) {
      errors.push(
        `Conflicting nested path: '${parts.slice(0, i + 1).join('.')}' is already a primitive value, cannot attach child '${parts[i + 1]}'.`
      );
      return;
    }
    current = current[part];
  }

  const lastKey = parts[parts.length - 1];
  if (current[lastKey] !== undefined && typeof current[lastKey] === 'object' && current[lastKey] !== null) {
    errors.push(
      `Conflicting nested path: '${path}' is already an object, cannot overwrite with primitive value.`
    );
  } else {
    current[lastKey] = value;
  }
}

/**
 * Convert parsed CSV results into structured JSON
 */
export function convertCsvToJson(
  parseResult: CsvParseResult,
  options: CsvParseOptions = {}
): CsvConversionResult {
  const start = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  const { rawRows, headers } = parseResult;
  const outputMode = options.outputMode || 'array-of-objects';
  const emptyAsNull = options.emptyValueHandling === 'null';
  const typeMode = options.typeConversionMode || 'auto';
  const columnConfigs = options.columnConfigs || {};
  const isNested = options.nestedJson ?? false;

  // Determine active columns (filtering excluded columns & renaming)
  const activeColumns: {
    index: number;
    originalHeader: string;
    targetKey: string;
    type: ColumnType | 'auto';
  }[] = [];

  for (let i = 0; i < headers.length; i++) {
    const originalHeader = headers[i];
    const cfg = columnConfigs[originalHeader];
    if (cfg && cfg.included === false) {
      continue;
    }

    activeColumns.push({
      index: i,
      originalHeader,
      targetKey: cfg?.targetKey?.trim() || originalHeader,
      type: typeMode === 'custom' && cfg ? cfg.type : typeMode === 'string' ? 'string' : 'auto',
    });
  }

  let finalData: any;

  if (outputMode === 'array-of-arrays') {
    const rowsArray: any[][] = [];
    // Include headers row
    rowsArray.push(activeColumns.map((col) => col.targetKey));

    for (let r = 0; r < rawRows.length; r++) {
      const row = rawRows[r];
      const rowValues: any[] = [];
      for (const col of activeColumns) {
        const rawVal = row[col.index] ?? '';
        rowValues.push(convertCellValue(rawVal, col.type, emptyAsNull));
      }
      rowsArray.push(rowValues);
    }
    finalData = rowsArray;
  } else if (outputMode === 'object-keyed') {
    const keyColName = options.keyColumn || activeColumns[0]?.originalHeader;
    const keyColIndex = headers.indexOf(keyColName);

    if (keyColIndex === -1 && activeColumns.length > 0) {
      errors.push(`Selected key column '${keyColName}' was not found in headers.`);
    }

    const keyedObj: Record<string, any> = {};
    const seenKeys: Record<string, number> = {};

    for (let r = 0; r < rawRows.length; r++) {
      const row = rawRows[r];
      const rawKey = (keyColIndex !== -1 ? row[keyColIndex] : '')?.trim() || `row_${r + 1}`;
      let finalKey = rawKey;

      if (seenKeys[rawKey] !== undefined) {
        seenKeys[rawKey]++;
        if (options.duplicateKeyStrategy === 'append-suffix') {
          finalKey = `${rawKey}_${seenKeys[rawKey]}`;
        } else {
          errors.push(
            `Duplicate row key '${rawKey}' at row ${r + 1}. Record was not overwritten.`
          );
          continue;
        }
      } else {
        seenKeys[rawKey] = 1;
      }

      const rowObj: Record<string, any> = {};
      for (const col of activeColumns) {
        if (col.index === keyColIndex) continue; // Skip key column in payload
        const rawVal = row[col.index] ?? '';
        const converted = convertCellValue(rawVal, col.type, emptyAsNull);

        if (isNested && col.targetKey.includes('.')) {
          setNestedProperty(rowObj, col.targetKey, converted, errors);
        } else {
          rowObj[col.targetKey] = converted;
        }
      }

      keyedObj[finalKey] = rowObj;
    }
    finalData = keyedObj;
  } else {
    // Default: 'array-of-objects'
    const objectsArray: Record<string, any>[] = [];

    for (let r = 0; r < rawRows.length; r++) {
      const row = rawRows[r];
      const rowObj: Record<string, any> = {};

      for (const col of activeColumns) {
        const rawVal = row[col.index] ?? '';
        const converted = convertCellValue(rawVal, col.type, emptyAsNull);

        if (isNested && col.targetKey.includes('.')) {
          setNestedProperty(rowObj, col.targetKey, converted, errors);
        } else {
          rowObj[col.targetKey] = converted;
        }
      }
      objectsArray.push(rowObj);
    }
    finalData = objectsArray;
  }

  // Format indentation
  const indent = options.indent || '2';
  let jsonOutput = '';
  try {
    if (indent === 'compact') {
      jsonOutput = JSON.stringify(finalData);
    } else {
      const spaces = indent === '4' ? 4 : 2;
      jsonOutput = JSON.stringify(finalData, null, spaces);
    }
  } catch (err: any) {
    errors.push(`JSON serialization failed: ${err?.message || 'Unknown error'}`);
    jsonOutput = '[]';
  }

  // Calculate size in bytes
  const outputBytes = typeof Blob !== 'undefined' ? new Blob([jsonOutput]).size : Buffer.byteLength(jsonOutput, 'utf8');
  const executionTimeMs = Math.round(performance.now() - start);

  return {
    jsonOutput,
    previewData: finalData,
    stats: {
      totalRows: rawRows.length,
      totalColumns: activeColumns.length,
      outputBytes,
      executionTimeMs,
    },
    errors,
    warnings,
  };
}

import { JsonStats } from '../types/json.types';

export function computeJsonStats(jsonString: string, parsedData?: any): JsonStats {
  const fileSizeBytes = new Blob([jsonString || '']).size;
  const characterCount = (jsonString || '').length;
  const lineCount = (jsonString || '').split('\n').length;

  let totalObjects = 0;
  let totalArrays = 0;
  let totalKeys = 0;
  let totalValues = 0;
  let maxDepth = 0;
  let stringsCount = 0;
  let numbersCount = 0;
  let booleansCount = 0;
  let nullsCount = 0;
  let emptyObjects = 0;
  let emptyArrays = 0;

  if (parsedData === undefined && jsonString.trim()) {
    try {
      parsedData = JSON.parse(jsonString);
    } catch {
      // If unparseable, return string-only counts
      return {
        totalObjects: 0,
        totalArrays: 0,
        totalKeys: 0,
        totalValues: 0,
        maxDepth: 0,
        stringsCount: 0,
        numbersCount: 0,
        booleansCount: 0,
        nullsCount: 0,
        emptyObjects: 0,
        emptyArrays: 0,
        fileSizeBytes,
        characterCount,
        lineCount,
      };
    }
  }

  function traverse(node: any, depth: number) {
    if (depth > maxDepth) {
      maxDepth = depth;
    }

    if (node === null) {
      nullsCount++;
      totalValues++;
      return;
    }

    if (Array.isArray(node)) {
      totalArrays++;
      if (node.length === 0) {
        emptyArrays++;
      }
      for (let i = 0; i < node.length; i++) {
        traverse(node[i], depth + 1);
      }
      return;
    }

    if (typeof node === 'object') {
      totalObjects++;
      const keys = Object.keys(node);
      totalKeys += keys.length;
      if (keys.length === 0) {
        emptyObjects++;
      }
      for (const key of keys) {
        traverse(node[key], depth + 1);
      }
      return;
    }

    totalValues++;
    if (typeof node === 'string') {
      stringsCount++;
    } else if (typeof node === 'number') {
      numbersCount++;
    } else if (typeof node === 'boolean') {
      booleansCount++;
    }
  }

  if (parsedData !== undefined && parsedData !== null) {
    traverse(parsedData, 1);
  }

  return {
    totalObjects,
    totalArrays,
    totalKeys,
    totalValues,
    maxDepth,
    stringsCount,
    numbersCount,
    booleansCount,
    nullsCount,
    emptyObjects,
    emptyArrays,
    fileSizeBytes,
    characterCount,
    lineCount,
  };
}

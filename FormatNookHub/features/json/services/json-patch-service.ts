/**
 * JSON Patch (RFC 6902) & Merge Patch (RFC 7386) Engine
 * FormatNook Hub - Universal Client-Side Developer Platform
 */

import {
  JsonPatchApplyResult,
  JsonPatchDiffSummary,
  JsonPatchOperation,
} from '../types/json-patch.types';

/**
 * Escapes tokens for RFC 6901 JSON Pointer (/ -> ~1, ~ -> ~0)
 */
export function escapePointer(str: string): string {
  return str.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Unescapes RFC 6901 JSON Pointer tokens (~1 -> /, ~0 -> ~)
 */
export function unescapePointer(str: string): string {
  return str.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Parses a JSON Pointer path string into an array of unescaped segment keys
 */
export function parsePointer(path: string): string[] {
  if (!path || path === '') return [];
  if (!path.startsWith('/')) {
    throw new Error(`Invalid JSON Pointer "${path}": must start with "/"`);
  }
  return path.slice(1).split('/').map(unescapePointer);
}

/**
 * Deep equality check for primitives, arrays, and objects
 */
export function deepEquals(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const k of keysA) {
    if (!(k in b) || !deepEquals(a[k], b[k])) return false;
  }
  return true;
}

/**
 * Generates an RFC 6902 JSON Patch by semantic diffing of two values
 */
export function createJsonPatch(original: any, modified: any): JsonPatchOperation[] {
  const patch: JsonPatchOperation[] = [];

  function diff(orig: any, mod: any, currentPath: string) {
    if (deepEquals(orig, mod)) return;

    const origIsObj = orig !== null && typeof orig === 'object' && !Array.isArray(orig);
    const modIsObj = mod !== null && typeof mod === 'object' && !Array.isArray(mod);
    const origIsArr = Array.isArray(orig);
    const modIsArr = Array.isArray(mod);

    // Objects
    if (origIsObj && modIsObj) {
      const origKeys = new Set(Object.keys(orig));
      const modKeys = new Set(Object.keys(mod));

      // Removed keys
      for (const k of origKeys) {
        if (!modKeys.has(k)) {
          patch.push({
            op: 'remove',
            path: `${currentPath}/${escapePointer(k)}`,
          });
        }
      }

      // Added or modified keys
      for (const k of modKeys) {
        const itemPath = `${currentPath}/${escapePointer(k)}`;
        if (!origKeys.has(k)) {
          patch.push({
            op: 'add',
            path: itemPath,
            value: mod[k],
          });
        } else {
          diff(orig[k], mod[k], itemPath);
        }
      }
      return;
    }

    // Arrays
    if (origIsArr && modIsArr) {
      let commonPrefix = 0;
      while (
        commonPrefix < orig.length &&
        commonPrefix < mod.length &&
        deepEquals(orig[commonPrefix], mod[commonPrefix])
      ) {
        commonPrefix++;
      }

      let commonSuffix = 0;
      while (
        commonSuffix < orig.length - commonPrefix &&
        commonSuffix < mod.length - commonPrefix &&
        deepEquals(orig[orig.length - 1 - commonSuffix], mod[mod.length - 1 - commonSuffix])
      ) {
        commonSuffix++;
      }

      const origSlice = orig.slice(commonPrefix, orig.length - commonSuffix);
      const modSlice = mod.slice(commonPrefix, mod.length - commonSuffix);

      // Simple replacement / removal / insertion for middle changes
      const minLen = Math.min(origSlice.length, modSlice.length);
      for (let i = 0; i < minLen; i++) {
        diff(origSlice[i], modSlice[i], `${currentPath}/${commonPrefix + i}`);
      }

      if (origSlice.length > modSlice.length) {
        // Elements removed (from the end of middle slice to maintain valid indices)
        for (let i = origSlice.length - 1; i >= modSlice.length; i--) {
          patch.push({
            op: 'remove',
            path: `${currentPath}/${commonPrefix + i}`,
          });
        }
      } else if (modSlice.length > origSlice.length) {
        // Elements added
        for (let i = origSlice.length; i < modSlice.length; i++) {
          patch.push({
            op: 'add',
            path: `${currentPath}/${commonPrefix + i}`,
            value: modSlice[i],
          });
        }
      }
      return;
    }

    // Primitive replacement
    patch.push({
      op: 'replace',
      path: currentPath === '' ? '/' : currentPath,
      value: mod,
    });
  }

  diff(original, modified, '');
  return patch;
}

/**
 * Applies RFC 6902 JSON Patch operations to a target document
 */
export function applyJsonPatch<T = any>(
  doc: T,
  patch: JsonPatchOperation[]
): JsonPatchApplyResult<T> {
  if (!Array.isArray(patch)) {
    return { success: false, error: 'Patch must be an array of patch operations' };
  }

  // Deep clone to avoid mutating input document
  let current: any = JSON.parse(JSON.stringify(doc === undefined ? null : doc));

  for (let idx = 0; idx < patch.length; idx++) {
    const op = patch[idx];
    if (!op || typeof op !== 'object' || !op.op || op.path === undefined) {
      return { success: false, error: `Malformed operation at index ${idx}`, opIndex: idx };
    }

    try {
      const pathTokens = parsePointer(op.path);

      if (pathTokens.length === 0) {
        if (op.op === 'replace' || op.op === 'add') {
          current = op.value;
          continue;
        } else {
          return { success: false, error: `Cannot "${op.op}" the root document`, opIndex: idx };
        }
      }

      // Traverse to parent
      let parent = current;
      for (let p = 0; p < pathTokens.length - 1; p++) {
        const seg = pathTokens[p];
        if (parent === null || typeof parent !== 'object') {
          return { success: false, error: `Path "${op.path}" does not exist at token "${seg}"`, opIndex: idx };
        }
        parent = parent[seg];
      }

      if (parent === null || typeof parent !== 'object') {
        return { success: false, error: `Parent path does not exist for "${op.path}"`, opIndex: idx };
      }

      const lastSeg = pathTokens[pathTokens.length - 1];

      switch (op.op) {
        case 'add': {
          if (Array.isArray(parent)) {
            if (lastSeg === '-') {
              parent.push(op.value);
            } else {
              const numIdx = Number(lastSeg);
              if (isNaN(numIdx) || numIdx < 0 || numIdx > parent.length) {
                return { success: false, error: `Invalid array index "${lastSeg}" for add in "${op.path}"`, opIndex: idx };
              }
              parent.splice(numIdx, 0, op.value);
            }
          } else {
            parent[lastSeg] = op.value;
          }
          break;
        }

        case 'remove': {
          if (Array.isArray(parent)) {
            const numIdx = Number(lastSeg);
            if (isNaN(numIdx) || numIdx < 0 || numIdx >= parent.length) {
              return { success: false, error: `Index out of bounds "${lastSeg}" for remove in "${op.path}"`, opIndex: idx };
            }
            parent.splice(numIdx, 1);
          } else {
            if (!(lastSeg in parent)) {
              return { success: false, error: `Property "${lastSeg}" does not exist for remove in "${op.path}"`, opIndex: idx };
            }
            delete parent[lastSeg];
          }
          break;
        }

        case 'replace': {
          if (Array.isArray(parent)) {
            const numIdx = Number(lastSeg);
            if (isNaN(numIdx) || numIdx < 0 || numIdx >= parent.length) {
              return { success: false, error: `Index out of bounds "${lastSeg}" for replace in "${op.path}"`, opIndex: idx };
            }
            parent[numIdx] = op.value;
          } else {
            if (!(lastSeg in parent)) {
              return { success: false, error: `Property "${lastSeg}" does not exist for replace in "${op.path}"`, opIndex: idx };
            }
            parent[lastSeg] = op.value;
          }
          break;
        }

        case 'move': {
          if (!op.from) {
            return { success: false, error: `"move" operation requires "from" path`, opIndex: idx };
          }
          // Remove from source and add to target
          const remRes = applyJsonPatch(current, [{ op: 'remove', path: op.from }]);
          if (!remRes.success) return remRes;
          // Get value at source before removal:
          const fromTokens = parsePointer(op.from);
          let val = current;
          for (const s of fromTokens) val = val[s];
          const addRes = applyJsonPatch(remRes.doc, [{ op: 'add', path: op.path, value: val }]);
          if (!addRes.success) return addRes;
          current = addRes.doc;
          break;
        }

        case 'copy': {
          if (!op.from) {
            return { success: false, error: `"copy" operation requires "from" path`, opIndex: idx };
          }
          const fromTokens = parsePointer(op.from);
          let val = current;
          for (const s of fromTokens) {
            if (val === null || typeof val !== 'object' || !(s in val)) {
              return { success: false, error: `"from" path "${op.from}" not found for copy`, opIndex: idx };
            }
            val = val[s];
          }
          const addRes = applyJsonPatch(current, [{ op: 'add', path: op.path, value: JSON.parse(JSON.stringify(val)) }]);
          if (!addRes.success) return addRes;
          current = addRes.doc;
          break;
        }

        case 'test': {
          let val = parent[lastSeg];
          if (!deepEquals(val, op.value)) {
            return {
              success: false,
              error: `Test operation failed at "${op.path}": expected ${JSON.stringify(op.value)} but got ${JSON.stringify(val)}`,
              opIndex: idx,
            };
          }
          break;
        }

        default:
          return { success: false, error: `Unknown operation "${(op as any).op}"`, opIndex: idx };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Patch execution failed', opIndex: idx };
    }
  }

  return { success: true, doc: current };
}

/**
 * Summarizes an RFC 6902 patch with counts of operations and paths
 */
export function summarizePatch(patch: JsonPatchOperation[]): JsonPatchDiffSummary {
  let addedCount = 0;
  let removedCount = 0;
  let replacedCount = 0;
  const paths: { path: string; op: any }[] = [];

  for (const op of patch) {
    if (op.op === 'add') addedCount++;
    else if (op.op === 'remove') removedCount++;
    else if (op.op === 'replace') replacedCount++;
    paths.push({ path: op.path, op: op.op });
  }

  return {
    addedCount,
    removedCount,
    replacedCount,
    totalOps: patch.length,
    paths,
  };
}

/**
 * Generates an RFC 7386 JSON Merge Patch document
 */
export function createMergePatch(original: any, modified: any): any {
  if (
    original === null ||
    typeof original !== 'object' ||
    Array.isArray(original) ||
    modified === null ||
    typeof modified !== 'object' ||
    Array.isArray(modified)
  ) {
    return modified === undefined ? null : modified;
  }

  const patch: Record<string, any> = {};

  for (const [key, origVal] of Object.entries(original)) {
    if (!(key in modified)) {
      patch[key] = null; // RFC 7386: null indicates deletion
    } else {
      const modVal = modified[key];
      if (
        origVal !== null &&
        typeof origVal === 'object' &&
        !Array.isArray(origVal) &&
        modVal !== null &&
        typeof modVal === 'object' &&
        !Array.isArray(modVal)
      ) {
        const subPatch = createMergePatch(origVal, modVal);
        if (Object.keys(subPatch).length > 0) {
          patch[key] = subPatch;
        }
      } else if (!deepEquals(origVal, modVal)) {
        patch[key] = modVal;
      }
    }
  }

  for (const [key, modVal] of Object.entries(modified)) {
    if (!(key in original)) {
      patch[key] = modVal;
    }
  }

  return patch;
}

/**
 * Applies an RFC 7386 JSON Merge Patch document to target
 */
export function applyMergePatch(target: any, patch: any): any {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return patch;
  }

  const result: Record<string, any> =
    target !== null && typeof target === 'object' && !Array.isArray(target)
      ? JSON.parse(JSON.stringify(target))
      : {};

  for (const [key, val] of Object.entries(patch)) {
    if (val === null) {
      delete result[key];
    } else {
      result[key] = applyMergePatch(result[key], val);
    }
  }

  return result;
}

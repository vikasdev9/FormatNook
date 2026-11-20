import { describe, it, expect } from 'vitest';
import {
  createJsonPatch,
  applyJsonPatch,
  summarizePatch,
  createMergePatch,
  applyMergePatch,
  escapePointer,
  unescapePointer,
  parsePointer,
} from '../services/json-patch-service';

describe('JSON Patch (RFC 6902) & Merge Patch (RFC 7386) Engine', () => {
  it('correctly escapes and unescapes JSON Pointer tokens', () => {
    expect(escapePointer('a/b~c')).toBe('a~1b~0c');
    expect(unescapePointer('a~1b~0c')).toBe('a/b~c');
    expect(parsePointer('/users/0/name')).toEqual(['users', '0', 'name']);
    expect(parsePointer('')).toEqual([]);
    expect(() => parsePointer('invalid-no-slash')).toThrow();
  });

  describe('RFC 6902 JSON Patch Generation & Application', () => {
    const original = {
      title: 'FormatNook',
      author: {
        name: 'Alex',
        location: 'New York',
      },
      tags: ['json', 'tools'],
      active: false,
    };

    const modified = {
      title: 'FormatNook Hub', // replaced
      author: {
        name: 'Alex',
        // location removed
        role: 'Maintainer', // added
      },
      tags: ['json', 'tools', 'diff'], // added item
      active: true, // replaced
    };

    it('generates an RFC 6902 patch with correct add, remove, and replace operations', () => {
      const patch = createJsonPatch(original, modified);
      expect(patch.length).toBeGreaterThanOrEqual(4);

      const ops = patch.map((p) => p.op);
      expect(ops).toContain('replace');
      expect(ops).toContain('add');
      expect(ops).toContain('remove');

      // Check author location removed
      const hasRemoveLocation = patch.some((p) => p.op === 'remove' && p.path === '/author/location');
      expect(hasRemoveLocation).toBe(true);

      // Check author role added
      const hasAddRole = patch.some((p) => p.op === 'add' && p.path === '/author/role' && p.value === 'Maintainer');
      expect(hasAddRole).toBe(true);
    });

    it('applies the generated RFC 6902 patch and recreates modified document perfectly', () => {
      const patch = createJsonPatch(original, modified);
      const applyRes = applyJsonPatch(original, patch);

      expect(applyRes.success).toBe(true);
      expect(applyRes.doc).toEqual(modified);
    });

    it('handles test operation correctly and fails when condition is not met', () => {
      const doc = { count: 5 };
      const validTest = applyJsonPatch(doc, [{ op: 'test', path: '/count', value: 5 }]);
      expect(validTest.success).toBe(true);

      const invalidTest = applyJsonPatch(doc, [{ op: 'test', path: '/count', value: 10 }]);
      expect(invalidTest.success).toBe(false);
      expect(invalidTest.error).toContain('Test operation failed');
    });

    it('handles array append (-) and index insertions', () => {
      const doc = { list: [1, 2] };
      const res = applyJsonPatch(doc, [
        { op: 'add', path: '/list/-', value: 3 },
        { op: 'add', path: '/list/0', value: 0 },
      ]);
      expect(res.success).toBe(true);
      expect(res.doc.list).toEqual([0, 1, 2, 3]);
    });

    it('summarizes patch operations breakdown', () => {
      const patch = createJsonPatch(original, modified);
      const summary = summarizePatch(patch);

      expect(summary.totalOps).toBe(patch.length);
      expect(summary.addedCount).toBeGreaterThan(0);
      expect(summary.removedCount).toBeGreaterThan(0);
      expect(summary.replacedCount).toBeGreaterThan(0);
    });
  });

  describe('RFC 7386 JSON Merge Patch', () => {
    it('creates RFC 7386 merge patch with null for deletions and new values for changes', () => {
      const orig = {
        a: 'b',
        c: {
          d: 'e',
          f: 'g',
        },
      };

      const mod = {
        a: 'z', // changed
        c: {
          d: 'e',
          // f removed
        },
        h: 'new', // added
      };

      const patch = createMergePatch(orig, mod);
      expect(patch).toEqual({
        a: 'z',
        c: {
          f: null,
        },
        h: 'new',
      });
    });

    it('applies RFC 7386 merge patch and matches expected output', () => {
      const target = {
        a: 'b',
        c: {
          d: 'e',
          f: 'g',
        },
      };

      const patch = {
        a: 'z',
        c: {
          f: null,
        },
        h: 'new',
      };

      const result = applyMergePatch(target, patch);
      expect(result).toEqual({
        a: 'z',
        c: {
          d: 'e',
        },
        h: 'new',
      });
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import {
  generateUuidV4,
  generateBulkUuids,
  formatUuid,
  validateSingleUuid,
  validateMultipleUuids,
  deduplicateUuids,
  detectVariant,
} from '../services/uuid-service';

describe('UUID v4 Generation Engine', () => {
  it('generates a valid canonical RFC 4122 v4 UUID', () => {
    const mathRandomSpy = vi.spyOn(Math, 'random');
    const uuid = generateUuidV4();

    // Canonical format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(uuid).toMatch(uuidV4Regex);

    // Assert Math.random is strictly never invoked
    expect(mathRandomSpy).not.toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });

  it('ensures version nibble is always 4 and variant is 8, 9, a, or b', () => {
    for (let i = 0; i < 50; i++) {
      const uuid = generateUuidV4();
      const parts = uuid.split('-');
      expect(parts).toHaveLength(5);
      expect(parts[2].charAt(0)).toBe('4');
      expect(['8', '9', 'a', 'b']).toContain(parts[3].charAt(0));
    }
  });

  it('generates bulk UUIDs matching requested quantity', () => {
    const batch10 = generateBulkUuids(10);
    expect(batch10).toHaveLength(10);

    const batch50 = generateBulkUuids(50);
    expect(batch50).toHaveLength(50);

    // Bounds checking
    expect(generateBulkUuids(0)).toHaveLength(1);
    expect(generateBulkUuids(-5)).toHaveLength(1);
  });

  it('formats UUIDs with uppercase, hyphens, and braces without changing values', () => {
    const canonical = 'c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd';

    // Uppercase
    expect(formatUuid(canonical, { uppercase: true, hyphens: true, braces: false })).toBe(
      'C73BCDCC-2669-4BF6-81D3-E4AE73FB11FD'
    );

    // Without hyphens
    expect(formatUuid(canonical, { uppercase: false, hyphens: false, braces: false })).toBe(
      'c73bcdcc26694bf681d3e4ae73fb11fd'
    );

    // With curly braces
    expect(formatUuid(canonical, { uppercase: false, hyphens: true, braces: true })).toBe(
      '{c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd}'
    );

    // Uppercase + no hyphens + braces
    expect(formatUuid(canonical, { uppercase: true, hyphens: false, braces: true })).toBe(
      '{C73BCDCC26694BF681D3E4AE73FB11FD}'
    );
  });
});

describe('UUID Validation & Diagnostics Engine', () => {
  it('identifies valid v4 UUID and its RFC 4122 variant', () => {
    const result = validateSingleUuid('550e8400-e29b-41d4-a716-446655440000');
    expect(result.isValid).toBe(true);
    expect(result.version).toBe(4);
    expect(result.variant).toBe('RFC 4122');
    expect(result.isV4).toBe(true);
  });

  it('detects UUID v1 timestamp-based and non-v4 UUIDs', () => {
    const v1Uuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const result = validateSingleUuid(v1Uuid);
    expect(result.isValid).toBe(true);
    expect(result.version).toBe(1);
    expect(result.isV4).toBe(false);
  });

  it('identifies malformed and invalid UUIDs', () => {
    const notHex = validateSingleUuid('550e8400-e29b-41d4-a716-44665544zzzz');
    expect(notHex.isValid).toBe(false);

    const tooShort = validateSingleUuid('550e8400-e29b-41d4');
    expect(tooShort.isValid).toBe(false);
  });

  it('validates multiple UUIDs and generates summary statistics', () => {
    const input = `550e8400-e29b-41d4-a716-446655440000
    6ba7b810-9dad-11d1-80b4-00c04fd430c8
    invalid-uuid-string`;

    const summary = validateMultipleUuids(input);
    expect(summary.totalCount).toBe(3);
    expect(summary.validCount).toBe(2);
    expect(summary.invalidCount).toBe(1);
    expect(summary.v4Count).toBe(1);
  });
});

describe('UUID Deduplication Engine', () => {
  it('deduplicates UUIDs case-insensitively and regardless of braces', () => {
    const list = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550E8400-E29B-41D4-A716-446655440000',
      '{550e8400-e29b-41d4-a716-446655440000}',
      'c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd',
    ];

    const result = deduplicateUuids(list);
    expect(result.originalCount).toBe(4);
    expect(result.uniqueCount).toBe(2);
    expect(result.duplicateCount).toBe(2);
    expect(result.unique).toHaveLength(2);
  });
});

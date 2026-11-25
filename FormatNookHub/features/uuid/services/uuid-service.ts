import {
  UuidFormatOptions,
  UuidValidationResult,
  UuidValidationSummary,
  UuidDeduplicationResult,
} from '../types/uuid.types';

/**
 * Generates a single cryptographically secure RFC 4122 v4 UUID.
 * Uses crypto.randomUUID() when available, with a compliant crypto.getRandomValues() fallback.
 * Strictly never uses Math.random() or non-cryptographic pseudo-randomness.
 */
export function generateUuidV4(): string {
  // 1. Standard web crypto randomUUID API
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // 2. Fallback using crypto.getRandomValues (RFC 4122 v4 standard)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set UUID version to 4: 0100 (bits 4-7 of time_hi_and_version)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;

    // Set RFC 4122 variant to 10xx (bits 6-7 of clock_seq_hi_and_reserved)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    // Convert bytes to 32-character hexadecimal string
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

    // Format as 8-4-4-4-12
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  throw new Error('Cryptographically secure randomness is unavailable in this environment.');
}

/**
 * Applies presentation formatting options to a raw UUID without altering underlying bits.
 */
export function formatUuid(
  uuid: string,
  options: UuidFormatOptions = { uppercase: false, hyphens: true, braces: false }
): string {
  if (!uuid) return '';

  // Extract clean 32 hex chars, stripping braces and existing hyphens
  const cleaned = uuid.replace(/[{}]/g, '').replace(/-/g, '').trim();
  if (cleaned.length !== 32) {
    // If malformed, return trimmed
    return uuid.trim();
  }

  let formatted = cleaned;

  if (options.hyphens) {
    formatted = `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20, 32)}`;
  }

  if (options.uppercase) {
    formatted = formatted.toUpperCase();
  } else {
    formatted = formatted.toLowerCase();
  }

  if (options.braces) {
    formatted = `{${formatted}}`;
  }

  return formatted;
}

/**
 * Generates bulk cryptographically secure UUIDs.
 * Supports batches between 1 and 10,000.
 */
export function generateBulkUuids(
  quantity: number = 10,
  options: UuidFormatOptions = { uppercase: false, hyphens: true, braces: false }
): string[] {
  const safeCount = Math.max(1, Math.min(10000, Math.floor(quantity) || 1));
  const results: string[] = new Array(safeCount);

  for (let i = 0; i < safeCount; i++) {
    const raw = generateUuidV4();
    results[i] = formatUuid(raw, options);
  }

  return results;
}

/**
 * Detects the RFC variant from the variant character/byte.
 */
export function detectVariant(variantChar: string): string {
  const char = variantChar.toLowerCase();
  if (/^[89ab]$/.test(char)) {
    return 'RFC 4122';
  }
  if (/^[0-7]$/.test(char)) {
    return 'NCS backward compatibility';
  }
  if (/^[cd]$/.test(char)) {
    return 'Microsoft GUID backward compatibility';
  }
  if (/^[ef]$/.test(char)) {
    return 'Reserved for future definition';
  }
  return 'Unknown';
}

/**
 * Validates a single UUID string, extracting version, variant, and canonical validity.
 */
export function validateSingleUuid(rawInput: string): UuidValidationResult {
  const trimmed = rawInput.trim();
  const cleaned = trimmed.replace(/[{}]/g, '').replace(/-/g, '');

  // Must be exactly 32 hexadecimal characters
  const isHex32 = /^[0-9a-fA-F]{32}$/.test(cleaned);

  if (!isHex32) {
    return {
      raw: trimmed,
      normalized: trimmed,
      isValid: false,
      version: null,
      variant: null,
      isV4: false,
      error: 'Invalid length or contains non-hexadecimal characters.',
    };
  }

  // Version nibble is character at index 12 (0-indexed in 32 hex string)
  const versionDigit = parseInt(cleaned.charAt(12), 16);
  // Variant character is character at index 16
  const variantChar = cleaned.charAt(16);
  const variant = detectVariant(variantChar);

  // Canonical format 8-4-4-4-12 lowercase
  const normalized = `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20, 32)}`.toLowerCase();

  const isV4 = versionDigit === 4 && variant === 'RFC 4122';

  return {
    raw: trimmed,
    normalized,
    isValid: true,
    version: versionDigit,
    variant,
    isV4,
  };
}

/**
 * Validates multiple UUIDs (newline or comma separated).
 */
export function validateMultipleUuids(input: string): UuidValidationSummary {
  if (!input || !input.trim()) {
    return {
      results: [],
      totalCount: 0,
      validCount: 0,
      invalidCount: 0,
      v4Count: 0,
    };
  }

  // Split on newlines, commas, or semicolons
  const lines = input.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const results = lines.map(validateSingleUuid);

  const totalCount = results.length;
  const validCount = results.filter((r) => r.isValid).length;
  const invalidCount = totalCount - validCount;
  const v4Count = results.filter((r) => r.isV4).length;

  return {
    results,
    totalCount,
    validCount,
    invalidCount,
    v4Count,
  };
}

/**
 * Deduplicates an array of UUIDs using case-insensitive normalization.
 */
export function deduplicateUuids(uuids: string[]): UuidDeduplicationResult {
  const seen = new Set<string>();
  const unique: string[] = [];
  const duplicates: string[] = [];

  for (const raw of uuids) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Normalized representation for comparison
    const norm = trimmed.toLowerCase().replace(/[{}]/g, '').replace(/-/g, '');

    if (seen.has(norm)) {
      duplicates.push(trimmed);
    } else {
      seen.add(norm);
      unique.push(trimmed);
    }
  }

  return {
    unique,
    duplicates,
    originalCount: uuids.length,
    uniqueCount: unique.length,
    duplicateCount: duplicates.length,
  };
}

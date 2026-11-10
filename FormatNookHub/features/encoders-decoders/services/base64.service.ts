import { cleanBase64, padBase64 } from '../utils/base64.utils';
import { ValidationIssue } from '@/types/tool';

const CHUNK_SIZE = 8192;

/**
 * Converts Uint8Array bytes to Base64 using chunking to avoid call-stack overflow on large arrays.
 */
export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    let chunkStr = '';
    for (let j = 0; j < chunk.length; j++) {
      chunkStr += String.fromCharCode(chunk[j]);
    }
    binary += chunkStr;
  }

  let base64 = btoa(binary);

  if (urlSafe) {
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  return base64;
}

/**
 * Decodes a Base64 string to raw Uint8Array bytes safely.
 */
export function base64ToBytes(base64Str: string): {
  bytes: Uint8Array;
  isValid: boolean;
  issues: ValidationIssue[];
} {
  const clean = cleanBase64(base64Str);
  if (!clean) {
    return {
      bytes: new Uint8Array(0),
      isValid: false,
      issues: [{ message: 'Input is empty.', severity: 'warning' }],
    };
  }

  // Convert URL-safe characters (- and _) to standard (+ and /)
  let normalized = clean.replace(/-/g, '+').replace(/_/g, '/');
  normalized = padBase64(normalized);

  // Validate Base64 characters
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    return {
      bytes: new Uint8Array(0),
      isValid: false,
      issues: [
        {
          message: 'Invalid Base64 sequence. Only characters A-Z, a-z, 0-9, +, /, and padding = are permitted.',
          severity: 'error',
        },
      ],
    };
  }

  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, isValid: true, issues: [] };
  } catch (err: any) {
    return {
      bytes: new Uint8Array(0),
      isValid: false,
      issues: [{ message: err?.message || 'Failed to decode Base64 string.', severity: 'error' }],
    };
  }
}

/**
 * Checks if a byte buffer represents valid, readable UTF-8 text without null bytes or control corruptions
 */
export function isLikelyUtf8Text(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;

  // If there are null bytes in first 1000 characters, it's almost certainly binary
  const sampleLength = Math.min(bytes.length, 1024);
  for (let i = 0; i < sampleLength; i++) {
    if (bytes[i] === 0x00) return false;
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(bytes.slice(0, sampleLength));
    return true;
  } catch {
    return false;
  }
}

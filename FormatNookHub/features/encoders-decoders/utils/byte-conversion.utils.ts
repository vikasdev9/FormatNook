import { HexFormatOptions } from '../types/encoder-decoder.types';

export function bytesToHex(
  bytes: Uint8Array,
  options: HexFormatOptions = { uppercase: false, grouping: 'none' }
): string {
  const hexParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    let hex = bytes[i].toString(16).padStart(2, '0');
    if (options.uppercase) {
      hex = hex.toUpperCase();
    }
    hexParts.push(hex);
  }

  if (options.grouping === 'space') {
    return hexParts.join(' ');
  }
  if (options.grouping === 'colon') {
    return hexParts.join(':');
  }
  if (options.grouping === 'hyphen') {
    return hexParts.join('-');
  }
  return hexParts.join('');
}

export function cleanHexInput(input: string): string {
  // Remove whitespace, colons, hyphens, and 0x prefix
  return input
    .trim()
    .replace(/^0x/i, '')
    .replace(/[\s:\-]+/g, '');
}

export function hexToBytes(hex: string): { bytes: Uint8Array; isValid: boolean; error?: string } {
  const cleaned = cleanHexInput(hex);

  if (!cleaned) {
    return { bytes: new Uint8Array(0), isValid: true };
  }

  if (cleaned.length % 2 !== 0) {
    return {
      bytes: new Uint8Array(0),
      isValid: false,
      error: `Invalid hexadecimal length (${cleaned.length} characters). Hex strings must contain complete 2-character byte pairs.`,
    };
  }

  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    return {
      bytes: new Uint8Array(0),
      isValid: false,
      error: 'Invalid hexadecimal characters found. Only characters 0-9 and A-F are allowed.',
    };
  }

  const length = cleaned.length / 2;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    const byteHex = cleaned.substring(i * 2, i * 2 + 2);
    bytes[i] = parseInt(byteHex, 16);
  }

  return { bytes, isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Robustly reads an ArrayBuffer from a Blob in both browser and test environments
 */
export async function getBlobArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  if (typeof Response !== 'undefined') {
    return new Response(blob).arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}


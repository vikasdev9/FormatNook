import { base64ToBytes, bytesToBase64 } from './base64.service';

export interface BinaryFormatOptions {
  grouping: 'byte' | 'nibble' | 'none';
}

/**
 * Converts a Base64 string into a binary bit string ('01001000 01100101...')
 */
export function base64ToBinaryBits(
  base64Str: string,
  options: BinaryFormatOptions = { grouping: 'byte' }
): {
  binaryString: string;
  totalBits: number;
  totalBytes: number;
  isValid: boolean;
  error?: string;
} {
  const { bytes, isValid, issues } = base64ToBytes(base64Str);
  if (!isValid) {
    return {
      binaryString: '',
      totalBits: 0,
      totalBytes: 0,
      isValid: false,
      error: issues[0]?.message || 'Invalid Base64 sequence.',
    };
  }

  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const byteBits = bytes[i].toString(2).padStart(8, '0');
    if (options.grouping === 'nibble') {
      parts.push(`${byteBits.slice(0, 4)} ${byteBits.slice(4)}`);
    } else {
      parts.push(byteBits);
    }
  }

  const delimiter = options.grouping === 'none' ? '' : ' ';
  const binaryString = parts.join(delimiter);

  return {
    binaryString,
    totalBits: bytes.length * 8,
    totalBytes: bytes.length,
    isValid: true,
  };
}

/**
 * Converts a binary bit string ('01001000 01100101...') into a Base64 string
 */
export function binaryBitsToBase64(
  binaryBits: string,
  urlSafe = false
): {
  base64: string;
  totalBytes: number;
  isValid: boolean;
  error?: string;
} {
  const cleanBits = binaryBits.replace(/[^01]/g, '');
  if (!cleanBits) {
    return { base64: '', totalBytes: 0, isValid: true };
  }

  if (cleanBits.length % 8 !== 0) {
    return {
      base64: '',
      totalBytes: 0,
      isValid: false,
      error: `Binary string length (${cleanBits.length} bits) is not a multiple of 8. Complete 8-bit bytes are required.`,
    };
  }

  const byteLength = cleanBits.length / 8;
  const bytes = new Uint8Array(byteLength);

  for (let i = 0; i < byteLength; i++) {
    const chunk = cleanBits.slice(i * 8, i * 8 + 8);
    bytes[i] = parseInt(chunk, 2);
  }

  const base64 = bytesToBase64(bytes, urlSafe);
  return {
    base64,
    totalBytes: byteLength,
    isValid: true,
  };
}


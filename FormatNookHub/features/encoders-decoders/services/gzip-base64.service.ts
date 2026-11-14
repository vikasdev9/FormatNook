import { bytesToBase64, base64ToBytes } from './base64.service';

export interface GzipCompressionResult {
  base64: string;
  originalBytes: number;
  compressedBytes: number;
  base64Length: number;
  compressionRatioPercent: number;
  isValid: boolean;
  error?: string;
}

export interface GzipDecompressionResult {
  text?: string;
  bytes: Uint8Array;
  compressedBytes: number;
  decompressedBytes: number;
  isText: boolean;
  isValid: boolean;
  error?: string;
}

const MAX_DECOMPRESSION_SIZE = 50 * 1024 * 1024; // 50MB protection limit
const MAX_EXPANSION_RATIO = 100; // 100x expansion bomb threshold

/**
 * Compresses UTF-8 text using native Gzip CompressionStream, then encodes into Base64
 */
export async function gzipCompressToBase64(text: string): Promise<GzipCompressionResult> {
  if (!text) {
    return {
      base64: '',
      originalBytes: 0,
      compressedBytes: 0,
      base64Length: 0,
      compressionRatioPercent: 0,
      isValid: true,
    };
  }

  const rawBytes = new TextEncoder().encode(text);

  if (typeof CompressionStream === 'undefined') {
    return {
      base64: '',
      originalBytes: rawBytes.length,
      compressedBytes: 0,
      base64Length: 0,
      compressionRatioPercent: 0,
      isValid: false,
      error: 'CompressionStream is not supported in this browser environment.',
    };
  }

  try {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(rawBytes as unknown as BufferSource);
    writer.close();

    const response = new Response(cs.readable);
    const compressedBuffer = await response.arrayBuffer();
    const compressedBytes = new Uint8Array(compressedBuffer);

    const base64 = bytesToBase64(compressedBytes);
    const ratio = Math.round((1 - compressedBytes.length / rawBytes.length) * 100);

    return {
      base64,
      originalBytes: rawBytes.length,
      compressedBytes: compressedBytes.length,
      base64Length: base64.length,
      compressionRatioPercent: Math.max(0, ratio),
      isValid: true,
    };
  } catch (err: any) {
    return {
      base64: '',
      originalBytes: rawBytes.length,
      compressedBytes: 0,
      base64Length: 0,
      compressionRatioPercent: 0,
      isValid: false,
      error: err?.message || 'Failed to compress text using Gzip.',
    };
  }
}

/**
 * Decodes a Gzip Base64 string and decompresses the payload with bomb protection
 */
export async function gzipDecompressFromBase64(base64Str: string): Promise<GzipDecompressionResult> {
  const { bytes, isValid, issues } = base64ToBytes(base64Str);
  if (!isValid || bytes.length === 0) {
    return {
      bytes: new Uint8Array(0),
      compressedBytes: 0,
      decompressedBytes: 0,
      isText: false,
      isValid: false,
      error: issues[0]?.message || 'Invalid Base64 input for Gzip decompression.',
    };
  }

  // Check Gzip magic bytes: 0x1F, 0x8B
  if (bytes.length < 2 || bytes[0] !== 0x1F || bytes[1] !== 0x8B) {
    return {
      bytes,
      compressedBytes: bytes.length,
      decompressedBytes: 0,
      isText: false,
      isValid: false,
      error: 'Data does not contain standard Gzip magic bytes (0x1F 0x8B). Input is not a valid gzip payload.',
    };
  }

  if (typeof DecompressionStream === 'undefined') {
    return {
      bytes,
      compressedBytes: bytes.length,
      decompressedBytes: 0,
      isText: false,
      isValid: false,
      error: 'DecompressionStream is not supported in this browser environment.',
    };
  }

  try {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes as unknown as BufferSource);
    writer.close();

    const response = new Response(ds.readable);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Could not acquire readable stream reader.');
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.length;
        if (totalBytes > MAX_DECOMPRESSION_SIZE) {
          throw new Error(`Decompression safety limit reached (${Math.round(totalBytes / 1024 / 1024)}MB exceeds 50MB maximum). Protected against zip-bomb.`);
        }
        if (totalBytes > bytes.length * MAX_EXPANSION_RATIO && totalBytes > 1024 * 1024) {
          throw new Error('Decompression aborted: expansion ratio exceeds 100x safe threshold.');
        }
        chunks.push(value);
      }
    }

    const decompressed = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }

    // Try decoding as UTF-8
    let isText = true;
    for (let i = 0; i < Math.min(decompressed.length, 512); i++) {
      if (decompressed[i] === 0x00) {
        isText = false;
        break;
      }
    }

    let text: string | undefined;
    if (isText) {
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(decompressed);
      } catch {
        isText = false;
      }
    }

    return {
      text,
      bytes: decompressed,
      compressedBytes: bytes.length,
      decompressedBytes: totalBytes,
      isText,
      isValid: true,
    };
  } catch (err: any) {
    return {
      bytes,
      compressedBytes: bytes.length,
      decompressedBytes: 0,
      isText: false,
      isValid: false,
      error: err?.message || 'Failed to decompress gzip data.',
    };
  }
}

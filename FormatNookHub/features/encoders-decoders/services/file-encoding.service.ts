import { bytesToBase64, base64ToBytes } from './base64.service';
import { detectMimeFromBytes, detectMimeFromBase64String, DetectedMimeResult } from './mime-detection.service';
import { getExtensionFromMime, sanitizeFilename } from '../utils/filename.utils';
import { truncateForDisplay } from '../utils/output-size.utils';
import { EncodingResult } from '../types/encoder-decoder.types';

export const MAX_FILE_SIZE_DEFAULT = 25 * 1024 * 1024; // 25 MB safe browser limit
export const MAX_VIDEO_SIZE_DEFAULT = 50 * 1024 * 1024; // 50 MB

/**
 * Encodes a File or Blob into raw Base64 and complete Data URI
 */
export async function encodeFileToBase64(
  file: File | Blob,
  fileName?: string
): Promise<EncodingResult & { dataUri: string; mimeType: string; originalName: string }> {
  const originalName = fileName || (file instanceof File ? file.name : 'uploaded-file');
  const mimeType = file.type || 'application/octet-stream';
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const rawBase64 = bytesToBase64(bytes);
  const dataUri = `data:${mimeType};base64,${rawBase64}`;

  const { displayText, isTruncated } = truncateForDisplay(rawBase64);

  return {
    output: rawBase64,
    displayOutput: displayText,
    isTruncatedForDisplay: isTruncated,
    dataUri,
    outputSize: rawBase64.length,
    inputSize: file.size,
    mimeType,
    originalName,
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

/**
 * Decodes a Base64 string into a binary Blob and detects file properties
 */
export function decodeBase64ToFile(
  base64Str: string,
  preferredMime?: string,
  suggestedFilename?: string
): {
  blob: Blob | null;
  detectedMime: DetectedMimeResult;
  objectUrl: string | null;
  suggestedFilename: string;
  fileSize: number;
  isValid: boolean;
  error?: string;
} {
  const { bytes, isValid, issues } = base64ToBytes(base64Str);
  if (!isValid || bytes.length === 0) {
    return {
      blob: null,
      detectedMime: {
        mimeType: 'application/octet-stream',
        category: 'binary',
        isSafeToPreview: false,
        confidence: 'low',
      },
      objectUrl: null,
      suggestedFilename: suggestedFilename || 'decoded-file.bin',
      fileSize: 0,
      isValid: false,
      error: issues[0]?.message || 'Failed to decode Base64 into binary file.',
    };
  }

  // Detect MIME type from magic bytes if not explicitly provided
  const detected = detectMimeFromBytes(bytes);
  const finalMime = preferredMime || (detected.confidence === 'high' ? detected.mimeType : 'application/octet-stream');
  const extension = getExtensionFromMime(finalMime);
  const safeName = sanitizeFilename(suggestedFilename || `decoded${extension}`, 'decoded-file', extension);

  const blob = new Blob([bytes as unknown as BlobPart], { type: finalMime });
  let objectUrl: string | null = null;
  if (typeof window !== 'undefined' && window.URL && window.URL.createObjectURL) {
    try {
      objectUrl = window.URL.createObjectURL(blob);
    } catch {
      // Fallback
    }
  }

  return {
    blob,
    detectedMime: detected,
    objectUrl,
    suggestedFilename: safeName,
    fileSize: bytes.length,
    isValid: true,
  };
}

/**
 * Validates whether bytes represent a PDF document by checking standard %PDF- magic signature
 */
export function validatePdfBytes(bytes: Uint8Array): { isValid: boolean; error?: string } {
  if (bytes.length < 5) {
    return { isValid: false, error: 'File is too short to be a valid PDF document.' };
  }

  // %PDF- signature: 0x25 0x50 0x44 0x46 0x2D
  const hasSignature =
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2D;

  if (!hasSignature) {
    return {
      isValid: false,
      error: 'Invalid PDF signature. File does not start with standard "%PDF-" header marker.',
    };
  }

  return { isValid: true };
}

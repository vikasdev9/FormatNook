import { describe, it, expect } from 'vitest';
import {
  decodeBase64ToFile,
  validatePdfBytes,
} from '../services/file-encoding.service';
import { detectMimeFromBytes } from '../services/mime-detection.service';
import { sanitizeFilename, getExtensionFromMime } from '../utils/filename.utils';

describe('file-encoding.service & mime-detection', () => {
  it('detects PNG magic bytes', () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const detected = detectMimeFromBytes(pngHeader);
    expect(detected.mimeType).toBe('image/png');
    expect(detected.category).toBe('image');
  });

  it('detects JPEG magic bytes', () => {
    const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
    const detected = detectMimeFromBytes(jpegHeader);
    expect(detected.mimeType).toBe('image/jpeg');
    expect(detected.category).toBe('image');
  });

  it('detects PDF magic bytes and validates PDF signature', () => {
    // %PDF-
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35]);
    const detected = detectMimeFromBytes(pdfBytes);
    expect(detected.mimeType).toBe('application/pdf');
    expect(detected.category).toBe('pdf');

    const check = validatePdfBytes(pdfBytes);
    expect(check.isValid).toBe(true);

    const brokenCheck = validatePdfBytes(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]));
    expect(brokenCheck.isValid).toBe(false);
  });

  it('sanitizes unsafe filenames and injects proper extensions', () => {
    expect(sanitizeFilename('../../../malicious/test*name?.pdf')).toBe('test-name-.pdf');
    expect(sanitizeFilename('', 'fallback', '.png')).toBe('fallback.png');
    expect(getExtensionFromMime('image/png')).toBe('.png');
    expect(getExtensionFromMime('application/pdf')).toBe('.pdf');
    expect(getExtensionFromMime('audio/mpeg')).toBe('.mp3');
    expect(getExtensionFromMime('video/mp4')).toBe('.mp4');
  });

  it('decodes Base64 to binary file blob', () => {
    // 1x1 transparent PNG in base64
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const decoded = decodeBase64ToFile(pngBase64, 'image/png', 'sample.png');
    expect(decoded.isValid).toBe(true);
    expect(decoded.blob).not.toBeNull();
    expect(decoded.detectedMime.mimeType).toBe('image/png');
    expect(decoded.suggestedFilename).toBe('sample.png');
  });
});

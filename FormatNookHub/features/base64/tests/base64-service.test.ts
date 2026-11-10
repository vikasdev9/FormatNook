import { describe, it, expect } from 'vitest';
import {
  encodeTextToBase64,
  decodeBase64ToText,
  detectImageMimeFromBase64,
  parseBase64ImageInput,
} from '../services/base64-service';

describe('base64-service', () => {
  it('encodes ASCII and UTF-8 strings accurately', () => {
    const raw = 'Hello World! 🚀';
    const encoded = encodeTextToBase64(raw);
    expect(encoded).toBe('SGVsbG8gV29ybGQhIPCfmoA=');

    const decoded = decodeBase64ToText(encoded);
    expect(decoded.isValid).toBe(true);
    expect(decoded.output).toBe(raw);
  });

  it('handles URL-safe Base64 encoding and decoding', () => {
    const text = 'subjects?_d=1&test=true';
    const urlSafe = encodeTextToBase64(text, true);
    expect(urlSafe).not.toContain('+');
    expect(urlSafe).not.toContain('/');

    const decoded = decodeBase64ToText(urlSafe);
    expect(decoded.isValid).toBe(true);
    expect(decoded.output).toBe(text);
  });

  it('rejects invalid Base64 sequences', () => {
    const broken = 'Invalid$$Base64==';
    const result = decodeBase64ToText(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('detects PNG and JPEG image headers from Base64 prefixes', () => {
    expect(detectImageMimeFromBase64('iVBORw0KGgoAAAANSUhEUgAAAAE=')).toBe('image/png');
    expect(detectImageMimeFromBase64('/9j/4AAQSkZJRgABAQEASABIAAD/')).toBe('image/jpeg');
  });

  it('parses valid Data URI and raw Base64 inputs', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const parsed = parseBase64ImageInput(dataUri);
    expect(parsed.isValid).toBe(true);
    expect(parsed.mimeType).toBe('image/png');
    expect(parsed.rawBase64).toContain('iVBORw0KGgo');
  });
});

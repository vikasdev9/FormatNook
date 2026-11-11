import { describe, it, expect } from 'vitest';
import { bytesToBase64, base64ToBytes, isLikelyUtf8Text } from '../services/base64.service';
import { cleanBase64, toUrlSafeBase64, fromUrlSafeBase64 } from '../utils/base64.utils';

describe('base64.service', () => {
  it('correctly converts binary bytes to Base64 and back (round-trip)', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]); // "Hello World"
    const b64 = bytesToBase64(original);
    expect(b64).toBe('SGVsbG8gV29ybGQ=');

    const decoded = base64ToBytes(b64);
    expect(decoded.isValid).toBe(true);
    expect(decoded.bytes).toEqual(original);
  });

  it('handles URL-safe Base64 alphabet (- and _)', () => {
    // String whose Base64 has + and /
    const raw = new Uint8Array([251, 239]); // Base64: ++8=
    const standard = bytesToBase64(raw, false);
    expect(standard).toBe('++8=');

    const urlSafe = bytesToBase64(raw, true);
    expect(urlSafe).toBe('--8');

    const decoded = base64ToBytes(urlSafe);
    expect(decoded.isValid).toBe(true);
    expect(decoded.bytes).toEqual(raw);
  });

  it('rejects invalid Base64 sequences with invalid characters', () => {
    const invalid = 'SGVsbG8$#@!*';
    const decoded = base64ToBytes(invalid);
    expect(decoded.isValid).toBe(false);
    expect(decoded.issues[0].message).toContain('Invalid Base64 sequence');
  });

  it('strips Data URI prefixes and whitespace in cleanBase64', () => {
    const dataUri = 'data:image/png;base64,  iVBORw0KGgoAAAANSUhEUg== \n';
    expect(cleanBase64(dataUri)).toBe('iVBORw0KGgoAAAANSUhEUg==');
  });

  it('detects whether bytes are UTF-8 text or binary', () => {
    const textBytes = new TextEncoder().encode('Hello, world! Valid UTF-8 text.');
    expect(isLikelyUtf8Text(textBytes)).toBe(true);

    const binaryBytes = new Uint8Array([0x00, 0xFF, 0xFE, 0x00, 0x12, 0x34]);
    expect(isLikelyUtf8Text(binaryBytes)).toBe(false);
  });

  it('encodes large byte arrays using chunking without call-stack overflow', () => {
    const large = new Uint8Array(65536); // 64KB
    for (let i = 0; i < large.length; i++) {
      large[i] = i % 256;
    }
    const b64 = bytesToBase64(large);
    expect(b64.length).toBeGreaterThan(65536);
    const roundTrip = base64ToBytes(b64);
    expect(roundTrip.isValid).toBe(true);
    expect(roundTrip.bytes.length).toBe(large.length);
  });

  it('handles empty input gracefully', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
    const decoded = base64ToBytes('');
    expect(decoded.isValid).toBe(false);
    expect(decoded.bytes.length).toBe(0);
  });

  it('preserves multi-byte Unicode, emoji, and non-Latin characters round-trip', () => {
    const text = 'Hello 世界 🌍! Special chars: àéîöñ — Привет мир! 🚀🔥';
    const bytes = new TextEncoder().encode(text);
    const b64 = bytesToBase64(bytes);
    const decoded = base64ToBytes(b64);
    expect(decoded.isValid).toBe(true);
    const recoveredText = new TextDecoder().decode(decoded.bytes);
    expect(recoveredText).toBe(text);
  });

  it('processes 10MB payload safely with exact round-trip integrity', () => {
    const size = 10 * 1024 * 1024;
    const large = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      large[i] = (i * 31) % 256;
    }
    const b64 = bytesToBase64(large);
    expect(b64.length).toBe(Math.ceil(size / 3) * 4);

    const decoded = base64ToBytes(b64);
    expect(decoded.isValid).toBe(true);
    expect(decoded.bytes.length).toBe(size);
    // Spot-check byte equality
    expect(decoded.bytes[0]).toBe(large[0]);
    expect(decoded.bytes[size - 1]).toBe(large[size - 1]);
    expect(decoded.bytes[Math.floor(size / 2)]).toBe(large[Math.floor(size / 2)]);
  });
});

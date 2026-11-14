import { describe, it, expect, vi } from 'vitest';
import { detectMimeFromBase64String, detectMimeFromBytes } from '../services/mime-detection.service';
import { parseJwtToken, inspectBase64 } from '../services/base64-inspector.service';
import { base64ToBytes, bytesToBase64 } from '../services/base64.service';
import * as clipboardModule from '@/lib/clipboard';

describe('Audit Remediation 1: MIME Detection for Wrapped Base64', () => {
  // 1x1 transparent PNG
  const rawPngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Minimal JPEG header (FF D8 FF E0 00 10 4A 46 49 46 00 01)
  const rawJpegB64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  // Minimal PDF header (%PDF-1.5 ...)
  const rawPdfB64 = 'JVBERi0xLjUKJcfsj6IKNCAwIG9iaiA8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1syIDAgUl1+Pj4=';

  // Minimal WebP header (RIFF....WEBP)
  const rawWebpB64 = 'UklGRlIAAABXRUJQVlA4TEYAAAAvAAAAAAfQ//73v/+IdrY291D11h874u9i0/13t7X2N/0R0b26v8/7v9/v/z9///8/AAA=';

  it('detects PNG with standard unbroken Base64', () => {
    const res = detectMimeFromBase64String(rawPngB64);
    expect(res.mimeType).toBe('image/png');
    expect(res.category).toBe('image');
    expect(res.confidence).toBe('high');
  });

  it('detects PNG with CRLF (\\r\\n) MIME/PEM line wrapping', () => {
    // Wrap every 32 chars with \r\n
    const wrappedPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB\r\nCAYAAAAfFcSJAAAADUlEQVR42mNk\r\n+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = detectMimeFromBase64String(wrappedPng);
    expect(res.mimeType).toBe('image/png');
    expect(res.category).toBe('image');
    expect(res.confidence).toBe('high');
  });

  it('detects JPEG with spaces, tabs, and line breaks', () => {
    const spacedJpeg = `  /9j/4AAQ  \n  SkZJRgAB \t AQEASABI \r\n AAD/2wBDAP//  `;
    const res = detectMimeFromBase64String(spacedJpeg);
    expect(res.mimeType).toBe('image/jpeg');
    expect(res.category).toBe('image');
    expect(res.confidence).toBe('high');
  });

  it('detects PDF with wrapped Base64', () => {
    const wrappedPdf = 'JVBERi0xLjUK\r\nJcfsj6IKNCAw\r\nIG9iaiA8PC9UeXBl\r\nL1BhZ2VzL0NvdW50';
    const res = detectMimeFromBase64String(wrappedPdf);
    expect(res.mimeType).toBe('application/pdf');
    expect(res.category).toBe('pdf');
    expect(res.confidence).toBe('high');
  });

  it('detects WebP from Base64', () => {
    const res = detectMimeFromBase64String(rawWebpB64);
    expect(res.mimeType).toBe('image/webp');
    expect(res.category).toBe('image');
    expect(res.confidence).toBe('high');
  });

  it('detects format even with missing padding', () => {
    // "JVBERi0xLjU" is 11 chars (missing 1 '=' padding for 12 chars)
    const unpaddedPdf = 'JVBERi0xLjU';
    const res = detectMimeFromBase64String(unpaddedPdf);
    expect(res.mimeType).toBe('application/pdf');
    expect(res.confidence).toBe('high');
  });

  it('handles invalid Base64 characters without crashing', () => {
    const invalid = '!@#$%^&*()_+~`|}{[]:;?><,./';
    const res = detectMimeFromBase64String(invalid);
    expect(res.mimeType).toBe('application/octet-stream');
    expect(res.confidence).toBe('low');
  });

  it('handles empty input and whitespace-only input safely', () => {
    expect(detectMimeFromBase64String('').mimeType).toBe('application/octet-stream');
    expect(detectMimeFromBase64String('   \n\t\r\n  ').mimeType).toBe('application/octet-stream');
  });

  it('handles very short payloads safely without throwing', () => {
    expect(detectMimeFromBase64String('A').mimeType).toBe('application/octet-stream');
    expect(detectMimeFromBase64String('AA').mimeType).toBe('application/octet-stream');
    expect(detectMimeFromBase64String('AAA').mimeType).toBe('application/octet-stream');
  });

  it('verifies whitespace normalization does not alter decoded bytes or create false positives', () => {
    const normalBytes = base64ToBytes(rawPngB64).bytes;
    const cleanedSampleBytes = base64ToBytes(rawPngB64.replace(/\s+/g, '')).bytes;
    expect(normalBytes).toEqual(cleanedSampleBytes);

    // Ensure non-matching random string does not falsely match
    const randomB64 = btoa('The quick brown fox jumps over the lazy dog');
    const randomRes = detectMimeFromBase64String(randomB64);
    expect(randomRes.confidence).toBe('low');
  });
});

describe('Audit Remediation 2: JWT UTF-8 Claim Inspection', () => {
  // Helper to construct a JWT from header and payload JS objects with optional UTF-8 string encoding
  function makeJwt(headerObj: object, payloadObj: object, signature = 'signature123', urlSafe = true): string {
    const enc = new TextEncoder();
    const hBytes = enc.encode(JSON.stringify(headerObj));
    const pBytes = enc.encode(JSON.stringify(payloadObj));
    const hB64 = bytesToBase64(hBytes, urlSafe);
    const pB64 = bytesToBase64(pBytes, urlSafe);
    return `${hB64}.${pB64}.${signature}`;
  }

  it('correctly parses ASCII claims', () => {
    const token = makeJwt({ alg: 'HS256', typ: 'JWT' }, { sub: 'user_123', role: 'admin' });
    const res = parseJwtToken(token);
    expect(res.isJwt).toBe(true);
    expect(res.header.alg).toBe('HS256');
    expect(res.payload.sub).toBe('user_123');
    expect(res.payload.role).toBe('admin');
    expect(res.hasSignature).toBe(true);
  });

  it('correctly decodes accented UTF-8 claims (French/Spanish)', () => {
    const token = makeJwt(
      { alg: 'RS256', typ: 'JWT' },
      { name: 'René Descartes', location: 'Montréal', note: '¡Olé! Señor González' }
    );
    const res = parseJwtToken(token);
    expect(res.isJwt).toBe(true);
    expect(res.payload.name).toBe('René Descartes');
    expect(res.payload.location).toBe('Montréal');
    expect(res.payload.note).toBe('¡Olé! Señor González');
  });

  it('correctly decodes Hindi (Devanagari) UTF-8 claims', () => {
    const token = makeJwt(
      { alg: 'HS256' },
      { greeting: 'नमस्ते', author: 'विकास', city: 'नई दिल्ली' }
    );
    const res = parseJwtToken(token);
    expect(res.isJwt).toBe(true);
    expect(res.payload.greeting).toBe('नमस्ते');
    expect(res.payload.author).toBe('विकास');
    expect(res.payload.city).toBe('नई दिल्ली');
  });

  it('correctly decodes Japanese (Kanji/Kana) UTF-8 claims', () => {
    const token = makeJwt(
      { alg: 'ES256' },
      { message: 'こんにちは世界', city: '東京', org: '日本開発' }
    );
    const res = parseJwtToken(token);
    expect(res.isJwt).toBe(true);
    expect(res.payload.message).toBe('こんにちは世界');
    expect(res.payload.city).toBe('東京');
    expect(res.payload.org).toBe('日本開発');
  });

  it('correctly decodes Cyrillic UTF-8 claims', () => {
    const token = makeJwt(
      { alg: 'HS384' },
      { title: 'Привет мир', author: 'Лев Толстой', location: 'Москва' }
    );
    const res = parseJwtToken(token);
    expect(res.isJwt).toBe(true);
    expect(res.payload.title).toBe('Привет мир');
    expect(res.payload.author).toBe('Лев Толстой');
    expect(res.payload.location).toBe('Москва');
  });

  it('correctly decodes Emoji UTF-8 claims', () => {
    const token = makeJwt(
      { alg: 'HS256' },
      { badge: '🚀✨🔥💻', status: 'verified ✅', tags: ['⚡️', '🎉'] }
    );
    const res = parseJwtToken(token);
    expect(res.isJwt).toBe(true);
    expect(res.payload.badge).toBe('🚀✨🔥💻');
    expect(res.payload.status).toBe('verified ✅');
    expect(res.payload.tags).toEqual(['⚡️', '🎉']);
  });

  it('supports unpadded Base64URL segments with - and _ characters', () => {
    // Craft payload with bytes that produce '-' and '_' in Base64URL
    const header = { alg: 'HS256', kid: 'key-test_01' };
    const payload = { data: 'Special url-safe test chars >>> ???' };
    const token = makeJwt(header, payload, 'sig_-123', true); // urlSafe = true
    const res = parseJwtToken(token);
    expect(res.isJwt).toBe(true);
    expect(res.header.kid).toBe('key-test_01');
    expect(res.payload.data).toBe('Special url-safe test chars >>> ???');
  });

  it('rejects invalid token segment count', () => {
    const single = 'onlyonepart';
    const twoParts = 'partOne.partTwo';
    const fourParts = 'part1.part2.part3.part4';

    expect(parseJwtToken(single).isJwt).toBe(false);
    expect(parseJwtToken(single).error).toContain('Invalid token segment count');

    expect(parseJwtToken(twoParts).isJwt).toBe(false);
    expect(parseJwtToken(twoParts).error).toContain('Invalid token segment count');

    expect(parseJwtToken(fourParts).isJwt).toBe(false);
    expect(parseJwtToken(fourParts).error).toContain('Invalid token segment count');
  });

  it('rejects malformed Base64 in segments safely', () => {
    const badBase64 = 'not@valid$b64.eyJzdWIiOiIxMjMifQ.sig';
    const res = parseJwtToken(badBase64);
    expect(res.isJwt).toBe(false);
    expect(res.error).toContain('Malformed Base64');
  });

  it('rejects invalid JSON in payload safely', () => {
    const badJsonPayload = btoa('this is not json at all');
    const validHeader = btoa(JSON.stringify({ alg: 'none' }));
    const token = `${validHeader}.${badJsonPayload}.`;
    const res = parseJwtToken(token);
    expect(res.isJwt).toBe(false);
    expect(res.error).toContain('Invalid JSON in payload');
  });

  it('integrates seamlessly with inspectBase64()', () => {
    const token = makeJwt({ alg: 'HS256' }, { name: 'René', greeting: 'नमस्ते 🚀' });
    const report = inspectBase64(token);
    expect(report.jwtInfo?.isJwt).toBe(true);
    expect(report.jwtInfo?.payload.name).toBe('René');
    expect(report.jwtInfo?.payload.greeting).toBe('नमस्ते 🚀');
    expect(report.explanation).toContain('JSON Web Token (JWT)');
  });
});

describe('Audit Remediation 3: Hex Dump Clipboard Handling', () => {
  it('calls copyToClipboard with formatted uppercase space-separated hex bytes', async () => {
    const spy = vi.spyOn(clipboardModule, 'copyToClipboard').mockResolvedValue(true);

    const testBytes = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"
    const hexParts: string[] = [];
    const limit = Math.min(testBytes.length, 16384);
    for (let i = 0; i < limit; i++) {
      hexParts.push(testBytes[i].toString(16).padStart(2, '0').toUpperCase());
    }
    const textToCopy = hexParts.join(' ');

    const success = await clipboardModule.copyToClipboard(textToCopy);

    expect(spy).toHaveBeenCalledWith('48 65 6C 6C 6F');
    expect(success).toBe(true);
    spy.mockRestore();
  });

  it('handles clipboard failure gracefully when copyToClipboard returns false', async () => {
    const spy = vi.spyOn(clipboardModule, 'copyToClipboard').mockResolvedValue(false);

    const success = await clipboardModule.copyToClipboard('FF FF');
    expect(success).toBe(false);
    spy.mockRestore();
  });
});


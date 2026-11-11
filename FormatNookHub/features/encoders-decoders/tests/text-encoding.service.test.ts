import { describe, it, expect } from 'vitest';
import {
  encodeText,
  decodeToText,
  encodeHexToBase64,
  decodeBase64ToHex,
  encodeUrlToBase64,
  encodeHtmlToBase64,
  encodeCssToBase64,
  decodeBasicAuth,
} from '../services/text-encoding.service';

describe('text-encoding.service', () => {
  it('encodes UTF-8 strings with special characters and emojis', () => {
    const raw = 'FormatNook 🚀 🌍 Special: ü ö ä ñ';
    const res = encodeText(raw);
    expect(res.isValid).toBe(true);

    const decoded = decodeToText(res.output);
    expect(decoded.isValid).toBe(true);
    expect(decoded.output).toBe(raw);
    expect(decoded.isBinary).toBe(false);
  });

  it('converts Hexadecimal to Base64 and vice versa', () => {
    // "Hello" in hex: 48656c6c6f
    const hex = '48 65 6c 6c 6f';
    const toB64 = encodeHexToBase64(hex);
    expect(toB64.isValid).toBe(true);
    expect(toB64.output).toBe('SGVsbG8=');

    const toHex = decodeBase64ToHex('SGVsbG8=', { uppercase: true, grouping: 'space' });
    expect(toHex.isValid).toBe(true);
    expect(toHex.output).toBe('48 65 6C 6C 6F');
  });

  it('rejects incomplete odd-length hexadecimal strings', () => {
    const oddHex = '48656c6c6'; // 9 chars
    const res = encodeHexToBase64(oddHex);
    expect(res.isValid).toBe(false);
    expect(res.issues[0].message).toContain('complete 2-character byte pairs');
  });

  it('encodes URLs without performing network requests', () => {
    const url = 'https://formatnook.com/callback?query=test&id=123';
    const res = encodeUrlToBase64(url, true);
    expect(res.isValid).toBe(true);
    expect(res.output).not.toContain('+');
    expect(res.output).not.toContain('/');
  });

  it('generates Data URI and embed examples for HTML and CSS', () => {
    const html = '<h1>FormatNook</h1>';
    const htmlRes = encodeHtmlToBase64(html);
    expect(htmlRes.isValid).toBe(true);
    expect(htmlRes.dataUri).toContain('data:text/html;base64,');
    expect(htmlRes.embedExample).toContain('<iframe');

    const css = 'body { color: red; }';
    const cssRes = encodeCssToBase64(css);
    expect(cssRes.isValid).toBe(true);
    expect(cssRes.dataUri).toContain('data:text/css;base64,');
    expect(cssRes.embedExample).toContain('<link rel="stylesheet"');
  });

  it('decodes Basic Authentication headers accurately without modifying secrets', () => {
    // "admin:secretpassword123" in base64: YWRtaW46c2VjcmV0cGFzc3dvcmQxMjM=
    const header = 'Authorization: Basic YWRtaW46c2VjcmV0cGFzc3dvcmQxMjM=';
    const creds = decodeBasicAuth(header);
    expect(creds.isValid).toBe(true);
    expect(creds.username).toBe('admin');
    expect(creds.password).toBe('secretpassword123');
    expect(creds.hasPassword).toBe(true);
  });

  it('handles Basic Auth with username only and no password', () => {
    // "api_user_key:" in base64: YXBpX3VzZXJfa2V5Og==
    const raw = 'Basic YXBpX3VzZXJfa2V5Og==';
    const creds = decodeBasicAuth(raw);
    expect(creds.isValid).toBe(true);
    expect(creds.username).toBe('api_user_key');
    expect(creds.password).toBe('');
  });

  describe('Base64 consolidated requirements', () => {
    it('encodes and decodes multi-byte Unicode strings and complex emojis', () => {
      const complexText = 'FormatNook 👩🏽‍💻 🚀 🌟 繁體中文 العربية Русский';
      const encoded = encodeText(complexText);
      expect(encoded.isValid).toBe(true);

      const decoded = decodeToText(encoded.output);
      expect(decoded.isValid).toBe(true);
      expect(decoded.output).toBe(complexText);
    });

    it('handles large text inputs efficiently without stack overflow', () => {
      // 100KB text
      const largeText = 'A'.repeat(100 * 1024);
      const encoded = encodeText(largeText);
      expect(encoded.isValid).toBe(true);
      expect(encoded.output.length).toBeGreaterThan(100 * 1024);

      const decoded = decodeToText(encoded.output);
      expect(decoded.isValid).toBe(true);
      expect(decoded.output.length).toBe(100 * 1024);
    });

    it('handles empty inputs gracefully', () => {
      const emptyEncoded = encodeText('');
      expect(emptyEncoded.output).toBe('');
      expect(emptyEncoded.isValid).toBe(true);

      const emptyDecoded = decodeToText('');
      expect(emptyDecoded.isValid).toBe(false);
      expect(emptyDecoded.output).toBe('');
    });

    it('detects binary image data and provides hex inspection rather than garbled text', () => {
      // 1x1 transparent PNG data in Base64
      const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const decoded = decodeToText(pngB64);
      expect(decoded.isValid).toBe(true);
      expect(decoded.isBinary).toBe(true);
      expect(decoded.hexPreview).toContain('89 50 4E 47'); // PNG magic bytes
    });

    it('rejects invalid Base64 sequences with meaningful diagnostics', () => {
      const invalid = 'SGVsbG8===InvalidChars***';
      const decoded = decodeToText(invalid);
      expect(decoded.isValid).toBe(false);
      expect(decoded.issues.length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { validateBase64 } from '../services/base64-validator.service';
import { repairBase64 } from '../services/base64-repair.service';
import { inspectBase64 } from '../services/base64-inspector.service';
import {
  parseDataUri,
  generateDataUri,
  buildDataUriSnippets,
  dataUriToDownloadableFile,
} from '../services/data-uri.service';
import { gzipCompressToBase64, gzipDecompressFromBase64 } from '../services/gzip-base64.service';
import { extractBase64Payloads } from '../services/payload-extractor.service';
import { base64ToBinaryBits, binaryBitsToBase64 } from '../services/binary-conversion.service';
import { encodeBasicAuth, decodeBasicAuth } from '../services/text-encoding.service';

describe('Base64 Validator Service', () => {
  it('identifies valid RFC 4648 standard Base64', () => {
    const res = validateBase64('SGVsbG8sIEZvcm1hdE5vb2sh');
    expect(res.isValid).toBe(true);
    expect(res.variant).toBe('standard');
    expect(res.errors).toHaveLength(0);
    expect(res.estimatedDecodedBytes).toBe(18); // "Hello, FormatNook!" is 18 bytes
  });

  it('identifies URL-safe Base64 without padding', () => {
    // "SGVsbG8-V29ybGQ" contains '-' (URL-safe) and has length 15 (remainder 3)
    const res = validateBase64('SGVsbG8-V29ybGQ');
    expect(res.isValid).toBe(true);
    expect(res.variant).toBe('url-safe');
    expect(res.paddingStatus).toBe('unpadded-url-safe');
  });

  it('detects missing padding on standard Base64', () => {
    // "Hello World" is "SGVsbG8gV29ybGQ=" (15 chars unpadded, remainder 3 -> needs 1 =)
    const res = validateBase64('SGVsbG8gV29ybGQ');
    expect(res.isValid).toBe(false);
    expect(res.paddingStatus).toBe('missing');
    expect(res.errors.some((e) => e.code === 'MISSING_PADDING')).toBe(true);
  });

  it('detects mathematically invalid length remainder 1', () => {
    // "A" alone cannot form a valid byte
    const res = validateBase64('ABCDE'); // 5 chars -> remainder 1
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.code === 'INVALID_MODULO_LENGTH')).toBe(true);
  });

  it('identifies exact illegal character and position', () => {
    const res = validateBase64('SGVsbG8$V29ybGQ=');
    expect(res.isValid).toBe(false);
    const illegalErr = res.errors.find((e) => e.code === 'ILLEGAL_CHARACTER');
    expect(illegalErr).toBeDefined();
    expect(illegalErr?.position).toBe(7); // "SGVsbG8" is 7 chars (0-6), $ is at index 7
  });

  it('detects mixed Base64 standard and URL-safe alphabet', () => {
    const res = validateBase64('SGVs+G8-V29ybGQ=');
    expect(res.isValid).toBe(false);
    expect(res.variant).toBe('mixed');
    expect(res.errors.some((e) => e.code === 'MIXED_BASE64_VARIANTS')).toBe(true);
  });

  it('detects Data URI scheme header correctly', () => {
    const res = validateBase64('data:image/png;base64,iVBORw0KGgo=');
    expect(res.hasDataUriPrefix).toBe(true);
    expect(res.dataUriMime).toBe('image/png');
  });
});

describe('Base64 Repair Service', () => {
  it('strips Data URI header and whitespace', () => {
    const input = 'data:text/plain;base64, \n SGVsbG8g\r\n V29ybGQ= \n';
    const res = repairBase64(input);
    expect(res.repairedOutput).toBe('SGVsbG8gV29ybGQ=');
    expect(res.isSuccessfullyDecodable).toBe(true);
    expect(res.transformations).toContain('Stripped Data URI prefix header');
  });

  it('repairs missing padding mathematically', () => {
    const input = 'SGVsbG8gV29ybGQ'; // needs =
    const res = repairBase64(input, { fixPadding: true });
    expect(res.repairedOutput).toBe('SGVsbG8gV29ybGQ=');
    expect(res.isSuccessfullyDecodable).toBe(true);
  });

  it('converts URL-safe to standard Base64', () => {
    const input = 'a-b_';
    const res = repairBase64(input, { convertUrlSafeToStandard: true });
    expect(res.repairedOutput).toBe('a+b/');
  });

  it('strips invalid characters only when explicitly requested', () => {
    const input = 'SGVsbG8$IQ==';
    const safeRes = repairBase64(input, { stripInvalidChars: false, fixPadding: false });
    expect(safeRes.repairedOutput).toBe('SGVsbG8$IQ==');
    expect(safeRes.warnings.length).toBeGreaterThan(0);

    const strippedRes = repairBase64(input, { stripInvalidChars: true, fixPadding: false });
    expect(strippedRes.repairedOutput).toBe('SGVsbG8IQ=='); // $ removed
    expect(strippedRes.removedCharCount).toBe(1);
  });

  it('applies 64-character line wrapping', () => {
    const longInput = 'A'.repeat(140);
    const res = repairBase64(longInput, { lineWrap: '64' });
    const lines = res.repairedOutput.split('\n');
    expect(lines[0]).toHaveLength(64);
    expect(lines[1]).toHaveLength(64);
    expect(lines[2]).toHaveLength(12);
  });
});

describe('Smart Base64 Inspector Service', () => {
  it('inspects PNG image magic header', () => {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const report = inspectBase64(pngBase64);
    expect(report.mimeResult.mimeType).toBe('image/png');
    expect(report.mimeResult.category).toBe('image');
    expect(report.suggestedExtension).toBe('.png');
    expect(report.confidence).toBe('high');
    expect(report.suggestedActions.some((a) => a.id === 'preview-image')).toBe(true);
  });

  it('inspects PDF magic header', () => {
    const pdfBase64 = 'JVBERi0xLjUKJcfsj6IKNCAwIG9iaiA=';
    const report = inspectBase64(pdfBase64);
    expect(report.mimeResult.mimeType).toBe('application/pdf');
    expect(report.suggestedExtension).toBe('.pdf');
    expect(report.suggestedActions.some((a) => a.id === 'preview-pdf')).toBe(true);
  });

  it('inspects JSON Web Token structure', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvcm1hdE5vb2sgRGV2In0.mockSignature';
    const report = inspectBase64(jwt);
    expect(report.jwtInfo?.isJwt).toBe(true);
    expect(report.jwtInfo?.header.alg).toBe('HS256');
    expect(report.jwtInfo?.payload.name).toBe('FormatNook Dev');
  });

  it('inspects readable UTF-8 text and provides preview', () => {
    const textB64 = 'SGVsbG8sIFdvcmxkISA8ZGV2Pg==';
    const report = inspectBase64(textB64);
    expect(report.isText).toBe(true);
    expect(report.textPreview).toContain('Hello, World! <dev>');
  });
});

describe('Data URI Service', () => {
  it('parses valid Data URI components', () => {
    const uri = 'data:image/svg+xml;charset=utf-8;base64,PHN2Zz48L3N2Zz4=';
    const parsed = parseDataUri(uri);
    expect(parsed.isValid).toBe(true);
    expect(parsed.mimeType).toBe('image/svg+xml');
    expect(parsed.mediaType).toBe('image');
    expect(parsed.charset).toBe('utf-8');
    expect(parsed.isBase64).toBe(true);
    expect(parsed.rawPayload).toBe('PHN2Zz48L3N2Zz4=');
  });

  it('generates Data URI string correctly', () => {
    const uri = generateDataUri('iVBORw0KGgo=', 'image/png');
    expect(uri).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('builds developer code snippets for image', () => {
    const uri = 'data:image/png;base64,iVBORw0KGgo=';
    const snippets = buildDataUriSnippets(uri, 'image/png');
    expect(snippets.htmlImg).toBe(`<img src="${uri}" alt="Embedded Image" />`);
    expect(snippets.cssBackground).toBe(`background-image: url("${uri}");`);
    expect(snippets.jsConstant).toContain(`const embeddedAsset = "${uri}";`);
  });

  it('converts Data URI to downloadable file', () => {
    const uri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const file = dataUriToDownloadableFile(uri, 'custom-icon');
    expect(file.filename).toBe('custom-icon.png');
    expect(file.mimeType).toBe('image/png');
    expect(file.blob.size).toBeGreaterThan(0);
  });
});

describe('Gzip + Base64 Utilities', () => {
  it('compresses text and decompresses back with byte fidelity', async () => {
    // Only run if CompressionStream is available in test environment
    if (typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined') {
      const original = 'FormatNook Hub Production Quality Test 🚀 Repeating data for gzip: '.repeat(20);
      const compressed = await gzipCompressToBase64(original);
      expect(compressed.isValid).toBe(true);
      expect(compressed.base64).toBeTruthy();
      expect(compressed.compressionRatioPercent).toBeGreaterThan(0);

      const decompressed = await gzipDecompressFromBase64(compressed.base64);
      expect(decompressed.isValid).toBe(true);
      expect(decompressed.text).toBe(original);
    }
  });

  it('rejects invalid non-gzip payloads safely', async () => {
    const invalidGzipBase64 = 'SGVsbG8sIFdvcmxkIQ=='; // "Hello, World!" (not gzip)
    const res = await gzipDecompressFromBase64(invalidGzipBase64);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Gzip magic bytes');
  });
});

describe('Payload Extractor Service', () => {
  it('extracts embedded Base64 strings from mixed logs and JSON', () => {
    const log = `
      [INFO] User uploaded avatar: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
      [DEBUG] Auth token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0
      [WARN] Random string that is short: abc
    `;
    const candidates = extractBase64Payloads(log);
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates.some((c) => c.detectedMime === 'image/png')).toBe(true);
  });
});

describe('Binary Bit String Converter', () => {
  it('converts Base64 to binary bits', () => {
    // 'A' (ASCII 65 = 01000001) in base64 is 'QQ=='
    const res = base64ToBinaryBits('QQ==', { grouping: 'byte' });
    expect(res.isValid).toBe(true);
    expect(res.binaryString).toBe('01000001');
    expect(res.totalBits).toBe(8);
    expect(res.totalBytes).toBe(1);
  });

  it('converts binary bits back to Base64', () => {
    const res = binaryBitsToBase64('01000001');
    expect(res.isValid).toBe(true);
    expect(res.base64).toBe('QQ==');
  });

  it('rejects incomplete binary bits (not multiple of 8)', () => {
    const res = binaryBitsToBase64('0100000'); // 7 bits
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('not a multiple of 8');
  });
});

describe('Basic Auth Encoder and Decoder', () => {
  it('encodes username and password into Authorization header and curl snippet', () => {
    const res = encodeBasicAuth('admin', 'secret123');
    expect(res.authorizationHeader).toBe('Authorization: Basic YWRtaW46c2VjcmV0MTIz');
    expect(res.curlExample).toContain('Authorization: Basic YWRtaW46c2VjcmV0MTIz');
  });

  it('decodes header back into username and password', () => {
    const res = decodeBasicAuth('Authorization: Basic YWRtaW46c2VjcmV0MTIz');
    expect(res.isValid).toBe(true);
    expect(res.username).toBe('admin');
    expect(res.password).toBe('secret123');
  });
});

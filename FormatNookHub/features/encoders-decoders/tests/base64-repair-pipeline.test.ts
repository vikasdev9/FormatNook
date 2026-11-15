import { describe, it, expect } from 'vitest';
import {
  repairBase64,
  extractPayloadCandidates,
  normalizeBase64Candidate,
  repairBase64CandidateAdvanced,
  validateBase64Candidate,
  inspectInputFormat,
  normalizeMimeAlias,
  DEFAULT_REPAIR_OPTIONS,
} from '../services/base64-repair.service';

const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const SAMPLE_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

const SAMPLE_GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const SAMPLE_TEXT_BASE64 = 'SGVsbG8gV29ybGQh'; // "Hello World!"

describe('Advanced Base64 Repair & Normalize Pipeline Tests', () => {
  // =========================================================================
  // 1. EXTRACTION TESTS (Scenarios 1-10)
  // =========================================================================
  describe('Extraction Engine', () => {
    it('1. extracts plain Base64 image payload', () => {
      const res = repairBase64(SAMPLE_PNG_BASE64);
      expect(res.inputFormat).toBe('plain_base64');
      expect(res.extractedCandidates).toHaveLength(1);
      expect(res.extractedCandidates[0].repairedPayload).toBe(SAMPLE_PNG_BASE64);
      expect(res.isBase64Valid).toBe(true);
      expect(res.isImageValid).toBe(true);
      expect(res.detectedFormat).toBe('PNG');
      expect(res.detectedMimeType).toBe('image/png');
    });

    it('2. extracts valid Data URI image payload and strips header cleanly', () => {
      const input = `data:image/png;base64,${SAMPLE_PNG_BASE64}`;
      const res = repairBase64(input);
      expect(res.inputFormat).toBe('data_uri');
      expect(res.repairedOutput).toBe(SAMPLE_PNG_BASE64);
      expect(res.isBase64Valid).toBe(true);
      expect(res.isImageValid).toBe(true);
      expect(res.detectedMimeType).toBe('image/png');
      expect(res.transformations).toContain('Stripped Data URI prefix header');
    });

    it('3. extracts image Data URI from inside a JSON object', () => {
      const jsonInput = JSON.stringify({
        banner_image: `data:image/jpeg;base64,${SAMPLE_JPEG_BASE64}`,
        status: 'active',
      });
      const res = repairBase64(jsonInput);
      expect(res.inputFormat).toBe('json_object');
      expect(res.extractedCandidates).toHaveLength(1);
      expect(res.extractedCandidates[0].propertyName).toBe('banner_image');
      expect(res.extractedCandidates[0].sourceType).toBe('json_field');
      expect(res.repairedOutput).toBe(SAMPLE_JPEG_BASE64);
      expect(res.detectedFormat).toBe('JPEG');
      expect(res.isImageValid).toBe(true);
    });

    it('4. extracts plain Base64 string from inside a JSON object without Data URI', () => {
      const jsonInput = JSON.stringify({
        photo: SAMPLE_PNG_BASE64,
        id: 12345,
      });
      const res = repairBase64(jsonInput);
      expect(res.inputFormat).toBe('json_object');
      expect(res.extractedCandidates).toHaveLength(1);
      expect(res.extractedCandidates[0].propertyName).toBe('photo');
      expect(res.repairedOutput).toBe(SAMPLE_PNG_BASE64);
      expect(res.detectedFormat).toBe('PNG');
    });

    it('5. extracts image from deeply nested JSON properties', () => {
      const nestedJson = JSON.stringify({
        data: {
          user: {
            profile: {
              avatar: `data:image/gif;base64,${SAMPLE_GIF_BASE64}`,
            },
          },
        },
      });
      const res = repairBase64(nestedJson);
      expect(res.extractedCandidates).toHaveLength(1);
      expect(res.extractedCandidates[0].propertyName).toBe('avatar');
      expect(res.extractedCandidates[0].sourceLocation).toBe('data.user.profile.avatar');
      expect(res.repairedOutput).toBe(SAMPLE_GIF_BASE64);
      expect(res.detectedFormat).toBe('GIF89a');
    });

    it('6. extracts and unescapes JSON string with escaped newlines and backslashes', () => {
      const escapedInput = `{\\n  "image": "data:image/png;base64,\\niVBORw0KGgoAAAANSUhEUgAAAAEAAAAB\\nCAYAAAAfFcSJAAAADUlEQVR42mNk\\n+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="\\n}`;
      const res = repairBase64(escapedInput);
      expect(res.extractedCandidates.length).toBeGreaterThanOrEqual(1);
      expect(res.repairedOutput).toBe(SAMPLE_PNG_BASE64);
      expect(res.isImageValid).toBe(true);
    });

    it('7. extracts multiple image candidates separately from a single JSON payload', () => {
      const multiJson = JSON.stringify({
        thumbnail: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
        full_banner: `data:image/jpeg;base64,${SAMPLE_JPEG_BASE64}`,
      });
      const res = repairBase64(multiJson);
      expect(res.extractedCandidates).toHaveLength(2);
      expect(res.extractedCandidates[0].propertyName).toBe('thumbnail');
      expect(res.extractedCandidates[1].propertyName).toBe('full_banner');
      expect(res.extractedCandidates[0].detectedFormat).toBe('PNG');
      expect(res.extractedCandidates[1].detectedFormat).toBe('JPEG');
    });

    it('8. extracts Base64 embedded in surrounding logs and harmless text', () => {
      const logText = `[2026-11-15 10:00:00] INFO API Gateway: Received avatar payload data:image/png;base64,${SAMPLE_PNG_BASE64} for user 42.`;
      const res = repairBase64(logText);
      expect(res.extractedCandidates).toHaveLength(1);
      expect(res.repairedOutput).toBe(SAMPLE_PNG_BASE64);
      expect(res.isImageValid).toBe(true);
    });

    it('9. strictly rejects false positives like property names "banner/image" and English words', () => {
      const trickyJson = JSON.stringify({
        banner_image: 'some other value that is definitely not base64',
        user_notes: 'hello world from developer',
      });
      const candidates = extractPayloadCandidates(trickyJson);
      // None of the values look like Base64 image payloads!
      expect(candidates).toHaveLength(0);

      // And JSON keys like "banner_image" are never extracted as payloads!
      const allExtractedKeys = candidates.map((c) => c.rawPayload);
      expect(allExtractedKeys).not.toContain('banner_image');
      expect(allExtractedKeys).not.toContain('banner/image');
    });

    it('10. allows separate selection when multiple genuine candidates are present', () => {
      const multiJson = JSON.stringify({
        firstImg: SAMPLE_PNG_BASE64,
        secondImg: SAMPLE_JPEG_BASE64,
      });
      const res = repairBase64(multiJson);
      expect(res.extractedCandidates).toHaveLength(2);

      // Candidate 1
      const cand1 = res.extractedCandidates[0];
      expect(cand1.repairedPayload).toBe(SAMPLE_PNG_BASE64);
      expect(cand1.detectedFormat).toBe('PNG');

      // Candidate 2
      const cand2 = res.extractedCandidates[1];
      expect(cand2.repairedPayload).toBe(SAMPLE_JPEG_BASE64);
      expect(cand2.detectedFormat).toBe('JPEG');
    });
  });

  // =========================================================================
  // 2. NORMALIZATION TESTS (Scenarios 11-20)
  // =========================================================================
  describe('Safe Normalization', () => {
    it('11. normalizes CRLF and LF embedded inside Base64 payloads', () => {
      const wrapped =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB\r\nCAYAAAAfFcSJAAAADUlEQVR42mNk\r\n+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = repairBase64(wrapped);
      expect(res.repairedOutput).toBe(SAMPLE_PNG_BASE64);
      expect(res.isBase64Valid).toBe(true);
      expect(res.isImageValid).toBe(true);
    });

    it('12. strips embedded tabs, spaces, and non-breaking spaces', () => {
      const spaced = `  iVBORw0KGgo  \t\u00A0  AAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==  \n`;
      const res = repairBase64(spaced);
      expect(res.repairedOutput).toBe(SAMPLE_PNG_BASE64);
      expect(res.isBase64Valid).toBe(true);
    });

    it('13. repairs missing padding with length remainder 2 by appending "=="', () => {
      // "any car" in Base64 is "YW55IGNhcg=="
      // If missing ==, it is "YW55IGNhcg" (length 10, remainder 2)
      const unpadded = 'YW55IGNhcg';
      const res = repairBase64(unpadded, { fixPadding: true });
      expect(res.repairedOutput).toBe('YW55IGNhcg==');
      expect(res.transformations).toContain('Appended missing "==" padding for modulo 4 alignment');
      expect(res.isBase64Valid).toBe(true);
    });

    it('14. repairs missing padding with length remainder 3 by appending "="', () => {
      // "any ca" in Base64 is "YW55IGNh"
      // "Hello World" is "SGVsbG8gV29ybGQ=" (length 15 -> missing =)
      const unpadded = 'SGVsbG8gV29ybGQ';
      const res = repairBase64(unpadded, { fixPadding: true });
      expect(res.repairedOutput).toBe('SGVsbG8gV29ybGQ=');
      expect(res.transformations).toContain('Appended missing "=" padding for modulo 4 alignment');
      expect(res.isBase64Valid).toBe(true);
    });

    it('15. reports unrecoverable length for remainder 1 and does not guess characters', () => {
      // Length 13 -> remainder 1 -> mathematically impossible in Base64
      const invalidRemainder1 = 'YW55IGNhcgEAB'; // 13 chars: 13 % 4 = 1
      const res = repairBase64(invalidRemainder1, { fixPadding: true });
      expect(res.isBase64Valid).toBe(false);
      expect(res.errors.some((e) => e.includes('remainder 1'))).toBe(true);
    });

    it('16. converts URL-safe Base64 (- and _) to standard RFC 4648 Base64 (+ and /)', () => {
      const urlSafePayload = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const res = repairBase64(urlSafePayload, { convertUrlSafeToStandard: true });
      expect(res.repairedOutput).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'); // already no -/_, but decodable
      expect(res.isBase64Valid).toBe(true);

      const urlSafeWithSymbols = 'ab-cd_ef';
      const convertedRes = repairBase64(urlSafeWithSymbols, { convertUrlSafeToStandard: true });
      expect(convertedRes.repairedOutput).toBe('ab+cd/ef');
    });

    it('17. preserves already canonical Base64 without unnecessary mutations', () => {
      const res = repairBase64(SAMPLE_PNG_BASE64);
      expect(res.repairedOutput).toBe(SAMPLE_PNG_BASE64);
      expect(res.isBase64Valid).toBe(true);
      expect(res.isImageValid).toBe(true);
    });

    it('18. normalizes MIME alias image/jpg to canonical image/jpeg', () => {
      const input = `data:image/jpg;base64,${SAMPLE_JPEG_BASE64}`;
      const res = repairBase64(input);
      expect(res.detectedMimeType).toBe('image/jpeg');
      expect(normalizeMimeAlias('image/jpg')).toBe('image/jpeg');
    });

    it('19. preserves valid existing padding without double-padding', () => {
      const res = repairBase64(SAMPLE_PNG_BASE64, { fixPadding: true });
      expect(res.repairedOutput.endsWith('==')).toBe(true);
      expect(res.repairedOutput.endsWith('====')).toBe(false);
    });

    it('20. detects and repairs invalid internal padding placement', () => {
      // Inadvertent '=' placed inside the stream: "iVBORw=0KGgo..."
      const corruptedPadding = 'SGVsbG8=V29ybGQ=';
      const res = repairBase64(corruptedPadding, { fixPadding: true });
      expect(res.transformations).toContain('Cleaned misplaced internal padding characters');
      expect(res.repairedOutput.slice(0, -2)).not.toContain('=');
      expect(res.repairedOutput.endsWith('==')).toBe(true);
    });
  });

  // =========================================================================
  // 3. REPAIR & SAFETY TESTS (Scenarios 21-29)
  // =========================================================================
  describe('Repair & Safety Engine', () => {
    it('21. preserves foreign characters and issues warning in safe mode (default)', () => {
      const input = 'SGVsbG8$IEZvcm1hdE5vb2s@IQ==';
      const res = repairBase64(input, { mode: 'safe', stripInvalidChars: false });
      expect(res.repairedOutput).toContain('$');
      expect(res.repairedOutput).toContain('@');
      expect(res.warnings.some((w) => w.includes('invalid non-Base64 characters'))).toBe(true);
      expect(res.isBase64Valid).toBe(false);
    });

    it('22. strips foreign characters only in Advanced Repair mode and records details', () => {
      const input = 'SGVsbG8$IEZvcm1hdE5vb2s@IQ==';
      const res = repairBase64(input, { mode: 'advanced', stripInvalidChars: true });
      expect(res.repairedOutput).not.toContain('$');
      expect(res.repairedOutput).not.toContain('@');
      expect(res.removedCharCount).toBe(2);
      expect(res.removedCharsDetails).toEqual([
        { char: '$', count: 1 },
        { char: '@', count: 1 },
      ]);
      expect(res.warnings.some((w) => w.includes('foreign character(s) were removed'))).toBe(true);
    });

    it('23. provides removed character count and breakdown for user review', () => {
      const input = 'ABC###DEF$$$';
      const res = repairBase64(input, { mode: 'advanced', stripInvalidChars: true });
      expect(res.removedCharCount).toBe(6);
      expect(res.removedCharsDetails).toContainEqual({ char: '#', count: 3 });
      expect(res.removedCharsDetails).toContainEqual({ char: '$', count: 3 });
    });

    it('24. correctly identifies truncated Base64 payload', () => {
      // First 20 characters of PNG (truncated)
      const truncated = SAMPLE_PNG_BASE64.slice(0, 21); // length 21 -> remainder 1
      const res = repairBase64(truncated);
      expect(res.isRecoverable).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    it('25. detects corrupted encoded characters where byte roundtrip changes', () => {
      // Non-canonical padding bits:
      // 'ZE==' has non-zero bits in the unused padding positions
      const nonCanonical = 'ZE==';
      const val = validateBase64Candidate(nonCanonical);
      expect(val.warnings.some((w) => w.includes('non-canonical padding bits'))).toBe(true);
    });

    it('26. handles empty and whitespace-only input safely', () => {
      const resEmpty = repairBase64('');
      expect(resEmpty.inputFormat).toBe('empty');
      expect(resEmpty.isBase64Valid).toBe(false);

      const resSpaces = repairBase64('   \n\t  ');
      expect(resSpaces.inputFormat).toBe('empty');
      expect(resSpaces.isBase64Valid).toBe(false);
    });

    it('27. handles large input payloads (1MB) efficiently without freezing', () => {
      const largeChunk = 'A'.repeat(1024 * 1024); // 1 MB of 'A's (modulo 4 is 0)
      const start = Date.now();
      const res = repairBase64(largeChunk);
      const elapsed = Date.now() - start;
      expect(res.repairedOutput.length).toBe(1024 * 1024);
      expect(res.isBase64Valid).toBe(true);
      expect(elapsed).toBeLessThan(500); // must execute under 500ms
    });

    it('28. accurately distinguishes valid Base64 that is NOT an image (e.g. plain text)', () => {
      const res = repairBase64(SAMPLE_TEXT_BASE64);
      expect(res.isBase64Valid).toBe(true);
      expect(res.isImageValid).toBe(false); // Valid Base64, but not an image!
      expect(res.confidence).toBe('medium');
      expect(res.warnings.some((w) => w.includes('does not match any known image signature'))).toBe(
        true
      );
    });

    it('29. detects valid Base64 containing damaged/incomplete image bytes', () => {
      // Header for PNG is 8 bytes: 89 50 4E 47 0D 0A 1A 0A
      // If payload is only the 8 bytes with zero IHDR chunks:
      // In base64: iVBORw0KGgo=
      const headerOnly = 'iVBORw0KGgo=';
      const res = repairBase64(headerOnly);
      expect(res.isBase64Valid).toBe(true);
      // parseImageBytes requires at least 26 bytes to read PNG dimensions and color type
      // So format is detected via magic bytes, but image is incomplete
      expect(res.detectedFormat).toBe('PNG');
      expect(res.imageDimensions).toBeUndefined(); // Incomplete header lacks dimensions
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  base64UrlDecode,
  cleanJwtToken,
  decodeJwt,
  analyzeTimestamp,
  formatTimeDifference,
} from '../services/jwt-service';

// Standard RFC 7519 dummy test token fixtures
const VALID_HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5In0'; // {"alg":"HS256","typ":"JWT","kid":"test-key"}
const VALID_PAYLOAD =
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik11bmNoZW4g8J+agCIsImFkbWluIjp0cnVlLCJleHAiOjE5MDM2OTg4MDAsImlhdCI6MTY3MjUzMTIwMCwibmJmIjoxNjcyNTMxMjAwLCJpc3MiOiJhdXRoLmRvbWFpbiJ9';
const VALID_SIG = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const FULL_VALID_JWT = `${VALID_HEADER}.${VALID_PAYLOAD}.${VALID_SIG}`;

describe('Base64URL and Token Cleaning Engine', () => {
  it('decodes standard base64url strings with hyphens and underscores', () => {
    // '-_' should map to '+/'
    const encoded = 'LS1fXw'; // '--__'
    const decoded = base64UrlDecode(encoded);
    expect(decoded).toBeDefined();
  });

  it('correctly decodes multi-byte UTF-8 Unicode characters and emojis without mojibake', () => {
    // {"test":"München 🚀"}
    const payloadStr = base64UrlDecode('eyJ0ZXN0IjoiTcO8bmNoZW4g8J+agCJ9');
    const parsed = JSON.parse(payloadStr);
    expect(parsed.test).toBe('München 🚀');
  });

  it('cleans surrounding quotes, whitespace, and Bearer prefix', () => {
    expect(cleanJwtToken('  "Bearer eyJhbGciOi..."  ')).toBe('eyJhbGciOi...');
    expect(cleanJwtToken("'eyJhbGciOi...'")).toBe('eyJhbGciOi...');
    expect(cleanJwtToken('`eyJhbGciOi...`')).toBe('eyJhbGciOi...');
  });
});

describe('JWT Decoding & Validation Engine', () => {
  it('parses a valid three-segment compact JWT', () => {
    const result = decodeJwt(FULL_VALID_JWT);
    expect(result.isValid).toBe(true);
    expect(result.segments.segmentCount).toBe(3);
    expect(result.header?.alg).toBe('HS256');
    expect(result.header?.kid).toBe('test-key');
    expect(result.payload?.sub).toBe('1234567890');
    expect(result.payload?.name).toBe('Munchen 🚀');
    expect(result.signature).toBe(VALID_SIG);
    expect(result.isUnsigned).toBe(false);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects tokens with missing or extra segments', () => {
    // Only two segments
    const twoSegments = `${VALID_HEADER}.${VALID_PAYLOAD}`;
    const result2 = decodeJwt(twoSegments);
    expect(result2.isValid).toBe(false);
    expect(result2.errors.some((e) => e.includes('Expected exactly 3'))).toBe(true);

    // Four segments
    const fourSegments = `${FULL_VALID_JWT}.extra`;
    const result4 = decodeJwt(fourSegments);
    expect(result4.isValid).toBe(false);
    expect(result4.errors.some((e) => e.includes('Expected exactly 3'))).toBe(true);
  });

  it('detects unsigned tokens declaring alg: none', () => {
    const unsignedHeader = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, '');
    const unsignedJwt = `${unsignedHeader}.${VALID_PAYLOAD}.`;
    const result = decodeJwt(unsignedJwt);
    expect(result.isUnsigned).toBe(true);
    expect(result.errors.some((e) => e.includes('alg: none'))).toBe(true);
  });

  it('rejects tokens where header or payload is an array or invalid JSON', () => {
    // Array payload: [1, 2, 3]
    const arrayPayload = btoa(JSON.stringify([1, 2, 3])).replace(/=/g, '');
    const arrayJwt = `${VALID_HEADER}.${arrayPayload}.${VALID_SIG}`;
    const result = decodeJwt(arrayJwt);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('must be a valid JSON object'))).toBe(true);

    // Malformed JSON payload
    const malformedPayload = btoa('{"invalid json:').replace(/=/g, '');
    const malformedJwt = `${VALID_HEADER}.${malformedPayload}.${VALID_SIG}`;
    const resultBadJson = decodeJwt(malformedJwt);
    expect(resultBadJson.isValid).toBe(false);
  });
});

describe('Timestamp & Expiration Analysis Engine', () => {
  it('correctly calculates active and expired tokens based on exp claim', () => {
    const now = Math.floor(Date.now() / 1000);

    // Future expiration (1 hour ahead)
    const futureAnalysis = analyzeTimestamp('exp', now + 3600, now, 0);
    expect(futureAnalysis.status).toBe('active');
    expect(futureAnalysis.message).toContain('Valid for another');

    // Expired timestamp (1 hour in the past)
    const pastAnalysis = analyzeTimestamp('exp', now - 3600, now, 0);
    expect(pastAnalysis.status).toBe('expired');
    expect(pastAnalysis.message).toContain('Token expired');
  });

  it('handles clock-skew tolerance correctly', () => {
    const now = Math.floor(Date.now() / 1000);

    // Expired 10 seconds ago, but with 30-second clock skew tolerance
    const skewAnalysis = analyzeTimestamp('exp', now - 10, now, 30);
    expect(skewAnalysis.status).toBe('active'); // Treated as active due to skew tolerance
  });

  it('handles missing, string, and fractional timestamp values without crashing', () => {
    const now = Math.floor(Date.now() / 1000);

    const missing = analyzeTimestamp('exp', undefined, now, 0);
    expect(missing.status).toBe('missing');

    const fractional = analyzeTimestamp('exp', now + 120.45, now, 0);
    expect(fractional.status).toBe('active');

    const invalid = analyzeTimestamp('exp', 'not-a-number', now, 0);
    expect(invalid.status).toBe('invalid');
  });

  it('formats time duration differences accurately', () => {
    expect(formatTimeDifference(45)).toBe('45s');
    expect(formatTimeDifference(150)).toBe('2m 30s');
    expect(formatTimeDifference(86400 * 2 + 3600 * 3)).toBe('2d 3h');
  });
});

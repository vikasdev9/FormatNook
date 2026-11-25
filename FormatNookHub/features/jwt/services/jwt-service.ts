import {
  JwtDecodeResult,
  JwtHeader,
  JwtPayload,
  JwtTimestampAnalysis,
} from '../types/jwt.types';

/**
 * Decodes a Base64URL string into a UTF-8 string.
 * Handles URL-safe characters (- and _), missing padding, and multi-byte UTF-8 sequences.
 */
export function base64UrlDecode(input: string): string {
  if (!input) return '';

  // 1. Convert URL-safe base64 characters back to standard base64
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // 2. Add padding '=' if missing
  const remainder = base64.length % 4;
  if (remainder === 2) {
    base64 += '==';
  } else if (remainder === 3) {
    base64 += '=';
  } else if (remainder === 1) {
    throw new Error('Illegal base64url string: invalid character length.');
  }

  // 3. Decode binary characters via atob
  const binaryStr = atob(base64);

  // 4. Decode binary bytes into UTF-8 text via TextDecoder
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

/**
 * Cleans surrounding whitespace, newlines, and quotes from pasted token strings.
 */
export function cleanJwtToken(raw: string): string {
  if (!raw) return '';
  let token = raw.trim();

  // Strip single, double quotes or backticks if token is wrapped in them
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'")) ||
    (token.startsWith('`') && token.endsWith('`'))
  ) {
    token = token.slice(1, -1).trim();
  }

  // Strip "Bearer " prefix if accidentally pasted with header keyword
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }

  return token;
}

/**
 * Formats a duration in seconds into human-readable string.
 */
export function formatTimeDifference(secondsDiff: number): string {
  const absSecs = Math.abs(secondsDiff);
  const days = Math.floor(absSecs / 86400);
  const hours = Math.floor((absSecs % 86400) / 3600);
  const minutes = Math.floor((absSecs % 3600) / 60);
  const seconds = Math.floor(absSecs % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0 || seconds > 0) parts.push(`${seconds}s`);

  return parts.slice(0, 2).join(' ');
}

/**
 * Analyzes standard NumericDate claim timestamps (exp, iat, nbf).
 */
export function analyzeTimestamp(
  claim: 'exp' | 'iat' | 'nbf',
  val: unknown,
  currentTimeSec: number,
  clockSkewSec: number = 0
): JwtTimestampAnalysis {
  const labelMap = {
    exp: 'Expiration Time (exp)',
    iat: 'Issued At (iat)',
    nbf: 'Not Before (nbf)',
  };

  if (val === undefined || val === null) {
    return {
      claim,
      label: labelMap[claim],
      rawSeconds: null,
      dateLocal: null,
      dateUtc: null,
      status: 'missing',
      message: 'Claim not present in token payload.',
    };
  }

  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num) || !isFinite(num)) {
    return {
      claim,
      label: labelMap[claim],
      rawSeconds: null,
      dateLocal: null,
      dateUtc: null,
      status: 'invalid',
      message: `Invalid timestamp value: "${String(val)}". NumericDate must be seconds.`,
    };
  }

  // Convert seconds to milliseconds for Date
  const dateObj = new Date(num * 1000);
  if (isNaN(dateObj.getTime())) {
    return {
      claim,
      label: labelMap[claim],
      rawSeconds: num,
      dateLocal: null,
      dateUtc: null,
      status: 'invalid',
      message: 'Timestamp value exceeds valid JavaScript Date bounds.',
    };
  }

  const dateLocal = dateObj.toLocaleString();
  const dateUtc = dateObj.toUTCString();

  if (claim === 'exp') {
    const isExpired = currentTimeSec - clockSkewSec > num;
    const diff = num - currentTimeSec;
    if (isExpired) {
      return {
        claim,
        label: labelMap[claim],
        rawSeconds: num,
        dateLocal,
        dateUtc,
        status: 'expired',
        message: `Token expired ${formatTimeDifference(diff)} ago.`,
      };
    }
    return {
      claim,
      label: labelMap[claim],
      rawSeconds: num,
      dateLocal,
      dateUtc,
      status: 'active',
      message: `Valid for another ${formatTimeDifference(diff)}.`,
    };
  }

  if (claim === 'nbf') {
    const isFuture = currentTimeSec + clockSkewSec < num;
    const diff = num - currentTimeSec;
    if (isFuture) {
      return {
        claim,
        label: labelMap[claim],
        rawSeconds: num,
        dateLocal,
        dateUtc,
        status: 'future',
        message: `Token not valid yet (starts in ${formatTimeDifference(diff)}).`,
      };
    }
    return {
      claim,
      label: labelMap[claim],
      rawSeconds: num,
      dateLocal,
      dateUtc,
      status: 'active',
      message: `Token became active ${formatTimeDifference(diff)} ago.`,
    };
  }

  // iat
  const diff = currentTimeSec - num;
  return {
    claim,
    label: labelMap[claim],
    rawSeconds: num,
    dateLocal,
    dateUtc,
    status: 'active',
    message: `Issued ${formatTimeDifference(diff)} ago.`,
  };
}

/**
 * Decodes and inspects a complete JWT string locally.
 */
export function decodeJwt(rawToken: string, clockSkewSec: number = 0): JwtDecodeResult {
  const token = cleanJwtToken(rawToken);

  if (!token) {
    return {
      isValid: false,
      raw: '',
      segments: { headerRaw: '', payloadRaw: '', signatureRaw: '', segmentCount: 0 },
      header: null,
      headerJson: '',
      payload: null,
      payloadJson: '',
      signature: '',
      isUnsigned: false,
      isExpired: false,
      isNotYetValid: false,
      timeRemaining: null,
      timestamps: [],
      errors: ['No token provided.'],
    };
  }

  const parts = token.split('.');
  const segmentCount = parts.length;
  const errors: string[] = [];

  const headerRaw = parts[0] || '';
  const payloadRaw = parts[1] || '';
  const signatureRaw = parts[2] || '';

  const segments = { headerRaw, payloadRaw, signatureRaw, segmentCount };

  // 1. Strict segment count check for signed compact JWT
  if (segmentCount !== 3) {
    errors.push(
      `Invalid compact JWT structure: Expected exactly 3 dot-separated segments (Header.Payload.Signature), but found ${segmentCount}.`
    );
  }

  let header: JwtHeader | null = null;
  let headerJson = '';
  let payload: JwtPayload | null = null;
  let payloadJson = '';

  // 2. Decode Header
  if (headerRaw) {
    try {
      const headerStr = base64UrlDecode(headerRaw);
      const parsed = JSON.parse(headerStr);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        errors.push('JWT Header must be a valid JSON object, not an array or primitive.');
      } else {
        header = parsed as JwtHeader;
        headerJson = JSON.stringify(header, null, 2);
      }
    } catch (e: unknown) {
      errors.push(`Failed to decode JWT Header: ${(e as Error).message}`);
    }
  }

  // 3. Decode Payload
  if (payloadRaw) {
    try {
      const payloadStr = base64UrlDecode(payloadRaw);
      const parsed = JSON.parse(payloadStr);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        errors.push('JWT Payload must be a valid JSON object, not an array or primitive.');
      } else {
        payload = parsed as JwtPayload;
        payloadJson = JSON.stringify(payload, null, 2);
      }
    } catch (e: unknown) {
      errors.push(`Failed to decode JWT Payload: ${(e as Error).message}`);
    }
  }

  // 4. Algorithm & Signature validation
  const alg = header?.alg ? String(header.alg).toLowerCase() : '';
  const isUnsigned = alg === 'none';

  if (isUnsigned) {
    errors.push('Warning: Token declares "alg: none" (unsigned token). Anyone can tamper with claims.');
  }

  if (segmentCount === 3 && !signatureRaw && !isUnsigned) {
    errors.push('Missing signature segment: Standard signed JWTs require a non-empty signature segment.');
  }

  // 5. Expiration & Timestamp checks
  const currentTimeSec = Math.floor(Date.now() / 1000);
  const timestamps: JwtTimestampAnalysis[] = [];

  if (payload) {
    timestamps.push(analyzeTimestamp('exp', payload.exp, currentTimeSec, clockSkewSec));
    timestamps.push(analyzeTimestamp('nbf', payload.nbf, currentTimeSec, clockSkewSec));
    timestamps.push(analyzeTimestamp('iat', payload.iat, currentTimeSec, clockSkewSec));
  }

  const expAnalysis = timestamps.find((t) => t.claim === 'exp');
  const nbfAnalysis = timestamps.find((t) => t.claim === 'nbf');

  const isExpired = expAnalysis?.status === 'expired';
  const isNotYetValid = nbfAnalysis?.status === 'future';

  let timeRemaining: string | null = null;
  if (expAnalysis && expAnalysis.rawSeconds !== null) {
    const diff = expAnalysis.rawSeconds - currentTimeSec;
    timeRemaining = diff > 0 ? formatTimeDifference(diff) : 'Expired';
  }

  const isValid = errors.length === 0 && header !== null && payload !== null;

  return {
    isValid,
    raw: token,
    segments,
    header,
    headerJson,
    payload,
    payloadJson,
    signature: signatureRaw,
    isUnsigned,
    isExpired,
    isNotYetValid,
    timeRemaining,
    timestamps,
    errors,
  };
}

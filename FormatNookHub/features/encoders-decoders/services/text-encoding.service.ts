import { bytesToBase64, base64ToBytes, isLikelyUtf8Text } from './base64.service';
import { hexToBytes, bytesToHex } from '../utils/byte-conversion.utils';
import { HexFormatOptions, BasicAuthCredentials, EncodingResult } from '../types/encoder-decoder.types';
import { truncateForDisplay } from '../utils/output-size.utils';

/**
 * Text to Base64 encoding supporting full multi-byte Unicode and emojis
 */
export function encodeText(text: string, urlSafe = false): EncodingResult {
  if (!text) {
    return { output: '', outputSize: 0, inputSize: 0, isValid: true, issues: [] };
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const base64 = bytesToBase64(bytes, urlSafe);
  const { displayText, isTruncated } = truncateForDisplay(base64);

  return {
    output: base64,
    displayOutput: displayText,
    isTruncatedForDisplay: isTruncated,
    outputSize: base64.length,
    inputSize: bytes.length,
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

/**
 * Base64 to Text decoding with non-text binary detection
 */
export function decodeToText(base64Str: string): EncodingResult & { isBinary: boolean; hexPreview?: string } {
  const { bytes, isValid, issues } = base64ToBytes(base64Str);
  if (!isValid) {
    return {
      output: '',
      outputSize: 0,
      inputSize: base64Str.length,
      isValid: false,
      issues,
      isBinary: false,
    };
  }

  const isText = isLikelyUtf8Text(bytes);
  if (!isText) {
    const hex = bytesToHex(bytes, { uppercase: true, grouping: 'space' });
    return {
      output: '[Binary Data Detected - Not Plain Text]',
      hexPreview: hex,
      displayOutput: `[Notice: The decoded ${bytes.length} bytes do not represent valid UTF-8 text]\n\nHexadecimal Representation:\n${hex.slice(0, 1000)}${hex.length > 1000 ? '...' : ''}`,
      outputSize: bytes.length,
      inputSize: base64Str.length,
      isValid: true,
      issues: [
        {
          message: 'Decoded data contains non-text binary bytes. Switched to hexadecimal inspection.',
          severity: 'info',
        },
      ],
      isBinary: true,
      rawBytes: bytes,
    };
  }

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const text = decoder.decode(bytes);
  const { displayText, isTruncated } = truncateForDisplay(text);

  return {
    output: text,
    displayOutput: displayText,
    isTruncatedForDisplay: isTruncated,
    outputSize: new Blob([text]).size,
    inputSize: base64Str.length,
    isValid: true,
    issues: [],
    isBinary: false,
    rawBytes: bytes,
  };
}

/**
 * Hex to Base64 conversion
 */
export function encodeHexToBase64(hex: string, urlSafe = false): EncodingResult {
  const { bytes, isValid, error } = hexToBytes(hex);
  if (!isValid) {
    return {
      output: '',
      outputSize: 0,
      inputSize: hex.length,
      isValid: false,
      issues: [{ message: error || 'Invalid hexadecimal string', severity: 'error' }],
    };
  }

  const base64 = bytesToBase64(bytes, urlSafe);
  return {
    output: base64,
    displayOutput: base64,
    outputSize: base64.length,
    inputSize: bytes.length,
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

/**
 * Base64 to Hex conversion
 */
export function decodeBase64ToHex(base64Str: string, options: HexFormatOptions): EncodingResult {
  const { bytes, isValid, issues } = base64ToBytes(base64Str);
  if (!isValid) {
    return {
      output: '',
      outputSize: 0,
      inputSize: base64Str.length,
      isValid: false,
      issues,
    };
  }

  const hex = bytesToHex(bytes, options);
  const { displayText, isTruncated } = truncateForDisplay(hex);

  return {
    output: hex,
    displayOutput: displayText,
    isTruncatedForDisplay: isTruncated,
    outputSize: hex.length,
    inputSize: base64Str.length,
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

/**
 * URL to Base64 conversion (encodes exact UTF-8 bytes without fetching)
 */
export function encodeUrlToBase64(url: string, urlSafe = false): EncodingResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { output: '', outputSize: 0, inputSize: 0, isValid: true, issues: [] };
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(trimmed);
  const base64 = bytesToBase64(bytes, urlSafe);

  return {
    output: base64,
    displayOutput: base64,
    outputSize: base64.length,
    inputSize: bytes.length,
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

/**
 * HTML to Base64 encoding with Data URI / embedding markup snippet
 */
export function encodeHtmlToBase64(html: string): EncodingResult & { dataUri: string; embedExample: string } {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(html);
  const base64 = bytesToBase64(bytes);
  const dataUri = `data:text/html;base64,${base64}`;
  const embedExample = `<iframe src="${dataUri}" title="Embedded HTML" sandbox="allow-same-origin"></iframe>`;

  const { displayText, isTruncated } = truncateForDisplay(base64);

  return {
    output: base64,
    displayOutput: displayText,
    isTruncatedForDisplay: isTruncated,
    dataUri,
    embedExample,
    outputSize: base64.length,
    inputSize: bytes.length,
    mimeType: 'text/html',
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

/**
 * CSS to Base64 encoding with Data URI / stylesheet link tag snippet
 */
export function encodeCssToBase64(css: string): EncodingResult & { dataUri: string; embedExample: string } {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(css);
  const base64 = bytesToBase64(bytes);
  const dataUri = `data:text/css;base64,${base64}`;
  const embedExample = `<link rel="stylesheet" href="${dataUri}">`;

  const { displayText, isTruncated } = truncateForDisplay(base64);

  return {
    output: base64,
    displayOutput: displayText,
    isTruncatedForDisplay: isTruncated,
    dataUri,
    embedExample,
    outputSize: base64.length,
    inputSize: bytes.length,
    mimeType: 'text/css',
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

/**
 * Basic Authentication Decoder
 * Security note: Data is strictly processed in memory and never logged, stored in localStorage, or sent across network.
 */
export function decodeBasicAuth(input: string): BasicAuthCredentials {
  const cleanInput = input.trim();
  if (!cleanInput) {
    return {
      username: '',
      hasPassword: false,
      rawHeader: cleanInput,
      base64Token: '',
      isValid: false,
      error: 'Please enter a Basic Authentication header or Base64 credentials.',
    };
  }

  // Strip optional "Basic " or "Authorization: Basic " prefix
  let token = cleanInput.replace(/^authorization:\s*/i, '').replace(/^basic\s+/i, '').trim();

  // Decode the token
  const { bytes, isValid, issues } = base64ToBytes(token);
  if (!isValid || bytes.length === 0) {
    return {
      username: '',
      hasPassword: false,
      rawHeader: cleanInput,
      base64Token: token,
      isValid: false,
      error: issues[0]?.message || 'Invalid Base64 credential token.',
    };
  }

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const decoded = decoder.decode(bytes);

  const colonIndex = decoded.indexOf(':');
  if (colonIndex === -1) {
    return {
      username: decoded,
      password: '',
      hasPassword: false,
      rawHeader: cleanInput,
      base64Token: token,
      isValid: true,
      error: 'Note: Credentials do not contain a separating colon (:). Standard format is "username:password".',
    };
  }

  const username = decoded.slice(0, colonIndex);
  const password = decoded.slice(colonIndex + 1);

  return {
    username,
    password,
    hasPassword: true,
    rawHeader: cleanInput,
    base64Token: token,
    isValid: true,
  };
}

/**
 * Basic Authentication Encoder
 * Generates RFC 7617 Basic Authorization headers strictly in browser memory.
 */
export function encodeBasicAuth(username: string, password = ''): {
  authorizationHeader: string;
  base64Token: string;
  curlExample: string;
  fetchExample: string;
} {
  const credentials = `${username}:${password}`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(credentials);
  const base64Token = bytesToBase64(bytes);
  const authorizationHeader = `Authorization: Basic ${base64Token}`;
  const curlExample = `curl -H "Authorization: Basic ${base64Token}" https://api.example.com/data`;
  const fetchExample = `fetch('https://api.example.com/data', {\n  headers: {\n    'Authorization': 'Basic ${base64Token}'\n  }\n});`;

  return {
    authorizationHeader,
    base64Token,
    curlExample,
    fetchExample,
  };
}

/**
 * URL Encoding (Component or Full URL) with UTF-8 support
 */
export function encodeUrlText(text: string, componentMode = true): EncodingResult {
  if (!text) {
    return { output: '', outputSize: 0, inputSize: 0, isValid: true, issues: [] };
  }

  try {
    const encoded = componentMode ? encodeURIComponent(text) : encodeURI(text);
    return {
      output: encoded,
      displayOutput: encoded,
      outputSize: encoded.length,
      inputSize: text.length,
      isValid: true,
      issues: [],
    };
  } catch (err: any) {
    return {
      output: '',
      outputSize: 0,
      inputSize: text.length,
      isValid: false,
      issues: [{ message: err.message || 'Failed to encode URL string.', severity: 'error' }],
    };
  }
}

/**
 * URL Decoding with error safety for malformed percent-encoding
 */
export function decodeUrlText(encodedUrl: string): EncodingResult {
  if (!encodedUrl) {
    return { output: '', outputSize: 0, inputSize: 0, isValid: true, issues: [] };
  }

  try {
    const decoded = decodeURIComponent(encodedUrl.replace(/\+/g, ' '));
    return {
      output: decoded,
      displayOutput: decoded,
      outputSize: new Blob([decoded]).size,
      inputSize: encodedUrl.length,
      isValid: true,
      issues: [],
    };
  } catch (err: any) {
    // Graceful partial decoding for malformed %-sequences
    const partialDecoded = encodedUrl.replace(/(%[0-9a-fA-F]{2})+/g, (match) => {
      try {
        return decodeURIComponent(match);
      } catch {
        return match;
      }
    });

    return {
      output: partialDecoded,
      displayOutput: partialDecoded,
      outputSize: new Blob([partialDecoded]).size,
      inputSize: encodedUrl.length,
      isValid: false,
      issues: [
        {
          message: `Malformed URL encoding encountered (${err.message || 'URI malformed'}). Partial recovery applied.`,
          severity: 'error',
        },
      ],
    };
  }
}

/**
 * Text to Hexadecimal string conversion
 */
export function encodeTextToHex(
  text: string,
  options: HexFormatOptions = { uppercase: true, grouping: 'space' }
): EncodingResult {
  if (!text) {
    return { output: '', outputSize: 0, inputSize: 0, isValid: true, issues: [] };
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const hex = bytesToHex(bytes, options);

  return {
    output: hex,
    displayOutput: hex,
    outputSize: hex.length,
    inputSize: bytes.length,
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

/**
 * Hexadecimal to UTF-8 Text conversion
 */
export function decodeHexToText(hex: string): EncodingResult {
  if (!hex.trim()) {
    return { output: '', outputSize: 0, inputSize: 0, isValid: true, issues: [] };
  }

  const { bytes, isValid, error } = hexToBytes(hex);
  if (!isValid) {
    return {
      output: '',
      outputSize: 0,
      inputSize: hex.length,
      isValid: false,
      issues: [{ message: error || 'Invalid hexadecimal string.', severity: 'error' }],
    };
  }

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const text = decoder.decode(bytes);

  return {
    output: text,
    displayOutput: text,
    outputSize: new Blob([text]).size,
    inputSize: hex.length,
    isValid: true,
    issues: [],
    rawBytes: bytes,
  };
}

const HTML_NAMED_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_REVERSE_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
};

/**
 * HTML Entities Encoding (Named or Numeric)
 */
export function encodeHtmlEntities(text: string, mode: 'named' | 'numeric' = 'named'): EncodingResult {
  if (!text) {
    return { output: '', outputSize: 0, inputSize: 0, isValid: true, issues: [] };
  }

  let encoded: string;
  if (mode === 'numeric') {
    encoded = text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  } else {
    encoded = text.replace(/[&<>"']/g, (ch) => HTML_NAMED_ENTITIES[ch] || ch);
  }

  return {
    output: encoded,
    displayOutput: encoded,
    outputSize: encoded.length,
    inputSize: text.length,
    isValid: true,
    issues: [],
  };
}

/**
 * HTML Entities Decoding (Named, Numeric Decimal, and Hex)
 */
export function decodeHtmlEntities(text: string): EncodingResult {
  if (!text) {
    return { output: '', outputSize: 0, inputSize: 0, isValid: true, issues: [] };
  }

  const decoded = text
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      const code = parseInt(hex, 16);
      return isNaN(code) ? match : String.fromCodePoint(code);
    })
    .replace(/&#([0-9]+);/g, (match, dec) => {
      const code = parseInt(dec, 10);
      return isNaN(code) ? match : String.fromCodePoint(code);
    })
    .replace(/&([a-zA-Z]+);/g, (match, entity) => {
      const lower = entity.toLowerCase();
      return HTML_REVERSE_ENTITIES[lower] || match;
    });

  return {
    output: decoded,
    displayOutput: decoded,
    outputSize: new Blob([decoded]).size,
    inputSize: text.length,
    isValid: true,
    issues: [],
  };
}

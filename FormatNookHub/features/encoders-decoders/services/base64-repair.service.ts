import {
  Base64InputFormat,
  Base64RepairCandidate,
  Base64RepairOptions,
  Base64RepairResult,
  DEFAULT_REPAIR_OPTIONS,
  RepairConfidence,
} from '../types/base64-repair.types';
import { base64ToBytes, bytesToBase64 } from './base64.service';
import { parseImageBytes } from './image-detection.service';
import { detectMimeFromBytes } from './mime-detection.service';

export type {
  Base64InputFormat,
  Base64RepairCandidate,
  Base64RepairOptions,
  Base64RepairResult,
};
export { DEFAULT_REPAIR_OPTIONS };

/**
 * Normalizes common MIME aliases to canonical web types
 */
export function normalizeMimeAlias(mime?: string | null): string | null {
  if (!mime) return null;
  const clean = mime.trim().toLowerCase();
  if (clean === 'image/jpg' || clean === 'image/pjpeg') return 'image/jpeg';
  if (clean === 'image/x-png') return 'image/png';
  if (clean === 'image/vnd.microsoft.icon') return 'image/x-icon';
  return clean;
}

/**
 * Inspects raw input string and detects format
 */
export function inspectInputFormat(raw: string): Base64InputFormat {
  if (!raw || !raw.trim()) return 'empty';
  const trimmed = raw.trim();

  // 1. JSON Object or Array
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'json_object';
    } catch {
      // Could be malformed/unquoted JSON or escaped JSON
      if (/["'][a-zA-Z0-9_$-]+["']\s*:\s*/.test(trimmed)) {
        return 'json_object';
      }
    }
  }

  // 2. Escaped JSON String: e.g. "{\"image\":\"...\"}" or contains escaped quotes/newlines
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.includes('\\"')) {
    return 'escaped_json';
  }
  if (trimmed.includes('\\"') && trimmed.includes('\\n')) {
    return 'escaped_json';
  }

  // 3. Data URI
  if (/^data:[^;,]+(?:;[^;,]+)*;base64,/i.test(trimmed)) {
    return 'data_uri';
  }

  // 4. Key-Value assignment: e.g. banner_image = data:... or image: "..."
  if (/^(?:(?:let|const|var)\s+)?[a-zA-Z0-9_$-]+\s*[:=]\s*/m.test(trimmed)) {
    return 'key_value';
  }

  // 5. URL-Safe Base64: contains - or _ and no standard + or /
  const noSpace = trimmed.replace(/\s+/g, '');
  if (/[-_]/.test(noSpace) && !/[+/]/.test(noSpace) && /^[A-Za-z0-9\-_=]+$/.test(noSpace)) {
    return 'url_safe';
  }

  // 6. Embedded text (e.g. server logs or HTML tags)
  if (
    trimmed.includes('data:') ||
    trimmed.includes('<img') ||
    trimmed.includes('http') ||
    trimmed.split(/\s+/).length > 3
  ) {
    return 'embedded_text';
  }

  return 'plain_base64';
}

/**
 * Safely tries to parse JSON from input, handling escaped strings if necessary
 */
function tryParseJson(raw: string): any | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Attempt unescaping if wrapped in quotes or has escaped quotes
    try {
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        const unquoted = JSON.parse(trimmed);
        if (typeof unquoted === 'string') {
          return JSON.parse(unquoted);
        }
        return unquoted;
      }
    } catch {
      // ignore
    }

    try {
      // Loose replace of escaped quotes
      const unescaped = trimmed.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      return JSON.parse(unescaped);
    } catch {
      return null;
    }
  }
}

interface RawExtractedCandidate {
  rawPayload: string;
  sourceType: Base64RepairCandidate['sourceType'];
  propertyName?: string;
  sourceLocation?: string;
  declaredMimeType?: string;
}

/**
 * Checks whether a candidate string looks like a valid Base64 payload rather than natural language
 */
function isViableBase64Payload(str: string): boolean {
  if (!str) return false;
  const clean = str.replace(/\s+/g, '');
  // Ignore short strings under 12 chars
  if (clean.length < 12) return false;

  // If it starts with data URI, definitely viable
  if (/^data:[^;,]+(?:;[^;,]+)*;base64,/i.test(clean)) return true;

  // Reject strings with natural language spaces between words
  if (/\s[a-z]{2,}\s/i.test(str) || (str.includes(' ') && str.trim().split(/\s+/).length > 2)) {
    return false;
  }

  // Reject if it contains spaces and is all lowercase English letters
  if (str.includes(' ') && /^[a-z\s]+$/.test(str.trim())) {
    return false;
  }

  // Check character set: only Base64 alphabet or URL-safe Base64 alphabet
  const base64CharsRegex = /^[A-Za-z0-9+/=\-_]+$/;
  return base64CharsRegex.test(clean);
}

/**
 * Extracts raw candidate payloads from supported input formats
 */
export function extractPayloadCandidates(raw: string): RawExtractedCandidate[] {
  if (!raw || !raw.trim()) return [];

  const trimmed = raw.trim();
  const inputFormat = inspectInputFormat(raw);

  // Fast path for Plain Base64 or direct Data URI: avoids catastrophic regex backtracking on large payloads
  if (inputFormat === 'plain_base64') {
    return [
      {
        rawPayload: raw,
        sourceType: 'plain_base64',
      },
    ];
  }

  if (inputFormat === 'data_uri') {
    const singleDataUriMatch = trimmed.match(/^data:([^;,]+)?(?:;[^;,]+)*;base64,/i);
    const declaredMime =
      singleDataUriMatch && singleDataUriMatch[1]
        ? normalizeMimeAlias(singleDataUriMatch[1]) || undefined
        : undefined;
    return [
      {
        rawPayload: trimmed,
        sourceType: 'data_uri',
        declaredMimeType: declaredMime,
      },
    ];
  }

  const candidates: RawExtractedCandidate[] = [];
  const seenPayloads = new Set<string>();

  const addCandidate = (cand: RawExtractedCandidate) => {
    const normalizedKey = cand.rawPayload.trim().replace(/\s+/g, '');
    if (!seenPayloads.has(normalizedKey) && isViableBase64Payload(cand.rawPayload)) {
      seenPayloads.add(normalizedKey);
      candidates.push(cand);
    }
  };

  // 1. JSON parsing extraction
  const jsonObj = tryParseJson(raw);
  if (jsonObj && typeof jsonObj === 'object') {
    const walkObject = (node: any, path: string = '') => {
      if (!node) return;
      if (typeof node === 'string') {
        let declaredMime: string | undefined;
        const dataUriMatch = node.match(/^data:([^;,]+)?(?:;[^;,]+)*;base64,/i);
        if (dataUriMatch && dataUriMatch[1]) {
          declaredMime = normalizeMimeAlias(dataUriMatch[1]) || undefined;
        }

        const propName = path.split('.').pop() || undefined;
        addCandidate({
          rawPayload: node,
          sourceType: 'json_field',
          propertyName: propName,
          sourceLocation: path,
          declaredMimeType: declaredMime,
        });
      } else if (Array.isArray(node)) {
        node.forEach((item, idx) => walkObject(item, `${path}[${idx}]`));
      } else if (typeof node === 'object') {
        for (const [key, val] of Object.entries(node)) {
          // Explicitly reject key names as candidates!
          const currentPath = path ? `${path}.${key}` : key;
          walkObject(val, currentPath);
        }
      }
    };

    walkObject(jsonObj);
    return candidates;
  }

  // 2. Key-Value Pattern extraction (bounded identifier length to prevent catastrophic backtracking)
  if (raw.length < 500000 && (raw.includes(':') || raw.includes('='))) {
    const keyValueRegex = /(?:(?:let|const|var)\s+)?([a-zA-Z0-9_$-]{1,64})\s*[:=]\s*["']?(data:[^"'\s\r\n]+|[A-Za-z0-9+/=_-]{16,})["']?/g;
    let kvMatch: RegExpExecArray | null;
    while ((kvMatch = keyValueRegex.exec(raw)) !== null) {
      const propName = kvMatch[1];
      const val = kvMatch[2];
      let declaredMime: string | undefined;
      const dataUriMatch = val.match(/^data:([^;,]+)?(?:;[^;,]+)*;base64,/i);
      if (dataUriMatch && dataUriMatch[1]) {
        declaredMime = normalizeMimeAlias(dataUriMatch[1]) || undefined;
      }
      addCandidate({
        rawPayload: val,
        sourceType: 'key_value',
        propertyName: propName,
        sourceLocation: propName,
        declaredMimeType: declaredMime,
      });
    }

    if (candidates.length > 0) {
      return candidates;
    }
  }

  // 3. Embedded Data URIs in text / markdown / HTML (stops at space or quote)
  if (raw.includes('data:')) {
    const dataUriRegex = /data:[a-zA-Z0-9_+-]+(?:\/[a-zA-Z0-9_+-]+)?(?:;[a-zA-Z0-9_+-]+=[^;,]+)*;base64,(?:[A-Za-z0-9+/=_\-%]|\\n|\\r|\r?\n)+/gi;
    let duMatch: RegExpExecArray | null;
    while ((duMatch = dataUriRegex.exec(raw)) !== null) {
      const fullUri = duMatch[0];
      const mimeMatch = fullUri.match(/^data:([^;,]+)?(?:;[^;,]+)*;base64,/i);
      const declaredMime =
        mimeMatch && mimeMatch[1] ? normalizeMimeAlias(mimeMatch[1]) || undefined : undefined;
      addCandidate({
        rawPayload: fullUri,
        sourceType: 'data_uri',
        declaredMimeType: declaredMime,
      });
    }

    if (candidates.length > 0) {
      return candidates;
    }
  }

  // 4. Default: Whole input is treated as a candidate payload
  let fallbackMime: string | undefined;
  const singleDataUriMatch = raw.trim().match(/^data:([^;,]+)?(?:;[^;,]+)*;base64,/i);
  if (singleDataUriMatch && singleDataUriMatch[1]) {
    fallbackMime = normalizeMimeAlias(singleDataUriMatch[1]) || undefined;
  }

  return [
    {
      rawPayload: raw,
      sourceType: singleDataUriMatch ? 'data_uri' : 'plain_base64',
      declaredMimeType: fallbackMime,
    },
  ];
}

/**
 * Normalizes a single candidate payload safely and losslessly
 */
export function normalizeBase64Candidate(
  rawPayload: string,
  options: Base64RepairOptions,
  declaredMime?: string
): {
  normalized: string;
  declaredMimeType?: string;
  transformations: string[];
  warnings: string[];
  errors: string[];
  isRecoverable: boolean;
  unpaddedRemainder: number;
} {
  const transformations: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  let current = rawPayload || '';
  let activeMime = declaredMime;
  let isRecoverable = true;

  // 1. Remove UTF-8 Byte Order Mark (BOM)
  if (options.removeBom && /[\uFEFF\uFFFE]/.test(current)) {
    current = current.replace(/[\uFEFF\uFFFE]/g, '');
    transformations.push('Removed UTF-8 Byte Order Mark (BOM)');
  }

  // 2. Strip Data URI prefix
  const dataUriRegex = /^data:([^;,]+)?(?:;charset=[^;,]+)?(?:;base64)?,/i;
  const dataUriMatch = current.match(dataUriRegex);
  if (dataUriMatch) {
    if (!activeMime && dataUriMatch[1]) {
      activeMime = normalizeMimeAlias(dataUriMatch[1]) || undefined;
    }
    if (options.stripDataUriPrefix) {
      current = current.replace(dataUriRegex, '');
      transformations.push('Stripped Data URI prefix header');
      if (activeMime) {
        transformations.push(`Preserved declared MIME: ${activeMime}`);
      }
    }
  }

  // 3. Decode JSON string escaping (e.g. \\n, \\r, \\/, \\")
  if (/\\([nrtvfb"'/]|u[0-9a-fA-F]{4})/.test(current)) {
    const prev = current;
    current = current
      .replace(/\\r\\n/g, '')
      .replace(/\\n/g, '')
      .replace(/\\r/g, '')
      .replace(/\\t/g, '')
      .replace(/\\\//g, '/')
      .replace(/\\"/g, '"');
    if (current !== prev) {
      transformations.push('Normalized escaped newline and backslash sequences');
    }
  }

  // 4. Decode supported percent-encoded characters (%2B -> +, %2F -> /, %3D -> =)
  if (/%(?:2B|2F|3D)/i.test(current)) {
    current = current
      .replace(/%2B/gi, '+')
      .replace(/%2F/gi, '/')
      .replace(/%3D/gi, '=');
    transformations.push('Decoded percent-encoded Base64 symbols (%2B, %2F, %3D)');
  }

  // 5. Remove whitespace & line breaks
  if (options.removeWhitespace) {
    const prevLen = current.length;
    current = current.replace(/[\s\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]+/g, '');
    if (current.length !== prevLen) {
      transformations.push(`Removed ${prevLen - current.length} whitespace / newline character(s)`);
    }
  }

  // 6. URL-safe to Standard Base64
  const isUrlSafeAlphabet = /[-_]/.test(current) && !/[+/]/.test(current);
  if (options.convertUrlSafeToStandard || isUrlSafeAlphabet) {
    if (/[-_]/.test(current)) {
      current = current.replace(/-/g, '+').replace(/_/g, '/');
      transformations.push('Converted URL-Safe characters (- and _) to Standard RFC 4648 (+ and /)');
    }
  } else if (options.convertStandardToUrlSafe) {
    if (/[+/]/.test(current)) {
      current = current.replace(/\+/g, '-').replace(/\//g, '_');
      transformations.push('Converted Standard characters (+ and /) to URL-Safe (- and _)');
    }
  }

  // 7. Missing padding calculation & repair
  let unpaddedRemainder = 0;
  if (options.fixPadding) {
    // Check for internal '=' misplaced in the middle
    const firstEquals = current.indexOf('=');
    if (firstEquals !== -1 && firstEquals < current.length - 2) {
      const internalEqualsCount = (current.slice(0, current.length - 2).match(/=/g) || []).length;
      if (internalEqualsCount > 0) {
        current = current.replace(/=/g, '');
        transformations.push('Cleaned misplaced internal padding characters');
      }
    }

    const unpadded = current.replace(/=+$/, '');
    unpaddedRemainder = unpadded.length % 4;

    if (unpaddedRemainder === 1) {
      isRecoverable = false;
      errors.push(
        'Unrecoverable length remainder 1 (truncated data). Base64 encoding requires at least 2 characters to represent a byte. Missing character(s) cannot be mathematically guessed.'
      );
    } else if (unpaddedRemainder === 2) {
      current = unpadded + '==';
      transformations.push('Appended missing "==" padding for modulo 4 alignment');
    } else if (unpaddedRemainder === 3) {
      current = unpadded + '=';
      transformations.push('Appended missing "=" padding for modulo 4 alignment');
    }
  }

  return {
    normalized: current,
    declaredMimeType: activeMime,
    transformations,
    warnings,
    errors,
    isRecoverable,
    unpaddedRemainder,
  };
}

/**
 * Applies controlled aggressive repair for invalid / foreign characters
 */
export function repairBase64CandidateAdvanced(
  payload: string,
  options: Base64RepairOptions
): {
  repaired: string;
  removedCharCount: number;
  removedCharsDetails: { char: string; count: number }[];
  transformations: string[];
  warnings: string[];
} {
  const transformations: string[] = [];
  const warnings: string[] = [];
  let current = payload;
  let removedCharCount = 0;
  const removedCharsMap = new Map<string, number>();

  const isAdvancedActive = options.mode === 'advanced' || options.stripInvalidChars;
  const validPattern = options.convertStandardToUrlSafe ? /[^A-Za-z0-9\-_=]/g : /[^A-Za-z0-9+/=]/g;

  if (isAdvancedActive) {
    const invalidChars = current.match(validPattern);
    if (invalidChars && invalidChars.length > 0) {
      removedCharCount = invalidChars.length;
      invalidChars.forEach((ch) => {
        removedCharsMap.set(ch, (removedCharsMap.get(ch) || 0) + 1);
      });

      current = current.replace(validPattern, '');
      transformations.push(
        `Stripped ${removedCharCount} invalid non-Base64 character(s) in Advanced Repair mode`
      );
      warnings.push(
        `Warning: ${removedCharCount} foreign character(s) were removed from the payload. Underlying decoded bytes may be altered.`
      );

      // Re-pad if padding fix is enabled
      if (options.fixPadding) {
        const unpadded = current.replace(/=+$/, '');
        const remainder = unpadded.length % 4;
        if (remainder === 2) {
          current = unpadded + '==';
        } else if (remainder === 3) {
          current = unpadded + '=';
        }
      }
    }
  } else {
    // Check if invalid characters exist in safe mode
    const testPattern = options.convertStandardToUrlSafe ? /[^A-Za-z0-9\-_=]/ : /[^A-Za-z0-9+/=]/;
    if (testPattern.test(current)) {
      warnings.push(
        'Input contains invalid non-Base64 characters. Enable Advanced Repair mode to strip foreign characters.'
      );
    }
  }

  const removedCharsDetails = Array.from(removedCharsMap.entries()).map(([char, count]) => ({
    char,
    count,
  }));

  return {
    repaired: current,
    removedCharCount,
    removedCharsDetails,
    transformations,
    warnings,
  };
}

/**
 * Validates Base64 syntax, verifies byte round-trip, and parses image format signatures
 */
export function validateBase64Candidate(
  payload: string,
  declaredMime?: string
): {
  isBase64Valid: boolean;
  isImageValid: boolean;
  isDecodable: boolean;
  detectedFormat: string | null;
  detectedMimeType: string | null;
  imageDimensions?: { width: number; height: number; aspectRatio?: string };
  decodedByteLength: number;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Strict RFC 4648 syntax validation
  const clean = payload.replace(/\s+/g, '');
  if (!clean) {
    return {
      isBase64Valid: false,
      isImageValid: false,
      isDecodable: false,
      detectedFormat: null,
      detectedMimeType: null,
      decodedByteLength: 0,
      warnings: [],
      errors: ['Candidate payload is empty.'],
    };
  }

  // Modulo 4 check
  if (clean.length % 4 !== 0) {
    errors.push(`Base64 length (${clean.length}) is not a multiple of 4.`);
  }

  // Permitted alphabet and padding
  const validBase64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!validBase64Pattern.test(clean)) {
    errors.push('Payload contains invalid characters or illegal padding placement.');
  }

  const isBase64Valid = errors.length === 0;

  // 2. Decode bytes and verify round-trip
  let bytes: Uint8Array = new Uint8Array(0);
  let isDecodable = false;

  if (isBase64Valid) {
    const byteResult = base64ToBytes(clean);
    if (byteResult.isValid && byteResult.bytes.length > 0) {
      bytes = byteResult.bytes;
      isDecodable = true;

      // Verify canonical round-trip consistency
      const reEncoded = bytesToBase64(bytes);
      if (reEncoded !== clean) {
        // Non-canonical padding or bits in unused padding positions
        warnings.push('Base64 string contains non-canonical padding bits.');
      }
    } else {
      errors.push('Failed to decode Base64 into binary bytes.');
    }
  }

  // 3. Image format inspection using file signatures
  let isImageValid = false;
  let detectedFormat: string | null = null;
  let detectedMimeType: string | null = null;
  let imageDimensions: { width: number; height: number; aspectRatio?: string } | undefined;

  if (isDecodable && bytes.length > 0) {
    const parsedImage = parseImageBytes(bytes);
    const mimeResult = detectMimeFromBytes(bytes);

    if (parsedImage) {
      isImageValid = true;
      detectedFormat = parsedImage.format;
      detectedMimeType = parsedImage.mimeType;
      if (parsedImage.dimensions) {
        imageDimensions = {
          width: parsedImage.dimensions.width,
          height: parsedImage.dimensions.height,
          aspectRatio: parsedImage.dimensions.aspectRatio,
        };
      }
    } else if (mimeResult.category === 'image') {
      isImageValid = true;
      detectedMimeType = mimeResult.mimeType;
      detectedFormat = mimeResult.mimeType.replace('image/', '').toUpperCase();
    } else {
      isImageValid = false;
      warnings.push(
        'Decoded payload is valid Base64, but does not match any known image signature (PNG, JPEG, WebP, GIF, BMP, SVG).'
      );
    }

    // Compare with declared MIME type
    if (declaredMime && detectedMimeType) {
      const normDeclared = normalizeMimeAlias(declaredMime);
      if (normDeclared !== detectedMimeType) {
        warnings.push(
          `Declared MIME type (${declaredMime}) does not match detected format (${detectedMimeType}).`
        );
      }
    }
  }

  return {
    isBase64Valid,
    isImageValid,
    isDecodable,
    detectedFormat,
    detectedMimeType: detectedMimeType || declaredMime || null,
    imageDimensions,
    decodedByteLength: bytes.length,
    warnings,
    errors,
  };
}

/**
 * Main Base64 Repair Pipeline Orchestrator
 */
export function repairBase64(
  input: string,
  options: Partial<Base64RepairOptions> = {}
): Base64RepairResult {
  const opts: Base64RepairOptions = { ...DEFAULT_REPAIR_OPTIONS, ...options };
  const rawInput = input || '';
  const originalLength = rawInput.length;
  const inputFormat = inspectInputFormat(rawInput);

  if (inputFormat === 'empty') {
    return {
      originalInput: rawInput,
      inputFormat: 'empty',
      selectedCandidateId: null,
      repairedOutput: '',
      repairedPayload: '',
      detectedFormat: null,
      detectedMimeType: null,
      decodedByteLength: 0,
      isBase64Valid: false,
      isImageValid: false,
      isSuccessfullyDecodable: false,
      isRecoverable: false,
      confidence: 'none',
      extractedCandidates: [],
      transformations: [],
      warnings: ['Input is empty.'],
      errors: ['No input provided.'],
      originalLength: 0,
      repairedLength: 0,
      removedCharCount: 0,
    };
  }

  // Stage B: Intelligent Extraction
  const rawCandidates = extractPayloadCandidates(rawInput);

  // Process each extracted candidate through Normalization & Validation
  const candidates: Base64RepairCandidate[] = rawCandidates.map((rawCand, idx) => {
    const id = `candidate-${idx + 1}`;

    // Stage C: Safe Normalization
    const normResult = normalizeBase64Candidate(
      rawCand.rawPayload,
      opts,
      rawCand.declaredMimeType
    );

    // Stage D: Controlled Aggressive Repair
    const advResult = repairBase64CandidateAdvanced(normResult.normalized, opts);

    // Stage E: Validation & Image Detection
    const valResult = validateBase64Candidate(
      advResult.repaired,
      normResult.declaredMimeType
    );

    // Combine transformations, warnings, and errors
    const transformations = [
      ...normResult.transformations,
      ...advResult.transformations,
    ];
    if (rawCand.propertyName) {
      transformations.unshift(`Extracted JSON property: ${rawCand.propertyName}`);
    }

    const allWarnings = [...normResult.warnings, ...advResult.warnings, ...valResult.warnings];
    const allErrors = [...normResult.errors, ...valResult.errors];

    // Determine confidence score
    let confidence: RepairConfidence = 'none';
    if (valResult.isBase64Valid && valResult.isImageValid) {
      confidence = 'high';
    } else if (valResult.isBase64Valid) {
      confidence = 'medium';
    } else if (normResult.isRecoverable && advResult.removedCharCount > 0) {
      confidence = 'low';
    }

    return {
      id,
      sourceType: rawCand.sourceType,
      propertyName: rawCand.propertyName,
      sourceLocation: rawCand.sourceLocation,
      declaredMimeType: normResult.declaredMimeType,
      rawPayload: rawCand.rawPayload,
      normalizedPayload: normResult.normalized,
      repairedPayload: advResult.repaired,
      isBase64Valid: valResult.isBase64Valid,
      isImageValid: valResult.isImageValid,
      isDecodable: valResult.isDecodable,
      detectedMimeType: valResult.detectedMimeType,
      detectedFormat: valResult.detectedFormat,
      imageDimensions: valResult.imageDimensions,
      decodedByteLength: valResult.decodedByteLength,
      confidence,
      transformations,
      warnings: allWarnings,
      errors: allErrors,
      removedCharCount: advResult.removedCharCount,
      removedCharsDetails: advResult.removedCharsDetails,
    };
  });

  // Candidate selection strategy:
  // 1. First candidate that is both valid Base64 and valid Image
  // 2. Otherwise first candidate that is valid Base64
  // 3. Otherwise first candidate
  let selected = candidates.find((c) => c.isBase64Valid && c.isImageValid);
  if (!selected) {
    selected = candidates.find((c) => c.isBase64Valid);
  }
  if (!selected && candidates.length > 0) {
    selected = candidates[0];
  }

  let finalOutput = selected ? selected.repairedPayload : '';

  // Apply Line Wrapping if requested by options
  if (finalOutput && (opts.lineWrap === '64' || opts.lineWrap === '76')) {
    const wrapWidth = parseInt(opts.lineWrap, 10);
    const unpaddedForWrap = finalOutput.replace(/\s+/g, '');
    const lines: string[] = [];
    for (let i = 0; i < unpaddedForWrap.length; i += wrapWidth) {
      lines.push(unpaddedForWrap.slice(i, i + wrapWidth));
    }
    finalOutput = lines.join('\n');
    selected?.transformations.push(`Applied ${wrapWidth}-character line wrapping`);
  }

  return {
    originalInput: rawInput,
    inputFormat,
    selectedCandidateId: selected ? selected.id : null,
    repairedOutput: finalOutput,
    repairedPayload: finalOutput || null,
    detectedFormat: selected ? selected.detectedFormat : null,
    detectedMimeType: selected ? selected.detectedMimeType : null,
    decodedByteLength: selected ? selected.decodedByteLength : 0,
    imageDimensions: selected ? selected.imageDimensions : undefined,
    isBase64Valid: selected ? selected.isBase64Valid : false,
    isImageValid: selected ? selected.isImageValid : false,
    isSuccessfullyDecodable: selected ? selected.isDecodable : false,
    isRecoverable: selected ? selected.confidence !== 'none' : false,
    confidence: selected ? selected.confidence : 'none',
    extractedCandidates: candidates,
    transformations: selected ? selected.transformations : [],
    warnings: selected ? selected.warnings : [],
    errors: selected ? selected.errors : [],
    originalLength,
    repairedLength: finalOutput.length,
    removedCharCount: selected ? selected.removedCharCount : 0,
    removedCharsDetails: selected ? selected.removedCharsDetails : [],
  };
}

import { base64ToBytes, isLikelyUtf8Text } from './base64.service';
import { detectMimeFromBytes, DetectedMimeResult } from './mime-detection.service';
import { getExtensionFromMime } from '../utils/filename.utils';
import { validateBase64 } from './base64-validator.service';

export interface JwtInspectionInfo {
  isJwt: boolean;
  header?: any;
  payload?: any;
  hasSignature?: boolean;
  error?: string;
}

export interface Base64InspectionReport {
  variant: 'standard' | 'url-safe' | 'mixed' | 'invalid';
  paddingStatus: string;
  hasWhitespace: boolean;
  hasDataUriPrefix: boolean;
  dataUriMime?: string;
  encodedLength: number;
  actualDecodedBytes: number;
  mimeResult: DetectedMimeResult;
  suggestedExtension: string;
  isText: boolean;
  textPreview?: string;
  jsonInfo?: { isJson: boolean; keyCount?: number };
  jwtInfo?: JwtInspectionInfo;
  magicBytesHex: string;
  magicBytesAscii: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  suggestedActions: Array<{
    id: string;
    label: string;
    description: string;
    targetMode?: string;
  }>;
}

/**
 * Safely decodes a single Base64 / Base64URL segment into a parsed JSON object using UTF-8 TextDecoder.
 */
function decodeJwtSegmentToJson(segment: string, segmentName: string): { data?: any; error?: string } {
  if (!segment) {
    return { error: `Missing ${segmentName} segment in JWT` };
  }

  // Convert Base64URL to standard Base64
  let normalized = segment.trim().replace(/-/g, '+').replace(/_/g, '/');

  // Restore padding
  const remainder = normalized.length % 4;
  if (remainder === 2) {
    normalized += '==';
  } else if (remainder === 3) {
    normalized += '=';
  } else if (remainder === 1) {
    return { error: `Malformed Base64 in ${segmentName}: invalid length` };
  }

  // Validate Base64 characters
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    return { error: `Malformed Base64 in ${segmentName}: contains illegal characters` };
  }

  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Decode as strict UTF-8
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const json = JSON.parse(text);
    if (typeof json !== 'object' || json === null) {
      return { error: `${segmentName} is not a valid JSON object` };
    }
    return { data: json };
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return { error: `Invalid JSON in ${segmentName}: ${err.message}` };
    }
    return { error: `Failed to decode ${segmentName}: ${err?.message || 'Invalid encoding'}` };
  }
}

/**
 * Decodes and inspects a JSON Web Token (JWT) structure without verifying cryptographic signatures.
 */
export function parseJwtToken(token: string): JwtInspectionInfo {
  if (!token || typeof token !== 'string') {
    return { isJwt: false, error: 'Token is empty' };
  }

  const trimmed = token.trim();
  const parts = trimmed.split('.');

  if (parts.length !== 3) {
    return {
      isJwt: false,
      error: `Invalid token segment count: expected exactly 3 dot-separated segments, received ${parts.length}.`,
    };
  }

  const [rawHeader, rawPayload, rawSignature] = parts;

  // Validate header
  const headerResult = decodeJwtSegmentToJson(rawHeader, 'header');
  if (headerResult.error) {
    return {
      isJwt: false,
      hasSignature: rawSignature.length > 0,
      error: headerResult.error,
    };
  }

  // Validate payload
  const payloadResult = decodeJwtSegmentToJson(rawPayload, 'payload');
  if (payloadResult.error) {
    return {
      isJwt: false,
      header: headerResult.data,
      hasSignature: rawSignature.length > 0,
      error: payloadResult.error,
    };
  }

  return {
    isJwt: true,
    header: headerResult.data,
    payload: payloadResult.data,
    hasSignature: rawSignature.length > 0,
  };
}

/**
 * Inspects unknown Base64 payloads and classifies their contents using byte signatures and structural heuristics.
 */
export function inspectBase64(input: string): Base64InspectionReport {
  const validation = validateBase64(input);

  // Check if input might be a JWT token (3 segments separated by '.')
  const trimmed = input.trim();
  let jwtInfo: JwtInspectionInfo | undefined;
  if (trimmed.includes('.') && trimmed.split('.').length === 3) {
    const candidateJwt = parseJwtToken(trimmed);
    if (candidateJwt.isJwt) {
      jwtInfo = candidateJwt;
    }
  }

  // Attempt to decode bytes
  const { bytes, isValid } = base64ToBytes(input);
  const actualDecodedBytes = bytes.length;

  // Extract leading 16 bytes for magic analysis
  const magicSample = bytes.slice(0, 16);
  let magicBytesHex = '';
  let magicBytesAscii = '';
  for (let i = 0; i < magicSample.length; i++) {
    const b = magicSample[i];
    magicBytesHex += (b < 16 ? '0' : '') + b.toString(16).toUpperCase() + ' ';
    magicBytesAscii += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
  }
  magicBytesHex = magicBytesHex.trim();

  // Detect MIME type and category
  const mimeResult = detectMimeFromBytes(bytes);
  const suggestedExtension = getExtensionFromMime(mimeResult.mimeType);

  // Analyze text vs binary
  const isText = isLikelyUtf8Text(bytes);
  let textPreview: string | undefined;
  let jsonInfo: { isJson: boolean; keyCount?: number } | undefined;

  if (isText && bytes.length > 0) {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const fullText = decoder.decode(bytes.slice(0, 2048));
    textPreview = fullText.slice(0, 500) + (bytes.length > 500 ? '...' : '');

    // Check JSON
    const trimmedText = fullText.trim();
    if ((trimmedText.startsWith('{') && trimmedText.endsWith('}')) || (trimmedText.startsWith('[') && trimmedText.endsWith(']'))) {
      try {
        const parsed = JSON.parse(decoder.decode(bytes));
        jsonInfo = {
          isJson: true,
          keyCount: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0,
        };
      } catch {
        jsonInfo = { isJson: false };
      }
    }
  }

  // Determine confidence & explanation
  let explanation = '';
  if (jwtInfo?.isJwt) {
    explanation = 'Detected 3-part JSON Web Token (JWT) with encoded header and claims.';
  } else if (mimeResult.confidence === 'high') {
    explanation = `Identified by strict binary magic signature: ${mimeResult.mimeType} (${magicBytesHex.slice(0, 12)}).`;
  } else if (jsonInfo?.isJson) {
    explanation = `Decoded content is valid structured JSON with ${jsonInfo.keyCount} top-level element(s).`;
  } else if (isText && bytes.length > 0) {
    explanation = 'Decoded content is readable UTF-8 text without null bytes or binary control markers.';
  } else if (bytes.length === 0) {
    explanation = 'Empty or undecodable payload.';
  } else {
    explanation = 'Binary data without a known standard file header (generic octet-stream).';
  }

  // Compile recommended next actions
  const suggestedActions: Base64InspectionReport['suggestedActions'] = [];

  if (mimeResult.category === 'image') {
    suggestedActions.push({
      id: 'preview-image',
      label: 'Preview Image',
      description: `View decoded ${mimeResult.mimeType.replace('image/', '').toUpperCase()} image.`,
      targetMode: 'image',
    });
  }

  if (mimeResult.category === 'pdf') {
    suggestedActions.push({
      id: 'preview-pdf',
      label: 'Preview PDF Document',
      description: 'View and download the decoded PDF document.',
      targetMode: 'pdf',
    });
  }

  if (mimeResult.category === 'audio') {
    suggestedActions.push({
      id: 'play-audio',
      label: 'Play Audio',
      description: `Listen to decoded ${mimeResult.mimeType} in audio player.`,
      targetMode: 'audio',
    });
  }

  if (mimeResult.category === 'video') {
    suggestedActions.push({
      id: 'play-video',
      label: 'Play Video',
      description: `Watch decoded ${mimeResult.mimeType} in video player.`,
      targetMode: 'video',
    });
  }

  if (mimeResult.mimeType === 'application/gzip') {
    suggestedActions.push({
      id: 'decompress-gzip',
      label: 'Decompress GZIP',
      description: 'Decompress the gzip archive to reveal uncompressed payload.',
      targetMode: 'gzip',
    });
  }

  if (isText && bytes.length > 0) {
    suggestedActions.push({
      id: 'decode-text',
      label: 'Decode as Plain Text',
      description: 'View decoded UTF-8 string.',
      targetMode: 'text',
    });
  }

  suggestedActions.push({
    id: 'view-hex',
    label: 'Inspect Hex Dump',
    description: 'Inspect binary byte offsets, hexadecimal bytes, and ASCII representation.',
    targetMode: 'hex-viewer',
  });

  suggestedActions.push({
    id: 'download-file',
    label: `Download as .${suggestedExtension.replace('.', '')}`,
    description: `Save decoded ${actualDecodedBytes} bytes to disk as a file.`,
  });

  return {
    variant: validation.variant === 'empty' ? 'invalid' : validation.variant,
    paddingStatus: validation.paddingStatus,
    hasWhitespace: validation.hasWhitespace,
    hasDataUriPrefix: validation.hasDataUriPrefix,
    dataUriMime: validation.dataUriMime,
    encodedLength: input.length,
    actualDecodedBytes,
    mimeResult,
    suggestedExtension,
    isText,
    textPreview,
    jsonInfo,
    jwtInfo,
    magicBytesHex,
    magicBytesAscii,
    confidence: mimeResult.confidence,
    explanation,
    suggestedActions,
  };
}


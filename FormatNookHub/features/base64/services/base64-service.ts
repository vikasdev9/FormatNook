import { ValidationIssue } from '@/types/tool';

/**
 * Encodes UTF-8 string to standard or URL-safe Base64 safely.
 */
export function encodeTextToBase64(text: string, isUrlSafe = false): string {
  if (!text) return '';

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);

  if (isUrlSafe) {
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  return base64;
}

/**
 * Decodes standard or URL-safe Base64 to UTF-8 text safely.
 */
export function decodeBase64ToText(base64: string): { output: string; isValid: boolean; issues: ValidationIssue[] } {
  if (!base64 || !base64.trim()) {
    return { output: '', isValid: false, issues: [{ message: 'Input is empty.', severity: 'warning' }] };
  }

  try {
    let normalized = base64.trim().replace(/\s+/g, '');

    // Convert URL-safe Base64 back to standard
    normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if missing
    while (normalized.length % 4 !== 0) {
      normalized += '=';
    }

    // Validate characters
    if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) {
      return {
        output: '',
        isValid: false,
        issues: [{ message: 'Invalid characters found. Standard Base64 requires A-Z, a-z, 0-9, +, / and =.', severity: 'error' }],
      };
    }

    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decoder = new TextDecoder('utf-8', { fatal: false });
    const decoded = decoder.decode(bytes);

    return { output: decoded, isValid: true, issues: [] };
  } catch (err: any) {
    return {
      output: '',
      isValid: false,
      issues: [{ message: err?.message || 'Failed to decode Base64 string', severity: 'error' }],
    };
  }
}

/**
 * Detects image MIME type from magic headers in Base64 string
 */
export function detectImageMimeFromBase64(rawBase64: string): string {
  const clean = rawBase64.replace(/^data:[^;]+;base64,/, '').trim();

  // Check common base64 starting headers
  if (clean.startsWith('iVBORw0KGgo')) return 'image/png';
  if (clean.startsWith('/9j/')) return 'image/jpeg';
  if (clean.startsWith('R0lGOD')) return 'image/gif';
  if (clean.startsWith('UklGR')) return 'image/webp';
  if (clean.startsWith('PHN2Zy') || clean.startsWith('PD94bWw')) return 'image/svg+xml';

  return 'image/png'; // Default fallback
}

/**
 * Normalizes input into raw Base64 and Data URI representations
 */
export function parseBase64ImageInput(input: string): {
  rawBase64: string;
  dataUri: string;
  mimeType: string;
  isValid: boolean;
  errorMessage?: string;
} {
  if (!input || !input.trim()) {
    return { rawBase64: '', dataUri: '', mimeType: '', isValid: false, errorMessage: 'Input is empty.' };
  }

  const trimmed = input.trim();
  let mimeType = 'image/png';
  let rawBase64 = '';

  const dataUriMatch = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (dataUriMatch) {
    mimeType = dataUriMatch[1];
    rawBase64 = dataUriMatch[2].replace(/\s+/g, '');
  } else {
    rawBase64 = trimmed.replace(/\s+/g, '');
    mimeType = detectImageMimeFromBase64(rawBase64);
  }

  // Validate Base64 characters
  const cleanBase64 = rawBase64.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    return {
      rawBase64: '',
      dataUri: '',
      mimeType,
      isValid: false,
      errorMessage: 'Invalid Base64 characters detected. Please verify your image payload.',
    };
  }

  const dataUri = `data:${mimeType};base64,${rawBase64}`;
  return {
    rawBase64,
    dataUri,
    mimeType,
    isValid: true,
  };
}

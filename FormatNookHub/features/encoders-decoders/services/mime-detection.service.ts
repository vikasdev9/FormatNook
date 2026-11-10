export interface DetectedMimeResult {
  mimeType: string;
  category: 'image' | 'audio' | 'video' | 'pdf' | 'text' | 'binary';
  isSafeToPreview: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Detects MIME type by inspecting leading byte signatures (Magic numbers)
 */
export function detectMimeFromBytes(bytes: Uint8Array): DetectedMimeResult {
  if (bytes.length < 4) {
    return {
      mimeType: 'application/octet-stream',
      category: 'binary',
      isSafeToPreview: false,
      confidence: 'low',
    };
  }

  // 1. PDF Check: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return {
      mimeType: 'application/pdf',
      category: 'pdf',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 2. PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return {
      mimeType: 'image/png',
      category: 'image',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 3. JPEG: 0xFF 0xD8 0xFF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return {
      mimeType: 'image/jpeg',
      category: 'image',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 4. GIF: 'GIF87a' or 'GIF89a' (0x47 0x49 0x46 0x38)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return {
      mimeType: 'image/gif',
      category: 'image',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 5. WebP: 'RIFF' .... 'WEBP'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return {
      mimeType: 'image/webp',
      category: 'image',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 6. WAV Audio: 'RIFF' .... 'WAVE'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45
  ) {
    return {
      mimeType: 'audio/wav',
      category: 'audio',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 7. MP3: 'ID3' (0x49 0x44 0x33) or MPEG frame sync (0xFF 0xFB / 0xFF 0xF3)
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0)
  ) {
    return {
      mimeType: 'audio/mpeg',
      category: 'audio',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 8. OGG Audio/Video: 'OggS' (0x4F 0x67 0x67 0x53)
  if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return {
      mimeType: 'audio/ogg',
      category: 'audio',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 9. MP4 Video: '....ftyp'
  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    return {
      mimeType: 'video/mp4',
      category: 'video',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 10. WebM Video: 0x1A 0x45 0xDF 0xA3
  if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
    return {
      mimeType: 'video/webm',
      category: 'video',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }

  // 11. Text / XML / SVG / HTML check
  const snippet = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 512)).trim();
  if (snippet.startsWith('<svg') || (snippet.startsWith('<?xml') && snippet.includes('<svg'))) {
    return {
      mimeType: 'image/svg+xml',
      category: 'image',
      isSafeToPreview: true,
      confidence: 'high',
    };
  }
  if (snippet.toLowerCase().startsWith('<!doctype html') || snippet.toLowerCase().startsWith('<html')) {
    return {
      mimeType: 'text/html',
      category: 'text',
      isSafeToPreview: false,
      confidence: 'high',
    };
  }

  return {
    mimeType: 'application/octet-stream',
    category: 'binary',
    isSafeToPreview: false,
    confidence: 'low',
  };
}

/**
 * Detects MIME type from raw Base64 prefix
 */
export function detectMimeFromBase64String(b64: string): DetectedMimeResult {
  const clean = b64.replace(/^data:([^;]+);base64,/, '').trim();
  const binaryHeaderLength = Math.min(clean.length, 64);
  const sample = clean.substring(0, binaryHeaderLength);

  try {
    const raw = atob(sample);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    return detectMimeFromBytes(bytes);
  } catch {
    return {
      mimeType: 'application/octet-stream',
      category: 'binary',
      isSafeToPreview: false,
      confidence: 'low',
    };
  }
}

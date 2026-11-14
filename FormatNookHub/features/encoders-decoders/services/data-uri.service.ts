import { base64ToBytes } from './base64.service';
import { detectMimeFromBytes } from './mime-detection.service';
import { getExtensionFromMime } from '../utils/filename.utils';

export interface ParsedDataUri {
  isValid: boolean;
  mimeType: string;
  mediaType: string;
  charset?: string;
  isBase64: boolean;
  rawPayload: string;
  decodedBytesLength: number;
  error?: string;
}

export interface DataUriSnippets {
  dataUri: string;
  htmlImg?: string;
  cssBackground?: string;
  htmlAudio?: string;
  htmlVideo?: string;
  htmlIframe?: string;
  htmlLinkCss?: string;
  jsConstant: string;
  jsonEscaped: string;
}

/**
 * Parses an RFC 2397 Data URI into its semantic components
 */
export function parseDataUri(uri: string): ParsedDataUri {
  const trimmed = (uri || '').trim();
  if (!trimmed.startsWith('data:')) {
    return {
      isValid: false,
      mimeType: '',
      mediaType: '',
      isBase64: false,
      rawPayload: '',
      decodedBytesLength: 0,
      error: 'Input does not start with "data:" scheme.',
    };
  }

  const commaIndex = trimmed.indexOf(',');
  if (commaIndex === -1) {
    return {
      isValid: false,
      mimeType: '',
      mediaType: '',
      isBase64: false,
      rawPayload: '',
      decodedBytesLength: 0,
      error: 'Malformed Data URI: missing comma delimiter separating metadata and payload.',
    };
  }

  const metaPart = trimmed.slice(5, commaIndex); // after 'data:' up to ','
  const payload = trimmed.slice(commaIndex + 1);

  const metaTokens = metaPart.split(';');
  const isBase64 = metaTokens.some((t) => t.trim().toLowerCase() === 'base64');

  let mimeType = 'text/plain';
  let charset: string | undefined;

  for (const token of metaTokens) {
    const trimmedToken = token.trim();
    if (trimmedToken.toLowerCase() === 'base64') continue;
    if (trimmedToken.toLowerCase().startsWith('charset=')) {
      charset = trimmedToken.slice(8);
    } else if (trimmedToken.includes('/')) {
      mimeType = trimmedToken.toLowerCase();
    }
  }

  const mediaType = mimeType.split('/')[0] || 'unknown';

  let decodedBytesLength = 0;
  if (isBase64) {
    const { bytes, isValid } = base64ToBytes(payload);
    decodedBytesLength = isValid ? bytes.length : Math.max(0, Math.floor((payload.length * 3) / 4));
  } else {
    try {
      decodedBytesLength = new Blob([decodeURIComponent(payload)]).size;
    } catch {
      decodedBytesLength = payload.length;
    }
  }

  return {
    isValid: true,
    mimeType,
    mediaType,
    charset,
    isBase64,
    rawPayload: payload,
    decodedBytesLength,
  };
}

/**
 * Generates an RFC 2397 Data URI string from MIME type and Base64 payload
 */
export function generateDataUri(
  base64Payload: string,
  mimeType = 'text/plain',
  charset?: string
): string {
  const cleanPayload = base64Payload.replace(/^data:[^;,]+(?:;base64)?,/i, '').replace(/\s+/g, '');
  const charsetParam = charset ? `;charset=${charset}` : '';
  return `data:${mimeType}${charsetParam};base64,${cleanPayload}`;
}

/**
 * Generates developer code snippets for embedding Data URIs in web markup and styles
 */
export function buildDataUriSnippets(dataUri: string, mimeType: string): DataUriSnippets {
  const cleanUri = dataUri.trim();
  const lowerMime = mimeType.toLowerCase();

  const snippets: DataUriSnippets = {
    dataUri: cleanUri,
    jsConstant: `const embeddedAsset = "${cleanUri}";`,
    jsonEscaped: JSON.stringify(cleanUri),
  };

  if (lowerMime.startsWith('image/')) {
    snippets.htmlImg = `<img src="${cleanUri}" alt="Embedded Image" />`;
    snippets.cssBackground = `background-image: url("${cleanUri}");`;
  }

  if (lowerMime.startsWith('audio/')) {
    snippets.htmlAudio = `<audio controls src="${cleanUri}">Your browser does not support the audio element.</audio>`;
  }

  if (lowerMime.startsWith('video/')) {
    snippets.htmlVideo = `<video controls width="640" height="360" src="${cleanUri}">Your browser does not support the video tag.</video>`;
  }

  if (lowerMime === 'text/css') {
    snippets.htmlLinkCss = `<link rel="stylesheet" href="${cleanUri}" />`;
  }

  if (lowerMime === 'text/html' || lowerMime === 'application/pdf') {
    snippets.htmlIframe = `<iframe src="${cleanUri}" title="Embedded Document" width="100%" height="500" sandbox="allow-same-origin"></iframe>`;
  }

  return snippets;
}

/**
 * Converts a Data URI into a downloadable Blob with detected filename
 */
export function dataUriToDownloadableFile(dataUri: string, defaultName = 'downloaded-file'): {
  blob: Blob;
  filename: string;
  mimeType: string;
} {
  const parsed = parseDataUri(dataUri);
  let bytes: Uint8Array;

  if (parsed.isBase64) {
    const res = base64ToBytes(parsed.rawPayload);
    bytes = res.bytes;
  } else {
    const text = decodeURIComponent(parsed.rawPayload);
    bytes = new TextEncoder().encode(text);
  }

  const detected = detectMimeFromBytes(bytes);
  const finalMime = parsed.mimeType || detected.mimeType || 'application/octet-stream';
  const ext = getExtensionFromMime(finalMime);

  const blob = new Blob([bytes as unknown as BlobPart], { type: finalMime });
  return {
    blob,
    filename: `${defaultName}${ext}`,
    mimeType: finalMime,
  };
}


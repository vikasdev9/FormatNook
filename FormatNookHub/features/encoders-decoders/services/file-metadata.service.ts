import { parseImageBytes } from './image-detection.service';
import { detectMimeFromBytes } from './mime-detection.service';
import { validatePdfBytes } from './file-encoding.service';
import { getBlobArrayBuffer } from '../utils/byte-conversion.utils';
import { ParsedImageInfo } from '../types/file-metadata.types';

export interface ExtractedMediaMetadata {
  mimeType: string;
  sizeBytes: number;
  imageInfo?: ParsedImageInfo | null;
  duration?: number;
  videoDimensions?: { width: number; height: number };
  isPdfValid?: boolean;
}

/**
 * Extracts metadata safely from Blob or Uint8Array
 */
export async function extractMediaMetadata(
  blob: Blob | null,
  rawBytes?: Uint8Array
): Promise<ExtractedMediaMetadata | null> {
  if (!blob && !rawBytes) return null;

  let bytes = rawBytes;
  if (!bytes && blob) {
    const buf = await getBlobArrayBuffer(blob);
    bytes = new Uint8Array(buf);
  }

  if (!bytes || bytes.length === 0) return null;

  const detected = detectMimeFromBytes(bytes);
  const sizeBytes = bytes.length;

  const result: ExtractedMediaMetadata = {
    mimeType: detected.mimeType,
    sizeBytes,
  };

  // 1. If image, parse binary image headers
  if (detected.category === 'image') {
    result.imageInfo = parseImageBytes(bytes);
  }

  // 2. If PDF, check %PDF- header sanity
  if (detected.category === 'pdf') {
    const pdfCheck = validatePdfBytes(bytes);
    result.isPdfValid = pdfCheck.isValid;
  }

  return result;
}

/**
 * Extracts duration from an Audio object URL in the browser
 */
export function extractAudioDuration(objectUrl: string): Promise<number | undefined> {
  if (typeof window === 'undefined') return Promise.resolve(undefined);

  return new Promise((resolve) => {
    const audio = new Audio();
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };

    const onLoaded = () => {
      cleanup();
      resolve(isFinite(audio.duration) ? audio.duration : undefined);
    };

    const onError = () => {
      cleanup();
      resolve(undefined);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = objectUrl;
  });
}

/**
 * Extracts duration and dimensions from a Video object URL in the browser
 */
export function extractVideoMetadata(
  objectUrl: string
): Promise<{ duration?: number; width?: number; height?: number } | undefined> {
  if (typeof window === 'undefined') return Promise.resolve(undefined);

  return new Promise((resolve) => {
    const video = document.createElement('video');
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };

    const onLoaded = () => {
      cleanup();
      resolve({
        duration: isFinite(video.duration) ? video.duration : undefined,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      });
    };

    const onError = () => {
      cleanup();
      resolve(undefined);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    video.src = objectUrl;
  });
}

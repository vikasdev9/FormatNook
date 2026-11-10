import {
  ImageConversionOptions,
  ImageOutputFormat,
  ConversionResult,
} from '../types/file-metadata.types';
import { getExtensionFromMime, sanitizeFilename } from '../utils/filename.utils';
import { getBlobArrayBuffer } from '../utils/byte-conversion.utils';
import { parseImageBytes } from './image-detection.service';

export const SUPPORTED_OUTPUT_FORMATS: {
  id: ImageOutputFormat;
  label: string;
  extension: string;
  supportsQuality: boolean;
  supportsTransparency: boolean;
}[] = [
  {
    id: 'auto',
    label: 'Auto-detect / Original Format',
    extension: '',
    supportsQuality: false,
    supportsTransparency: true,
  },
  {
    id: 'image/png',
    label: 'PNG (.png)',
    extension: '.png',
    supportsQuality: false,
    supportsTransparency: true,
  },
  {
    id: 'image/jpeg',
    label: 'JPG / JPEG (.jpg)',
    extension: '.jpg',
    supportsQuality: true,
    supportsTransparency: false,
  },
  {
    id: 'image/webp',
    label: 'WebP (.webp)',
    extension: '.webp',
    supportsQuality: true,
    supportsTransparency: true,
  },
  {
    id: 'image/gif',
    label: 'GIF (.gif - Static)',
    extension: '.gif',
    supportsQuality: false,
    supportsTransparency: true,
  },
];

/**
 * Checks if target format requires browser-side Canvas re-encoding
 */
export function isReencodingRequired(
  sourceMime: string,
  targetFormat: ImageOutputFormat,
  options?: Partial<ImageConversionOptions>
): boolean {
  if (targetFormat === 'auto') return false;
  if (sourceMime.toLowerCase() === targetFormat.toLowerCase()) {
    // If same format, check if lossy quality recompression was explicitly set
    if (
      (targetFormat === 'image/jpeg' || targetFormat === 'image/webp') &&
      options?.quality !== undefined &&
      options.quality < 0.99
    ) {
      return true;
    }
    return false;
  }
  return true;
}

/**
 * Generates an appropriate output filename reflecting the target format
 */
export function getConvertedFilename(
  originalFilename: string,
  targetMime: string
): string {
  const safeName = sanitizeFilename(originalFilename);
  const baseName = safeName.replace(/\.[^/.]+$/, '');
  const ext = getExtensionFromMime(targetMime);
  return `${baseName}${ext}`;
}

/**
 * Performs client-side image format conversion using HTML5 Canvas / createImageBitmap
 */
export async function convertImageBlob(
  sourceBlob: Blob,
  options: ImageConversionOptions,
  originalFilename: string = 'decoded-image'
): Promise<ConversionResult> {
  const targetFormat = options.format;
  const sourceMime = sourceBlob.type || 'image/png';

  // 1. If format is 'auto' or matches without recompression, bypass canvas
  if (!isReencodingRequired(sourceMime, targetFormat, options)) {
    const objectUrl = URL.createObjectURL(sourceBlob);
    const buf = await getBlobArrayBuffer(sourceBlob);
    const parsed = parseImageBytes(new Uint8Array(buf));
    const ext = getExtensionFromMime(sourceMime);

    return {
      blob: sourceBlob,
      objectUrl,
      mimeType: sourceMime,
      extension: ext,
      suggestedFilename: getConvertedFilename(originalFilename, sourceMime),
      width: parsed?.dimensions?.width,
      height: parsed?.dimensions?.height,
      sizeBytes: sourceBlob.size,
      isReencoded: false,
      format: targetFormat,
    };
  }

  // 2. Browser environment check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Image format conversion is only available in a browser environment.');
  }

  // 3. Load image into memory
  const sourceUrl = URL.createObjectURL(sourceBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load decoded image for conversion.'));
      image.src = sourceUrl;
    });

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
      throw new Error('Image dimensions could not be determined.');
    }

    // 4. Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: targetFormat !== 'image/jpeg' });

    if (!ctx) {
      throw new Error('Could not initialize 2D canvas rendering context.');
    }

    // 5. If converting to JPEG, fill transparency with background color
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = options.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // 6. Draw image onto canvas
    ctx.drawImage(img, 0, 0);

    // 7. Re-encode to target format
    const quality =
      targetFormat === 'image/jpeg' || targetFormat === 'image/webp'
        ? Math.min(Math.max(options.quality, 0.1), 1.0)
        : undefined;

    const convertedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error(`Failed to convert image to ${targetFormat}.`));
            return;
          }
          resolve(blob);
        },
        targetFormat,
        quality
      );
    });

    // 8. Verify browser did not silently fall back to an unsupported MIME
    if (targetFormat === 'image/gif' && convertedBlob.type !== 'image/gif') {
      throw new Error(
        'Browser canvas does not support direct GIF encoding. Please choose PNG or WebP instead.'
      );
    }

    const objectUrl = URL.createObjectURL(convertedBlob);
    const actualMime = convertedBlob.type || targetFormat;
    const ext = getExtensionFromMime(actualMime);

    return {
      blob: convertedBlob,
      objectUrl,
      mimeType: actualMime,
      extension: ext,
      suggestedFilename: getConvertedFilename(originalFilename, actualMime),
      width,
      height,
      sizeBytes: convertedBlob.size,
      qualityUsed: quality,
      isReencoded: true,
      format: targetFormat,
    };
  } finally {
    // Revoke temporary source object URL
    URL.revokeObjectURL(sourceUrl);
  }
}

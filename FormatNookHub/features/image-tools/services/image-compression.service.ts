/**
 * Image Compression & Target Size Estimator Service
 */

import { ImageOutputFormat } from '../types/image-tools.types';

export interface CompressionEstimation {
  estimatedBytes: number;
  reductionPercentage: number;
  isLossy: boolean;
}

/**
 * Estimates the output size in bytes based on pixel area, quality, and format.
 */
export function estimateOutputSize(
  width: number,
  height: number,
  quality: number,
  format: ImageOutputFormat,
  originalSizeBytes: number
): CompressionEstimation {
  const pixelCount = width * height;
  let estimatedBytes = originalSizeBytes;
  let isLossy = true;

  if (format === 'image/png') {
    // Lossless PNG: typical compression ~1.2 to 2.5 bytes per pixel for photographic images
    estimatedBytes = Math.round(pixelCount * 1.5);
    isLossy = false;
  } else if (format === 'image/webp') {
    // WebP: ~0.15 to 0.75 bytes per pixel depending on quality
    const bpp = 0.12 + quality * 0.55;
    estimatedBytes = Math.round(pixelCount * bpp);
  } else if (format === 'image/avif') {
    // AVIF: ~0.08 to 0.45 bytes per pixel
    const bpp = 0.08 + quality * 0.42;
    estimatedBytes = Math.round(pixelCount * bpp);
  } else {
    // JPEG (or auto default): ~0.2 to 1.1 bytes per pixel
    const bpp = 0.18 + quality * 0.72;
    estimatedBytes = Math.round(pixelCount * bpp);
  }

  // Bound estimation reasonably
  if (estimatedBytes < 1024) estimatedBytes = 1024;

  const reductionPercentage = Math.round(
    ((originalSizeBytes - estimatedBytes) / (originalSizeBytes || 1)) * 100
  );

  return {
    estimatedBytes,
    reductionPercentage,
    isLossy,
  };
}

/**
 * Recommends optimal quality setting to reach target file size in KB.
 */
export function calculateRecommendedQuality(
  targetSizeBytes: number,
  width: number,
  height: number,
  format: ImageOutputFormat
): number {
  if (format === 'image/png') return 1.0;

  const pixelCount = Math.max(1, width * height);
  const targetBpp = targetSizeBytes / pixelCount;

  if (format === 'image/webp') {
    // bpp = 0.12 + quality * 0.55 => quality = (bpp - 0.12) / 0.55
    const q = (targetBpp - 0.12) / 0.55;
    return Math.max(0.1, Math.min(1.0, Math.round(q * 100) / 100));
  }

  if (format === 'image/avif') {
    // bpp = 0.08 + quality * 0.42 => quality = (bpp - 0.08) / 0.42
    const q = (targetBpp - 0.08) / 0.42;
    return Math.max(0.1, Math.min(1.0, Math.round(q * 100) / 100));
  }

  // JPEG: bpp = 0.18 + quality * 0.72 => quality = (bpp - 0.18) / 0.72
  const q = (targetBpp - 0.18) / 0.72;
  return Math.max(0.1, Math.min(1.0, Math.round(q * 100) / 100));
}

import { describe, it, expect } from 'vitest';
import { estimateOutputSize, calculateRecommendedQuality } from '../services/image-compression.service';

describe('Image Compression Service', () => {
  it('estimates output size based on format, dimensions and quality', () => {
    // 1000 x 1000 = 1,000,000 pixels
    const originalBytes = 2_000_000;

    // WebP at 80% quality
    const webpEst = estimateOutputSize(1000, 1000, 0.8, 'image/webp', originalBytes);
    expect(webpEst.estimatedBytes).toBeLessThan(originalBytes);
    expect(webpEst.reductionPercentage).toBeGreaterThan(0);
    expect(webpEst.isLossy).toBe(true);

    // PNG is marked as lossless
    const pngEst = estimateOutputSize(1000, 1000, 1.0, 'image/png', originalBytes);
    expect(pngEst.isLossy).toBe(false);
  });

  it('calculates recommended quality to match target file size', () => {
    const targetBytes = 200 * 1024; // 200 KB
    const width = 1200;
    const height = 800;

    const recommendedWebp = calculateRecommendedQuality(targetBytes, width, height, 'image/webp');
    expect(recommendedWebp).toBeGreaterThanOrEqual(0.1);
    expect(recommendedWebp).toBeLessThanOrEqual(1.0);

    const recommendedJpeg = calculateRecommendedQuality(targetBytes, width, height, 'image/jpeg');
    expect(recommendedJpeg).toBeGreaterThanOrEqual(0.1);
    expect(recommendedJpeg).toBeLessThanOrEqual(1.0);
  });
});

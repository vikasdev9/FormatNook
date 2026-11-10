import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isReencodingRequired,
  getConvertedFilename,
  convertImageBlob,
  SUPPORTED_OUTPUT_FORMATS,
} from '../services/image-conversion.service';
import {
  parseImageBytes,
  formatAspectRatio,
  calculateGcd,
} from '../services/image-detection.service';

describe('Image Detection & Header Parsing Service', () => {
  it('correctly calculates GCD and aspect ratios', () => {
    expect(calculateGcd(1920, 1080)).toBe(120);
    expect(calculateGcd(800, 600)).toBe(200);

    expect(formatAspectRatio(1920, 1080)).toBe('16:9');
    expect(formatAspectRatio(800, 600)).toBe('4:3');
    expect(formatAspectRatio(500, 500)).toBe('1:1');
    expect(formatAspectRatio(1200, 800)).toBe('3:2');
    expect(formatAspectRatio(0, 0)).toBe('Unknown');
  });

  it('parses valid PNG binary header without canvas', () => {
    // 8-byte PNG signature + 4 bytes length + 4 bytes 'IHDR' + 4 bytes width (100) + 4 bytes height (50) + 1 byte bitDepth (8) + 1 byte colorType (6 = RGBA)
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
      0x00, 0x00, 0x00, 0x0d, // Length 13
      0x49, 0x48, 0x44, 0x52, // 'IHDR'
      0x00, 0x00, 0x00, 0x64, // Width = 100
      0x00, 0x00, 0x00, 0x32, // Height = 50
      0x08, // Bit depth = 8
      0x06, // Color type = 6 (RGBA)
      0x00, 0x00, 0x00,
    ]);

    const result = parseImageBytes(pngBytes);
    expect(result).not.toBeNull();
    expect(result?.format).toBe('PNG');
    expect(result?.mimeType).toBe('image/png');
    expect(result?.dimensions?.width).toBe(100);
    expect(result?.dimensions?.height).toBe(50);
    expect(result?.dimensions?.aspectRatio).toBe('2:1');
    expect(result?.bitDepth).toBe(8);
    expect(result?.colorType).toBe('RGBA (Truecolor with Alpha)');
  });

  it('parses valid GIF binary header', () => {
    // GIF89a signature + width (200 little-endian) + height (150 little-endian)
    const gifBytes = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // 'GIF89a'
      0xc8, 0x00, // Width = 200
      0x96, 0x00, // Height = 150
      0x00, 0x00,
    ]);

    const result = parseImageBytes(gifBytes);
    expect(result).not.toBeNull();
    expect(result?.format).toBe('GIF89a');
    expect(result?.mimeType).toBe('image/gif');
    expect(result?.dimensions?.width).toBe(200);
    expect(result?.dimensions?.height).toBe(150);
    expect(result?.dimensions?.aspectRatio).toBe('4:3');
  });

  it('parses valid JPEG binary SOF header', () => {
    // FF D8 FF + APP0 marker + SOF0 marker (FF C0) with precision 8, height 400, width 600
    const jpegBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, // SOI + APP0
      0x00, 0x02, // Segment length
      0xff, 0xc0, // SOF0
      0x00, 0x0b, // Segment length 11
      0x08, // Precision = 8
      0x01, 0x90, // Height = 400
      0x02, 0x58, // Width = 600
      0x03, 0x01, 0x11, 0x00,
    ]);

    const result = parseImageBytes(jpegBytes);
    expect(result).not.toBeNull();
    expect(result?.format).toBe('JPEG');
    expect(result?.mimeType).toBe('image/jpeg');
    expect(result?.dimensions?.width).toBe(600);
    expect(result?.dimensions?.height).toBe(400);
    expect(result?.dimensions?.aspectRatio).toBe('3:2');
    expect(result?.bitDepth).toBe(8);
  });

  it('parses SVG text dimensions from viewBox', () => {
    const svgString = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><circle r="50"/></svg>';
    const svgBytes = new TextEncoder().encode(svgString);

    const result = parseImageBytes(svgBytes);
    expect(result).not.toBeNull();
    expect(result?.format).toBe('SVG Vector');
    expect(result?.mimeType).toBe('image/svg+xml');
    expect(result?.dimensions?.width).toBe(800);
    expect(result?.dimensions?.height).toBe(600);
    expect(result?.dimensions?.aspectRatio).toBe('4:3');
  });
});

describe('Image Conversion Service', () => {
  it('correctly identifies when re-encoding is required', () => {
    // Auto-detect never forces re-encoding
    expect(isReencodingRequired('image/png', 'auto')).toBe(false);

    // Same format with default quality bypasses canvas
    expect(isReencodingRequired('image/png', 'image/png')).toBe(false);
    expect(isReencodingRequired('image/jpeg', 'image/jpeg')).toBe(false);

    // Cross format conversion requires canvas
    expect(isReencodingRequired('image/png', 'image/jpeg')).toBe(true);
    expect(isReencodingRequired('image/jpeg', 'image/png')).toBe(true);
    expect(isReencodingRequired('image/png', 'image/webp')).toBe(true);

    // Same lossy format with quality lower than 0.99 requires recompression
    expect(isReencodingRequired('image/jpeg', 'image/jpeg', { quality: 0.5 })).toBe(true);
  });

  it('generates proper output filenames based on target MIME', () => {
    expect(getConvertedFilename('avatar.png', 'image/jpeg')).toBe('avatar.jpg');
    expect(getConvertedFilename('photo.jpeg', 'image/webp')).toBe('photo.webp');
    expect(getConvertedFilename('graphic.webp', 'image/png')).toBe('graphic.png');
    expect(getConvertedFilename('../../../sneaky.png', 'image/jpeg')).toBe('sneaky.jpg');
  });

  it('bypasses canvas conversion when format is auto or unchanged', async () => {
    const originalBlob = new Blob(['sample-png-bytes'], { type: 'image/png' });
    const result = await convertImageBlob(originalBlob, {
      format: 'auto',
      quality: 0.92,
      backgroundColor: '#FFFFFF',
    }, 'original.png');

    expect(result.isReencoded).toBe(false);
    expect(result.mimeType).toBe('image/png');
    expect(result.blob).toBe(originalBlob);
    expect(result.suggestedFilename).toBe('original.png');
  });
});

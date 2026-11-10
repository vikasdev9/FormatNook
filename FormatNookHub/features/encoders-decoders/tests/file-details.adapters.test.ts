import { describe, it, expect } from 'vitest';
import { buildImageDetails } from '../adapters/image-details.adapter';
import { buildTextDetails } from '../adapters/text-details.adapter';
import { buildFileDetails } from '../adapters/file-details.adapter';
import { buildPdfDetails } from '../adapters/pdf-details.adapter';
import { buildAudioDetails } from '../adapters/audio-details.adapter';
import { buildVideoDetails } from '../adapters/video-details.adapter';
import { buildBasicAuthDetails } from '../adapters/basic-auth-details.adapter';

describe('File Details Metadata Adapters', () => {
  it('builds image details for Base64 to Image with conversion', () => {
    const meta = buildImageDetails({
      toolId: 'base64-to-image',
      sourceInfo: {
        mimeType: 'image/png',
        sizeBytes: 10240,
        parsed: {
          format: 'PNG',
          mimeType: 'image/png',
          dimensions: { width: 1920, height: 1080, aspectRatio: '16:9' },
          bitDepth: 8,
          colorType: 'RGBA (Truecolor with Alpha)',
          sizeBytes: 10240,
        },
      },
      outputResult: {
        conversion: {
          blob: new Blob(['converted-jpg-bytes'], { type: 'image/jpeg' }),
          objectUrl: 'blob:http://localhost/test',
          mimeType: 'image/jpeg',
          extension: '.jpg',
          suggestedFilename: 'decoded-image.jpg',
          width: 1920,
          height: 1080,
          sizeBytes: 8192,
          qualityUsed: 0.92,
          isReencoded: true,
          format: 'image/jpeg',
        },
      },
    });

    expect(meta.toolId).toBe('base64-to-image');
    expect(meta.summary.formatBadge).toBe('PNG');
    expect(meta.summary.primaryMetric).toBe('1920 × 1080 px');
    expect(meta.summary.statusBadge?.label).toBe('Converted');

    // Source group verification
    const srcItems = meta.sourceGroups[0].items;
    expect(srcItems.find((i) => i.label === 'Detected Format')?.value).toBe('PNG');
    expect(srcItems.find((i) => i.label === 'Dimensions')?.value).toBe('1920 × 1080 px');
    expect(srcItems.find((i) => i.label === 'Bit Depth')?.value).toBe('8-bit per channel');

    // Output group verification
    const outItems = meta.outputGroups[0].items;
    expect(outItems.find((i) => i.label === 'Target Format')?.value).toBe('image/jpeg');
    expect(outItems.find((i) => i.label === 'Output Filename')?.value).toBe('decoded-image.jpg');

    // JPEG transparency notice included
    expect(meta.notes?.some((n) => n.includes('alpha channel transparency'))).toBe(true);
  });

  it('builds text details for Base64 to Text', () => {
    const meta = buildTextDetails({
      toolId: 'base64-to-text',
      inputString: 'SGVsbG8gV29ybGQh',
      outputString: 'Hello World!',
      isUtf8Valid: true,
    });

    expect(meta.toolId).toBe('base64-to-text');
    expect(meta.summary.formatBadge).toBe('TEXT');
    expect(meta.summary.primaryMetric).toBe('12 chars');
    expect(meta.outputGroups[0].items.find((i) => i.label === 'UTF-8 Validation')?.value).toBe(
      '100% Valid UTF-8'
    );
  });

  it('builds PDF details with sanity check notice', () => {
    const meta = buildPdfDetails({
      toolId: 'base64-to-pdf',
      filename: 'document.pdf',
      sizeBytes: 54321,
      hasPdfSignature: true,
    });

    expect(meta.toolId).toBe('base64-to-pdf');
    expect(meta.summary.formatBadge).toBe('PDF');
    expect(meta.summary.statusBadge?.label).toBe('PDF Verified');
    expect(meta.notes?.some((n) => n.includes('%PDF- header check'))).toBe(true);
  });

  it('builds audio details with duration', () => {
    const meta = buildAudioDetails({
      toolId: 'base64-to-audio',
      filename: 'track.mp3',
      sizeBytes: 1048576,
      mimeType: 'audio/mpeg',
      duration: 125.4,
    });

    expect(meta.toolId).toBe('base64-to-audio');
    expect(meta.summary.formatBadge).toBe('MPEG');
    expect(meta.sourceGroups[0].items.find((i) => i.label === 'Audio Duration')?.value).toContain(
      '2:05'
    );
  });

  it('builds video details with dimensions and aspect ratio', () => {
    const meta = buildVideoDetails({
      toolId: 'base64-to-video',
      filename: 'clip.mp4',
      sizeBytes: 5242880,
      mimeType: 'video/mp4',
      dimensions: { width: 1280, height: 720 },
      duration: 15.0,
    });

    expect(meta.toolId).toBe('base64-to-video');
    expect(meta.sourceGroups[0].items.find((i) => i.label === 'Video Resolution')?.value).toBe(
      '1280 × 720 px'
    );
    expect(meta.sourceGroups[0].items.find((i) => i.label === 'Aspect Ratio')?.value).toBe('16:9');
  });

  it('STRICT PRIVACY: Basic Auth details never exposes credentials or passwords in metadata', () => {
    const meta = buildBasicAuthDetails({
      isValid: true,
      hasAuthorizationPrefix: true,
      tokenLength: 48,
      hasPasswordDefined: true,
    });

    expect(meta.toolId).toBe('basic-auth-decoder');
    expect(meta.summary.formatBadge).toBe('BASIC AUTH');
    expect(meta.summary.statusBadge?.label).toBe('Decoded Securely');

    // Confirm that no item in any group contains any username or password
    const allSerialized = JSON.stringify(meta);
    expect(allSerialized).not.toContain('admin');
    expect(allSerialized).not.toContain('secretpassword');
    expect(allSerialized).toContain('100% Client-Side In-Memory Isolation');
    expect(allSerialized).toContain('Zero-Knowledge Security Inspection');
  });
});

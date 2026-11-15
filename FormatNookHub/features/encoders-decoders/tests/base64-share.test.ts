import { describe, it, expect } from 'vitest';
import { createBase64RepairSharePayload } from '../adapters/base64-repair-share.adapter';
import { Base64RepairResult, Base64RepairCandidate } from '../types/base64-repair.types';

describe('base64-repair-share.adapter', () => {
  const sampleCandidate: Base64RepairCandidate = {
    id: 'candidate-1',
    sourceType: 'data_uri',
    propertyName: 'avatar',
    rawPayload: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    normalizedPayload: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    repairedPayload: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    isBase64Valid: true,
    isImageValid: true,
    isDecodable: true,
    detectedMimeType: 'image/png',
    detectedFormat: 'PNG',
    imageDimensions: { width: 1, height: 1, aspectRatio: '1:1' },
    decodedByteLength: 68,
    confidence: 'high',
    transformations: ['Stripped Data URI scheme prefix'],
    warnings: [],
    errors: [],
    removedCharCount: 0,
  };

  const sampleResult: Base64RepairResult = {
    originalInput: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    inputFormat: 'data_uri',
    selectedCandidateId: 'candidate-1',
    repairedOutput: sampleCandidate.repairedPayload,
    repairedPayload: sampleCandidate.repairedPayload,
    detectedFormat: 'PNG',
    detectedMimeType: 'image/png',
    decodedByteLength: 68,
    imageDimensions: { width: 1, height: 1, aspectRatio: '1:1' },
    isBase64Valid: true,
    isImageValid: true,
    isSuccessfullyDecodable: true,
    isRecoverable: true,
    confidence: 'high',
    extractedCandidates: [sampleCandidate],
    transformations: ['Stripped Data URI scheme prefix'],
    warnings: [],
    errors: [],
    originalLength: 110,
    repairedLength: 88,
    removedCharCount: 0,
  };

  it('returns null when result or candidate is null', () => {
    expect(createBase64RepairSharePayload(null, null)).toBeNull();
    expect(createBase64RepairSharePayload(sampleResult, null)).toBeNull();
  });

  it('creates full set of 5 format options for valid image candidates', async () => {
    const payload = createBase64RepairSharePayload(sampleResult, sampleCandidate);
    expect(payload).not.toBeNull();
    expect(payload!.toolTitle).toBe('Base64 to Image Decoder');
    expect(payload!.options).toHaveLength(5);

    const ids = payload!.options.map((o) => o.id);
    expect(ids).toContain('base64-text');
    expect(ids).toContain('decoded-image');
    expect(ids).toContain('pdf-report');
    expect(ids).toContain('metadata-json');
    expect(ids).toContain('summary-txt');

    // Test text option generation
    const textOpt = payload!.options.find((o) => o.id === 'base64-text')!;
    const textRes = await textOpt.generate();
    expect(textRes.content).toBe(sampleCandidate.repairedPayload);
    expect(textRes.fileName).toBe('repaired-base64.txt');

    // Test decoded image file option generation
    const imgOpt = payload!.options.find((o) => o.id === 'decoded-image')!;
    const imgRes = await imgOpt.generate();
    expect(imgRes.content).toBeInstanceOf(Blob);
    expect(imgRes.fileName).toBe('decoded-image.png');
    expect(imgRes.mimeType).toBe('image/png');

    // Test PDF Report option generation
    const pdfOpt = payload!.options.find((o) => o.id === 'pdf-report')!;
    const pdfRes = await pdfOpt.generate();
    expect(pdfRes.content).toBeInstanceOf(Blob);
    expect(pdfRes.mimeType).toBe('application/pdf');

    // Test JSON Metadata option generation
    const jsonOpt = payload!.options.find((o) => o.id === 'metadata-json')!;
    const jsonRes = await jsonOpt.generate();
    expect(typeof jsonRes.content).toBe('string');
    const parsed = JSON.parse(jsonRes.content as string);
    expect(parsed.detectedFormat).toBe('PNG');
    expect(parsed.dimensions).toEqual({ width: 1, height: 1, aspectRatio: '1:1' });

    // Test Summary option generation
    const summaryOpt = payload!.options.find((o) => o.id === 'summary-txt')!;
    const summaryRes = await summaryOpt.generate();
    expect(typeof summaryRes.content).toBe('string');
    expect(summaryRes.content).toContain('FORMATNOOK HUB — BASE64 REPAIR & NORMALIZATION SUMMARY');
  });

  it('omits decoded-image binary option when candidate is not a valid image', () => {
    const textCandidate: Base64RepairCandidate = {
      ...sampleCandidate,
      isImageValid: false,
      detectedFormat: null,
      detectedMimeType: null,
    };
    const payload = createBase64RepairSharePayload(sampleResult, textCandidate);
    expect(payload).not.toBeNull();
    const ids = payload!.options.map((o) => o.id);
    expect(ids).not.toContain('decoded-image');
    expect(ids).toContain('base64-text');
  });
});

import { describe, it, expect } from 'vitest';
import { createDecoderSharePayload } from '../adapters/base64-decoder-share.adapter';

describe('base64-decoder-share.adapter', () => {
  it('returns null when no output exists', () => {
    expect(
      createDecoderSharePayload({
        toolId: 'base64-to-image',
        isMediaDecoder: true,
      })
    ).toBeNull();
  });

  it('creates 4 format options for Base64 to Image Decoder with embedded image PDF', async () => {
    const mockBlob = new Blob(['image-png-binary'], { type: 'image/png' });
    const payload = createDecoderSharePayload({
      toolId: 'base64-to-image',
      isMediaDecoder: true,
      convertedImage: {
        blob: mockBlob,
        mimeType: 'image/png',
        extension: 'png',
        suggestedFilename: 'decoded-image.png',
        width: 1024,
        height: 1024,
        sizeBytes: 644280,
      },
      textInput: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    });

    expect(payload).not.toBeNull();
    expect(payload!.toolTitle).toBe('Base64 to Image Decoder');
    expect(payload!.options).toHaveLength(4);

    const ids = payload!.options.map((o) => o.id);
    expect(ids).toEqual([
      'decoded-image-file',
      'image-decode-pdf',
      'base64-source-text',
      'image-metadata-json',
    ]);

    // 1. Decoded image file option
    const imgOpt = payload!.options.find((o) => o.id === 'decoded-image-file')!;
    const imgRes = await imgOpt.generate();
    expect(imgRes.fileName).toBe('decoded-image.png');
    expect(imgRes.mimeType).toBe('image/png');
    expect(imgRes.content).toBe(mockBlob);

    // 2. Image PDF Report option with embedded image
    const pdfOpt = payload!.options.find((o) => o.id === 'image-decode-pdf')!;
    const pdfRes = await pdfOpt.generate();
    expect(pdfRes.fileName).toBe('base64-image-decode-report.pdf');
    expect(pdfRes.mimeType).toBe('application/pdf');
    expect(pdfRes.content).toBeInstanceOf(Blob);

    // 3. Source Base64 Text option
    const textOpt = payload!.options.find((o) => o.id === 'base64-source-text')!;
    const textRes = await textOpt.generate();
    expect(textRes.fileName).toBe('base64-payload.txt');
    expect(textRes.content).toContain('iVBORw0KGgo');

    // 4. Metadata JSON option
    const jsonOpt = payload!.options.find((o) => o.id === 'image-metadata-json')!;
    const jsonRes = await jsonOpt.generate();
    expect(jsonRes.fileName).toBe('image-metadata.json');
    const parsed = JSON.parse(jsonRes.content as string);
    expect(parsed.dimensions.width).toBe(1024);
    expect(parsed.dimensions.height).toBe(1024);
  });

  it('creates primary output option for non-media decoders (e.g. text/code)', async () => {
    const payload = createDecoderSharePayload({
      toolId: 'base64-to-text',
      isMediaDecoder: false,
      outputString: 'Hello, FormatNook Hub!',
      textInput: 'SGVsbG8sIEZvcm1hdE5vb2sgSHViIQ==',
      outputFileName: 'decoded-text.txt',
    });

    expect(payload).not.toBeNull();
    expect(payload!.options).toHaveLength(2);
    expect(payload!.options[0].id).toBe('primary-output');
    expect(payload!.options[1].id).toBe('input-source');
  });
});

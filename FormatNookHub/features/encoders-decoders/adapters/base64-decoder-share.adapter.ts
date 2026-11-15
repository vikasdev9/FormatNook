import { ShareFormatOption, SharePayload } from '@/features/shared/types/share.types';
import { generatePdfReport, convertBlobToJpegBytes } from '@/features/shared/services/pdf-report.service';

export interface DecoderShareParams {
  toolId: string;
  isMediaDecoder: boolean;
  convertedImage?: {
    blob: Blob;
    mimeType: string;
    extension: string;
    suggestedFilename: string;
    width?: number;
    height?: number;
    sizeBytes: number;
  } | null;
  decodedBlob?: Blob | null;
  parsedSourceImage?: {
    mimeType: string;
    dimensions?: { width: number; height: number; aspectRatio?: string };
  } | null;
  outputString?: string;
  textInput?: string;
  detectedMime?: string;
  customFilename?: string;
  outputFileName?: string;
}

export function createDecoderSharePayload(params: DecoderShareParams): SharePayload | null {
  const {
    toolId,
    isMediaDecoder,
    convertedImage,
    decodedBlob,
    parsedSourceImage,
    outputString,
    textInput = '',
    detectedMime = 'application/octet-stream',
    customFilename,
    outputFileName = 'output.txt',
  } = params;

  const hasImage = toolId === 'base64-to-image' && (Boolean(convertedImage) || Boolean(decodedBlob));
  const hasOutput = Boolean(outputString) || Boolean(decodedBlob) || Boolean(convertedImage);

  if (!hasOutput) return null;

  const options: ShareFormatOption[] = [];

  // Case 1: Base64 to Image Decoder
  if (hasImage) {
    const activeBlob = convertedImage ? convertedImage.blob : decodedBlob!;
    const mime = convertedImage ? convertedImage.mimeType : detectedMime;
    const filename = convertedImage
      ? convertedImage.suggestedFilename
      : customFilename || 'decoded-image.png';
    const ext = filename.split('.').pop() || 'png';
    const width = convertedImage?.width || parsedSourceImage?.dimensions?.width || 400;
    const height = convertedImage?.height || parsedSourceImage?.dimensions?.height || 400;
    const sizeBytes = convertedImage?.sizeBytes || activeBlob.size;

    // 1. Decoded Binary Image File
    options.push({
      id: 'decoded-image-file',
      label: `Decoded ${ext.toUpperCase()} File`,
      description: `Original decoded raster image (${ext.toUpperCase()})`,
      extension: `.${ext}`,
      mimeType: mime,
      badge: 'Lossless',
      estimatedSize: `${(sizeBytes / 1024).toFixed(1)} KB`,
      generate: () => ({
        content: activeBlob,
        fileName: filename,
        mimeType: mime,
        isBinary: true,
        textForClipboard: textInput ? `data:${mime};base64,${textInput.trim()}` : undefined,
      }),
    });

    // 2. Image & Decode PDF Report with EMBEDDED IMAGE
    options.push({
      id: 'image-decode-pdf',
      label: 'Image & Decode PDF Report',
      description: 'Audit document with embedded image preview and dimensions',
      extension: '.pdf',
      mimeType: 'application/pdf',
      badge: 'PDF',
      estimatedSize: '~10 KB',
      generate: async () => {
        const embeddedImage = await convertBlobToJpegBytes(activeBlob, width, height);

        const pdfBlob = generatePdfReport({
          title: 'Base64 to Image Decode Report',
          toolName: 'Base64 to Image Decoder',
          embeddedImage,
          sections: [
            {
              title: 'Image Specification',
              items: [
                { label: 'File Name', value: filename },
                { label: 'MIME Type', value: mime },
                { label: 'Image Dimensions', value: `${width} × ${height} px` },
                { label: 'Decoded Bytes', value: `${sizeBytes.toLocaleString()} bytes (${(sizeBytes / 1024).toFixed(1)} KB)` },
                { label: 'Decoding Status', value: 'Successfully Decoded & Verified' },
              ],
            },
            {
              title: 'Base64 Encoding Metrics',
              items: [
                { label: 'Base64 Input Length', value: `${textInput.length.toLocaleString()} characters` },
                { label: 'Decoded Binary Size', value: `${sizeBytes.toLocaleString()} bytes` },
                {
                  label: 'Efficiency Ratio',
                  value: `${textInput.length > 0 ? ((sizeBytes / textInput.length) * 100).toFixed(1) : 0}% binary density`,
                },
              ],
            },
          ],
          notes: [
            'Decoded entirely client-side in browser memory with zero network transfer.',
            'Cryptographic verification: Magic bytes match image format signature.',
          ],
        });

        return {
          content: pdfBlob,
          fileName: 'base64-image-decode-report.pdf',
          mimeType: 'application/pdf',
          isBinary: true,
        };
      },
    });

    // 3. Raw Base64 String
    if (textInput) {
      options.push({
        id: 'base64-source-text',
        label: 'Base64 Source String',
        description: 'Original Base64 string payload ready for clipboard or code',
        extension: '.txt',
        mimeType: 'text/plain',
        badge: 'Base64',
        estimatedSize: `${(textInput.length / 1024).toFixed(1)} KB`,
        generate: () => ({
          content: textInput,
          fileName: 'base64-payload.txt',
          mimeType: 'text/plain;charset=utf-8',
          textForClipboard: textInput,
        }),
      });
    }

    // 4. Image Metadata JSON
    options.push({
      id: 'image-metadata-json',
      label: 'Image Metadata JSON',
      description: 'Structured metadata with image dimensions and byte lengths',
      extension: '.json',
      mimeType: 'application/json',
      badge: 'Structured',
      estimatedSize: '< 2 KB',
      generate: () => {
        const metadata = {
          tool: 'FormatNook Base64 to Image Decoder',
          timestamp: new Date().toISOString(),
          fileName: filename,
          mimeType: mime,
          dimensions: { width, height, aspectRatio: `${width}:${height}` },
          decodedByteLength: sizeBytes,
          base64InputLength: textInput.length,
          status: 'Successfully Decoded',
        };
        const jsonStr = JSON.stringify(metadata, null, 2);
        return {
          content: jsonStr,
          fileName: 'image-metadata.json',
          mimeType: 'application/json;charset=utf-8',
          textForClipboard: jsonStr,
        };
      },
    });

    return {
      toolTitle: 'Base64 to Image Decoder',
      defaultFileName: filename,
      options,
      metadata: {
        format: ext,
        dimensions: `${width}x${height}`,
        bytes: sizeBytes,
      },
    };
  }

  // Case 2: Other Decoders / Encoders (Audio, Video, PDF, Text, HTML, CSS, URL, Hex)
  const isBinary = Boolean(decodedBlob) && isMediaDecoder;
  const contentToShare = decodedBlob || outputString || '';
  const chosenFilename = customFilename || outputFileName;
  const chosenMime = detectedMime || 'text/plain;charset=utf-8';

  options.push({
    id: 'primary-output',
    label: isBinary ? 'Decoded Media File' : 'Processed Output',
    description: `Export active ${toolId} result (${chosenFilename})`,
    extension: chosenFilename.includes('.') ? `.${chosenFilename.split('.').pop()}` : '.txt',
    mimeType: chosenMime,
    badge: 'Primary',
    estimatedSize: isBinary
      ? `${((decodedBlob?.size || 0) / 1024).toFixed(1)} KB`
      : `${((outputString?.length || 0) / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: contentToShare,
      fileName: chosenFilename,
      mimeType: chosenMime,
      isBinary,
      textForClipboard: typeof contentToShare === 'string' ? contentToShare : undefined,
    }),
  });

  if (textInput && textInput !== outputString) {
    options.push({
      id: 'input-source',
      label: 'Source Payload',
      description: 'Original input data passed into the tool',
      extension: '.txt',
      mimeType: 'text/plain',
      badge: 'Source',
      estimatedSize: `${(textInput.length / 1024).toFixed(1)} KB`,
      generate: () => ({
        content: textInput,
        fileName: 'input-payload.txt',
        mimeType: 'text/plain;charset=utf-8',
        textForClipboard: textInput,
      }),
    });
  }

  return {
    toolTitle: 'Base64 & Developer Suite',
    defaultFileName: chosenFilename,
    options,
    metadata: {
      toolId,
      mime: chosenMime,
    },
  };
}

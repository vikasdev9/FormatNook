import { Base64RepairCandidate, Base64RepairResult } from '../types/base64-repair.types';
import { ShareFormatOption, SharePayload } from '@/features/shared/types/share.types';
import { generatePdfReport, convertBlobToJpegBytes } from '@/features/shared/services/pdf-report.service';
import { base64ToBytes } from '../services/base64.service';

export function createBase64RepairSharePayload(
  result: Base64RepairResult | null,
  activeCandidate: Base64RepairCandidate | null
): SharePayload | null {
  if (!result || !activeCandidate) return null;

  const candidate = activeCandidate;
  const repairedText = candidate.repairedPayload || candidate.normalizedPayload;
  const isImage = candidate.isImageValid;
  const formatExt = candidate.detectedFormat ? candidate.detectedFormat.toLowerCase() : 'bin';
  const mimeType = candidate.detectedMimeType || 'application/octet-stream';

  const options: ShareFormatOption[] = [];

  // Option 1: Repaired Base64 String (Text)
  options.push({
    id: 'base64-text',
    label: 'Repaired Base64 Text',
    description: 'Clean, normalized Base64 string ready for code or API payloads',
    extension: '.txt',
    mimeType: 'text/plain',
    badge: 'Standard',
    estimatedSize: `${(repairedText.length / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: repairedText,
      fileName: 'repaired-base64.txt',
      mimeType: 'text/plain;charset=utf-8',
      textForClipboard: repairedText,
    }),
  });

  // Option 2: Decoded Binary Image File (if valid image)
  if (isImage) {
    const byteResult = base64ToBytes(repairedText);
    if (byteResult.isValid && byteResult.bytes.length > 0) {
      const byteLength = byteResult.bytes.length;
      options.push({
        id: 'decoded-image',
        label: `Decoded ${candidate.detectedFormat || 'Image'} File`,
        description: `Original decoded raster/vector file (${formatExt.toUpperCase()})`,
        extension: `.${formatExt}`,
        mimeType,
        badge: 'Lossless',
        estimatedSize: `${(byteLength / 1024).toFixed(1)} KB`,
        generate: () => {
          const blob = new Blob([byteResult.bytes as unknown as BlobPart], { type: mimeType });
          return {
            content: blob,
            fileName: `decoded-image.${formatExt}`,
            mimeType,
            isBinary: true,
            textForClipboard: `data:${mimeType};base64,${repairedText}`,
          };
        },
      });
    }
  }

  // Option 3: Image PDF Report
  options.push({
    id: 'pdf-report',
    label: 'Image & Repair PDF Report',
    description: 'Complete audit report with metadata, dimensions, and transformations',
    extension: '.pdf',
    mimeType: 'application/pdf',
    badge: 'PDF',
    estimatedSize: '~8 KB',
    generate: async () => {
      let embeddedImage: { jpegBytes: Uint8Array; width: number; height: number } | undefined;
      if (isImage) {
        const byteResult = base64ToBytes(repairedText);
        if (byteResult.isValid && byteResult.bytes.length > 0) {
          const imgBlob = new Blob([byteResult.bytes as unknown as BlobPart], { type: mimeType });
          const w = candidate.imageDimensions?.width || 400;
          const h = candidate.imageDimensions?.height || 400;
          embeddedImage = await convertBlobToJpegBytes(imgBlob, w, h);
        }
      }

      const pdfBlob = generatePdfReport({
        title: 'Base64 Image Repair & Normalization Report',
        toolName: 'Base64 to Image Decoder',
        embeddedImage,
        sections: [
          {
            title: 'Image Specification',
            items: [
              { label: 'Detected Format', value: candidate.detectedFormat || 'Unknown / Non-image' },
              { label: 'MIME Type', value: candidate.detectedMimeType || 'application/octet-stream' },
              {
                label: 'Image Dimensions',
                value: candidate.imageDimensions
                  ? `${candidate.imageDimensions.width} × ${candidate.imageDimensions.height} px (${candidate.imageDimensions.aspectRatio || 'custom'})`
                  : 'N/A',
              },
              { label: 'Decoded Bytes', value: `${candidate.decodedByteLength.toLocaleString()} bytes` },
              { label: 'Decoding Status', value: candidate.isDecodable ? 'Successfully Decoded' : 'Decode Warning' },
            ],
          },
          {
            title: 'Normalization Metrics',
            items: [
              { label: 'Original Length', value: `${result.originalLength.toLocaleString()} characters` },
              { label: 'Repaired Length', value: `${repairedText.length.toLocaleString()} characters` },
              {
                label: 'Length Delta',
                value: `${repairedText.length - result.originalLength > 0 ? '+' : ''}${repairedText.length - result.originalLength} chars`,
              },
              { label: 'Removed Characters', value: `${candidate.removedCharCount} non-alphabet chars` },
            ],
          },
        ],
        notes: candidate.transformations,
      });

      return {
        content: pdfBlob,
        fileName: 'base64-repair-audit-report.pdf',
        mimeType: 'application/pdf',
        isBinary: true,
      };
    },
  });

  // Option 4: Image Metadata Report (JSON)
  options.push({
    id: 'metadata-json',
    label: 'Image Metadata JSON',
    description: 'Structured JSON containing dimensions, MIME, and candidate properties',
    extension: '.json',
    mimeType: 'application/json',
    badge: 'Structured',
    estimatedSize: '< 2 KB',
    generate: () => {
      const metadataPayload = {
        tool: 'FormatNook Base64 Repair Engine',
        timestamp: new Date().toISOString(),
        candidateId: candidate.id,
        isImageValid: candidate.isImageValid,
        isBase64Valid: candidate.isBase64Valid,
        detectedFormat: candidate.detectedFormat,
        detectedMimeType: candidate.detectedMimeType,
        dimensions: candidate.imageDimensions,
        decodedByteLength: candidate.decodedByteLength,
        originalLength: result.originalLength,
        repairedLength: repairedText.length,
        removedCharCount: candidate.removedCharCount,
        transformations: candidate.transformations,
        warnings: candidate.warnings,
        errors: candidate.errors,
      };

      const jsonStr = JSON.stringify(metadataPayload, null, 2);
      return {
        content: jsonStr,
        fileName: 'image-metadata.json',
        mimeType: 'application/json;charset=utf-8',
        textForClipboard: jsonStr,
      };
    },
  });

  // Option 5: Repair Summary Report (Text)
  options.push({
    id: 'summary-txt',
    label: 'Repair Summary Report',
    description: 'Human-readable plain text audit log of all transformations applied',
    extension: '.txt',
    mimeType: 'text/plain',
    badge: 'Audit',
    estimatedSize: '< 2 KB',
    generate: () => {
      const lines = [
        '===========================================================',
        'FORMATNOOK HUB — BASE64 REPAIR & NORMALIZATION SUMMARY',
        '===========================================================',
        `Timestamp:       ${new Date().toISOString()}`,
        `Candidate ID:    ${candidate.id}`,
        `Original Length: ${result.originalLength} characters`,
        `Repaired Length: ${repairedText.length} characters`,
        `Delta:           ${repairedText.length - result.originalLength} characters`,
        `Decoded Bytes:   ${candidate.decodedByteLength} bytes`,
        `Detected Format: ${candidate.detectedFormat || 'Unknown'} (${candidate.detectedMimeType || 'none'})`,
        `Decodable:       ${candidate.isDecodable ? 'YES' : 'NO'}`,
        '',
        'APPLIED TRANSFORMATIONS:',
        ...candidate.transformations.map((t, i) => `  ${i + 1}. ${t}`),
        '',
      ];

      if (candidate.removedCharCount > 0) {
        lines.push(`STRIPPED NON-ALPHABET CHARS: ${candidate.removedCharCount}`);
        if (candidate.removedCharsDetails) {
          lines.push(
            `Details: ${candidate.removedCharsDetails.map((d) => `'${d.char}' (x${d.count})`).join(', ')}`
          );
        }
        lines.push('');
      }

      if (candidate.warnings.length > 0) {
        lines.push('WARNINGS:');
        candidate.warnings.forEach((w) => lines.push(`  - ${w}`));
        lines.push('');
      }

      if (candidate.errors.length > 0) {
        lines.push('ERRORS:');
        candidate.errors.forEach((e) => lines.push(`  - ${e}`));
        lines.push('');
      }

      lines.push('-----------------------------------------------------------');
      lines.push('Verified Client-Side by FormatNook Hub (Zero Server Telemetry)');
      lines.push('===========================================================');

      const text = lines.join('\n');
      return {
        content: text,
        fileName: 'repair-summary.txt',
        mimeType: 'text/plain;charset=utf-8',
        textForClipboard: text,
      };
    },
  });

  return {
    toolTitle: 'Base64 to Image Decoder',
    defaultFileName: isImage ? `decoded-image.${formatExt}` : 'repaired-base64.txt',
    options,
    metadata: {
      format: candidate.detectedFormat || undefined,
      dimensions: candidate.imageDimensions ? `${candidate.imageDimensions.width}x${candidate.imageDimensions.height}` : undefined,
      size: candidate.decodedByteLength,
    },
  };
}

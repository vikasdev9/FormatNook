import {
  DetailedFileMetadata,
  MetadataGroup,
  MetadataItem,
  ConversionResult,
  ParsedImageInfo,
} from '../types/file-metadata.types';
import { formatFileSize } from '../utils/byte-conversion.utils';

export interface ImageAdapterParams {
  toolId: 'base64-to-image' | 'image-to-base64';
  sourceInfo?: {
    filename?: string;
    mimeType: string;
    sizeBytes: number;
    parsed?: ParsedImageInfo | null;
    dimensions?: { width: number; height: number };
  };
  outputResult?: {
    conversion?: ConversionResult | null;
    dataUriMode?: 'data-uri' | 'raw';
    base64String?: string;
    outputSize?: number;
    filename?: string;
    mimeType?: string;
  };
}

export function buildImageDetails(params: ImageAdapterParams): DetailedFileMetadata {
  const { toolId, sourceInfo, outputResult } = params;

  // 1. Tool: Base64 to Image
  if (toolId === 'base64-to-image') {
    const parsed = sourceInfo?.parsed;
    const conv = outputResult?.conversion;
    const srcSize = sourceInfo?.sizeBytes || 0;
    const outSize = conv?.sizeBytes || srcSize;

    const sourceItems: MetadataItem[] = [];
    if (parsed?.format) {
      sourceItems.push({ label: 'Detected Format', value: parsed.format, badge: 'accent' });
    }
    sourceItems.push({
      label: 'Original MIME',
      value: sourceInfo?.mimeType || parsed?.mimeType || 'Unknown',
    });
    if (srcSize > 0) {
      sourceItems.push({
        label: 'Decoded Byte Size',
        value: `${formatFileSize(srcSize)} (${srcSize.toLocaleString()} bytes)`,
      });
    }
    if (parsed?.dimensions) {
      sourceItems.push({
        label: 'Dimensions',
        value: `${parsed.dimensions.width} × ${parsed.dimensions.height} px`,
      });
      sourceItems.push({
        label: 'Aspect Ratio',
        value: parsed.dimensions.aspectRatio,
        hint: 'Calculated from native image header',
      });
    }
    if (parsed?.bitDepth !== undefined) {
      sourceItems.push({
        label: 'Bit Depth',
        value: `${parsed.bitDepth}-bit per channel`,
      });
    }
    if (parsed?.colorType) {
      sourceItems.push({
        label: 'Color Space / Type',
        value: parsed.colorType,
      });
    }

    const outputItems: MetadataItem[] = [];
    if (conv) {
      outputItems.push({
        label: 'Target Format',
        value: conv.format === 'auto' ? 'Auto (Original)' : conv.mimeType,
        badge: conv.isReencoded ? 'accent' : 'neutral',
      });
      outputItems.push({
        label: 'Actual Output MIME',
        value: conv.mimeType,
      });
      outputItems.push({
        label: 'Output File Size',
        value: `${formatFileSize(conv.sizeBytes)} (${conv.sizeBytes.toLocaleString()} bytes)`,
      });
      if (srcSize > 0 && conv.isReencoded) {
        const diffPercent = Math.round(((conv.sizeBytes - srcSize) / srcSize) * 100);
        const sign = diffPercent >= 0 ? '+' : '';
        outputItems.push({
          label: 'Size Difference',
          value: `${sign}${diffPercent}% vs Decoded Original`,
          badge: diffPercent <= 0 ? 'success' : 'warning',
        });
      }
      outputItems.push({
        label: 'Output Filename',
        value: conv.suggestedFilename,
      });
      outputItems.push({
        label: 'Processing Method',
        value: conv.isReencoded ? 'HTML5 Canvas Re-encoded' : 'Lossless Original Decoded Stream',
      });
    }

    const notes: string[] = [];
    if (conv?.mimeType === 'image/jpeg' && conv.isReencoded) {
      notes.push(
        'JPEG does not support alpha channel transparency. Any transparent background was filled with your chosen solid background color.'
      );
    }
    if (conv?.isReencoded) {
      notes.push(
        'Original Base64 data remains unchanged in the editor. You can switch formats or quality at any time.'
      );
    }

    const primaryMetric = parsed?.dimensions
      ? `${parsed.dimensions.width} × ${parsed.dimensions.height} px`
      : undefined;

    return {
      toolId,
      summary: {
        formatBadge: parsed?.format || 'IMAGE',
        primaryMetric,
        sizeString: formatFileSize(outSize),
        statusBadge: {
          label: conv?.isReencoded ? 'Converted' : 'Decoded',
          variant: 'success',
        },
      },
      sourceGroups: [
        {
          title: 'Source Details (Decoded Input)',
          items: sourceItems,
        },
      ],
      outputGroups: conv
        ? [
            {
              title: 'Output Details (Selected Image)',
              items: outputItems,
            },
          ]
        : [],
      notes,
    };
  }

  // 2. Tool: Image to Base64
  const sourceItems: MetadataItem[] = [];
  if (sourceInfo?.filename) {
    sourceItems.push({ label: 'Original Filename', value: sourceInfo.filename });
  }
  sourceItems.push({ label: 'MIME Type', value: sourceInfo?.mimeType || 'image/png' });
  if (sourceInfo?.sizeBytes) {
    sourceItems.push({
      label: 'Image File Size',
      value: `${formatFileSize(sourceInfo.sizeBytes)} (${sourceInfo.sizeBytes.toLocaleString()} bytes)`,
    });
  }
  if (sourceInfo?.dimensions) {
    sourceItems.push({
      label: 'Dimensions',
      value: `${sourceInfo.dimensions.width} × ${sourceInfo.dimensions.height} px`,
    });
  }

  const outputItems: MetadataItem[] = [];
  const b64Len = outputResult?.base64String?.length || 0;
  if (b64Len > 0) {
    outputItems.push({
      label: 'Base64 Character Length',
      value: `${b64Len.toLocaleString()} chars`,
      badge: 'neutral',
    });
    outputItems.push({
      label: 'Encoding Format',
      value: outputResult?.dataUriMode === 'data-uri' ? 'HTML/CSS Data URI' : 'Raw Base64 String',
    });
    if (sourceInfo?.sizeBytes) {
      const expansion = Math.round(((b64Len - sourceInfo.sizeBytes) / sourceInfo.sizeBytes) * 100);
      outputItems.push({
        label: 'Base64 Expansion',
        value: `+${expansion}% (${formatFileSize(b64Len)})`,
        badge: 'warning',
      });
    }
  }

  return {
    toolId,
    summary: {
      formatBadge: sourceInfo?.mimeType?.split('/')[1]?.toUpperCase() || 'IMAGE',
      primaryMetric: sourceInfo?.dimensions
        ? `${sourceInfo.dimensions.width} × ${sourceInfo.dimensions.height} px`
        : undefined,
      sizeString: sourceInfo?.sizeBytes ? formatFileSize(sourceInfo.sizeBytes) : undefined,
      statusBadge: {
        label: 'Encoded',
        variant: 'success',
      },
    },
    sourceGroups: [{ title: 'Source Image File', items: sourceItems }],
    outputGroups: [{ title: 'Encoded Base64 Output', items: outputItems }],
    notes: [
      'Base64 expands binary data size by ~33%. For web assets, consider SVGs or direct CDN asset references when possible.',
    ],
  };
}

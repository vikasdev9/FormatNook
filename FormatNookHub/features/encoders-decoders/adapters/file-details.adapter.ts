import { DetailedFileMetadata, MetadataItem } from '../types/file-metadata.types';
import { formatFileSize } from '../utils/byte-conversion.utils';

export interface FileAdapterParams {
  toolId: 'base64-to-file' | 'file-to-base64';
  filename: string;
  sizeBytes: number;
  mimeType: string;
  isVerifiedMime?: boolean;
  outputFilename?: string;
  outputSize?: number;
}

export function buildFileDetails(params: FileAdapterParams): DetailedFileMetadata {
  const { toolId, filename, sizeBytes, mimeType, isVerifiedMime, outputFilename, outputSize } = params;

  const isEncoder = toolId === 'file-to-base64';

  const sourceItems: MetadataItem[] = [
    { label: 'File Name', value: filename },
    { label: 'File Size', value: `${formatFileSize(sizeBytes)} (${sizeBytes.toLocaleString()} bytes)` },
    {
      label: 'MIME Type',
      value: mimeType || 'application/octet-stream',
      hint: isVerifiedMime ? 'Verified via magic byte signature' : undefined,
    },
  ];

  const outputItems: MetadataItem[] = [];
  if (outputFilename) {
    outputItems.push({ label: 'Output Filename', value: outputFilename });
  }
  if (outputSize !== undefined && outputSize > 0) {
    outputItems.push({
      label: 'Output Size',
      value: `${formatFileSize(outputSize)} (${outputSize.toLocaleString()} bytes)`,
    });
    if (isEncoder && sizeBytes > 0) {
      const exp = Math.round(((outputSize - sizeBytes) / sizeBytes) * 100);
      outputItems.push({
        label: 'Base64 Size Expansion',
        value: `+${exp}%`,
        badge: 'warning',
      });
    }
  }

  return {
    toolId,
    summary: {
      formatBadge: isEncoder ? 'BASE64' : 'BINARY FILE',
      primaryMetric: filename,
      sizeString: formatFileSize(sizeBytes),
      statusBadge: {
        label: isEncoder ? 'Encoded' : 'Decoded',
        variant: 'success',
      },
    },
    sourceGroups: [{ title: isEncoder ? 'Uploaded File' : 'Decoded Stream', items: sourceItems }],
    outputGroups: [{ title: isEncoder ? 'Base64 Output' : 'Downloadable File', items: outputItems }],
    notes: [
      'Binary verification inspects leading byte signatures. Ensure file extension matches your intended file format.',
    ],
  };
}

import { DetailedFileMetadata, MetadataItem } from '../types/file-metadata.types';
import { formatFileSize } from '../utils/byte-conversion.utils';

export interface PdfAdapterParams {
  toolId: 'base64-to-pdf' | 'pdf-to-base64';
  filename: string;
  sizeBytes: number;
  hasPdfSignature: boolean;
  outputSize?: number;
}

export function buildPdfDetails(params: PdfAdapterParams): DetailedFileMetadata {
  const { toolId, filename, sizeBytes, hasPdfSignature, outputSize } = params;

  const isEncoder = toolId === 'pdf-to-base64';

  const sourceItems: MetadataItem[] = [
    { label: 'File Name', value: filename },
    { label: 'File Size', value: `${formatFileSize(sizeBytes)} (${sizeBytes.toLocaleString()} bytes)` },
    { label: 'Document MIME', value: 'application/pdf' },
    {
      label: 'PDF Signature Check (%PDF-)',
      value: hasPdfSignature ? 'Verified Signature Header' : 'Missing %PDF- Header',
      badge: hasPdfSignature ? 'success' : 'warning',
    },
  ];

  const outputItems: MetadataItem[] = [];
  if (outputSize !== undefined && outputSize > 0) {
    outputItems.push({
      label: 'Output Size',
      value: `${formatFileSize(outputSize)} (${outputSize.toLocaleString()} bytes)`,
    });
  }

  return {
    toolId,
    summary: {
      formatBadge: 'PDF',
      primaryMetric: filename,
      sizeString: formatFileSize(sizeBytes),
      statusBadge: {
        label: hasPdfSignature ? 'PDF Verified' : 'Unverified',
        variant: hasPdfSignature ? 'success' : 'warning',
      },
    },
    sourceGroups: [{ title: isEncoder ? 'Source PDF File' : 'Decoded PDF Stream', items: sourceItems }],
    outputGroups: [{ title: isEncoder ? 'Base64 Stream' : 'Output Document', items: outputItems }],
    notes: [
      'Note: The %PDF- header check verifies the standard PDF container signature. It acts as an initial sanity check and does not replace full structural document parsing.',
    ],
  };
}

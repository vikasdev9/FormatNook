import { DetailedFileMetadata, MetadataItem } from '../types/file-metadata.types';
import { formatFileSize } from '../utils/byte-conversion.utils';
import { formatDuration } from './audio-details.adapter';
import { formatAspectRatio } from '../services/image-detection.service';

export interface VideoAdapterParams {
  toolId: 'base64-to-video' | 'video-to-base64';
  filename: string;
  sizeBytes: number;
  mimeType: string;
  duration?: number;
  dimensions?: { width: number; height: number };
  outputSize?: number;
}

export function buildVideoDetails(params: VideoAdapterParams): DetailedFileMetadata {
  const { toolId, filename, sizeBytes, mimeType, duration, dimensions, outputSize } = params;

  const isEncoder = toolId === 'video-to-base64';
  const durationStr = formatDuration(duration);

  const sourceItems: MetadataItem[] = [
    { label: 'File Name', value: filename },
    { label: 'Video File Size', value: `${formatFileSize(sizeBytes)} (${sizeBytes.toLocaleString()} bytes)` },
    { label: 'Video Container / MIME', value: mimeType, badge: 'accent' },
  ];

  if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
    sourceItems.push({
      label: 'Video Resolution',
      value: `${dimensions.width} × ${dimensions.height} px`,
    });
    sourceItems.push({
      label: 'Aspect Ratio',
      value: formatAspectRatio(dimensions.width, dimensions.height),
    });
  }

  if (durationStr) {
    sourceItems.push({
      label: 'Video Duration',
      value: durationStr,
      hint: 'Read from HTML5 video metadata',
    });
  }

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
      formatBadge: mimeType.split('/')[1]?.toUpperCase() || 'VIDEO',
      primaryMetric: dimensions
        ? `${dimensions.width} × ${dimensions.height} px`
        : durationStr || filename,
      sizeString: formatFileSize(sizeBytes),
      statusBadge: {
        label: isEncoder ? 'Encoded' : 'Decoded',
        variant: 'success',
      },
    },
    sourceGroups: [{ title: isEncoder ? 'Source Video File' : 'Decoded Video Stream', items: sourceItems }],
    outputGroups: [{ title: isEncoder ? 'Base64 Stream' : 'Playable Video', items: outputItems }],
    notes: [
      'Preview capability depends on your browser codecs (MP4 / H.264, WebM / VP8 / VP9). Large video files consume substantial memory when Base64-encoded.',
    ],
  };
}

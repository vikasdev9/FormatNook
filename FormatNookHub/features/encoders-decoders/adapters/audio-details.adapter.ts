import { DetailedFileMetadata, MetadataItem } from '../types/file-metadata.types';
import { formatFileSize } from '../utils/byte-conversion.utils';

export interface AudioAdapterParams {
  toolId: 'base64-to-audio' | 'audio-to-base64';
  filename: string;
  sizeBytes: number;
  mimeType: string;
  duration?: number;
  outputSize?: number;
}

export function formatDuration(seconds?: number): string | undefined {
  if (seconds === undefined || !isFinite(seconds) || seconds <= 0) return undefined;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}s (${seconds.toFixed(1)}s)`;
}

export function buildAudioDetails(params: AudioAdapterParams): DetailedFileMetadata {
  const { toolId, filename, sizeBytes, mimeType, duration, outputSize } = params;

  const isEncoder = toolId === 'audio-to-base64';
  const durationStr = formatDuration(duration);

  const sourceItems: MetadataItem[] = [
    { label: 'File Name', value: filename },
    { label: 'Audio File Size', value: `${formatFileSize(sizeBytes)} (${sizeBytes.toLocaleString()} bytes)` },
    { label: 'Audio Format / MIME', value: mimeType, badge: 'accent' },
  ];

  if (durationStr) {
    sourceItems.push({
      label: 'Audio Duration',
      value: durationStr,
      hint: 'Read from HTML5 audio metadata',
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
      formatBadge: mimeType.split('/')[1]?.toUpperCase() || 'AUDIO',
      primaryMetric: durationStr || filename,
      sizeString: formatFileSize(sizeBytes),
      statusBadge: {
        label: isEncoder ? 'Encoded' : 'Decoded',
        variant: 'success',
      },
    },
    sourceGroups: [{ title: isEncoder ? 'Source Audio Track' : 'Decoded Audio Track', items: sourceItems }],
    outputGroups: [{ title: isEncoder ? 'Base64 Stream' : 'Playable Audio', items: outputItems }],
    notes: [
      'Supported formats for browser preview: MP3, WAV, OGG, AAC. Bitrate and sample rates depend on the client decoder.',
    ],
  };
}

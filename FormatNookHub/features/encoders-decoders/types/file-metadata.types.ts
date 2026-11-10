import { EncoderDecoderToolId } from './encoder-decoder.types';

export type ImageOutputFormat = 'auto' | 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

export interface ImageConversionOptions {
  format: ImageOutputFormat;
  quality: number; // 0.1 to 1.0 (default 0.92 for JPEG, 0.90 for WebP)
  backgroundColor: string; // Hex color for transparency replacement, default '#ffffff'
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface ParsedImageInfo {
  format: string;
  mimeType: string;
  dimensions?: ImageDimensions;
  bitDepth?: number;
  colorType?: string;
  isAnimated?: boolean;
  sizeBytes: number;
}

export interface ConversionResult {
  blob: Blob;
  objectUrl: string;
  mimeType: string;
  extension: string;
  suggestedFilename: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  qualityUsed?: number;
  isReencoded: boolean;
  format: ImageOutputFormat;
}

export interface MetadataItem {
  label: string;
  value: string | number;
  badge?: 'neutral' | 'accent' | 'warning' | 'success';
  hint?: string;
}

export interface MetadataGroup {
  title: string;
  items: MetadataItem[];
}

export interface DetailedFileMetadata {
  toolId: EncoderDecoderToolId;
  summary: {
    formatBadge?: string;
    primaryMetric?: string; // e.g. "1920 × 1080 px" or "1,248 chars"
    sizeString?: string;
    statusBadge?: {
      label: string;
      variant: 'success' | 'warning' | 'neutral' | 'error';
    };
  };
  sourceGroups: MetadataGroup[];
  outputGroups: MetadataGroup[];
  notes?: string[];
}

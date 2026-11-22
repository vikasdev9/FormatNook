export type ImageToolTab =
  | 'crop'
  | 'resize'
  | 'rotate'
  | 'compress'
  | 'convert'
  | 'watermark'
  | 'metadata'
  | 'colors';

export type AspectRatioPreset =
  | 'free'
  | '1:1'
  | '16:9'
  | '4:3'
  | '3:2'
  | '9:16'
  | '4:5';

export type ImageOutputFormat =
  | 'auto'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/avif'
  | 'image/gif';

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropSettings {
  enabled: boolean;
  rect: CropRect;
  aspectPreset: AspectRatioPreset;
}

export interface ResizeSettings {
  enabled: boolean;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  scalePercent: number;
  algorithm: 'high' | 'medium' | 'low';
}

export interface OrientationSettings {
  rotateAngle: number; // in degrees (-180 to 180 or 0, 90, 180, 270)
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: WatermarkPosition;
  padding: number;
  imageBlob?: Blob;
  imageUrl?: string;
  imageScale: number;
}

export interface ExportSettings {
  format: ImageOutputFormat;
  quality: number; // 0.1 to 1.0
  backgroundColor: string; // for filling transparent backgrounds when exporting to JPEG
  stripMetadata: boolean;
}

export interface PipelineSettings {
  crop: CropSettings;
  resize: ResizeSettings;
  orientation: OrientationSettings;
  watermark: WatermarkSettings;
  export: ExportSettings;
}

export interface ImageExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: string;
  focalLength?: string;
  software?: string;
  [key: string]: string | undefined;
}

export interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  mimeType: string;
  originalUrl: string;
  width: number;
  height: number;
  aspectRatio: string;
  exif?: ImageExifData;
}

export type BatchItemStatus = 'idle' | 'processing' | 'done' | 'error' | 'cancelled';

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  width: number;
  height: number;
  status: BatchItemStatus;
  progress?: number;
  outputBlob?: Blob;
  outputUrl?: string;
  outputSize?: number;
  error?: string;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inFlight: number;
  percent: number;
  etaSeconds: number | null;
}

export interface ColorSample {
  hex: string;
  rgb: string;
  hsl: string;
}

export interface PipelineRenderResult {
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface WorkerTaskRequest {
  taskId: string;
  fileBuffer: ArrayBuffer;
  settings: PipelineSettings;
  originalMime: string;
  width?: number;
  height?: number;
}

export interface WorkerTaskResponse {
  taskId: string;
  status: 'success' | 'error';
  outputBuffer?: ArrayBuffer;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  error?: string;
}

export interface MemoryBudget {
  isMobile: boolean;
  maxTaskMemoryBytes: number;
  maxBatchMemoryBytes: number;
  concurrency: number;
  estimatedBatchBytes: number;
}

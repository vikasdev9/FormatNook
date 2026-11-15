export interface GeneratedShareItem {
  content: string | Blob;
  fileName: string;
  mimeType: string;
  isBinary?: boolean;
  textForClipboard?: string;
}

export interface ShareFormatOption {
  id: string;
  label: string;
  description: string;
  extension: string;
  mimeType: string;
  badge?: string;
  estimatedSize?: string;
  generate: () => Promise<GeneratedShareItem> | GeneratedShareItem;
}

export interface SharePayload {
  toolTitle: string;
  defaultFileName: string;
  options: ShareFormatOption[];
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface ShareActionResult {
  action: 'web-share' | 'download' | 'copy';
  success: boolean;
  cancelled?: boolean;
  message?: string;
  error?: string;
}

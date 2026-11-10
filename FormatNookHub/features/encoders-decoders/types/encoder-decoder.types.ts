import { ValidationIssue } from '@/types/tool';

export type EncoderDecoderToolId =
  | 'base64-to-text'
  | 'text-to-base64'
  | 'base64-to-image'
  | 'image-to-base64'
  | 'base64-to-file'
  | 'file-to-base64'
  | 'base64-to-hex'
  | 'hex-to-base64'
  | 'base64-to-audio'
  | 'audio-to-base64'
  | 'base64-to-video'
  | 'video-to-base64'
  | 'base64-to-pdf'
  | 'pdf-to-base64'
  | 'basic-auth-decoder'
  | 'html-to-base64'
  | 'css-to-base64'
  | 'url-to-base64';

export type ToolDirection = 'encode' | 'decode';

export interface FileMetadataInfo {
  name: string;
  size: number;
  mimeType: string;
  extension?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  lastModified?: number;
}

export interface EncodingResult {
  output: string;
  dataUri?: string;
  blob?: Blob;
  outputSize: number;
  inputSize: number;
  mimeType?: string;
  isValid: boolean;
  issues: ValidationIssue[];
  isTruncatedForDisplay?: boolean;
  displayOutput?: string;
  rawBytes?: Uint8Array;
}

export interface BasicAuthCredentials {
  username: string;
  password?: string;
  hasPassword: boolean;
  rawHeader: string;
  base64Token: string;
  isValid: boolean;
  error?: string;
}

export interface HexFormatOptions {
  uppercase: boolean;
  grouping: 'none' | 'space' | 'colon' | 'hyphen';
}

export interface Base64Options {
  urlSafe?: boolean;
  wrapLines?: boolean;
  lineLength?: number;
}

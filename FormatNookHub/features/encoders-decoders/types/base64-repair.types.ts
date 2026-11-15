export type Base64InputFormat =
  | 'plain_base64'
  | 'data_uri'
  | 'json_object'
  | 'json_string'
  | 'escaped_json'
  | 'key_value'
  | 'url_safe'
  | 'embedded_text'
  | 'empty';

export type RepairConfidence = 'high' | 'medium' | 'low' | 'none';

export type CandidateSourceType =
  | 'plain_base64'
  | 'data_uri'
  | 'json_field'
  | 'key_value'
  | 'text_embedded';

export interface Base64RepairCandidate {
  id: string;
  sourceType: CandidateSourceType;
  propertyName?: string;
  sourceLocation?: string;
  declaredMimeType?: string;
  rawPayload: string;
  normalizedPayload: string;
  repairedPayload: string;
  isBase64Valid: boolean;
  isImageValid: boolean;
  isDecodable: boolean;
  detectedMimeType: string | null;
  detectedFormat: string | null;
  imageDimensions?: { width: number; height: number; aspectRatio?: string };
  decodedByteLength: number;
  confidence: RepairConfidence;
  transformations: string[];
  warnings: string[];
  errors: string[];
  removedCharCount: number;
  removedCharsDetails?: { char: string; count: number }[];
}

export interface Base64RepairOptions {
  mode: 'safe' | 'advanced';
  stripDataUriPrefix: boolean;
  removeWhitespace: boolean;
  removeBom: boolean;
  convertUrlSafeToStandard: boolean;
  convertStandardToUrlSafe: boolean;
  fixPadding: boolean;
  stripInvalidChars: boolean; // only active in advanced mode
  lineWrap: 'none' | '64' | '76';
}

export const DEFAULT_REPAIR_OPTIONS: Base64RepairOptions = {
  mode: 'safe',
  stripDataUriPrefix: true,
  removeWhitespace: true,
  removeBom: true,
  convertUrlSafeToStandard: false,
  convertStandardToUrlSafe: false,
  fixPadding: true,
  stripInvalidChars: false,
  lineWrap: 'none',
};

export interface Base64RepairResult {
  originalInput: string;
  inputFormat: Base64InputFormat;
  selectedCandidateId: string | null;
  repairedOutput: string; // for backward compatibility with existing views & tests
  repairedPayload: string | null;
  detectedFormat: string | null;
  detectedMimeType: string | null;
  decodedByteLength: number;
  imageDimensions?: { width: number; height: number; aspectRatio?: string };
  isBase64Valid: boolean;
  isImageValid: boolean;
  isSuccessfullyDecodable: boolean; // for backward compatibility
  isRecoverable: boolean;
  confidence: RepairConfidence;
  extractedCandidates: Base64RepairCandidate[];
  transformations: string[];
  warnings: string[];
  errors: string[];
  originalLength: number;
  repairedLength: number;
  removedCharCount: number;
  removedCharsDetails?: { char: string; count: number }[];
}

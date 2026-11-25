export interface JwtHeader {
  alg?: string;
  typ?: string;
  kid?: string;
  cty?: string;
  crit?: string[];
  jku?: string;
  jwk?: unknown;
  x5u?: string;
  x5c?: string[];
  [key: string]: unknown;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface JwtTimestampAnalysis {
  claim: 'exp' | 'iat' | 'nbf';
  label: string;
  rawSeconds: number | null;
  dateLocal: string | null;
  dateUtc: string | null;
  status: 'active' | 'expired' | 'future' | 'missing' | 'invalid';
  message: string;
}

export interface JwtSegmentDetail {
  headerRaw: string;
  payloadRaw: string;
  signatureRaw: string;
  segmentCount: number;
}

export interface JwtDecodeResult {
  isValid: boolean;
  raw: string;
  segments: JwtSegmentDetail;
  header: JwtHeader | null;
  headerJson: string;
  payload: JwtPayload | null;
  payloadJson: string;
  signature: string;
  isUnsigned: boolean;
  isExpired: boolean;
  isNotYetValid: boolean;
  timeRemaining: string | null;
  timestamps: JwtTimestampAnalysis[];
  errors: string[];
}

export type JwtTabType =
  | 'overview'
  | 'header'
  | 'payload'
  | 'expiry'
  | 'signature'
  | 'reference'
  | 'converter'
  | 'cleaner';

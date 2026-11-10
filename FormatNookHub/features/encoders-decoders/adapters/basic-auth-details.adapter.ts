import { DetailedFileMetadata, MetadataItem } from '../types/file-metadata.types';

export interface BasicAuthAdapterParams {
  isValid: boolean;
  hasAuthorizationPrefix: boolean;
  tokenLength: number;
  hasPasswordDefined: boolean;
}

export function buildBasicAuthDetails(params: BasicAuthAdapterParams): DetailedFileMetadata {
  const { isValid, hasAuthorizationPrefix, tokenLength, hasPasswordDefined } = params;

  // STRICT PRIVACY: NEVER output the username, password, or base64 token string in metadata!
  const processingItems: MetadataItem[] = [
    {
      label: 'Security & Privacy Level',
      value: '100% Client-Side In-Memory Isolation',
      badge: 'success',
      hint: 'No network calls, zero analytics, zero local persistence',
    },
    {
      label: 'Header Format',
      value: hasAuthorizationPrefix ? 'Standard HTTP Basic Authorization Header' : 'Raw Base64 Credential Pair',
    },
    {
      label: 'Token Character Length',
      value: `${tokenLength} characters`,
    },
    {
      label: 'Password Component',
      value: hasPasswordDefined ? 'Present (Hidden by Default)' : 'Empty / None',
      badge: hasPasswordDefined ? 'neutral' : 'warning',
    },
    {
      label: 'Character Encoding',
      value: 'UTF-8 String Parsing',
    },
  ];

  return {
    toolId: 'basic-auth-decoder',
    summary: {
      formatBadge: 'BASIC AUTH',
      primaryMetric: isValid ? 'Valid Format' : 'Invalid Format',
      statusBadge: {
        label: isValid ? 'Decoded Securely' : 'Awaiting Input',
        variant: isValid ? 'success' : 'neutral',
      },
    },
    sourceGroups: [{ title: 'Zero-Knowledge Security Inspection', items: processingItems }],
    outputGroups: [],
    notes: [
      'Security Guarantee: Decoded credentials are held exclusively in volatile component memory and are completely wiped upon clearing or navigating away. They are never written to disk, cookies, or localStorage.',
    ],
  };
}

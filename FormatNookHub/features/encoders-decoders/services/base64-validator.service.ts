export interface Base64ValidationError {
  code: string;
  message: string;
  position?: number;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface Base64ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface Base64ValidationResult {
  isValid: boolean;
  variant: 'standard' | 'url-safe' | 'mixed' | 'empty';
  paddingStatus: 'correct' | 'missing' | 'malformed' | 'unpadded-url-safe' | 'none';
  hasDataUriPrefix: boolean;
  dataUriMime?: string;
  hasWhitespace: boolean;
  hasLineBreaks: boolean;
  rawLength: number;
  cleanLength: number;
  estimatedDecodedBytes: number;
  errors: Base64ValidationError[];
  warnings: Base64ValidationWarning[];
  suggestions: string[];
}

/**
 * Validates a Base64 string according to RFC 4648 standards with precise character position diagnosis.
 */
export function validateBase64(input: string): Base64ValidationResult {
  const rawLength = input.length;
  const errors: Base64ValidationError[] = [];
  const warnings: Base64ValidationWarning[] = [];
  const suggestions: string[] = [];

  if (!input || input.trim().length === 0) {
    return {
      isValid: false,
      variant: 'empty',
      paddingStatus: 'none',
      hasDataUriPrefix: false,
      hasWhitespace: false,
      hasLineBreaks: false,
      rawLength: 0,
      cleanLength: 0,
      estimatedDecodedBytes: 0,
      errors: [{ code: 'EMPTY_INPUT', message: 'Input is empty. Please paste a Base64 payload.' }],
      warnings: [],
      suggestions: ['Paste or upload a Base64 string to analyze.'],
    };
  }

  // 1. Data URI prefix check
  let processed = input;
  let hasDataUriPrefix = false;
  let dataUriMime: string | undefined;

  const dataUriMatch = input.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,/i);
  if (dataUriMatch) {
    hasDataUriPrefix = true;
    dataUriMime = dataUriMatch[1] || 'application/octet-stream';
    if (!dataUriMatch[2]) {
      warnings.push({
        code: 'DATA_URI_NOT_BASE64',
        message: 'Data URI header is missing the ";base64" indicator. It may be percent-encoded rather than Base64.',
        suggestion: 'Verify if the payload is raw text or URL percent-encoded.',
      });
    }
    processed = input.slice(dataUriMatch[0].length);
  }

  // 2. Whitespace check
  const hasLineBreaks = /[\r\n]/.test(processed);
  const hasWhitespace = /\s/.test(processed);
  if (hasLineBreaks) {
    warnings.push({
      code: 'HAS_LINE_BREAKS',
      message: 'Input contains line breaks (common in MIME/PEM formatting).',
      suggestion: 'You can normalize this string by stripping line breaks.',
    });
  } else if (hasWhitespace) {
    warnings.push({
      code: 'HAS_WHITESPACE',
      message: 'Input contains whitespace characters.',
      suggestion: 'Remove whitespace for compact Base64 transmission.',
    });
  }

  // Calculate line/col map for error reporting
  const lines = input.split('\n');
  const getLineAndCol = (index: number): { line: number; column: number } => {
    let charCount = 0;
    for (let l = 0; l < lines.length; l++) {
      const lineLen = lines[l].length + 1; // +1 for \n
      if (charCount + lineLen > index) {
        return { line: l + 1, column: index - charCount + 1 };
      }
      charCount += lineLen;
    }
    return { line: 1, column: index + 1 };
  };

  // Strip whitespace for core character check
  const cleanPayload = processed.replace(/\s+/g, '');

  // 3. Variant detection: Standard (+, /) vs URL-Safe (-, _)
  const hasStandardChars = cleanPayload.includes('+') || cleanPayload.includes('/');
  const hasUrlSafeChars = cleanPayload.includes('-') || cleanPayload.includes('_');

  let variant: 'standard' | 'url-safe' | 'mixed' | 'empty' = 'standard';
  if (hasStandardChars && hasUrlSafeChars) {
    variant = 'mixed';
    errors.push({
      code: 'MIXED_BASE64_VARIANTS',
      message: 'String mixes both Standard characters (+, /) and URL-safe characters (-, _). Base64 strings must adhere to a single alphabet standard.',
      suggestion: 'Use the Repair tool to convert all characters to either Standard or URL-Safe Base64.',
    });
  } else if (hasUrlSafeChars) {
    variant = 'url-safe';
  } else if (hasStandardChars) {
    variant = 'standard';
  }

  // 4. Character-by-character illegal character scan using immutable charsets
  const STANDARD_SET = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=');
  const URL_SAFE_SET = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=');
  const activeCharSet = variant === 'url-safe' ? URL_SAFE_SET : STANDARD_SET;

  let firstIllegalCharPos: number | null = null;
  let illegalCharCount = 0;

  for (let i = 0; i < cleanPayload.length; i++) {
    const char = cleanPayload[i];
    if (!activeCharSet.has(char)) {
      illegalCharCount++;
      if (firstIllegalCharPos === null) {
        firstIllegalCharPos = i;
        const { line, column } = getLineAndCol(i);
        errors.push({
          code: 'ILLEGAL_CHARACTER',
          message: `Illegal Base64 character '${char}' detected at position ${i} (Line ${line}, Col ${column}).`,
          position: i,
          line,
          column,
          suggestion: `Remove or fix invalid character '${char}'.`,
        });
      }
    }
  }

  if (illegalCharCount > 1) {
    errors.push({
      code: 'MULTIPLE_ILLEGAL_CHARACTERS',
      message: `Total of ${illegalCharCount} illegal characters found in the payload.`,
      suggestion: 'Clean the input using Base64 Repair to filter out foreign characters.',
    });
  }

  // 5. Padding & Length Validation
  let paddingStatus: 'correct' | 'missing' | 'malformed' | 'unpadded-url-safe' | 'none' = 'correct';
  const paddingIndex = cleanPayload.indexOf('=');

  let padCount = 0;
  if (paddingIndex !== -1) {
    const paddingSubstr = cleanPayload.slice(paddingIndex);
    padCount = paddingSubstr.length;

    // Check if there are non-padding characters after '='
    if (!/^=+$/.test(paddingSubstr)) {
      paddingStatus = 'malformed';
      errors.push({
        code: 'CHARACTERS_AFTER_PADDING',
        message: 'Invalid characters found after padding character "=". Padding must only appear at the very end of the string.',
        position: paddingIndex,
        suggestion: 'Ensure "=" only occurs at the end of the Base64 payload.',
      });
    } else if (padCount > 2) {
      paddingStatus = 'malformed';
      errors.push({
        code: 'EXCESS_PADDING',
        message: `Found ${padCount} padding characters. Valid Base64 never has more than 2 padding characters ("=" or "==").`,
        position: paddingIndex,
        suggestion: 'Reduce padding to at most two "=" characters.',
      });
    }
  }

  // Check modulo 4 length rules
  const unpaddedLength = paddingIndex !== -1 ? paddingIndex : cleanPayload.length;
  const remainder = unpaddedLength % 4;

  if (remainder === 1) {
    paddingStatus = 'malformed';
    errors.push({
      code: 'INVALID_MODULO_LENGTH',
      message: 'Unpadded length modulo 4 equals 1 (a single 6-bit Base64 character cannot form a whole 8-bit byte). The payload is truncated or corrupted.',
      suggestion: 'Verify the original source of this Base64 payload; one or more characters have been cut off.',
    });
  } else if (remainder === 2) {
    // Requires 2 padding '='
    if (padCount === 0) {
      if (variant === 'url-safe') {
        paddingStatus = 'unpadded-url-safe';
        warnings.push({
          code: 'UNPADDED_URL_SAFE',
          message: 'Payload omits padding (standard practice in URL-safe Base64 and JWT).',
          suggestion: 'Can be padded with "==" for strict RFC 4648 decoders.',
        });
      } else {
        paddingStatus = 'missing';
        errors.push({
          code: 'MISSING_PADDING',
          message: 'Payload is missing 2 required padding characters ("==").',
          suggestion: 'Append "==" to the end of the string.',
        });
      }
    } else if (padCount !== 2) {
      paddingStatus = 'malformed';
      errors.push({
        code: 'INCORRECT_PADDING_COUNT',
        message: `Expected exactly 2 padding "=" characters for length remainder 2, but found ${padCount}.`,
      });
    }
  } else if (remainder === 3) {
    // Requires 1 padding '='
    if (padCount === 0) {
      if (variant === 'url-safe') {
        paddingStatus = 'unpadded-url-safe';
        warnings.push({
          code: 'UNPADDED_URL_SAFE',
          message: 'Payload omits padding (standard in URL-safe Base64).',
          suggestion: 'Can be padded with "=" for strict RFC 4648 decoders.',
        });
      } else {
        paddingStatus = 'missing';
        errors.push({
          code: 'MISSING_PADDING',
          message: 'Payload is missing 1 required padding character ("=").',
          suggestion: 'Append "=" to the end of the string.',
        });
      }
    } else if (padCount !== 1) {
      paddingStatus = 'malformed';
      errors.push({
        code: 'INCORRECT_PADDING_COUNT',
        message: `Expected exactly 1 padding "=" character for length remainder 3, but found ${padCount}.`,
      });
    }
  } else if (remainder === 0 && padCount > 0) {
    paddingStatus = 'malformed';
    errors.push({
      code: 'UNEXPECTED_PADDING',
      message: 'Payload unpadded length is a multiple of 4, but trailing "=" padding was attached.',
      suggestion: 'Remove redundant "=" padding characters.',
    });
  }

  // Estimated Decoded Size calculation
  const totalBase64Units = Math.ceil(unpaddedLength / 4) * 4;
  let estimatedDecodedBytes = Math.floor((unpaddedLength * 3) / 4);
  if (remainder === 2) {
    estimatedDecodedBytes = Math.floor((unpaddedLength - 2) / 4) * 3 + 1;
  } else if (remainder === 3) {
    estimatedDecodedBytes = Math.floor((unpaddedLength - 3) / 4) * 3 + 2;
  }

  // Compile helpful suggestions
  if (errors.length === 0) {
    suggestions.push('Payload syntax is 100% valid RFC 4648 Base64.');
    if (variant === 'url-safe') {
      suggestions.push('Payload is URL-safe and ready for query parameters and JWT tokens.');
    }
  } else {
    suggestions.push('Use the Base64 Repair tool to automatically resolve identified syntax errors.');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    variant,
    paddingStatus,
    hasDataUriPrefix,
    dataUriMime,
    hasWhitespace,
    hasLineBreaks,
    rawLength,
    cleanLength: cleanPayload.length,
    estimatedDecodedBytes: Math.max(0, estimatedDecodedBytes),
    errors,
    warnings,
    suggestions,
  };
}

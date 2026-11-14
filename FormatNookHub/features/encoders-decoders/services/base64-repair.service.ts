export interface Base64RepairOptions {
  stripDataUriPrefix: boolean;
  removeWhitespace: boolean;
  removeBom: boolean;
  convertUrlSafeToStandard: boolean;
  convertStandardToUrlSafe: boolean;
  fixPadding: boolean;
  stripInvalidChars: boolean;
  lineWrap: 'none' | '64' | '76';
}

export const DEFAULT_REPAIR_OPTIONS: Base64RepairOptions = {
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
  repairedOutput: string;
  transformations: string[];
  warnings: string[];
  isSuccessfullyDecodable: boolean;
  originalLength: number;
  repairedLength: number;
  removedCharCount: number;
}

/**
 * Safely repairs and normalizes a Base64 string without silently discarding data.
 */
export function repairBase64(input: string, options: Partial<Base64RepairOptions> = {}): Base64RepairResult {
  const opts: Base64RepairOptions = { ...DEFAULT_REPAIR_OPTIONS, ...options };
  const transformations: string[] = [];
  const warnings: string[] = [];
  let current = input || '';
  const originalLength = current.length;

  if (!current.trim()) {
    return {
      originalInput: input,
      repairedOutput: '',
      transformations: [],
      warnings: ['Input is empty.'],
      isSuccessfullyDecodable: false,
      originalLength: 0,
      repairedLength: 0,
      removedCharCount: 0,
    };
  }

  // 1. Remove UTF-8 Byte Order Mark (BOM: \uFEFF or \uFFFE)
  if (opts.removeBom && /[\uFEFF\uFFFE]/.test(current)) {
    current = current.replace(/[\uFEFF\uFFFE]/g, '');
    transformations.push('Removed UTF-8 Byte Order Mark (BOM)');
  }

  // 2. Strip Data URI prefix
  if (opts.stripDataUriPrefix) {
    const dataUriRegex = /^data:[^;,]+(?:;charset=[^;,]+)?(?:;base64)?,/i;
    if (dataUriRegex.test(current)) {
      current = current.replace(dataUriRegex, '');
      transformations.push('Stripped Data URI prefix header');
    }
  }

  // 3. Remove whitespace and Unicode space characters
  if (opts.removeWhitespace) {
    const prevLen = current.length;
    // Strip standard whitespace and Unicode spaces (\u00A0, \u2000-\u200B, \u3000, etc.)
    current = current.replace(/[\s\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]+/g, '');
    if (current.length !== prevLen) {
      transformations.push(`Removed ${prevLen - current.length} whitespace / newline character(s)`);
    }
  }

  // 4. URL-safe to Standard or vice-versa
  if (opts.convertUrlSafeToStandard) {
    if (/[-_]/.test(current)) {
      current = current.replace(/-/g, '+').replace(/_/g, '/');
      transformations.push('Converted URL-Safe characters (- and _) to Standard RFC 4648 (+ and /)');
    }
  } else if (opts.convertStandardToUrlSafe) {
    if (/[+/]/.test(current)) {
      current = current.replace(/\+/g, '-').replace(/\//g, '_');
      transformations.push('Converted Standard characters (+ and /) to URL-Safe (- and _)');
    }
  }

  // 5. Strip invalid non-Base64 characters (only if explicitly enabled)
  let removedChars = 0;
  if (opts.stripInvalidChars) {
    const validPattern = opts.convertStandardToUrlSafe ? /[^A-Za-z0-9\-_=]/g : /[^A-Za-z0-9+/=]/g;
    const matchInvalid = current.match(validPattern);
    if (matchInvalid && matchInvalid.length > 0) {
      removedChars = matchInvalid.length;
      current = current.replace(validPattern, '');
      transformations.push(`Stripped ${removedChars} invalid / non-alphabet character(s)`);
      warnings.push(`Warning: ${removedChars} foreign character(s) were removed from the payload.`);
    }
  } else {
    // Check if invalid characters remain
    const testPattern = /[^A-Za-z0-9+/=\-_]/;
    if (testPattern.test(current)) {
      warnings.push('Input still contains invalid non-Base64 characters. Enable "Strip Invalid Characters" to discard them.');
    }
  }

  // 6. Padding repair
  if (opts.fixPadding) {
    // Remove mispositioned padding or excess padding first
    const firstEquals = current.indexOf('=');
    if (firstEquals !== -1) {
      // Check if there are characters after '='
      const trailing = current.slice(firstEquals);
      if (!/^=+$/.test(trailing) || trailing.length > 2) {
        current = current.replace(/=+$/, '');
        transformations.push('Cleaned malformed trailing padding');
      }
    }

    const unpadded = current.replace(/=+$/, '');
    const remainder = unpadded.length % 4;

    if (remainder === 1) {
      warnings.push('Cannot mathematically pad length remainder 1 (truncated data). One or more characters are missing.');
    } else if (remainder === 2) {
      current = unpadded + '==';
      transformations.push('Appended missing "==" padding for modulo 4 alignment');
    } else if (remainder === 3) {
      current = unpadded + '=';
      transformations.push('Appended missing "=" padding for modulo 4 alignment');
    }
  }

  // 7. Line wrapping (if requested)
  if (opts.lineWrap === '64' || opts.lineWrap === '76') {
    const wrapWidth = parseInt(opts.lineWrap, 10);
    const unpaddedForWrap = current.replace(/\s+/g, '');
    const lines: string[] = [];
    for (let i = 0; i < unpaddedForWrap.length; i += wrapWidth) {
      lines.push(unpaddedForWrap.slice(i, i + wrapWidth));
    }
    current = lines.join('\n');
    transformations.push(`Applied ${wrapWidth}-character line wrapping`);
  }

  // Check if now decodable
  let isSuccessfullyDecodable = false;
  try {
    const testClean = current.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    let padded = testClean;
    while (padded.length % 4 !== 0) padded += '=';
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(padded)) {
      atob(padded);
      isSuccessfullyDecodable = true;
    }
  } catch {
    isSuccessfullyDecodable = false;
  }

  return {
    originalInput: input,
    repairedOutput: current,
    transformations,
    warnings,
    isSuccessfullyDecodable,
    originalLength,
    repairedLength: current.length,
    removedCharCount: removedChars,
  };
}


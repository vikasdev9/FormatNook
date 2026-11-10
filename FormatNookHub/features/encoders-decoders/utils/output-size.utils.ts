export const DISPLAY_PREVIEW_LIMIT = 50 * 1024; // 50 KB text preview limit
export const LARGE_OUTPUT_THRESHOLD = 150 * 1024; // 150 KB warning threshold

/**
 * Calculates theoretical Base64 expansion (+33%)
 */
export function calculateBase64Expansion(inputBytes: number): {
  base64Bytes: number;
  expansionRatio: number;
  percentIncrease: number;
} {
  const base64Bytes = Math.ceil((inputBytes * 4) / 3);
  const percentIncrease = inputBytes > 0 ? Math.round(((base64Bytes - inputBytes) / inputBytes) * 100) : 33;
  return {
    base64Bytes,
    expansionRatio: 1.33,
    percentIncrease,
  };
}

/**
 * Determines if text length exceeds safe DOM editor rendering limits
 */
export function isLargeOutput(sizeInBytes: number, threshold = LARGE_OUTPUT_THRESHOLD): boolean {
  return sizeInBytes > threshold;
}

/**
 * Truncates text safely for preview display while preserving browser responsiveness
 */
export function truncateForDisplay(text: string, maxChars = DISPLAY_PREVIEW_LIMIT): {
  displayText: string;
  isTruncated: boolean;
  totalLength: number;
} {
  if (text.length <= maxChars) {
    return { displayText: text, isTruncated: false, totalLength: text.length };
  }

  return {
    displayText: text.slice(0, maxChars) + '\n\n... [Output truncated for browser performance. Use "Download" for the complete payload] ...',
    isTruncated: true,
    totalLength: text.length,
  };
}

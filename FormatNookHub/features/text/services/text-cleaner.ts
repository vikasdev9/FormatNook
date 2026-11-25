/**
 * Text Cleaner and Formatter transformations.
 * Pure functions that preserve the original string until explicitly applied.
 */

export function trimWhitespace(text: string): string {
  if (!text) return '';
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

export function removeExtraSpaces(text: string): string {
  if (!text) return '';
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/[^\S\r\n]+/g, ' ').trim())
    .join('\n');
}

export function removeDuplicateLines(text: string): string {
  if (!text) return '';
  const lines = text.split(/\r\n|\r|\n/);
  const seen = new Set<string>();
  const uniqueLines: string[] = [];

  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      uniqueLines.push(line);
    }
  }

  return uniqueLines.join('\n');
}

export function removeEmptyLines(text: string): string {
  if (!text) return '';
  return text
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

export function normalizeLineBreaks(text: string): string {
  if (!text) return '';
  return text.replace(/\r\n|\r/g, '\n');
}

export function toUpperCase(text: string): string {
  return text ? text.toUpperCase() : '';
}

export function toLowerCase(text: string): string {
  return text ? text.toLowerCase() : '';
}

export function toTitleCase(text: string): string {
  if (!text) return '';

  const minorWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'
  ]);

  return text.replace(/[\p{L}\p{N}]+/gu, (word, offset) => {
    const lower = word.toLowerCase();
    // Capitalize if it's the first word or not a minor word
    if (offset === 0 || !minorWords.has(lower)) {
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }
    return lower;
  });
}

export function toSentenceCase(text: string): string {
  if (!text) return '';

  // Match sentences starting after [.!?…\n] or start of string
  return text.toLowerCase().replace(/(^\s*|[.!?…\n]\s*)([\p{Ll}])/gu, (_, prefix, char) => {
    return prefix + char.toUpperCase();
  });
}

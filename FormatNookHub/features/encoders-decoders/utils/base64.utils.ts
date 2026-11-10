/**
 * Strips whitespace, Data URI prefixes, and newlines from a raw or Data URI Base64 string.
 */
export function cleanBase64(input: string): string {
  if (!input) return '';
  return input
    .replace(/^data:[^;]+;base64,/, '')
    .replace(/\s+/g, '');
}

/**
 * Checks if a string uses URL-safe Base64 alphabet (- and _)
 */
export function isUrlSafeBase64(input: string): boolean {
  return /[-_]/.test(input) && !/[+/]/.test(input);
}

/**
 * Converts standard Base64 (+ and /) to URL-safe Base64 (- and _)
 */
export function toUrlSafeBase64(input: string, stripPadding = true): string {
  let res = input.replace(/\+/g, '-').replace(/\//g, '_');
  if (stripPadding) {
    res = res.replace(/=+$/, '');
  }
  return res;
}

/**
 * Converts URL-safe Base64 (- and _) back to standard Base64 (+ and /) with padding
 */
export function fromUrlSafeBase64(input: string): string {
  let res = input.replace(/-/g, '+').replace(/_/g, '/');
  while (res.length % 4 !== 0) {
    res += '=';
  }
  return res;
}

/**
 * Ensures a Base64 string has the correct length divisible by 4 with '=' padding
 */
export function padBase64(input: string): string {
  let res = input;
  while (res.length % 4 !== 0) {
    res += '=';
  }
  return res;
}

export function sanitizeFilename(
  name: string,
  defaultName = 'output-file',
  forceExtension?: string
): string {
  let clean = (name || '').trim();

  // Strip directory paths and path traversal sequences
  const segments = clean.split(/[/\\]+/).filter(Boolean);
  clean = segments.pop() || '';

  // Clean illegal filename characters
  clean = clean.replace(/[?%*:|"<>]/g, '-').replace(/^\.+/, '');

  if (!clean) {
    clean = defaultName;
  }

  if (forceExtension) {
    const ext = forceExtension.startsWith('.') ? forceExtension : `.${forceExtension}`;
    if (!clean.toLowerCase().endsWith(ext.toLowerCase())) {
      clean += ext;
    }
  }

  return clean;
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/aac': '.aac',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
    'text/html': '.html',
    'text/css': '.css',
    'text/plain': '.txt',
    'application/json': '.json',
    'application/xml': '.xml',
    'application/zip': '.zip',
    'application/octet-stream': '.bin',
  };

  return map[mimeType.toLowerCase()] || '.bin';
}

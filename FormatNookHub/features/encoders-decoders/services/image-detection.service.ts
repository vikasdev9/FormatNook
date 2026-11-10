import { ParsedImageInfo, ImageDimensions } from '../types/file-metadata.types';

/**
 * Calculates Greatest Common Divisor for aspect ratio formatting
 */
export function calculateGcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Computes human-friendly aspect ratio (e.g. "16:9", "4:3", "1:1", or decimal ratio)
 */
export function formatAspectRatio(width: number, height: number): string {
  if (!width || !height || width <= 0 || height <= 0) return 'Unknown';
  const gcd = calculateGcd(width, height);
  const rw = width / gcd;
  const rh = height / gcd;

  // Well known ratios
  if (rw <= 32 && rh <= 32) {
    return `${rw}:${rh}`;
  }

  // Decimal approximation
  const ratio = (width / height).toFixed(2);
  return `${ratio}:1`;
}

/**
 * Parses image binary bytes to extract real dimensions, bit depth, and format
 */
export function parseImageBytes(bytes: Uint8Array): ParsedImageInfo | null {
  if (!bytes || bytes.length < 8) return null;

  // 1. PNG parser
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    if (bytes.length >= 26) {
      const width =
        ((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0;
      const height =
        ((bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]) >>> 0;
      const bitDepth = bytes[24];
      const colorTypeCode = bytes[25];

      const colorTypes: Record<number, string> = {
        0: 'Grayscale',
        2: 'RGB (Truecolor)',
        3: 'Indexed Color',
        4: 'Grayscale with Alpha',
        6: 'RGBA (Truecolor with Alpha)',
      };

      return {
        format: 'PNG',
        mimeType: 'image/png',
        dimensions: {
          width,
          height,
          aspectRatio: formatAspectRatio(width, height),
        },
        bitDepth,
        colorType: colorTypes[colorTypeCode] || `Type ${colorTypeCode}`,
        sizeBytes: bytes.length,
      };
    }
  }

  // 2. GIF parser
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    if (bytes.length >= 10) {
      const width = bytes[6] | (bytes[7] << 8);
      const height = bytes[8] | (bytes[9] << 8);
      const version = `GIF8${String.fromCharCode(bytes[4])}a`;

      return {
        format: version,
        mimeType: 'image/gif',
        dimensions: {
          width,
          height,
          aspectRatio: formatAspectRatio(width, height),
        },
        bitDepth: 8,
        colorType: 'Indexed (256 Colors)',
        sizeBytes: bytes.length,
      };
    }
  }

  // 3. JPEG parser
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    let offset = 2;
    while (offset < bytes.length - 8) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = bytes[offset + 1];
      // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2) contain dimensions
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const bitDepth = bytes[offset + 4];
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];

        return {
          format: 'JPEG',
          mimeType: 'image/jpeg',
          dimensions: {
            width,
            height,
            aspectRatio: formatAspectRatio(width, height),
          },
          bitDepth,
          colorType: 'YUV / 24-bit Truecolor',
          sizeBytes: bytes.length,
        };
      }

      // Standalone markers or markers without length
      if (
        marker === 0xd8 ||
        marker === 0xd9 ||
        (marker >= 0xd0 && marker <= 0xd7) ||
        marker === 0x01
      ) {
        offset += 2;
      } else {
        const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
        if (length < 2) break; // Corrupt marker segment
        offset += 2 + length;
      }
    }

    return {
      format: 'JPEG',
      mimeType: 'image/jpeg',
      colorType: 'YUV / 24-bit Truecolor',
      sizeBytes: bytes.length,
    };
  }

  // 4. WebP parser
  if (
    bytes.length >= 16 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50 // WEBP
  ) {
    const chunkFourCC = String.fromCharCode(
      bytes[12],
      bytes[13],
      bytes[14],
      bytes[15]
    );

    // VP8 lossy
    if (chunkFourCC === 'VP8 ' && bytes.length >= 30) {
      const width = ((bytes[26] | (bytes[27] << 8)) & 0x3fff);
      const height = ((bytes[28] | (bytes[29] << 8)) & 0x3fff);
      return {
        format: 'WebP (Lossy)',
        mimeType: 'image/webp',
        dimensions: {
          width,
          height,
          aspectRatio: formatAspectRatio(width, height),
        },
        bitDepth: 8,
        colorType: 'YUV420',
        sizeBytes: bytes.length,
      };
    }

    // VP8L lossless
    if (chunkFourCC === 'VP8L' && bytes.length >= 25) {
      const b0 = bytes[21];
      const b1 = bytes[22];
      const b2 = bytes[23];
      const b3 = bytes[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + ((((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)));
      return {
        format: 'WebP (Lossless)',
        mimeType: 'image/webp',
        dimensions: {
          width,
          height,
          aspectRatio: formatAspectRatio(width, height),
        },
        bitDepth: 8,
        colorType: 'RGBA',
        sizeBytes: bytes.length,
      };
    }

    // VP8X extended
    if (chunkFourCC === 'VP8X' && bytes.length >= 30) {
      const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
      return {
        format: 'WebP (Extended)',
        mimeType: 'image/webp',
        dimensions: {
          width,
          height,
          aspectRatio: formatAspectRatio(width, height),
        },
        bitDepth: 8,
        colorType: 'Extended / RGBA',
        sizeBytes: bytes.length,
      };
    }

    return {
      format: 'WebP',
      mimeType: 'image/webp',
      sizeBytes: bytes.length,
    };
  }

  // 5. SVG parser
  const textHeader = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, 1024))
    .trim();
  if (
    textHeader.startsWith('<svg') ||
    (textHeader.startsWith('<?xml') && textHeader.includes('<svg'))
  ) {
    const viewBoxMatch = textHeader.match(/viewBox=["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)["']/i);
    const widthMatch = textHeader.match(/width=["']([\d.]+)(?:px)?["']/i);
    const heightMatch = textHeader.match(/height=["']([\d.]+)(?:px)?["']/i);

    let width: number | undefined;
    let height: number | undefined;

    if (viewBoxMatch) {
      width = Math.round(parseFloat(viewBoxMatch[1]));
      height = Math.round(parseFloat(viewBoxMatch[2]));
    } else if (widthMatch && heightMatch) {
      width = Math.round(parseFloat(widthMatch[1]));
      height = Math.round(parseFloat(heightMatch[1]));
    }

    return {
      format: 'SVG Vector',
      mimeType: 'image/svg+xml',
      dimensions:
        width && height
          ? { width, height, aspectRatio: formatAspectRatio(width, height) }
          : undefined,
      colorType: 'Vector Graphics',
      sizeBytes: bytes.length,
    };
  }

  return null;
}

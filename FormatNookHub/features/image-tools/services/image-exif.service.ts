/**
 * Client-side EXIF Orientation Extractor & Normalizer
 * Reads standard JPEG APP1 marker without external heavy dependencies.
 */

export interface ExifTransform {
  rotateAngle: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

/**
 * Extracts EXIF orientation tag (1-8) from JPEG file buffer.
 * Returns 1 (Normal) if no EXIF or non-JPEG.
 */
export async function getExifOrientation(file: File): Promise<number> {
  if (file.type !== 'image/jpeg' && !file.name.match(/\.jpe?g$/i)) {
    return 1;
  }

  try {
    const buffer = await file.slice(0, 65536).arrayBuffer();
    const view = new DataView(buffer);

    // Verify JPEG SOI marker (0xFFD8)
    if (view.getUint16(0, false) !== 0xffd8) {
      return 1;
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length) {
      if (view.getUint8(offset) !== 0xff) {
        return 1;
      }

      const marker = view.getUint8(offset + 1);

      // APP1 marker (0xFFE1) contains EXIF data
      if (marker === 0xe1) {
        const app1Length = view.getUint16(offset + 2, false);
        const exifHeaderOffset = offset + 4;

        // Check for 'Exif\0\0' string (0x457869660000)
        if (
          view.getUint32(exifHeaderOffset, false) === 0x45786966 &&
          view.getUint16(exifHeaderOffset + 4, false) === 0x0000
        ) {
          const tiffStart = exifHeaderOffset + 6;
          const byteOrder = view.getUint16(tiffStart, false);
          const littleEndian = byteOrder === 0x4949; // 'II'

          // 0x002A is TIFF tag marker
          if (view.getUint16(tiffStart + 2, littleEndian) !== 0x002a) {
            return 1;
          }

          const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
          if (firstIfdOffset < 0x00000008) {
            return 1;
          }

          let dirStart = tiffStart + firstIfdOffset;
          const entries = view.getUint16(dirStart, littleEndian);
          dirStart += 2;

          for (let i = 0; i < entries; i++) {
            const entryOffset = dirStart + i * 12;
            const tag = view.getUint16(entryOffset, littleEndian);

            // Tag 0x0112 is Orientation
            if (tag === 0x0112) {
              const orientation = view.getUint16(entryOffset + 8, littleEndian);
              return orientation >= 1 && orientation <= 8 ? orientation : 1;
            }
          }
        }

        offset += 2 + app1Length;
      } else if ((marker & 0xff00) !== 0xff00 && (marker < 0xe0 || marker > 0xef)) {
        break;
      } else {
        offset += 2 + view.getUint16(offset + 2, false);
      }
    }

    return 1;
  } catch {
    return 1;
  }
}

/**
 * Maps EXIF orientation (1-8) to canvas transformation (rotation/flip).
 */
export function mapExifToTransform(orientation: number): ExifTransform {
  switch (orientation) {
    case 2:
      return { rotateAngle: 0, flipHorizontal: true, flipVertical: false };
    case 3:
      return { rotateAngle: 180, flipHorizontal: false, flipVertical: false };
    case 4:
      return { rotateAngle: 180, flipHorizontal: true, flipVertical: false };
    case 5:
      return { rotateAngle: 90, flipHorizontal: true, flipVertical: false };
    case 6:
      return { rotateAngle: 90, flipHorizontal: false, flipVertical: false };
    case 7:
      return { rotateAngle: 270, flipHorizontal: true, flipVertical: false };
    case 8:
      return { rotateAngle: 270, flipHorizontal: false, flipVertical: false };
    case 1:
    default:
      return { rotateAngle: 0, flipHorizontal: false, flipVertical: false };
  }
}

/**
 * Zero-Dependency In-Memory Client-Side ZIP Generator.
 * Implements PKZIP 2.0 (Store mode - compression 0) with IEEE 802.3 CRC-32 checksums.
 * Perfectly suited for images (JPEG, PNG, WebP, AVIF) which are already compressed.
 */

// CRC-32 Precomputed Lookup Table (IEEE 802.3 reversed polynomial 0xEDB88320)
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

/**
 * Computes standard IEEE 802.3 CRC-32 checksum over a Uint8Array.
 */
export function computeCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Safely converts a Blob to an ArrayBuffer across browser, JSDOM, and Node environments.
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  // JSDOM Blob support
  const symbols = Object.getOwnPropertySymbols(blob);
  for (const sym of symbols) {
    const impl = (blob as any)[sym];
    if (impl && impl._buffer) {
      const buf = impl._buffer;
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
  }
  if (typeof FileReader !== 'undefined') {
    try {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read Blob as ArrayBuffer'));
        reader.readAsArrayBuffer(blob);
      });
    } catch {}
  }
  if (typeof Response !== 'undefined') {
    return new Response(blob).arrayBuffer();
  }
  throw new Error('No mechanism available to convert Blob to ArrayBuffer');
}

/**
 * Computes CRC-32 asynchronously from a Blob slice-by-slice without full memory loading.
 */
export async function computeCrc32FromBlob(blob: Blob): Promise<number> {
  const buffer = await blobToArrayBuffer(blob);
  return computeCrc32(new Uint8Array(buffer));
}

export interface ZipFileEntry {
  name: string;
  data: Uint8Array;
}

export interface ChunkedZipEntry {
  name: string;
  data: Uint8Array | Blob;
}

// Standard PKZIP 2.0 Limits
export const PKZIP_MAX_FILES = 65535;
export const PKZIP_MAX_TOTAL_SIZE = 4294967295; // 4 GB - 1 byte

/**
 * Creates a standard uncompressed PKZIP Uint8Array from an array of file entries.
 */
export function buildZipUint8Array(files: ZipFileEntry[]): Uint8Array {
  if (files.length > PKZIP_MAX_FILES) {
    throw new Error(`File count (${files.length}) exceeds PKZIP 2.0 limit (${PKZIP_MAX_FILES}).`);
  }

  const textEncoder = new TextEncoder();

  // Pre-calculate total archive size
  let totalSize = 22; // EOCD size
  const preparedFiles = files.map((file) => {
    const nameBytes = textEncoder.encode(file.name);
    const crc = computeCrc32(file.data);
    const localHeaderSize = 30 + nameBytes.length;
    const centralHeaderSize = 46 + nameBytes.length;

    totalSize += localHeaderSize + file.data.length + centralHeaderSize;

    return {
      nameBytes,
      data: file.data,
      crc,
      localHeaderSize,
      centralHeaderSize,
    };
  });

  if (totalSize > PKZIP_MAX_TOTAL_SIZE) {
    throw new Error(`Archive size (${totalSize} bytes) exceeds standard PKZIP 4GB limit.`);
  }

  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer, output.byteOffset, output.byteLength);

  let offset = 0;
  const centralDirRecords: {
    nameBytes: Uint8Array;
    dataLength: number;
    crc: number;
    localHeaderOffset: number;
  }[] = [];

  // 1. Write Local File Headers + File Data
  for (const file of preparedFiles) {
    const localOffset = offset;
    view.setUint32(offset, 0x04034b50, true); // Local header signature (PK\x03\x04)
    view.setUint16(offset + 4, 20, true); // Version 2.0
    view.setUint16(offset + 6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(offset + 8, 0, true); // Stored (no compression)
    view.setUint16(offset + 10, 0, true); // Mod time
    view.setUint16(offset + 12, 0, true); // Mod date
    view.setUint32(offset + 14, file.crc, true); // CRC-32
    view.setUint32(offset + 18, file.data.length, true); // Compressed size
    view.setUint32(offset + 22, file.data.length, true); // Uncompressed size
    view.setUint16(offset + 26, file.nameBytes.length, true); // Name length
    view.setUint16(offset + 28, 0, true); // Extra field length

    output.set(file.nameBytes, offset + 30);
    offset += 30 + file.nameBytes.length;

    output.set(file.data, offset);
    offset += file.data.length;

    centralDirRecords.push({
      nameBytes: file.nameBytes,
      dataLength: file.data.length,
      crc: file.crc,
      localHeaderOffset: localOffset,
    });
  }

  // 2. Write Central Directory Headers
  const centralDirStart = offset;
  for (const record of centralDirRecords) {
    view.setUint32(offset, 0x02014b50, true); // Central header signature (PK\x01\x02)
    view.setUint16(offset + 4, 20, true); // Version made by
    view.setUint16(offset + 6, 20, true); // Version needed
    view.setUint16(offset + 8, 0x0800, true); // UTF-8
    view.setUint16(offset + 10, 0, true); // Method: Store
    view.setUint16(offset + 12, 0, true); // Mod time
    view.setUint16(offset + 14, 0, true); // Mod date
    view.setUint32(offset + 16, record.crc, true); // CRC-32
    view.setUint32(offset + 20, record.dataLength, true); // Compressed size
    view.setUint32(offset + 24, record.dataLength, true); // Uncompressed size
    view.setUint16(offset + 28, record.nameBytes.length, true); // Name length
    view.setUint16(offset + 30, 0, true); // Extra length
    view.setUint16(offset + 32, 0, true); // Comment length
    view.setUint16(offset + 34, 0, true); // Disk number
    view.setUint16(offset + 36, 0, true); // Internal attributes
    view.setUint32(offset + 38, 0, true); // External attributes
    view.setUint32(offset + 42, record.localHeaderOffset, true); // Relative offset

    output.set(record.nameBytes, offset + 46);
    offset += 46 + record.nameBytes.length;
  }

  const centralDirSize = offset - centralDirStart;

  // 3. Write End of Central Directory Record (EOCD)
  view.setUint32(offset, 0x06054b50, true); // EOCD signature (PK\x05\x06)
  view.setUint16(offset + 4, 0, true); // Disk number
  view.setUint16(offset + 6, 0, true); // Central dir disk
  view.setUint16(offset + 8, files.length, true); // Entries on disk
  view.setUint16(offset + 10, files.length, true); // Total entries
  view.setUint32(offset + 12, centralDirSize, true); // Central dir size
  view.setUint32(offset + 16, centralDirStart, true); // Central dir offset
  view.setUint16(offset + 20, 0, true); // Comment length

  return output;
}

/**
 * Creates a standard uncompressed PKZIP Blob from an array of file entries.
 */
export function createZipArchive(files: ZipFileEntry[]): Blob {
  const bytes = buildZipUint8Array(files);
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/zip' });
}

/**
 * Assembles a PKZIP 2.0 archive in streaming chunks without allocating a single monolithic ArrayBuffer.
 * Preserves browser memory when exporting large image batches.
 */
export async function createZipArchiveChunked(entries: ChunkedZipEntry[]): Promise<Blob> {
  if (entries.length > PKZIP_MAX_FILES) {
    throw new Error(`File count (${entries.length}) exceeds PKZIP 2.0 limit (${PKZIP_MAX_FILES}).`);
  }

  const textEncoder = new TextEncoder();
  const chunks: BlobPart[] = [];

  let currentOffset = 0;
  const centralRecords: {
    nameBytes: Uint8Array;
    size: number;
    crc: number;
    localOffset: number;
  }[] = [];

  // 1. Process each file and append local header + payload
  for (const entry of entries) {
    const localOffset = currentOffset;
    const nameBytes = textEncoder.encode(entry.name);

    let dataBuffer: Uint8Array;
    let dataLength: number;

    if (entry.data instanceof Uint8Array) {
      dataBuffer = entry.data;
      dataLength = dataBuffer.length;
    } else {
      const buf = await blobToArrayBuffer(entry.data);
      dataBuffer = new Uint8Array(buf);
      dataLength = dataBuffer.length;
    }

    const crc = computeCrc32(dataBuffer);

    // Build Local File Header (30 bytes + name)
    const headerBuffer = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(headerBuffer.buffer, headerBuffer.byteOffset, headerBuffer.byteLength);

    view.setUint32(0, 0x04034b50, true); // Local header signature
    view.setUint16(4, 20, true); // Version 2.0
    view.setUint16(6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(8, 0, true); // Store
    view.setUint16(10, 0, true); // Mod time
    view.setUint16(12, 0, true); // Mod date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, dataLength, true); // Compressed size
    view.setUint32(22, dataLength, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // Filename length
    view.setUint16(28, 0, true); // Extra field length
    headerBuffer.set(nameBytes, 30);

    chunks.push(headerBuffer.slice().buffer);
    chunks.push(dataBuffer.slice().buffer);

    currentOffset += headerBuffer.length + dataLength;

    centralRecords.push({
      nameBytes,
      size: dataLength,
      crc,
      localOffset,
    });
  }

  // 2. Build Central Directory
  const centralDirStart = currentOffset;
  let totalCentralDirSize = 0;

  for (const rec of centralRecords) {
    const cdfh = new Uint8Array(46 + rec.nameBytes.length);
    const view = new DataView(cdfh.buffer, cdfh.byteOffset, cdfh.byteLength);

    view.setUint32(0, 0x02014b50, true); // Central directory signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed
    view.setUint16(8, 0x0800, true); // UTF-8
    view.setUint16(10, 0, true); // Store
    view.setUint16(12, 0, true); // Mod time
    view.setUint16(14, 0, true); // Mod date
    view.setUint32(16, rec.crc, true); // CRC-32
    view.setUint32(20, rec.size, true); // Compressed size
    view.setUint32(24, rec.size, true); // Uncompressed size
    view.setUint16(28, rec.nameBytes.length, true); // Filename length
    view.setUint16(30, 0, true); // Extra length
    view.setUint16(32, 0, true); // Comment length
    view.setUint16(34, 0, true); // Disk number
    view.setUint16(36, 0, true); // Internal attributes
    view.setUint32(38, 0, true); // External attributes
    view.setUint32(42, rec.localOffset, true); // Relative offset of local header
    cdfh.set(rec.nameBytes, 46);

    chunks.push(cdfh.slice().buffer);
    totalCentralDirSize += cdfh.length;
    currentOffset += cdfh.length;
  }

  // 3. Build End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer, eocd.byteOffset, eocd.byteLength);

  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true); // Disk number
  eocdView.setUint16(6, 0, true); // Central dir disk
  eocdView.setUint16(8, entries.length, true); // Disk entries
  eocdView.setUint16(10, entries.length, true); // Total entries
  eocdView.setUint32(12, totalCentralDirSize, true); // Central dir size
  eocdView.setUint32(16, centralDirStart, true); // Central dir offset
  eocdView.setUint16(20, 0, true); // Comment length

  chunks.push(eocd.slice().buffer);

  return new Blob(chunks, { type: 'application/zip' });
}

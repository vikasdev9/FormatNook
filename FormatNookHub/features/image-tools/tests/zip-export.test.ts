import { describe, it, expect } from 'vitest';
import {
  createZipArchive,
  buildZipUint8Array,
  computeCrc32,
  createZipArchiveChunked,
  blobToArrayBuffer,
  PKZIP_MAX_FILES,
} from '../services/zip-export.service';

describe('Zero-Dependency ZIP Export Service', () => {
  it('computes standard IEEE 802.3 CRC-32 checksums', () => {
    const textEncoder = new TextEncoder();
    // Standard test vector: "123456789" -> 0xcbf43926
    const data = textEncoder.encode('123456789');
    expect(computeCrc32(data)).toBe(0xcbf43926);
  });

  it('generates a valid PKZIP binary with local and central directory headers', () => {
    const textEncoder = new TextEncoder();
    const files = [
      { name: 'hello.txt', data: textEncoder.encode('Hello World!') },
      { name: 'image.png', data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
    ];

    const bytes = buildZipUint8Array(files);
    expect(bytes.byteLength).toBeGreaterThan(0);

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // Verify first local header signature: 0x04034b50 (PK\x03\x04)
    expect(view.getUint32(0, true)).toBe(0x04034b50);

    // Scan for Central Directory Header signature: 0x02014b50 (PK\x01\x02)
    let foundCentralDir = false;
    let foundEOCD = false;

    for (let i = 0; i < bytes.byteLength - 4; i++) {
      const sig = view.getUint32(i, true);
      if (sig === 0x02014b50) foundCentralDir = true;
      if (sig === 0x06054b50) foundEOCD = true;
    }

    expect(foundCentralDir).toBe(true);
    expect(foundEOCD).toBe(true);

    const blob = createZipArchive(files);
    expect(blob.type).toBe('application/zip');
    expect(blob.size).toBe(bytes.byteLength);
  });

  it('generates streaming chunked PKZIP archives with Blob and buffer payloads', async () => {
    const textEncoder = new TextEncoder();
    const bufferData = textEncoder.encode('Streaming payload');
    const blobData = new Blob(['Image blob content'], { type: 'image/png' });

    const entries = [
      { name: 'buffer-file.bin', data: bufferData },
      { name: 'blob-image.png', data: blobData },
    ];

    const zipBlob = await createZipArchiveChunked(entries);
    expect(zipBlob.type).toBe('application/zip');
    expect(zipBlob.size).toBeGreaterThan(0);

    const arrayBuffer = await blobToArrayBuffer(zipBlob);
    const view = new DataView(arrayBuffer);

    // Verify PKZIP local header signature at start
    expect(view.getUint32(0, true)).toBe(0x04034b50);
  });

  it('rejects entries exceeding the PKZIP 2.0 65535 files limit', async () => {
    const oversizedFiles = new Array(PKZIP_MAX_FILES + 1).fill({
      name: 'item.txt',
      data: new Uint8Array([0]),
    });

    expect(() => buildZipUint8Array(oversizedFiles)).toThrow(/exceeds PKZIP 2.0 limit/);
    await expect(createZipArchiveChunked(oversizedFiles)).rejects.toThrow(/exceeds PKZIP 2.0 limit/);
  });
});

import { describe, it, expect } from 'vitest';
import { formatByteSize, readTextFile, readDataUrlFile } from '../file-reader';

describe('lib/file-reader', () => {
  describe('formatByteSize', () => {
    it('handles zero, negative, and invalid inputs gracefully', () => {
      expect(formatByteSize(0)).toBe('0 B');
      expect(formatByteSize(-1)).toBe('0 B');
      expect(formatByteSize(-1024)).toBe('0 B');
      expect(formatByteSize(NaN)).toBe('0 B');
      expect(formatByteSize(undefined as any)).toBe('0 B');
    });

    it('formats exact byte boundaries correctly', () => {
      expect(formatByteSize(1)).toBe('1 B');
      expect(formatByteSize(512)).toBe('512 B');
      expect(formatByteSize(1024)).toBe('1 KB');
      expect(formatByteSize(1536)).toBe('1.5 KB');
      expect(formatByteSize(1024 * 1024)).toBe('1 MB');
      expect(formatByteSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('formats terabytes and petabytes without returning undefined units', () => {
      const oneTB = 1024 ** 4;
      const onePB = 1024 ** 5;
      const beyondPB = 1024 ** 6;

      expect(formatByteSize(oneTB)).toBe('1 TB');
      expect(formatByteSize(onePB)).toBe('1 PB');
      expect(formatByteSize(beyondPB)).toContain('PB');
      expect(formatByteSize(beyondPB)).not.toContain('undefined');
      expect(formatByteSize(beyondPB)).not.toContain('NaN');
    });
  });

  describe('readTextFile', () => {
    it('reads standard text files successfully', async () => {
      const file = new File(['Hello FormatNook!'], 'test.txt', { type: 'text/plain' });
      const result = await readTextFile(file);
      expect(result.content).toBe('Hello FormatNook!');
      expect(result.name).toBe('test.txt');
      expect(result.size).toBe(17);
      expect(result.mimeType).toBe('text/plain');
    });

    it('handles empty files accurately', async () => {
      const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
      const result = await readTextFile(emptyFile);
      expect(result.content).toBe('');
      expect(result.size).toBe(0);
    });

    it('rejects files exceeding maximum size limit', async () => {
      const file = new File(['Some content'], 'large.txt', { type: 'text/plain' });
      // Set limit lower than file size
      await expect(readTextFile(file, { maxSizeInBytes: 5 })).rejects.toThrow('exceeds maximum limit');
    });
  });

  describe('readDataUrlFile', () => {
    it('reads files as data URL successfully', async () => {
      const file = new File(['data'], 'test.bin', { type: 'application/octet-stream' });
      const result = await readDataUrlFile(file);
      expect(result.dataUrl).toContain('data:application/octet-stream;base64,');
      expect(result.name).toBe('test.bin');
    });

    it('rejects data URL file reads exceeding size limit', async () => {
      const file = new File(['data string'], 'test.bin', { type: 'application/octet-stream' });
      await expect(readDataUrlFile(file, { maxSizeInBytes: 4 })).rejects.toThrow('exceeds limit');
    });
  });
});


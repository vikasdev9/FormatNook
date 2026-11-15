import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShareService } from '../services/share.service';
import { ShareFormatOption } from '../types/share.types';

describe('ShareService', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe('isWebShareSupported', () => {
    it('returns true when navigator.share is a function', () => {
      Object.defineProperty(global, 'navigator', {
        value: { share: vi.fn() },
        writable: true,
        configurable: true,
      });
      expect(ShareService.isWebShareSupported()).toBe(true);
    });

    it('returns false when navigator.share is absent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(ShareService.isWebShareSupported()).toBe(false);
    });
  });

  describe('canShareFiles', () => {
    it('returns true when navigator.canShare accepts files', () => {
      const mockCanShare = vi.fn().mockReturnValue(true);
      Object.defineProperty(global, 'navigator', {
        value: { share: vi.fn(), canShare: mockCanShare },
        writable: true,
        configurable: true,
      });
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(ShareService.canShareFiles([file])).toBe(true);
      expect(mockCanShare).toHaveBeenCalledWith({ files: [file] });
    });

    it('returns false when navigator.canShare throws or returns false', () => {
      const mockCanShare = vi.fn().mockReturnValue(false);
      Object.defineProperty(global, 'navigator', {
        value: { share: vi.fn(), canShare: mockCanShare },
        writable: true,
        configurable: true,
      });
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(ShareService.canShareFiles([file])).toBe(false);
    });
  });

  describe('shareViaWebShare & Cancellation', () => {
    it('calls navigator.share with title and text', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(global, 'navigator', {
        value: { share: mockShare },
        writable: true,
        configurable: true,
      });

      const res = await ShareService.shareViaWebShare({
        title: 'Test Title',
        text: 'Test Content',
      });

      expect(res.success).toBe(true);
      expect(res.cancelled).toBeUndefined();
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test Content',
      });
    });

    it('handles AbortError gracefully as user cancellation without reporting success or triggering download', async () => {
      const abortErr = new Error('Share canceled');
      abortErr.name = 'AbortError';
      const mockShare = vi.fn().mockRejectedValue(abortErr);
      Object.defineProperty(global, 'navigator', {
        value: { share: mockShare },
        writable: true,
        configurable: true,
      });

      const res = await ShareService.shareViaWebShare({
        title: 'Test Title',
      });

      expect(res.success).toBe(false);
      expect(res.cancelled).toBe(true);
      expect(res.error).toBe('Share dialog was dismissed.');
    });

    it('returns failure when Web Share is unsupported', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const res = await ShareService.shareViaWebShare({ title: 'Test' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('not supported');
    });
  });

  describe('executeShareOption cancellation safety', () => {
    it('does NOT trigger download fallback when user cancels native sharing', async () => {
      const abortErr = new Error('User closed share');
      abortErr.name = 'AbortError';
      const mockShare = vi.fn().mockRejectedValue(abortErr);
      Object.defineProperty(global, 'navigator', {
        value: { share: mockShare },
        writable: true,
        configurable: true,
      });

      const downloadSpy = vi.spyOn(ShareService, 'downloadItem');

      const mockOption: ShareFormatOption = {
        id: 'test-text',
        label: 'Test File',
        description: 'A test file description',
        extension: '.txt',
        mimeType: 'text/plain',
        generate: () => ({
          content: 'Sample text content',
          fileName: 'test.txt',
          mimeType: 'text/plain',
        }),
      };

      const res = await ShareService.executeShareOption(mockOption, 'share');
      expect(res.cancelled).toBe(true);
      expect(res.success).toBe(false);
      expect(downloadSpy).not.toHaveBeenCalled();
    });
  });

  describe('copyTextToClipboard', () => {
    it('writes text to clipboard when available', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(global, 'navigator', {
        value: { clipboard: { writeText: mockWriteText } },
        writable: true,
        configurable: true,
      });

      const res = await ShareService.copyTextToClipboard('Hello World');
      expect(res.success).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith('Hello World');
    });

    it('returns error when clipboard is unavailable', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const res = await ShareService.copyTextToClipboard('Hello World');
      expect(res.success).toBe(false);
      expect(res.error).toContain('unavailable');
    });
  });
});

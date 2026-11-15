import { ShareActionResult, ShareFormatOption } from '../types/share.types';
import { downloadFile } from '@/lib/download';

export class ShareService {
  /**
   * Check if the browser supports the native Web Share API
   */
  static isWebShareSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  /**
   * Check if file sharing is supported for a given set of files
   */
  static canShareFiles(files: File[]): boolean {
    if (!this.isWebShareSupported() || !navigator.canShare) {
      return false;
    }
    try {
      return navigator.canShare({ files });
    } catch {
      return false;
    }
  }

  /**
   * Execute native Web Share API call with automatic fallbacks
   */
  static async shareViaWebShare(data: {
    title: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<ShareActionResult> {
    if (!this.isWebShareSupported()) {
      return {
        action: 'web-share',
        success: false,
        error: 'Web Share API is not supported in this browser.',
      };
    }

    try {
      const shareData: ShareData = {
        title: data.title,
        text: data.text,
      };

      if (data.url) {
        shareData.url = data.url;
      }

      if (data.files && data.files.length > 0) {
        if (this.canShareFiles(data.files)) {
          shareData.files = data.files;
        }
      }

      await navigator.share(shareData);
      return {
        action: 'web-share',
        success: true,
        message: 'Shared successfully via system share dialog.',
      };
    } catch (err: any) {
      // If user aborted / cancelled share dialog
      if (err?.name === 'AbortError') {
        return {
          action: 'web-share',
          success: false,
          cancelled: true,
          error: 'Share dialog was dismissed.',
        };
      }
      return {
        action: 'web-share',
        success: false,
        error: err?.message || 'Failed to share content.',
      };
    }
  }

  /**
   * Copy plain text to clipboard
   */
  static async copyTextToClipboard(text: string): Promise<ShareActionResult> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return {
        action: 'copy',
        success: false,
        error: 'Clipboard API is unavailable in this environment.',
      };
    }

    try {
      await navigator.clipboard.writeText(text);
      return {
        action: 'copy',
        success: true,
        message: 'Content copied to clipboard!',
      };
    } catch (err: any) {
      return {
        action: 'copy',
        success: false,
        error: err?.message || 'Failed to copy to clipboard.',
      };
    }
  }

  /**
   * Trigger direct client-side file download
   */
  static async downloadItem(
    content: string | Blob,
    fileName: string,
    mimeType: string
  ): Promise<ShareActionResult> {
    try {
      const ok = downloadFile(content, fileName, mimeType);
      return {
        action: 'download',
        success: ok,
        message: ok ? `Downloaded ${fileName}` : 'Download failed.',
      };
    } catch (err: any) {
      return {
        action: 'download',
        success: false,
        error: err?.message || 'Download failed.',
      };
    }
  }

  /**
   * Execute action for a specific format option
   */
  static async executeShareOption(
    option: ShareFormatOption,
    mode: 'share' | 'download' | 'copy'
  ): Promise<ShareActionResult> {
    const item = await option.generate();

    if (mode === 'download') {
      return this.downloadItem(item.content, item.fileName, item.mimeType);
    }

    if (mode === 'copy') {
      const textToCopy =
        item.textForClipboard ||
        (typeof item.content === 'string' ? item.content : '');

      if (!textToCopy) {
        return {
          action: 'copy',
          success: false,
          error: 'Binary formats cannot be copied directly to clipboard as text. Please use Download instead.',
        };
      }

      return this.copyTextToClipboard(textToCopy);
    }

    if (mode === 'share') {
      // Prepare file for sharing if it's a blob or string
      const fileBlob =
        item.content instanceof Blob
          ? item.content
          : new Blob([item.content], { type: item.mimeType });

      let files: File[] | undefined;
      try {
        files = [new File([fileBlob], item.fileName, { type: item.mimeType })];
      } catch {
        files = undefined;
      }

      const textFallback =
        typeof item.content === 'string' ? item.content.slice(0, 1000) : undefined;

      // Try native share
      const shareRes = await this.shareViaWebShare({
        title: item.fileName,
        text: textFallback,
        files,
      });

      // If user cancelled, NEVER download and return cancellation immediately
      if (shareRes.cancelled) {
        return shareRes;
      }

      // If Web Share is not supported, gracefully fallback to download
      if (!shareRes.success && shareRes.error?.includes('not supported')) {
        return this.downloadItem(item.content, item.fileName, item.mimeType);
      }

      return shareRes;
    }

    return {
      action: mode,
      success: false,
      error: 'Unsupported share mode.',
    };
  }
}

export interface FileReadOptions {
  maxSizeInBytes?: number;
}

const DEFAULT_MAX_SIZE = 15 * 1024 * 1024; // 15MB

export function readTextFile(
  file: File,
  options: FileReadOptions = {}
): Promise<{ content: string; name: string; size: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const maxSize = options.maxSizeInBytes ?? DEFAULT_MAX_SIZE;
    if (file.size > maxSize) {
      reject(new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        content: reader.result as string,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'text/plain',
      });
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file content.'));
    };
    reader.readAsText(file);
  });
}

export function readDataUrlFile(
  file: File,
  options: FileReadOptions = {}
): Promise<{ dataUrl: string; name: string; size: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const maxSize = options.maxSizeInBytes ?? DEFAULT_MAX_SIZE;
    if (file.size > maxSize) {
      reject(new Error(`File size exceeds limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      });
    };
    reader.onerror = () => {
      reject(new Error('Failed to load file.'));
    };
    reader.readAsDataURL(file);
  });
}

export function formatByteSize(bytes: number): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

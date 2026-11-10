export function downloadFile(
  content: string | Blob,
  fileName: string,
  mimeType = 'text/plain;charset=utf-8'
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch {
    return false;
  }
}

export function downloadDataUrl(dataUrl: string, fileName: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch {
    return false;
  }
}

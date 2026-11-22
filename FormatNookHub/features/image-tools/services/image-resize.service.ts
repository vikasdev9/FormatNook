/**
 * Calculates resized dimensions while strictly maintaining aspect ratio if enabled
 */
export function calculateResizeDimensions(
  origWidth: number,
  origHeight: number,
  changedProp: 'width' | 'height',
  newValue: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  const val = Math.max(1, Math.min(Math.round(newValue), 8192));
  if (!maintainAspectRatio || origWidth <= 0 || origHeight <= 0) {
    return {
      width: changedProp === 'width' ? val : origWidth,
      height: changedProp === 'height' ? val : origHeight,
    };
  }

  const ratio = origWidth / origHeight;
  if (changedProp === 'width') {
    return {
      width: val,
      height: Math.max(1, Math.round(val / ratio)),
    };
  } else {
    return {
      width: Math.max(1, Math.round(val * ratio)),
      height: val,
    };
  }
}

/**
 * Calculates dimensions based on standard percentage scaling (e.g. 25%, 50%, 200%)
 */
export function scaleByPercentage(
  origWidth: number,
  origHeight: number,
  percent: number
): { width: number; height: number } {
  const pct = Math.max(5, Math.min(percent, 500)) / 100;
  return {
    width: Math.max(1, Math.round(origWidth * pct)),
    height: Math.max(1, Math.round(origHeight * pct)),
  };
}

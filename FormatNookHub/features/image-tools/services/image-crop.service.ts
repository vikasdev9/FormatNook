import { CropRect, AspectRatioPreset } from '../types/image-tools.types';

export type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

/**
 * Clamps a crop rectangle to ensure it resides entirely within image bounds
 */
export function clampCropRect(
  rect: CropRect,
  imageWidth: number,
  imageHeight: number,
  minDimension: number = 20
): CropRect {
  const minW = Math.min(minDimension, imageWidth);
  const minH = Math.min(minDimension, imageHeight);

  const x = Math.max(0, Math.min(rect.x, imageWidth - minW));
  const y = Math.max(0, Math.min(rect.y, imageHeight - minH));
  const width = Math.max(minW, Math.min(rect.width, imageWidth - x));
  const height = Math.max(minH, Math.min(rect.height, imageHeight - y));

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Adjusts width and height to strictly match an aspect ratio preset
 */
export function applyAspectRatioPreset(
  currentWidth: number,
  currentHeight: number,
  preset: AspectRatioPreset,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (preset === 'free') {
    return {
      width: Math.min(currentWidth, maxWidth),
      height: Math.min(currentHeight, maxHeight),
    };
  }

  let ratio = 1;
  switch (preset) {
    case '1:1':
      ratio = 1;
      break;
    case '16:9':
      ratio = 16 / 9;
      break;
    case '4:3':
      ratio = 4 / 3;
      break;
    case '3:2':
      ratio = 3 / 2;
      break;
    case '9:16':
      ratio = 9 / 16;
      break;
    case '4:5':
      ratio = 4 / 5;
      break;
  }

  let targetW = currentWidth;
  let targetH = Math.round(targetW / ratio);

  if (targetH > maxHeight) {
    targetH = maxHeight;
    targetW = Math.round(targetH * ratio);
  }
  if (targetW > maxWidth) {
    targetW = maxWidth;
    targetH = Math.round(targetW / ratio);
  }

  return {
    width: Math.max(20, Math.round(targetW)),
    height: Math.max(20, Math.round(targetH)),
  };
}

/**
 * Calculates updated crop rectangle during pointer drag of a handle or move
 */
export function computeHandleDrag(
  startRect: CropRect,
  handle: CropHandle,
  deltaX: number,
  deltaY: number,
  imageWidth: number,
  imageHeight: number,
  preset: AspectRatioPreset
): CropRect {
  if (handle === 'move') {
    const nextX = Math.max(0, Math.min(startRect.x + deltaX, imageWidth - startRect.width));
    const nextY = Math.max(0, Math.min(startRect.y + deltaY, imageHeight - startRect.height));
    return {
      x: Math.round(nextX),
      y: Math.round(nextY),
      width: startRect.width,
      height: startRect.height,
    };
  }

  let { x, y, width, height } = startRect;

  // Handle horizontal expansion/contraction
  if (handle.includes('w')) {
    const proposedX = x + deltaX;
    const proposedW = width - deltaX;
    if (proposedW >= 20 && proposedX >= 0) {
      x = proposedX;
      width = proposedW;
    }
  } else if (handle.includes('e')) {
    const proposedW = width + deltaX;
    if (proposedW >= 20 && x + proposedW <= imageWidth) {
      width = proposedW;
    }
  }

  // Handle vertical expansion/contraction
  if (handle.includes('n')) {
    const proposedY = y + deltaY;
    const proposedH = height - deltaY;
    if (proposedH >= 20 && proposedY >= 0) {
      y = proposedY;
      height = proposedH;
    }
  } else if (handle.includes('s')) {
    const proposedH = height + deltaY;
    if (proposedH >= 20 && y + proposedH <= imageHeight) {
      height = proposedH;
    }
  }

  // Constrain to aspect ratio preset if not free
  if (preset !== 'free') {
    const constrained = applyAspectRatioPreset(width, height, preset, imageWidth - x, imageHeight - y);
    width = constrained.width;
    height = constrained.height;
  }

  return clampCropRect({ x, y, width, height }, imageWidth, imageHeight);
}

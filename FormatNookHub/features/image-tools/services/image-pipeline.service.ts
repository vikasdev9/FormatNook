import {
  PipelineSettings,
  PipelineRenderResult,
  ImageOutputFormat,
  WatermarkPosition,
} from '../types/image-tools.types';
import { clampCropRect } from './image-crop.service';
import { calculateRotatedBoundingBox } from './image-transform.service';

let cachedAvifSupport: boolean | null = null;

/**
 * Probes browser canvas support for native AVIF export
 */
export async function isAvifSupported(): Promise<boolean> {
  if (cachedAvifSupport !== null) return cachedAvifSupport;
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    if (typeof testCanvas.toBlob !== 'function') {
      cachedAvifSupport = false;
      return false;
    }
    const blob = await new Promise<Blob | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 150);
      try {
        testCanvas.toBlob((b) => {
          clearTimeout(timeout);
          resolve(b);
        }, 'image/avif');
      } catch {
        clearTimeout(timeout);
        resolve(null);
      }
    });
    cachedAvifSupport = blob?.type === 'image/avif';
  } catch {
    cachedAvifSupport = false;
  }
  return cachedAvifSupport;
}

/**
 * Loads a File or Blob into an HTMLImageElement
 */
export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Image loading is only supported in browser environments.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file.'));
    };
    img.src = url;
  });
}

/**
 * Creates default pipeline settings initialized to the image's native dimensions
 */
export function createDefaultPipelineSettings(
  width: number,
  height: number,
  initialFormat: ImageOutputFormat = 'auto'
): PipelineSettings {
  return {
    crop: {
      enabled: false,
      rect: { x: 0, y: 0, width, height },
      aspectPreset: 'free',
    },
    resize: {
      enabled: false,
      width,
      height,
      maintainAspectRatio: true,
      scalePercent: 100,
      algorithm: 'high',
    },
    orientation: {
      rotateAngle: 0,
      flipHorizontal: false,
      flipVertical: false,
    },
    watermark: {
      enabled: false,
      type: 'text',
      text: '© FormatNook',
      fontFamily: 'sans-serif',
      fontSize: Math.max(16, Math.round(width * 0.03)),
      color: '#ffffff',
      opacity: 0.8,
      position: 'bottom-right',
      padding: Math.max(12, Math.round(width * 0.02)),
      imageScale: 20,
    },
    export: {
      format: initialFormat,
      quality: 0.85,
      backgroundColor: '#ffffff',
      stripMetadata: true,
    },
  };
}

/**
 * Calculates anchor coordinates for 9-point watermark placement
 */
function calculateWatermarkAnchor(
  canvasWidth: number,
  canvasHeight: number,
  itemWidth: number,
  itemHeight: number,
  position: WatermarkPosition,
  padding: number
): { x: number; y: number } {
  let x = padding;
  let y = padding;

  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-center':
      x = Math.round((canvasWidth - itemWidth) / 2);
      y = padding;
      break;
    case 'top-right':
      x = canvasWidth - itemWidth - padding;
      y = padding;
      break;
    case 'center-left':
      x = padding;
      y = Math.round((canvasHeight - itemHeight) / 2);
      break;
    case 'center':
      x = Math.round((canvasWidth - itemWidth) / 2);
      y = Math.round((canvasHeight - itemHeight) / 2);
      break;
    case 'center-right':
      x = canvasWidth - itemWidth - padding;
      y = Math.round((canvasHeight - itemHeight) / 2);
      break;
    case 'bottom-left':
      x = padding;
      y = canvasHeight - itemHeight - padding;
      break;
    case 'bottom-center':
      x = Math.round((canvasWidth - itemWidth) / 2);
      y = canvasHeight - itemHeight - padding;
      break;
    case 'bottom-right':
    default:
      x = canvasWidth - itemWidth - padding;
      y = canvasHeight - itemHeight - padding;
      break;
  }

  return { x: Math.max(0, x), y: Math.max(0, y) };
}

/**
 * Executes the full non-destructive image pipeline and returns output Blob & metadata
 */
export async function renderPipeline(
  sourceImg: HTMLImageElement,
  settings: PipelineSettings,
  originalMime: string = 'image/png'
): Promise<PipelineRenderResult> {
  const origW = sourceImg.naturalWidth || sourceImg.width;
  const origH = sourceImg.naturalHeight || sourceImg.height;

  // 1. Crop parameters (active if explicitly enabled or if crop rect differs from full frame)
  const isCropActive =
    settings.crop.enabled ||
    (settings.crop.rect &&
      (settings.crop.rect.x > 0 ||
        settings.crop.rect.y > 0 ||
        (settings.crop.rect.width > 0 && settings.crop.rect.width < origW) ||
        (settings.crop.rect.height > 0 && settings.crop.rect.height < origH)));

  const clampedRect = isCropActive
    ? clampCropRect(settings.crop.rect, origW, origH)
    : { x: 0, y: 0, width: origW, height: origH };
  const cropX = clampedRect.x;
  const cropY = clampedRect.y;
  const cropW = clampedRect.width;
  const cropH = clampedRect.height;

  // 2. Resize dimensions
  const targetW = settings.resize.enabled
    ? Math.max(1, Math.round(settings.resize.width))
    : cropW;
  const targetH = settings.resize.enabled
    ? Math.max(1, Math.round(settings.resize.height))
    : cropH;

  // 3. Orientation & Bounding Box
  const angleDeg = settings.orientation.rotateAngle % 360;
  const rad = (angleDeg * Math.PI) / 180;
  const { width: finalW, height: finalH } = calculateRotatedBoundingBox(targetW, targetH, angleDeg);

  // Determine target output format
  let targetFormat = settings.export.format;
  if (targetFormat === 'auto') {
    targetFormat = (originalMime as ImageOutputFormat) || 'image/png';
  }

  // Create primary offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;
  const ctx = canvas.getContext('2d', {
    alpha: targetFormat !== 'image/jpeg',
  });

  if (!ctx) {
    throw new Error('Failed to create canvas 2D rendering context.');
  }

  // Set image smoothing
  ctx.imageSmoothingEnabled = settings.resize.algorithm !== 'low';
  if (ctx.imageSmoothingEnabled) {
    ctx.imageSmoothingQuality = settings.resize.algorithm === 'high' ? 'high' : 'medium';
  }

  // Fill background if JPEG
  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = settings.export.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, finalW, finalH);
  }

  // 4. Draw transformed image
  ctx.save();
  ctx.translate(finalW / 2, finalH / 2);
  if (angleDeg !== 0) {
    ctx.rotate(rad);
  }
  const scaleX = settings.orientation.flipHorizontal ? -1 : 1;
  const scaleY = settings.orientation.flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  ctx.drawImage(
    sourceImg,
    cropX,
    cropY,
    cropW,
    cropH,
    -targetW / 2,
    -targetH / 2,
    targetW,
    targetH
  );
  ctx.restore();

  // 5. Watermark overlay
  if (settings.watermark.enabled) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(settings.watermark.opacity, 1.0));

    if (settings.watermark.type === 'text' && settings.watermark.text.trim()) {
      const fontSize = Math.max(8, settings.watermark.fontSize);
      ctx.font = `600 ${fontSize}px ${settings.watermark.fontFamily}`;
      ctx.fillStyle = settings.watermark.color;
      ctx.textBaseline = 'top';

      const metrics = ctx.measureText(settings.watermark.text);
      const textW = metrics.width;
      const textH = fontSize * 1.2;

      const anchor = calculateWatermarkAnchor(
        finalW,
        finalH,
        textW,
        textH,
        settings.watermark.position,
        settings.watermark.padding
      );

      // Add subtle drop shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(settings.watermark.text, anchor.x, anchor.y);
    } else if (settings.watermark.type === 'image' && settings.watermark.imageUrl) {
      try {
        const wmImg = await new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => rej(new Error('Failed to load watermark image'));
          img.src = settings.watermark.imageUrl!;
        });

        const scale = (settings.watermark.imageScale || 20) / 100;
        const maxWmDim = Math.min(finalW, finalH) * scale;
        const aspect = (wmImg.naturalWidth || wmImg.width || 1) / (wmImg.naturalHeight || wmImg.height || 1);
        let wmW = maxWmDim;
        let wmH = maxWmDim / aspect;
        if (wmH > maxWmDim) {
          wmH = maxWmDim;
          wmW = wmH * aspect;
        }
        wmW = Math.max(16, Math.round(wmW));
        wmH = Math.max(16, Math.round(wmH));

        const anchor = calculateWatermarkAnchor(
          finalW,
          finalH,
          wmW,
          wmH,
          settings.watermark.position,
          settings.watermark.padding
        );

        ctx.drawImage(wmImg, anchor.x, anchor.y, wmW, wmH);
      } catch (err) {
        console.warn('Logo watermark rendering skipped:', err);
      }
    }
    ctx.restore();
  }

  // 6. Encode to Blob
  const quality =
    targetFormat === 'image/jpeg' || targetFormat === 'image/webp' || targetFormat === 'image/avif'
      ? Math.min(Math.max(settings.export.quality, 0.1), 1.0)
      : undefined;

  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to encode image to ${targetFormat}.`));
          return;
        }
        resolve(blob);
      },
      targetFormat,
      quality
    );
  });

  const objectUrl = URL.createObjectURL(outputBlob);

  return {
    blob: outputBlob,
    objectUrl,
    width: finalW,
    height: finalH,
    sizeBytes: outputBlob.size,
  };
}

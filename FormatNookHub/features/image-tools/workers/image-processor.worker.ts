import { WorkerTaskRequest, WorkerTaskResponse, WatermarkPosition } from '../types/image-tools.types';
import { clampCropRect } from '../services/image-crop.service';
import { calculateRotatedBoundingBox } from '../services/image-transform.service';

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
 * Executes image processing on an OffscreenCanvas inside the worker.
 */
export async function executeWorkerPipeline(
  request: WorkerTaskRequest
): Promise<WorkerTaskResponse> {
  const { taskId, fileBuffer, settings, originalMime } = request;
  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;

  try {
    const inputBlob = new Blob([fileBuffer], { type: originalMime });
    bitmap = await createImageBitmap(inputBlob);

    const origW = bitmap.width;
    const origH = bitmap.height;

    // 1. Crop parameters
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
    const { width: finalW, height: finalH } = calculateRotatedBoundingBox(
      targetW,
      targetH,
      angleDeg
    );

    // Determine target format
    let targetFormat = settings.export.format;
    if (targetFormat === 'auto') {
      targetFormat = (originalMime as any) || 'image/png';
    }

    // 4. Create OffscreenCanvas
    canvas = new OffscreenCanvas(finalW, finalH);
    const ctx = canvas.getContext('2d', {
      alpha: targetFormat !== 'image/jpeg',
    }) as OffscreenCanvasRenderingContext2D | null;

    if (!ctx) {
      throw new Error('Failed to create OffscreenCanvas 2D rendering context.');
    }

    ctx.imageSmoothingEnabled = settings.resize.algorithm !== 'low';
    if (ctx.imageSmoothingEnabled) {
      ctx.imageSmoothingQuality = settings.resize.algorithm === 'high' ? 'high' : 'medium';
    }

    // Fill background if JPEG
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = settings.export.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, finalW, finalH);
    }

    // Draw transformed image
    ctx.save();
    ctx.translate(finalW / 2, finalH / 2);
    if (angleDeg !== 0) {
      ctx.rotate(rad);
    }
    const scaleX = settings.orientation.flipHorizontal ? -1 : 1;
    const scaleY = settings.orientation.flipVertical ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    ctx.drawImage(
      bitmap,
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
        ctx.font = `600 ${fontSize}px ${settings.watermark.fontFamily || 'sans-serif'}`;
        ctx.fillStyle = settings.watermark.color || '#ffffff';
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

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(settings.watermark.text, anchor.x, anchor.y);
      } else if (settings.watermark.type === 'image' && settings.watermark.imageBlob) {
        let wmBitmap: ImageBitmap | null = null;
        try {
          wmBitmap = await createImageBitmap(settings.watermark.imageBlob);
          const scale = (settings.watermark.imageScale || 20) / 100;
          const maxWmDim = Math.min(finalW, finalH) * scale;
          const aspect = (wmBitmap.width || 1) / (wmBitmap.height || 1);
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

          ctx.drawImage(wmBitmap, anchor.x, anchor.y, wmW, wmH);
        } finally {
          if (wmBitmap) {
            wmBitmap.close();
          }
        }
      }

      ctx.restore();
    }

    // 6. Encode to Blob
    const outputBlob = await canvas.convertToBlob({
      type: targetFormat,
      quality: settings.export.quality,
    });

    const outputBuffer = await outputBlob.arrayBuffer();

    return {
      taskId,
      status: 'success',
      outputBuffer,
      mimeType: targetFormat,
      width: finalW,
      height: finalH,
      sizeBytes: outputBuffer.byteLength,
    };
  } catch (err: any) {
    return {
      taskId,
      status: 'error',
      error: err?.message || 'Processing failed in worker.',
    };
  } finally {
    // Immediate memory cleanup
    if (bitmap) {
      try {
        bitmap.close();
      } catch {}
    }
    if (canvas) {
      // Resize to 1x1 to flush GPU texture memory immediately
      canvas.width = 1;
      canvas.height = 1;
    }
  }
}

// Attach listener if running in dedicated Web Worker scope
if (typeof self !== 'undefined' && 'postMessage' in self && typeof (self as any).importScripts === 'function') {
  self.onmessage = async (event: MessageEvent<WorkerTaskRequest>) => {
    const result = await executeWorkerPipeline(event.data);
    if (result.outputBuffer) {
      (self as any).postMessage(result, [result.outputBuffer]);
    } else {
      (self as any).postMessage(result);
    }
  };
}

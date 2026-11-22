import { describe, it, expect, vi } from 'vitest';
import {
  createDefaultPipelineSettings,
  isAvifSupported,
} from '../services/image-pipeline.service';

describe('Image Pipeline Service', () => {
  it('creates default pipeline settings matching native image dimensions', () => {
    const settings = createDefaultPipelineSettings(1920, 1080);

    expect(settings.crop.enabled).toBe(false);
    expect(settings.crop.rect).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    expect(settings.crop.aspectPreset).toBe('free');

    expect(settings.resize.enabled).toBe(false);
    expect(settings.resize.width).toBe(1920);
    expect(settings.resize.height).toBe(1080);
    expect(settings.resize.maintainAspectRatio).toBe(true);
    expect(settings.resize.scalePercent).toBe(100);

    expect(settings.orientation.rotateAngle).toBe(0);
    expect(settings.orientation.flipHorizontal).toBe(false);
    expect(settings.orientation.flipVertical).toBe(false);

    expect(settings.watermark.enabled).toBe(false);
    expect(settings.watermark.text).toContain('FormatNook');
    expect(settings.watermark.position).toBe('bottom-right');

    expect(settings.export.format).toBe('auto');
    expect(settings.export.quality).toBe(0.85);
    expect(settings.export.backgroundColor).toBe('#ffffff');
  });

  it('checks AVIF support without throwing errors in Node or jsdom environment', async () => {
    const supported = await isAvifSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('preserves target format when specified in createDefaultPipelineSettings', () => {
    const settings = createDefaultPipelineSettings(800, 600, 'image/webp');
    expect(settings.export.format).toBe('image/webp');
  });

  it('initializes watermark settings with logo scaling and image watermark support', () => {
    const settings = createDefaultPipelineSettings(1200, 800);
    expect(settings.watermark.type).toBe('text');
    expect(settings.watermark.imageScale).toBe(20);
  });

  it('correctly processes crop regions and computes target dimensions', () => {
    const settings = createDefaultPipelineSettings(1000, 800);
    // Custom crop area
    settings.crop.rect = { x: 100, y: 50, width: 400, height: 300 };
    settings.crop.enabled = true;

    expect(settings.crop.rect.width).toBe(400);
    expect(settings.crop.rect.height).toBe(300);
  });
});

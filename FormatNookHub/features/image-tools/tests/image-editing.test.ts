import { describe, it, expect } from 'vitest';
import { clampCropRect, applyAspectRatioPreset, computeHandleDrag } from '../services/image-crop.service';
import { calculateResizeDimensions, scaleByPercentage } from '../services/image-resize.service';
import { calculateRotatedBoundingBox, normalizeAngle } from '../services/image-transform.service';
import { mapExifToTransform } from '../services/image-exif.service';

describe('Image Crop Service', () => {
  it('clamps crop rectangle within image boundaries', () => {
    const raw = { x: -20, y: -50, width: 1500, height: 900 };
    const clamped = clampCropRect(raw, 1000, 800);

    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);
    expect(clamped.width).toBe(1000);
    expect(clamped.height).toBe(800);
  });

  it('enforces minimum dimensions (default 20px, custom minDimension)', () => {
    const raw = { x: 50, y: 50, width: 2, height: -5 };
    const clampedDefault = clampCropRect(raw, 100, 100);
    expect(clampedDefault.width).toBe(20);
    expect(clampedDefault.height).toBe(20);

    const clampedCustom = clampCropRect(raw, 100, 100, 10);
    expect(clampedCustom.width).toBe(10);
    expect(clampedCustom.height).toBe(10);
  });

  it('calculates aspect ratio presets correctly', () => {
    // 1:1 Square: 400 width -> 400 height
    const square = applyAspectRatioPreset(400, 300, '1:1', 1000, 1000);
    expect(square.width).toBe(400);
    expect(square.height).toBe(400);

    // 16:9 Landscape
    const landscape = applyAspectRatioPreset(800, 600, '16:9', 1920, 1080);
    expect(landscape.width).toBe(800);
    expect(landscape.height).toBe(450);

    // Freeform leaves dimensions unchanged
    const free = applyAspectRatioPreset(640, 480, 'free', 1000, 1000);
    expect(free.width).toBe(640);
    expect(free.height).toBe(480);
  });

  it('computes handle dragging for corner and edge resize handles', () => {
    const initial = { x: 100, y: 100, width: 200, height: 200 };

    // Drag south-east handle outward with free preset
    const se = computeHandleDrag(initial, 'se', 20, 30, 800, 600, 'free');
    expect(se.width).toBe(220);
    expect(se.height).toBe(230);
    expect(se.x).toBe(100);
    expect(se.y).toBe(100);

    // Drag north-west handle inward with free preset
    const nw = computeHandleDrag(initial, 'nw', 15, 20, 800, 600, 'free');
    expect(nw.x).toBe(115);
    expect(nw.y).toBe(120);
    expect(nw.width).toBe(185);
    expect(nw.height).toBe(180);
  });
});

describe('Image Resize Service', () => {
  it('calculates proportional dimensions when aspect ratio is locked', () => {
    // 1000x500 (2:1 ratio) - change width to 800 -> height should be 400
    const wRes = calculateResizeDimensions(1000, 500, 'width', 800, true);
    expect(wRes.width).toBe(800);
    expect(wRes.height).toBe(400);

    // change height to 250 -> width should be 500
    const hRes = calculateResizeDimensions(1000, 500, 'height', 250, true);
    expect(hRes.width).toBe(500);
    expect(hRes.height).toBe(250);
  });

  it('allows independent dimensions when aspect ratio is unlocked', () => {
    const res = calculateResizeDimensions(1000, 500, 'width', 800, false);
    expect(res.width).toBe(800);
    expect(res.height).toBe(500);
  });

  it('scales dimensions accurately by percentage presets', () => {
    const scaled50 = scaleByPercentage(1200, 800, 50);
    expect(scaled50.width).toBe(600);
    expect(scaled50.height).toBe(400);

    const scaled25 = scaleByPercentage(1200, 800, 25);
    expect(scaled25.width).toBe(300);
    expect(scaled25.height).toBe(200);

    const scaled200 = scaleByPercentage(1200, 800, 200);
    expect(scaled200.width).toBe(2400);
    expect(scaled200.height).toBe(1600);
  });
});

describe('Image Transform & EXIF Services', () => {
  it('normalizes angles within -180 to +180 degrees', () => {
    expect(normalizeAngle(90)).toBe(90);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(-90)).toBe(-90);
    expect(normalizeAngle(270)).toBe(-90);
    expect(normalizeAngle(450)).toBe(90);
  });

  it('computes rotated bounding box dimensions accurately', () => {
    // 0 deg: same
    const r0 = calculateRotatedBoundingBox(800, 600, 0);
    expect(r0.width).toBe(800);
    expect(r0.height).toBe(600);

    // 90 deg: swapped width and height
    const r90 = calculateRotatedBoundingBox(800, 600, 90);
    expect(r90.width).toBe(600);
    expect(r90.height).toBe(800);

    // 180 deg: same
    const r180 = calculateRotatedBoundingBox(800, 600, 180);
    expect(r180.width).toBe(800);
    expect(r180.height).toBe(600);

    // 270 deg: swapped
    const r270 = calculateRotatedBoundingBox(800, 600, 270);
    expect(r270.width).toBe(600);
    expect(r270.height).toBe(800);
  });

  it('maps standard EXIF orientation tags to transforms', () => {
    // Orientation 1: Normal
    expect(mapExifToTransform(1)).toEqual({ rotateAngle: 0, flipHorizontal: false, flipVertical: false });
    // Orientation 3: 180 deg
    expect(mapExifToTransform(3)).toEqual({ rotateAngle: 180, flipHorizontal: false, flipVertical: false });
    // Orientation 6: 90 deg CW
    expect(mapExifToTransform(6)).toEqual({ rotateAngle: 90, flipHorizontal: false, flipVertical: false });
    // Orientation 8: 270 deg CW
    expect(mapExifToTransform(8)).toEqual({ rotateAngle: 270, flipHorizontal: false, flipVertical: false });
  });
});

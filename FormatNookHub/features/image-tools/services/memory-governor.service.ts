/**
 * Dual-Layer Memory Governor for FormatNook Image Tools.
 * Enforces per-task and total batch memory budgets across Desktop and Mobile devices.
 */

import { MemoryBudget } from '../types/image-tools.types';

// Desktop Limits
export const DESKTOP_MAX_TASK_RAM = 128 * 1024 * 1024; // 128 MB
export const DESKTOP_MAX_BATCH_RAM = 512 * 1024 * 1024; // 512 MB
export const DESKTOP_MAX_CONCURRENCY = 4;

// Mobile Limits (safeguard against iOS Safari / Android tab crash at ~200MB)
export const MOBILE_MAX_TASK_RAM = 48 * 1024 * 1024; // 48 MB
export const MOBILE_MAX_BATCH_RAM = 160 * 1024 * 1024; // 160 MB
export const MOBILE_MAX_CONCURRENCY = 1;

// Base pipeline memory overhead (canvas context, intermediate arrays, DOM wrappers)
export const PIPELINE_OVERHEAD_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Detects whether the current client is a mobile or memory-constrained device.
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // 1. Device Memory API check
  const devNav = navigator as unknown as { deviceMemory?: number };
  if (typeof devNav.deviceMemory === 'number' && devNav.deviceMemory <= 4) {
    return true;
  }

  // 2. Viewport width check (typical mobile viewport <= 768px)
  if (typeof window.matchMedia === 'function') {
    if (window.matchMedia('(max-width: 768px)').matches) {
      return true;
    }
  }

  // 3. Touch user agent heuristic
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile|Silk/i.test(ua)) {
    return true;
  }

  return false;
}

/**
 * Calculates estimated working memory required for an image operation.
 * PeakJobMemory = (WidthIn * HeightIn * 4) + (WidthOut * HeightOut * 4) + Overhead
 */
export function estimateJobMemory(
  widthIn: number,
  heightIn: number,
  widthOut?: number,
  heightOut?: number
): number {
  const wIn = Math.max(1, Math.round(widthIn));
  const hIn = Math.max(1, Math.round(heightIn));
  const wOut = Math.max(1, Math.round(widthOut || widthIn));
  const hOut = Math.max(1, Math.round(heightOut || heightIn));

  const decodedRawIn = wIn * hIn * 4;
  const decodedRawOut = wOut * hOut * 4;
  return decodedRawIn + decodedRawOut + PIPELINE_OVERHEAD_BYTES;
}

export interface TaskMemoryValidation {
  allowed: boolean;
  estimatedBytes: number;
  reason?: string;
}

/**
 * Validates whether a single image task fits within the device memory limits.
 */
export function validateTaskMemory(
  width: number,
  height: number,
  forcedMobile?: boolean
): TaskMemoryValidation {
  const mobile = forcedMobile !== undefined ? forcedMobile : isMobileDevice();
  const maxTaskBytes = mobile ? MOBILE_MAX_TASK_RAM : DESKTOP_MAX_TASK_RAM;
  const estimated = estimateJobMemory(width, height);

  if (estimated > maxTaskBytes) {
    const limitMB = Math.round(maxTaskBytes / (1024 * 1024));
    return {
      allowed: false,
      estimatedBytes: estimated,
      reason: mobile
        ? `Image exceeds mobile memory budget (${limitMB}MB). Please resize or crop the image first.`
        : `Image exceeds task memory budget (${limitMB}MB). Please reduce image dimensions before processing.`,
    };
  }

  return {
    allowed: true,
    estimatedBytes: estimated,
  };
}

/**
 * Calculates adaptive concurrency for batch processing based on image dimensions and device RAM.
 * Formula: Concurrency = min(N_cpu - 1, floor(BatchMemoryCap / PeakJobMemory), MaxCap)
 */
export function calculateAdaptiveConcurrency(
  items: { width: number; height: number }[],
  forcedMobile?: boolean,
  forcedCpuCount?: number
): number {
  const mobile = forcedMobile !== undefined ? forcedMobile : isMobileDevice();

  if (mobile) {
    // Strictly serialized on mobile to prevent WebKit / Blink tab crashes
    return MOBILE_MAX_CONCURRENCY;
  }

  if (!items || items.length === 0) {
    return 1;
  }

  const cpuCount =
    forcedCpuCount !== undefined
      ? forcedCpuCount
      : typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : 4;

  const maxCap = DESKTOP_MAX_CONCURRENCY;
  const cpuBudget = Math.max(1, cpuCount - 1);

  // Find peak memory across items
  let peakMemory = 0;
  for (const item of items) {
    const mem = estimateJobMemory(item.width, item.height);
    if (mem > peakMemory) {
      peakMemory = mem;
    }
  }

  const memoryBudgetConcurrency = Math.floor(DESKTOP_MAX_BATCH_RAM / Math.max(1, peakMemory));
  const candidate = Math.min(cpuBudget, memoryBudgetConcurrency, maxCap);

  return Math.max(1, candidate);
}

/**
 * Returns complete memory budget overview for the current environment.
 */
export function getMemoryBudget(
  items: { width: number; height: number }[] = [],
  forcedMobile?: boolean
): MemoryBudget {
  const isMobile = forcedMobile !== undefined ? forcedMobile : isMobileDevice();
  const maxTaskMemoryBytes = isMobile ? MOBILE_MAX_TASK_RAM : DESKTOP_MAX_TASK_RAM;
  const maxBatchMemoryBytes = isMobile ? MOBILE_MAX_BATCH_RAM : DESKTOP_MAX_BATCH_RAM;
  const concurrency = calculateAdaptiveConcurrency(items, isMobile);

  const estimatedBatchBytes = items.reduce(
    (acc, it) => acc + estimateJobMemory(it.width, it.height),
    0
  );

  return {
    isMobile,
    maxTaskMemoryBytes,
    maxBatchMemoryBytes,
    concurrency,
    estimatedBatchBytes,
  };
}

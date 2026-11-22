import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerPoolService } from '../services/worker-pool.service';
import { BatchItem, PipelineSettings } from '../types/image-tools.types';
import { createDefaultPipelineSettings } from '../services/image-pipeline.service';

describe('Adaptive Web Worker Pool Service', () => {
  let pool: WorkerPoolService;
  let settings: PipelineSettings;

  beforeEach(() => {
    pool = WorkerPoolService.getInstance();
    settings = createDefaultPipelineSettings(800, 600);
  });

  it('provides a singleton instance', () => {
    const p1 = WorkerPoolService.getInstance();
    const p2 = WorkerPoolService.getInstance();
    expect(p1).toBe(p2);
  });

  it('immediately returns cancelled status if task is aborted prior to execution', async () => {
    const controller = new AbortController();
    controller.abort();

    const dummyFile = new File([new Uint8Array([1, 2, 3])], 'test.png', { type: 'image/png' });
    const item: BatchItem = {
      id: 'task-cancelled',
      file: dummyFile,
      name: 'test.png',
      sizeBytes: 3,
      width: 800,
      height: 600,
      status: 'idle',
    };

    const res = await pool.processItem(item, settings, controller.signal);
    expect(res.status).toBe('cancelled');
    expect(res.error).toContain('cancelled');
  });

  it('fails early when an item exceeds maximum allowed memory budget', async () => {
    const dummyFile = new File([new Uint8Array([1, 2, 3])], 'oversized.png', { type: 'image/png' });
    const item: BatchItem = {
      id: 'task-oversized',
      file: dummyFile,
      name: 'oversized.png',
      sizeBytes: 3,
      width: 7000,
      height: 7000, // exceeds 128MB budget
      status: 'idle',
    };

    const res = await pool.processItem(item, settings);
    expect(res.status).toBe('error');
    expect(res.error).toContain('budget');
  });

  it('supports cancellation during batch processing', async () => {
    const dummyFile1 = new File([new Uint8Array([1, 2, 3])], 'item1.png', { type: 'image/png' });
    const dummyFile2 = new File([new Uint8Array([1, 2, 3])], 'item2.png', { type: 'image/png' });

    const items: BatchItem[] = [
      { id: '1', file: dummyFile1, name: 'item1.png', sizeBytes: 3, width: 200, height: 200, status: 'idle' },
      { id: '2', file: dummyFile2, name: 'item2.png', sizeBytes: 3, width: 200, height: 200, status: 'idle' },
    ];

    const controller = new AbortController();
    controller.abort(); // Cancel immediately

    const onItemUpdate = vi.fn();
    const onBatchProgress = vi.fn();

    const results = await pool.processBatch(
      items,
      settings,
      { onItemUpdate, onBatchProgress },
      controller.signal
    );

    // All should be marked cancelled
    for (const r of results) {
      expect(r.status).toBe('cancelled');
    }
  });

  it('safely terminates all worker instances', () => {
    expect(() => pool.terminateAllWorkers()).not.toThrow();
  });
});

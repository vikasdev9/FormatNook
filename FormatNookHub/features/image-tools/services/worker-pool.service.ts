/**
 * Adaptive Web Worker Pool Service for FormatNook Image Tools.
 * Coordinates worker allocation, memory throttling, 30s idle termination, crash recovery, and cancellation.
 */

import {
  BatchItem,
  BatchProgress,
  PipelineSettings,
  WorkerTaskRequest,
  WorkerTaskResponse,
} from '../types/image-tools.types';
import {
  calculateAdaptiveConcurrency,
  validateTaskMemory,
  isMobileDevice,
} from './memory-governor.service';
import {
  createImageProcessorWorker,
  executeTaskOnWorker,
  isWorkerPipelineSupported,
} from '../workers/worker-bridge';
import { loadImage, renderPipeline } from './image-pipeline.service';

interface PooledWorker {
  id: number;
  worker: Worker;
  busy: boolean;
}

export class WorkerPoolService {
  private static instance: WorkerPoolService | null = null;
  private workers: PooledWorker[] = [];
  private nextWorkerId = 1;
  private idleTimer: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT_MS = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): WorkerPoolService {
    if (!WorkerPoolService.instance) {
      WorkerPoolService.instance = new WorkerPoolService();
    }
    return WorkerPoolService.instance;
  }

  /**
   * Resets idle timer and terminates all idle workers after 30 seconds of inactivity.
   */
  private scheduleIdleTermination(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.terminateAllWorkers();
    }, this.IDLE_TIMEOUT_MS);
  }

  /**
   * Terminates all active worker threads and clears the pool.
   */
  public terminateAllWorkers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    for (const entry of this.workers) {
      try {
        entry.worker.terminate();
      } catch (e) {
        console.warn('Error terminating worker:', e);
      }
    }
    this.workers = [];
  }

  /**
   * Spawns or borrows an available worker from the pool.
   */
  private acquireWorker(maxAllowed: number): PooledWorker | null {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // Try finding an idle worker
    const idle = this.workers.find((w) => !w.busy);
    if (idle) {
      idle.busy = true;
      return idle;
    }

    // Spawn new worker if under maxAllowed
    if (this.workers.length < maxAllowed) {
      const workerInstance = createImageProcessorWorker();
      if (workerInstance) {
        const pooled: PooledWorker = {
          id: this.nextWorkerId++,
          worker: workerInstance,
          busy: true,
        };
        this.workers.push(pooled);
        return pooled;
      }
    }

    return null;
  }

  /**
   * Releases a worker back to the pool, or replaces it if it faulted.
   */
  private releaseWorker(workerId: number, faultOccurred: boolean = false): void {
    const idx = this.workers.findIndex((w) => w.id === workerId);
    if (idx !== -1) {
      if (faultOccurred) {
        try {
          this.workers[idx].worker.terminate();
        } catch {}
        this.workers.splice(idx, 1);
      } else {
        this.workers[idx].busy = false;
      }
    }

    // Check if all workers are idle
    const anyBusy = this.workers.some((w) => w.busy);
    if (!anyBusy) {
      this.scheduleIdleTermination();
    }
  }

  /**
   * Processes a single batch item using Web Worker (with fallback to main-thread renderPipeline).
   */
  public async processItem(
    item: BatchItem,
    settings: PipelineSettings,
    signal?: AbortSignal
  ): Promise<BatchItem> {
    if (signal?.aborted) {
      return { ...item, status: 'cancelled', error: 'Operation cancelled by user' };
    }

    // 1. Validate Memory Budget Upfront
    const validation = validateTaskMemory(item.width, item.height);
    if (!validation.allowed) {
      return {
        ...item,
        status: 'error',
        error: validation.reason || 'Memory budget exceeded.',
      };
    }

    // 2. Determine if Web Worker is available
    const workerSupported = isWorkerPipelineSupported();

    if (workerSupported) {
      const maxConcurrency = calculateAdaptiveConcurrency([item]);
      let pooled = this.acquireWorker(maxConcurrency);

      // Wait if all workers are busy (poll briefly)
      let waitAttempts = 0;
      while (!pooled && waitAttempts < 60) {
        if (signal?.aborted) {
          return { ...item, status: 'cancelled', error: 'Operation cancelled' };
        }
        await new Promise((r) => setTimeout(r, 50));
        pooled = this.acquireWorker(maxConcurrency);
        waitAttempts++;
      }

      if (pooled) {
        try {
          const fileBuffer = await item.file.arrayBuffer();

          if (signal?.aborted) {
            this.releaseWorker(pooled.id);
            return { ...item, status: 'cancelled', error: 'Operation cancelled' };
          }

          const request: WorkerTaskRequest = {
            taskId: item.id,
            fileBuffer,
            settings,
            originalMime: item.file.type || 'image/png',
            width: item.width,
            height: item.height,
          };

          const response: WorkerTaskResponse = await executeTaskOnWorker(
            pooled.worker,
            request,
            45000 // 45s timeout per item
          );

          this.releaseWorker(pooled.id, false);

          if (response.status === 'success' && response.outputBuffer) {
            const outputBlob = new Blob([response.outputBuffer], {
              type: response.mimeType || 'image/png',
            });
            const outputUrl = URL.createObjectURL(outputBlob);
            return {
              ...item,
              status: 'done',
              progress: 100,
              outputBlob,
              outputUrl,
              outputSize: response.sizeBytes || outputBlob.size,
              width: response.width || item.width,
              height: response.height || item.height,
            };
          } else {
            return {
              ...item,
              status: 'error',
              error: response.error || 'Worker failed to render image.',
            };
          }
        } catch (workerErr: any) {
          this.releaseWorker(pooled.id, true); // fault occurred, respawn
          console.warn('Worker error, falling back to main-thread pipeline:', workerErr);
          // Fall through to main-thread pipeline fallback below
        }
      }
    }

    // 3. Fallback to Main-Thread Pipeline (for Node/JSDOM tests or unsupported browsers)
    try {
      if (signal?.aborted) {
        return { ...item, status: 'cancelled', error: 'Operation cancelled' };
      }

      const img = await loadImage(item.file);
      const res = await renderPipeline(img, settings, item.file.type || 'image/png');

      return {
        ...item,
        status: 'done',
        progress: 100,
        outputBlob: res.blob,
        outputUrl: res.objectUrl,
        outputSize: res.sizeBytes,
        width: res.width,
        height: res.height,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        error: err?.message || 'Failed to process image on main thread.',
      };
    }
  }

  /**
   * Executes a batch of items with adaptive concurrency, live progress, and cancellation.
   */
  public async processBatch(
    items: BatchItem[],
    settings: PipelineSettings,
    callbacks: {
      onItemUpdate: (updated: BatchItem) => void;
      onBatchProgress: (progress: BatchProgress) => void;
    },
    signal?: AbortSignal
  ): Promise<BatchItem[]> {
    if (!items || items.length === 0) {
      return [];
    }

    const concurrency = calculateAdaptiveConcurrency(items);
    const results: BatchItem[] = [...items];
    const total = items.length;
    let completedCount = 0;
    let failedCount = 0;
    let inFlightCount = 0;

    const startTime = Date.now();
    const itemDurations: number[] = [];

    const updateProgress = () => {
      const finished = completedCount + failedCount;
      const percent = total > 0 ? Math.round((finished / total) * 100) : 0;

      let etaSeconds: number | null = null;
      if (finished > 0 && finished < total && itemDurations.length > 0) {
        const avgDuration =
          itemDurations.reduce((a, b) => a + b, 0) / itemDurations.length;
        const remainingItems = total - finished;
        const estimatedRemainingMs = (remainingItems * avgDuration) / concurrency;
        etaSeconds = Math.max(1, Math.round(estimatedRemainingMs / 1000));
      }

      callbacks.onBatchProgress({
        total,
        completed: completedCount,
        failed: failedCount,
        inFlight: inFlightCount,
        percent,
        etaSeconds,
      });
    };

    // Queue pointer
    let nextIndex = 0;

    const workerLoop = async () => {
      while (nextIndex < total) {
        if (signal?.aborted) {
          break;
        }

        const currentIndex = nextIndex++;
        const currentItem = results[currentIndex];

        // Skip if already done
        if (currentItem.status === 'done') {
          completedCount++;
          updateProgress();
          continue;
        }

        inFlightCount++;
        results[currentIndex] = { ...currentItem, status: 'processing', progress: 10 };
        callbacks.onItemUpdate(results[currentIndex]);
        updateProgress();

        const itemStart = Date.now();
        const processed = await this.processItem(currentItem, settings, signal);
        const itemEnd = Date.now();
        itemDurations.push(itemEnd - itemStart);

        inFlightCount--;
        results[currentIndex] = processed;
        callbacks.onItemUpdate(processed);

        if (processed.status === 'done') {
          completedCount++;
        } else if (processed.status === 'error') {
          failedCount++;
        }

        updateProgress();
      }
    };

    // Run parallel workers up to concurrency
    const runners: Promise<void>[] = [];
    const activeWorkers = Math.min(concurrency, total);

    for (let i = 0; i < activeWorkers; i++) {
      runners.push(workerLoop());
    }

    await Promise.all(runners);

    // If cancelled, mark remaining queued items as cancelled
    if (signal?.aborted) {
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'idle' || results[i].status === 'processing') {
          results[i] = {
            ...results[i],
            status: 'cancelled',
            error: 'Batch cancelled by user',
          };
          callbacks.onItemUpdate(results[i]);
        }
      }
      this.terminateAllWorkers();
    }

    updateProgress();
    return results;
  }
}

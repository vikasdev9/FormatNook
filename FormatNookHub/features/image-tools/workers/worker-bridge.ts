import { WorkerTaskRequest, WorkerTaskResponse } from '../types/image-tools.types';

/**
 * Checks whether Web Workers, OffscreenCanvas, and createImageBitmap are supported in the current environment.
 */
export function isWorkerPipelineSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap === 'function'
  );
}

/**
 * Instantiates a new image processing Web Worker using Next.js / Webpack 5 module worker syntax.
 */
export function createImageProcessorWorker(): Worker | null {
  if (!isWorkerPipelineSupported()) {
    return null;
  }

  try {
    return new Worker(new URL('./image-processor.worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch (err) {
    console.warn('Failed to instantiate image-processor.worker:', err);
    return null;
  }
}

/**
 * Dispatches a single task to a Worker with zero-copy buffer transfer, timeout protection, and response handling.
 */
export function executeTaskOnWorker(
  worker: Worker,
  request: WorkerTaskRequest,
  timeoutMs: number = 60000
): Promise<WorkerTaskResponse> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };

    const handleMessage = (event: MessageEvent<WorkerTaskResponse>) => {
      if (event.data.taskId === request.taskId) {
        cleanup();
        resolve(event.data);
      }
    };

    const handleError = (error: ErrorEvent) => {
      cleanup();
      reject(new Error(error.message || 'Worker encountered an unhandled execution error.'));
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Worker execution timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    // Transfer input buffer to worker without memory duplication
    worker.postMessage(request, [request.fileBuffer]);
  });
}

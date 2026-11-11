import { JsonStats, JsonPathMatch } from '../types/json.types';
import { computeJsonStats } from './json-stats-service';
import { evaluateJsonPath } from './json-path-service';

export interface WorkerJobResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  executionTimeMs: number;
}

const WORKER_SCRIPT = `
self.onmessage = function(e) {
  const { id, action, payload } = e.data;
  const start = performance.now();

  try {
    if (action === 'parse') {
      const parsed = JSON.parse(payload.jsonString);
      self.postMessage({ id, success: true, data: parsed, executionTimeMs: Math.round(performance.now() - start) });
    } else if (action === 'format') {
      const parsed = JSON.parse(payload.jsonString);
      const indent = payload.indent === 'tab' ? '\\t' : Number(payload.indent || 2);
      const output = JSON.stringify(parsed, null, indent);
      self.postMessage({ id, success: true, data: output, executionTimeMs: Math.round(performance.now() - start) });
    } else if (action === 'minify') {
      const parsed = JSON.parse(payload.jsonString);
      const output = JSON.stringify(parsed);
      self.postMessage({ id, success: true, data: output, executionTimeMs: Math.round(performance.now() - start) });
    } else {
      self.postMessage({ id, success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    self.postMessage({ id, success: false, error: err && err.message ? err.message : 'Worker error' });
  }
};
`;

interface PendingWorkerJob<T = any> {
  resolve: (res: WorkerJobResult<T>) => void;
  reject: (err: any) => void;
  settled: boolean;
}

export class JsonWorkerClient {
  private worker: Worker | null = null;
  private workerUrl: string | null = null;
  private currentJobId = 0;
  private pendingCallbacks = new Map<number, PendingWorkerJob>();
  private activeConsumerCount = 0;

  /**
   * Reference-counted consumer acquisition.
   * Returns a release function to be called on component unmount.
   * If the last consumer releases the worker, the background worker is safely terminated.
   */
  public acquire(): () => void {
    this.activeConsumerCount++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.release();
    };
  }

  public release() {
    this.activeConsumerCount = Math.max(0, this.activeConsumerCount - 1);
    if (this.activeConsumerCount === 0 && this.worker) {
      this.terminate();
    }
  }

  public getActiveConsumerCount(): number {
    return this.activeConsumerCount;
  }

  public isWorkerActive(): boolean {
    return this.worker !== null;
  }

  private initWorker() {
    if (this.worker) return;
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(this.workerUrl);

      this.worker.onmessage = (e: MessageEvent) => {
        const { id } = e.data || {};
        if (id !== undefined && this.pendingCallbacks.has(id)) {
          const job = this.pendingCallbacks.get(id)!;
          if (!job.settled) {
            job.settled = true;
            this.pendingCallbacks.delete(id);
            job.resolve(e.data);
          }
        }
      };

      this.worker.onerror = (err: any) => {
        const errorMsg =
          err?.message || (typeof err === 'string' ? err : 'Web Worker crashed or ran out of memory');
        this.handleCrash(errorMsg);
      };
    } catch (e) {
      console.warn('Failed to initialize inline JsonWorker, using main thread fallback:', e);
      this.worker = null;
    }
  }

  public handleCrash(errorMsg: string) {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // ignore
      }
      this.worker = null;
    }
    if (this.workerUrl) {
      try {
        URL.revokeObjectURL(this.workerUrl);
      } catch {
        // ignore
      }
      this.workerUrl = null;
    }

    const callbacksToReject = Array.from(this.pendingCallbacks.values());
    this.pendingCallbacks.clear();

    for (const job of callbacksToReject) {
      if (!job.settled) {
        job.settled = true;
        job.reject(new Error(`Worker error: ${errorMsg}`));
      }
    }
  }

  public terminate() {
    this.handleCrash('Worker was terminated');
  }

  public getPendingCount(): number {
    return this.pendingCallbacks.size;
  }

  public async parse(jsonString: string): Promise<WorkerJobResult<any>> {
    const start = performance.now();
    this.initWorker();

    if (!this.worker) {
      // Main-thread fallback
      try {
        const data = JSON.parse(jsonString);
        return { success: true, data, executionTimeMs: Math.round(performance.now() - start) };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Invalid JSON', executionTimeMs: Math.round(performance.now() - start) };
      }
    }

    return new Promise((resolve, reject) => {
      const id = ++this.currentJobId;
      this.pendingCallbacks.set(id, { resolve, reject, settled: false });
      this.worker!.postMessage({ id, action: 'parse', payload: { jsonString } });
    });
  }

  public async format(jsonString: string, indent: string = '2'): Promise<WorkerJobResult<string>> {
    const start = performance.now();
    this.initWorker();

    if (!this.worker) {
      try {
        const parsed = JSON.parse(jsonString);
        const indentVal = indent === 'tab' ? '\t' : Number(indent);
        const data = JSON.stringify(parsed, null, indentVal);
        return { success: true, data, executionTimeMs: Math.round(performance.now() - start) };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Format failed', executionTimeMs: Math.round(performance.now() - start) };
      }
    }

    return new Promise((resolve, reject) => {
      const id = ++this.currentJobId;
      this.pendingCallbacks.set(id, { resolve, reject, settled: false });
      this.worker!.postMessage({ id, action: 'format', payload: { jsonString, indent } });
    });
  }

  public async minify(jsonString: string): Promise<WorkerJobResult<string>> {
    const start = performance.now();
    this.initWorker();

    if (!this.worker) {
      try {
        const parsed = JSON.parse(jsonString);
        const data = JSON.stringify(parsed);
        return { success: true, data, executionTimeMs: Math.round(performance.now() - start) };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Minify failed', executionTimeMs: Math.round(performance.now() - start) };
      }
    }

    return new Promise((resolve, reject) => {
      const id = ++this.currentJobId;
      this.pendingCallbacks.set(id, { resolve, reject, settled: false });
      this.worker!.postMessage({ id, action: 'minify', payload: { jsonString } });
    });
  }
}

export const jsonWorkerClient = new JsonWorkerClient();


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

class JsonWorkerClient {
  private worker: Worker | null = null;
  private workerUrl: string | null = null;
  private currentJobId = 0;
  private pendingCallbacks = new Map<number, (res: any) => void>();

  private initWorker() {
    if (this.worker) return;
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(this.workerUrl);

      this.worker.onmessage = (e) => {
        const { id } = e.data;
        const cb = this.pendingCallbacks.get(id);
        if (cb) {
          this.pendingCallbacks.delete(id);
          cb(e.data);
        }
      };

      this.worker.onerror = (err) => {
        console.error('JsonWorker error:', err);
      };
    } catch (e) {
      console.warn('Failed to initialize inline JsonWorker, using main thread fallback:', e);
      this.worker = null;
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workerUrl) {
      URL.revokeObjectURL(this.workerUrl);
      this.workerUrl = null;
    }
    this.pendingCallbacks.clear();
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

    return new Promise((resolve) => {
      const id = ++this.currentJobId;
      this.pendingCallbacks.set(id, (res) => resolve(res));
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

    return new Promise((resolve) => {
      const id = ++this.currentJobId;
      this.pendingCallbacks.set(id, (res) => resolve(res));
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

    return new Promise((resolve) => {
      const id = ++this.currentJobId;
      this.pendingCallbacks.set(id, (res) => resolve(res));
      this.worker!.postMessage({ id, action: 'minify', payload: { jsonString } });
    });
  }
}

export const jsonWorkerClient = new JsonWorkerClient();


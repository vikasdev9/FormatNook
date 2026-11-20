import { describe, it, expect, vi } from 'vitest';
import { diffWorkerClient, DiffWorkerClient } from '../services/diff-worker-client';
import { DEFAULT_DIFF_OPTIONS } from '../services/diff-service';

describe('diff-worker-client', () => {
  it('computes basic line differences accurately', async () => {
    const orig = 'alpha\nbeta\ngamma';
    const mod = 'alpha\nbeta updated\ngamma\ndelta';

    const res = await diffWorkerClient.computeDiff(orig, mod, DEFAULT_DIFF_OPTIONS);

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.statistics.addedLines).toBeGreaterThan(0);
    expect(res.data?.unifiedDiffText).toContain('+delta');
    expect(res.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('handles identical inputs correctly', async () => {
    const text = 'line 1\nline 2\nline 3';
    const res = await diffWorkerClient.computeDiff(text, text, DEFAULT_DIFF_OPTIONS);

    expect(res.success).toBe(true);
    expect(res.data?.isIdentical).toBe(true);
    expect(res.data?.statistics.addedLines).toBe(0);
    expect(res.data?.statistics.removedLines).toBe(0);
  });

  it('handles empty inputs correctly', async () => {
    const res = await diffWorkerClient.computeDiff('', '', DEFAULT_DIFF_OPTIONS);

    expect(res.success).toBe(true);
    expect(res.data?.isEmpty).toBe(true);
    expect(res.data?.isIdentical).toBe(true);
  });

  it('manages consumer reference counts with acquire and release', () => {
    const client = new DiffWorkerClient();
    expect(client.getActiveConsumerCount()).toBe(0);

    const release1 = client.acquire();
    expect(client.getActiveConsumerCount()).toBe(1);

    const release2 = client.acquire();
    expect(client.getActiveConsumerCount()).toBe(2);

    release1();
    expect(client.getActiveConsumerCount()).toBe(1);

    // Redundant call should be a no-op
    release1();
    expect(client.getActiveConsumerCount()).toBe(1);

    release2();
    expect(client.getActiveConsumerCount()).toBe(0);
  });

  describe('Crash and error handling', () => {
    it('rejects pending jobs on worker crash and cleans up callbacks', async () => {
      const client = new DiffWorkerClient();
      const p = new Promise((resolve, reject) => {
        (client as any).pendingCallbacks.set(1, { resolve, reject, settled: false });
      });

      expect(client.getPendingCount()).toBe(1);

      client.handleCrash('Heap limit exceeded');

      await expect(p).rejects.toThrow('Worker error: Heap limit exceeded');
      expect(client.getPendingCount()).toBe(0);
    });

    it('terminates cleanly when terminate() is called', () => {
      const client = new DiffWorkerClient();
      client.terminate();
      expect(client.isWorkerActive()).toBe(false);
      expect(client.getPendingCount()).toBe(0);
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { jsonWorkerClient, JsonWorkerClient } from '../services/json-worker-client';

describe('json-worker-client (fallback and API test)', () => {
  it('formats JSON string accurately', async () => {
    const raw = '{"a":1,"b":2}';
    const res = await jsonWorkerClient.format(raw, '2');
    expect(res.success).toBe(true);
    expect(res.data).toContain('  "a": 1');
  });

  it('minifies JSON string accurately', async () => {
    const formatted = '{\n  "name": "FormatNook"\n}';
    const res = await jsonWorkerClient.minify(formatted);
    expect(res.success).toBe(true);
    expect(res.data).toBe('{"name":"FormatNook"}');
  });

  it('parses JSON string into JavaScript data object', async () => {
    const raw = '{"scores":[10,20,30]}';
    const res = await jsonWorkerClient.parse(raw);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ scores: [10, 20, 30] });
  });

  it('reports error on invalid JSON payload', async () => {
    const invalid = '{ broken: json ';
    const res = await jsonWorkerClient.parse(invalid);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  describe('Worker error and crash handling', () => {
    it('rejects a single pending request on worker crash and clears callbacks', async () => {
      const client = new JsonWorkerClient();
      // Simulate registering a pending job
      const p = new Promise((resolve, reject) => {
        (client as any).pendingCallbacks.set(1, { resolve, reject, settled: false });
      });

      expect(client.getPendingCount()).toBe(1);

      // Trigger crash
      client.handleCrash('Out of memory');

      await expect(p).rejects.toThrow('Worker error: Out of memory');
      expect(client.getPendingCount()).toBe(0);
    });

    it('rejects multiple pending requests on worker crash and prevents duplicate settling', async () => {
      const client = new JsonWorkerClient();
      let settledCount1 = 0;
      let settledCount2 = 0;

      const p1 = new Promise((resolve, reject) => {
        (client as any).pendingCallbacks.set(1, {
          resolve: (val: any) => { settledCount1++; resolve(val); },
          reject: (err: any) => { settledCount1++; reject(err); },
          settled: false,
        });
      });
      const p2 = new Promise((resolve, reject) => {
        (client as any).pendingCallbacks.set(2, {
          resolve: (val: any) => { settledCount2++; resolve(val); },
          reject: (err: any) => { settledCount2++; reject(err); },
          settled: false,
        });
      });

      expect(client.getPendingCount()).toBe(2);

      // Trigger crash
      client.handleCrash('Fatal heap error');

      await Promise.allSettled([p1, p2]);

      expect(settledCount1).toBe(1);
      expect(settledCount2).toBe(1);
      expect(client.getPendingCount()).toBe(0);

      // Subsequent crash call does not double-settle
      client.handleCrash('Second crash attempt');
      expect(settledCount1).toBe(1);
      expect(settledCount2).toBe(1);
    });

    it('ensures subsequent operations work after worker failure', async () => {
      const client = new JsonWorkerClient();
      client.handleCrash('Initial crash simulation');

      // Subsequent operation uses clean state or fallback
      const result = await client.format('{"recovered": true}', '2');
      expect(result.success).toBe(true);
      expect(result.data).toContain('"recovered": true');
    });

    it('clears pending callbacks and rejects jobs on explicit terminate', async () => {
      const client = new JsonWorkerClient();
      const p = new Promise((resolve, reject) => {
        (client as any).pendingCallbacks.set(10, { resolve, reject, settled: false });
      });

      client.terminate();
      await expect(p).rejects.toThrow('Worker was terminated');
      expect(client.getPendingCount()).toBe(0);
    });
  });

  describe('Worker reference-counted lifecycle management', () => {
    it('manages consumer reference counts correctly', () => {
      const client = new JsonWorkerClient();
      expect(client.getActiveConsumerCount()).toBe(0);

      const release1 = client.acquire();
      expect(client.getActiveConsumerCount()).toBe(1);

      const release2 = client.acquire();
      expect(client.getActiveConsumerCount()).toBe(2);

      release1();
      expect(client.getActiveConsumerCount()).toBe(1);

      // Re-calling release1 is idempotent
      release1();
      expect(client.getActiveConsumerCount()).toBe(1);

      release2();
      expect(client.getActiveConsumerCount()).toBe(0);
    });

    it('terminates worker only when the last active consumer releases', () => {
      const client = new JsonWorkerClient();
      const terminateSpy = vi.spyOn(client, 'terminate');

      // Simulate active worker
      (client as any).worker = { terminate: vi.fn() };

      const release1 = client.acquire();
      const release2 = client.acquire();

      // First consumer unmounts
      release1();
      expect(terminateSpy).not.toHaveBeenCalled();

      // Second (last) consumer unmounts
      release2();
      expect(terminateSpy).toHaveBeenCalledTimes(1);
    });

    it('allows fresh worker initialization after release and termination', async () => {
      const client = new JsonWorkerClient();
      const release = client.acquire();
      release();

      // Re-acquiring and running a job works cleanly
      const releaseAgain = client.acquire();
      const res = await client.format('{"fresh": true}', '2');
      expect(res.success).toBe(true);
      expect(res.data).toContain('"fresh": true');
      releaseAgain();
    });
  });
});


import { describe, it, expect } from 'vitest';
import { jsonWorkerClient } from '../services/json-worker-client';

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
});


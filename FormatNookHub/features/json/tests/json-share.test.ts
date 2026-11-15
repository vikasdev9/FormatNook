import { describe, it, expect } from 'vitest';
import { createJsonSharePayload } from '../adapters/json-share.adapter';

describe('json-share.adapter', () => {
  const sampleJson = '{\n  "name": "FormatNook",\n  "tools": ["json", "yaml", "diff", "base64"],\n  "features": {\n    "share": true,\n    "version": 2\n  }\n}';

  it('returns null when json is empty', () => {
    expect(createJsonSharePayload('')).toBeNull();
    expect(createJsonSharePayload('   ')).toBeNull();
  });

  it('creates 3 valid format options for valid JSON', async () => {
    const payload = createJsonSharePayload(sampleJson);
    expect(payload).not.toBeNull();
    expect(payload!.toolTitle).toBe('JSON Workspace');
    expect(payload!.options).toHaveLength(3);

    const ids = payload!.options.map((o) => o.id);
    expect(ids).toEqual(['formatted-json', 'minified-json', 'json-metrics']);

    // Formatted option
    const formattedOpt = payload!.options.find((o) => o.id === 'formatted-json')!;
    const fRes = await formattedOpt.generate();
    expect(fRes.fileName).toBe('formatted.json');
    expect(typeof fRes.content).toBe('string');
    expect(fRes.content).toContain('\n');

    // Minified option
    const minifiedOpt = payload!.options.find((o) => o.id === 'minified-json')!;
    const mRes = await minifiedOpt.generate();
    expect(mRes.fileName).toBe('minified.json');
    expect((mRes.content as string).includes('\n')).toBe(false);

    // Metrics option
    const metricsOpt = payload!.options.find((o) => o.id === 'json-metrics')!;
    const metRes = await metricsOpt.generate();
    expect(metRes.fileName).toBe('json-metrics-report.json');
    const parsedReport = JSON.parse(metRes.content as string);
    expect(parsedReport.valid).toBe(true);
    expect(parsedReport.metrics.totalKeys).toBeGreaterThanOrEqual(4);
    expect(parsedReport.metrics.maxDepth).toBeGreaterThanOrEqual(2);
  });
});

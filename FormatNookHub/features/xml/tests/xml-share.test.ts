import { describe, it, expect } from 'vitest';
import { createXmlSharePayload } from '../adapters/xml-share.adapter';

describe('xml-share.adapter', () => {
  const sampleXml = '<catalog>\n  <item id="101">\n    <name>FormatNook XML</name>\n  </item>\n</catalog>';

  it('returns null when xml is empty', () => {
    expect(createXmlSharePayload('')).toBeNull();
    expect(createXmlSharePayload('   ')).toBeNull();
  });

  it('creates formatted, minified, and metrics options for XML', async () => {
    const payload = createXmlSharePayload(sampleXml);
    expect(payload).not.toBeNull();
    expect(payload!.toolTitle).toBe('XML Workspace');
    expect(payload!.options).toHaveLength(3);

    const ids = payload!.options.map((o) => o.id);
    expect(ids).toEqual(['formatted-xml', 'minified-xml', 'xml-metrics']);

    // Formatted XML
    const fOpt = payload!.options.find((o) => o.id === 'formatted-xml')!;
    const fRes = await fOpt.generate();
    expect(fRes.fileName).toBe('formatted.xml');
    expect(fRes.content).toBe(sampleXml);

    // Minified XML
    const mOpt = payload!.options.find((o) => o.id === 'minified-xml')!;
    const mRes = await mOpt.generate();
    expect(mRes.fileName).toBe('minified.xml');
    expect((mRes.content as string).includes('\n')).toBe(false);

    // Metrics Report
    const metOpt = payload!.options.find((o) => o.id === 'xml-metrics')!;
    const metRes = await metOpt.generate();
    expect(metRes.fileName).toBe('xml-metrics-report.json');
    const parsed = JSON.parse(metRes.content as string);
    expect(parsed.metrics.tagCount).toBeGreaterThanOrEqual(3);
    expect(parsed.metrics.attributeCount).toBeGreaterThanOrEqual(1);
  });
});

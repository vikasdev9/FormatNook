import { describe, it, expect } from 'vitest';
import { createBeautifierSharePayload } from '../adapters/beautifier-share.adapter';

describe('beautifier-share.adapter', () => {
  const sampleSql = 'SELECT id, name, created_at FROM users WHERE active = 1 ORDER BY id DESC;';

  it('returns null when content is empty', () => {
    expect(createBeautifierSharePayload('', 'sql', 'query.sql')).toBeNull();
  });

  it('creates formatted code and summary options for SQL beautifier', async () => {
    const payload = createBeautifierSharePayload(sampleSql, 'sql', 'formatted.sql');
    expect(payload).not.toBeNull();
    expect(payload!.toolTitle).toBe('SQL Beautifier');
    expect(payload!.options).toHaveLength(2);

    const ids = payload!.options.map((o) => o.id);
    expect(ids).toEqual(['formatted-code', 'beautifier-summary']);

    const codeOpt = payload!.options.find((o) => o.id === 'formatted-code')!;
    const cRes = await codeOpt.generate();
    expect(cRes.fileName).toBe('formatted.sql');
    expect(cRes.content).toBe(sampleSql);
    expect(cRes.mimeType).toContain('application/sql');

    const summaryOpt = payload!.options.find((o) => o.id === 'beautifier-summary')!;
    const sRes = await summaryOpt.generate();
    expect(sRes.fileName).toBe('sql-beautifier-summary.txt');
    expect(sRes.content).toContain('FORMATNOOK HUB — SQL BEAUTIFIER AUDIT REPORT');
  });
});

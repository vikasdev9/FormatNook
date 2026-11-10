import { describe, it, expect } from 'vitest';
import { formatXml, validateXml, minifyXml } from '../services/xml-service';

describe('xml-service', () => {
  const validXml = '<?xml version="1.0"?><catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer\'s Guide</title></book></catalog>';

  it('formats valid XML with indentation', () => {
    const result = formatXml(validXml, '2');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('  <book id="bk101">');
  });

  it('minifies XML cleanly', () => {
    const formatted = `<root>\n  <item>1</item>\n  <item>2</item>\n</root>`;
    const result = minifyXml(formatted);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('<root><item>1</item><item>2</item></root>');
  });

  it('detects unclosed XML tags', () => {
    const broken = '<root><item>Hello</root>';
    const validation = validateXml(broken);
    expect(validation.isValid).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);
  });

  it('handles self-closing elements and attributes', () => {
    const xmlWithSelfClosing = '<gallery><image src="photo.png" width="200" /><image src="banner.jpg" /></gallery>';
    const result = formatXml(xmlWithSelfClosing);
    expect(result.isValid).toBe(true);
  });
});

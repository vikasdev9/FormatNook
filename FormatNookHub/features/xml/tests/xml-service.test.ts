import { describe, it, expect } from 'vitest';
import { formatXml, validateXml, minifyXml } from '../services/xml-service';

describe('xml-service', () => {
  const validXml = '<?xml version="1.0"?><catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer\'s Guide</title></book></catalog>';

  it('formats valid XML with indentation', () => {
    const result = formatXml(validXml, '2');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('  <book id="bk101">');
  });

  it('minifies XML cleanly by removing inter-tag whitespace', () => {
    const formatted = `<root>\n  <item>1</item>\n  <item>2</item>\n</root>`;
    const result = minifyXml(formatted);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('<root><item>1</item><item>2</item></root>');
  });

  it('preserves multiple spaces and formatting inside text nodes', () => {
    const xml = `<root>\n  <text>preserve   three   spaces</text>\n</root>`;
    const result = minifyXml(xml);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('<root><text>preserve   three   spaces</text></root>');
  });

  it('preserves newlines, spaces, and indentation inside CDATA sections', () => {
    const cdataXml = `<root>\n  <data><![CDATA[\n    function test() {\n      return true;\n    }\n  ]]></data>\n</root>`;
    const result = minifyXml(cdataXml);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe(
      '<root><data><![CDATA[\n    function test() {\n      return true;\n    }\n  ]]></data></root>'
    );
  });

  it('preserves spaces in mixed content elements', () => {
    const mixed = `<p>text with <b>bold</b> and spaces</p>`;
    const result = minifyXml(mixed);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('<p>text with <b>bold</b> and spaces</p>');
  });

  it('handles empty elements and self-closing tags', () => {
    const xml = `<root>\n  <empty></empty>\n  <closed/>\n</root>`;
    const result = minifyXml(xml);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('<root><empty></empty><closed/></root>');
  });

  it('preserves spaces inside attribute values while collapsing extraneous attribute spacing', () => {
    const xml = `<root>\n  <item   name="First   Last"   id="123"   />\n</root>`;
    const result = minifyXml(xml);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('<root><item name="First   Last" id="123"/></root>');
  });

  it('preserves comments', () => {
    const xml = `<root>\n  <!-- Important notice -->\n  <value>42</value>\n</root>`;
    const result = minifyXml(xml);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('<root><!-- Important notice --><value>42</value></root>');
  });

  it('detects unclosed XML tags', () => {
    const broken = '<root><item>Hello</root>';
    const validation = validateXml(broken);
    expect(validation.isValid).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);
  });

  it('handles self-closing elements and attributes in formatter', () => {
    const xmlWithSelfClosing = '<gallery><image src="photo.png" width="200" /><image src="banner.jpg" /></gallery>';
    const result = formatXml(xmlWithSelfClosing);
    expect(result.isValid).toBe(true);
  });
});

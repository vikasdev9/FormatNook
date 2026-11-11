import { describe, it, expect } from 'vitest';
import {
  formatXml,
  minifyXml,
  validateXml,
  oneLineXml,
  escapeXml,
  unescapeXml,
} from '../services/xml-service';
import { parseXmlToTree } from '../services/xml-parser-service';
import { evaluateXPath, COMMON_XPATH_PRESETS } from '../services/xml-xpath-service';
import {
  xmlToJson,
  jsonToXmlString,
  xmlToYaml,
  xmlToCsv,
  xmlToStringLiteral,
} from '../services/xml-converter-service';
import { analyzeSpecializedXml } from '../services/xml-specialized-service';
import { XML_SAMPLES } from '../services/xml-samples';

describe('XML Advanced Processing & Feature Suite', () => {
  describe('Formatting & Validation', () => {
    it('formats nested XML with clean indentation', () => {
      const xml = '<root><user id="1"><name>Alice</name></user></root>';
      const res = formatXml(xml, '2');
      expect(res.isValid).toBe(true);
      expect(res.output).toContain('<root>');
      expect(res.output).toContain('  <user id="1">');
      expect(res.output).toContain('    <name>Alice</name>');
    });

    it('preserves CDATA sections and comments during minification', () => {
      const xml = '<note><!-- comment --><content><![CDATA[Some <raw> data & entities]]></content></note>';
      const res = minifyXml(xml);
      expect(res.isValid).toBe(true);
      expect(res.output).toContain('<!-- comment -->');
      expect(res.output).toContain('<![CDATA[Some <raw> data & entities]]>');
    });

    it('collapses XML to one-line format', () => {
      const xml = `
<root>
  <item>1</item>
  <item>2</item>
</root>`;
      const oneline = oneLineXml(xml);
      expect(oneline).not.toContain('\n');
      expect(oneline).toContain('<root>');
      expect(oneline).toContain('</root>');
    });

    it('escapes and unescapes XML literals cleanly', () => {
      const raw = '<root name="test">\n  <item>value</item>\n</root>';
      const escaped = escapeXml(raw);
      expect(escaped).toContain('\\n');
      expect(escaped).toContain('\\"');

      const unescaped = unescapeXml(escaped);
      expect(unescaped).toBe(raw);
    });

    it('flags unclosed and mismatched tags with line numbers', () => {
      const broken = '<root><child>value</other></root>';
      const val = validateXml(broken);
      expect(val.isValid).toBe(false);
      expect(val.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Tree Parsing & Hierarchy', () => {
    it('constructs hierarchical tree node structure with XPath addresses', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <title>XML Primer</title>
    <price>29.99</price>
  </book>
</catalog>`;
      const res = parseXmlToTree(xml);
      expect(res.error).toBeUndefined();
      expect(res.tree).not.toBeNull();
      expect(res.tree?.name).toBe('catalog');
      expect(res.tree?.children?.length).toBeGreaterThanOrEqual(1);

      const book = res.tree?.children?.find((c) => c.name === 'book');
      expect(book).toBeDefined();
      expect(book?.attributes?.id).toBe('bk101');
      expect(book?.xpath).toBe('/catalog/book[1]');
    });
  });

  describe('XPath Expression Evaluator', () => {
    const xml = `
<bookstore>
  <book category="cooking">
    <title lang="en">Everyday Italian</title>
    <price>30.00</price>
  </book>
  <book category="web">
    <title lang="en">Learning XML</title>
    <price>39.95</price>
  </book>
</bookstore>`;

    it('evaluates all elements query (//*)', () => {
      const res = evaluateXPath(xml, '//*');
      expect(res.isValid).toBe(true);
      expect(res.matchCount).toBeGreaterThanOrEqual(5);
    });

    it('evaluates attribute selector (//@*)', () => {
      const res = evaluateXPath(xml, '//@*');
      expect(res.isValid).toBe(true);
      expect(res.matchCount).toBeGreaterThanOrEqual(2);
    });

    it('handles invalid XPath syntax gracefully with readable error', () => {
      const res = evaluateXPath(xml, '///[[[invalid');
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('Converters (JSON, YAML, CSV, TSV)', () => {
    const xml = `
<catalog>
  <book id="1">
    <title>Clean Code</title>
    <author>Martin</author>
  </book>
</catalog>`;

    it('converts XML to JSON and parses back', () => {
      const jsonRes = xmlToJson(xml);
      expect(jsonRes.error).toBeUndefined();
      const obj = JSON.parse(jsonRes.output);
      expect(obj.catalog).toBeDefined();
      expect(obj.catalog.book).toBeDefined();
    });

    it('converts JSON to XML', () => {
      const json = JSON.stringify({ book: { title: 'Clean Architecture', author: 'Martin' } });
      const xmlRes = jsonToXmlString(json);
      expect(xmlRes.error).toBeUndefined();
      expect(xmlRes.output).toContain('<title>Clean Architecture</title>');
      expect(xmlRes.output).toContain('<author>Martin</author>');
    });

    it('converts XML to YAML', () => {
      const yamlRes = xmlToYaml(xml);
      expect(yamlRes.error).toBeUndefined();
      expect(yamlRes.output).toContain('catalog:');
      expect(yamlRes.output).toContain('Clean Code');
    });

    it('converts XML to CSV and TSV', () => {
      const csvRes = xmlToCsv(xml, ',');
      expect(csvRes.error).toBeUndefined();
      expect(csvRes.output).toContain('Clean Code');

      const tsvRes = xmlToCsv(xml, '\t');
      expect(tsvRes.error).toBeUndefined();
      expect(tsvRes.output).toContain('Clean Code');
    });

    it('converts XML to string literal', () => {
      const strRes = xmlToStringLiteral(xml);
      expect(strRes.error).toBeUndefined();
      expect(strRes.output.startsWith('"')).toBe(true);
    });
  });

  describe('Specialized Analyzers (SOAP, WSDL, XSD)', () => {
    it('detects SOAP 1.1 request envelope', () => {
      const soapSample = XML_SAMPLES.find((s) => s.id === 'soap-request')!;
      const analysis = analyzeSpecializedXml(soapSample.data);
      expect(analysis.detectedType).toBe('soap');
      expect(analysis.soap?.version).toBe('1.1');
      expect(analysis.soap?.hasBody).toBe(true);
    });

    it('detects SOAP 1.2 fault envelope', () => {
      const faultSample = XML_SAMPLES.find((s) => s.id === 'soap-fault')!;
      const analysis = analyzeSpecializedXml(faultSample.data);
      expect(analysis.detectedType).toBe('soap');
      expect(analysis.soap?.hasFault).toBe(true);
      expect(analysis.soap?.faultDetails?.faultString).toBeDefined();
    });

    it('detects WSDL service definitions and operations', () => {
      const wsdlSample = XML_SAMPLES.find((s) => s.id === 'wsdl')!;
      const analysis = analyzeSpecializedXml(wsdlSample.data);
      expect(analysis.detectedType).toBe('wsdl');
      expect(analysis.wsdl?.services.length).toBeGreaterThan(0);
    });

    it('detects XML Schema (XSD) and complex types', () => {
      const xsdSample = XML_SAMPLES.find((s) => s.id === 'xsd')!;
      const analysis = analyzeSpecializedXml(xsdSample.data);
      expect(analysis.detectedType).toBe('xsd');
      expect(analysis.xsd?.elements.length).toBeGreaterThan(0);
    });
  });
});

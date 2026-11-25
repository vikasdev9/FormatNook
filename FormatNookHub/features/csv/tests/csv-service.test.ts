import { describe, it, expect } from 'vitest';
import { parseCsv, detectDelimiter, detectHeaders, resolveHeaders } from '../services/csv-parser';
import { convertCsvToJson, convertCellValue } from '../services/csv-converter';

describe('CSV Parser Engine Suite', () => {
  it('parses basic comma-separated CSV with standard headers and rows', () => {
    const csv = 'name,age,city\nJohn,25,Delhi\nAlex,30,Mumbai';
    const result = parseCsv(csv);

    expect(result.headers).toEqual(['name', 'age', 'city']);
    expect(result.totalRows).toBe(2);
    expect(result.rawRows).toEqual([
      ['John', '25', 'Delhi'],
      ['Alex', '30', 'Mumbai'],
    ]);
  });

  it('parses semicolon-separated CSV correctly', () => {
    const csv = 'product;price;inStock\nLaptop;1200;true\nMouse;25;false';
    const result = parseCsv(csv, { delimiter: ';' });

    expect(result.headers).toEqual(['product', 'price', 'inStock']);
    expect(result.rawRows).toEqual([
      ['Laptop', '1200', 'true'],
      ['Mouse', '25', 'false'],
    ]);
  });

  it('parses tab-separated values (TSV) correctly', () => {
    const tsv = 'id\tname\trole\n1\tAlice\tAdmin\n2\tBob\tUser';
    const result = parseCsv(tsv, { delimiter: '\t' });

    expect(result.headers).toEqual(['id', 'name', 'role']);
    expect(result.rawRows).toEqual([
      ['1', 'Alice', 'Admin'],
      ['2', 'Bob', 'User'],
    ]);
  });

  it('parses pipe-separated CSV correctly', () => {
    const csv = 'sku|title|qty\nA101|Widget|50\nB202|Gadget|15';
    const result = parseCsv(csv, { delimiter: '|' });

    expect(result.headers).toEqual(['sku', 'title', 'qty']);
    expect(result.rawRows[0]).toEqual(['A101', 'Widget', '50']);
  });

  it('handles quotes with delimiters inside quoted fields', () => {
    const csv = 'id,title,description\n1,"Big, Blue Widget","Contains blue, green, and red parts."';
    const result = parseCsv(csv);

    expect(result.rawRows[0][1]).toBe('Big, Blue Widget');
    expect(result.rawRows[0][2]).toBe('Contains blue, green, and red parts.');
  });

  it('handles escaped double quotes ("") properly', () => {
    const csv = 'id,quote\n1,"He said, ""Hello World!"""';
    const result = parseCsv(csv);

    expect(result.rawRows[0][1]).toBe('He said, "Hello World!"');
  });

  it('handles newlines inside quoted fields with both CRLF and LF', () => {
    const csv = 'id,address\r\n101,"Line 1\r\nLine 2\r\nCity"';
    const result = parseCsv(csv);

    expect(result.totalRows).toBe(1);
    expect(result.rawRows[0][1]).toBe('Line 1\r\nLine 2\r\nCity');
  });

  it('strips UTF-8 BOM properly without corrupting the first header', () => {
    const csv = '\uFEFFname,score\nCharlie,98';
    const result = parseCsv(csv);

    expect(result.headers[0]).toBe('name');
    expect(result.rawRows[0]).toEqual(['Charlie', '98']);
  });

  it('handles Unicode and multilingual values flawlessly', () => {
    const csv = 'country,capital,greeting\nGermany,München,Guten Tag\nJapan,東京,こんにちは\nIndia,दिल्ली,नमस्ते';
    const result = parseCsv(csv);

    expect(result.totalRows).toBe(3);
    expect(result.rawRows[1][1]).toBe('東京');
    expect(result.rawRows[2][2]).toBe('नमस्ते');
  });

  it('preserves empty fields and trailing delimiters without dropping cells', () => {
    const csv = 'a,b,c,\n1,,3,\n';
    const result = parseCsv(csv);

    expect(result.headers).toEqual(['a', 'b', 'c', 'column_4']);
    expect(result.rawRows[0]).toEqual(['1', '', '3', '']);
  });

  it('detects unclosed quotes and reports meaningful error diagnostics', () => {
    const csv = 'id,note\n1,"Unclosed quote row\n2,normal row';
    const result = parseCsv(csv);

    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0].message).toContain('Unclosed double-quote');
  });

  it('detects delimiter automatically', () => {
    expect(detectDelimiter('a;b;c\n1;2;3\n4;5;6')).toBe(';');
    expect(detectDelimiter('x\ty\tz\n1\t2\t3')).toBe('\t');
    expect(detectDelimiter('col1|col2\nv1|v2')).toBe('|');
  });

  it('detects headers using explainable heuristic', () => {
    const withHeaders = [
      ['Name', 'Age', 'Email'],
      ['Alice', '28', 'alice@test.com'],
      ['Bob', '34', 'bob@test.com'],
    ];
    const detectH = detectHeaders(withHeaders);
    expect(detectH.hasHeader).toBe(true);

    const withoutHeaders = [
      ['101', '45.5', 'true'],
      ['102', '55.0', 'false'],
    ];
    const detectNoH = detectHeaders(withoutHeaders);
    expect(detectNoH.hasHeader).toBe(false);
  });

  it('handles duplicate headers according to strategies', () => {
    const raw = ['id', 'name', 'id', 'name'];

    const suffix = resolveHeaders(raw, 'numeric-suffix');
    expect(suffix.headers).toEqual(['id', 'name', 'id_2', 'name_2']);
    expect(suffix.errors).toHaveLength(0);

    const rename = resolveHeaders(raw, 'rename-duplicates');
    expect(rename.headers).toEqual(['id', 'name', 'id_dup1', 'name_dup1']);

    const reject = resolveHeaders(raw, 'reject');
    expect(reject.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('CSV to JSON Converter Engine Suite', () => {
  it('converts CSV to Array of Objects', () => {
    const parsed = parseCsv('name,age,active\nAlice,30,true\nBob,25,false');
    const result = convertCsvToJson(parsed, { outputMode: 'array-of-objects' });

    expect(JSON.parse(result.jsonOutput)).toEqual([
      { name: 'Alice', age: 30, active: true },
      { name: 'Bob', age: 25, active: false },
    ]);
  });

  it('converts CSV to Array of Arrays', () => {
    const parsed = parseCsv('name,score\nSam,95\nLeo,88');
    const result = convertCsvToJson(parsed, { outputMode: 'array-of-arrays' });

    expect(JSON.parse(result.jsonOutput)).toEqual([
      ['name', 'score'],
      ['Sam', 95],
      ['Leo', 88],
    ]);
  });

  it('converts CSV to Object keyed by selected column', () => {
    const parsed = parseCsv('sku,title,price\nA100,Headphones,99.99\nB200,Speaker,149.50');
    const result = convertCsvToJson(parsed, {
      outputMode: 'object-keyed',
      keyColumn: 'sku',
    });

    expect(JSON.parse(result.jsonOutput)).toEqual({
      A100: { title: 'Headphones', price: 99.99 },
      B200: { title: 'Speaker', price: 149.5 },
    });
  });

  it('safely handles duplicate row keys without silent overwriting', () => {
    const parsed = parseCsv('id,val\n101,First\n101,Second');
    const resultError = convertCsvToJson(parsed, {
      outputMode: 'object-keyed',
      keyColumn: 'id',
      duplicateKeyStrategy: 'error',
    });

    expect(resultError.errors.length).toBeGreaterThan(0);
    expect(resultError.errors[0]).toContain("Duplicate row key '101'");

    const resultSuffix = convertCsvToJson(parsed, {
      outputMode: 'object-keyed',
      keyColumn: 'id',
      duplicateKeyStrategy: 'append-suffix',
    });
    expect(JSON.parse(resultSuffix.jsonOutput)).toHaveProperty('101');
    expect(JSON.parse(resultSuffix.jsonOutput)).toHaveProperty('101_2');
  });

  it('preserves leading zeros for postal codes, phone numbers, and IDs', () => {
    expect(convertCellValue('01234', 'auto')).toBe('01234');
    expect(convertCellValue('007', 'auto')).toBe('007');
    expect(convertCellValue('0', 'auto')).toBe(0);
    expect(convertCellValue('0.45', 'auto')).toBe(0.45);
  });

  it('converts scientific notation and negative numbers', () => {
    expect(convertCellValue('1.25e3', 'auto')).toBe(1250);
    expect(convertCellValue('-42', 'auto')).toBe(-42);
    expect(convertCellValue('-3.14', 'auto')).toBe(-3.14);
  });

  it('does not convert invalid numeric values into zero', () => {
    expect(convertCellValue('abc', 'number')).toBe('abc');
    expect(convertCellValue('N/A', 'auto')).toBe('N/A');
  });

  it('converts empty values to null when configured', () => {
    expect(convertCellValue('', 'auto', false)).toBe('');
    expect(convertCellValue('', 'auto', true)).toBeNull();
  });

  it('generates nested JSON objects from dot-separated column headers', () => {
    const csv = 'user.name,user.address.city,user.address.zip\nJohn,Berlin,01115';
    const parsed = parseCsv(csv);
    const result = convertCsvToJson(parsed, { nestedJson: true });

    expect(JSON.parse(result.jsonOutput)).toEqual([
      {
        user: {
          name: 'John',
          address: {
            city: 'Berlin',
            zip: '01115', // preserved leading zero!
          },
        },
      },
    ]);
  });

  it('detects conflicting nested paths and records errors', () => {
    const csv = 'user,user.name\nJohn,Johnny';
    const parsed = parseCsv(csv);
    const result = convertCsvToJson(parsed, { nestedJson: true });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Conflicting nested path');
  });

  it('supports column renaming and exclusion', () => {
    const csv = 'id,internal_flag,name\n1,SECRET,Alice';
    const parsed = parseCsv(csv);
    const result = convertCsvToJson(parsed, {
      columnConfigs: {
        id: { name: 'id', targetKey: 'userId', type: 'integer', included: true, order: 0 },
        internal_flag: { name: 'internal_flag', targetKey: 'flag', type: 'string', included: false, order: 1 },
        name: { name: 'name', targetKey: 'fullName', type: 'string', included: true, order: 2 },
      },
    });

    expect(JSON.parse(result.jsonOutput)).toEqual([
      { userId: 1, fullName: 'Alice' },
    ]);
  });
});

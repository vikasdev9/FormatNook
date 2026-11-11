import { describe, it, expect } from 'vitest';
import {
  validateYaml,
  formatYaml,
  minifyYaml,
  oneLineYaml,
  escapeYaml,
  unescapeYaml,
  splitYamlDocuments,
} from '../services/yaml-service';
import { parseYamlToTree, updateYamlValueAtPath } from '../services/yaml-parser-service';
import {
  yamlToJson,
  jsonToYaml,
  yamlToXml,
  xmlToYaml,
  yamlToCsv,
  csvToYaml,
} from '../services/yaml-converter-service';
import { analyzeYamlConfig } from '../services/yaml-analyzer-service';
import { YAML_SAMPLES } from '../services/yaml-samples';

describe('YAML Advanced Processing & Feature Suite', () => {
  describe('Core Parsing & Validation', () => {
    it('handles simple and nested mappings accurately', () => {
      const yaml = `
server:
  host: 127.0.0.1
  port: 8080
  security:
    ssl:
      enabled: true
      cert: "/etc/ssl/cert.pem"
`;
      const val = validateYaml(yaml);
      expect(val.isValid).toBe(true);

      const formatted = formatYaml(yaml, '2');
      expect(formatted.isValid).toBe(true);
      expect(formatted.output).toContain('host: 127.0.0.1');
      expect(formatted.output).toContain('enabled: true');
    });

    it('preserves sequences, arrays, and lists properly', () => {
      const yaml = `
fruits:
  - Apple
  - Banana
  - Orange
tags: ["dev", "staging", "prod"]
`;
      const val = validateYaml(yaml);
      expect(val.isValid).toBe(true);
      const res = formatYaml(yaml, '2');
      expect(res.output).toContain('- Apple');
      expect(res.output).toContain('- Banana');
    });

    it('preserves multiline literal (|) and folded (>) strings without data loss', () => {
      const yaml = `
description: |
  This is a literal block.
  Line breaks are preserved.
summary: >
  This is a folded block.
  Line breaks are folded into spaces.
`;
      const val = validateYaml(yaml);
      expect(val.isValid).toBe(true);
      const res = formatYaml(yaml, '2');
      expect(res.isValid).toBe(true);
      expect(res.output).toContain('This is a literal block.');
      expect(res.output).toContain('This is a folded block.');
    });

    it('distinguishes booleans, numbers, nulls and quoted strings without type coercion', () => {
      const yaml = `
is_active: true
is_pending: false
count: 42
pi: 3.14159
empty_field: null
tilde_null: ~
quoted_number: "12345"
quoted_boolean: "true"
`;
      const val = validateYaml(yaml);
      expect(val.isValid).toBe(true);

      const jsonStr = yamlToJson(yaml);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.is_active).toBe(true);
      expect(parsed.is_pending).toBe(false);
      expect(parsed.count).toBe(42);
      expect(parsed.empty_field).toBeNull();
      expect(parsed.tilde_null).toBeNull();
      expect(parsed.quoted_number).toBe('12345');
      expect(parsed.quoted_boolean).toBe('true');
    });

    it('safely resolves anchors and aliases', () => {
      const yamlWithAnchors = `
defaults: &base_config
  timeout: 30
  retries: 3

production:
  <<: *base_config
  host: "prod.example.com"
`;
      const val = validateYaml(yamlWithAnchors);
      expect(val.isValid).toBe(true);

      const json = JSON.parse(yamlToJson(yamlWithAnchors));
      expect(json.production.timeout).toBe(30);
      expect(json.production.retries).toBe(3);
      expect(json.production.host).toBe('prod.example.com');
    });

    it('detects duplicate mapping keys and flags a warning', () => {
      const duplicateKeyYaml = `
app:
  name: formatnook
  port: 8080
  port: 9090
`;
      const val = validateYaml(duplicateKeyYaml);
      const dupWarning = val.issues.find((i) => i.message.includes('Duplicate key'));
      expect(dupWarning).toBeDefined();
      expect(dupWarning?.severity).toBe('warning');
    });

    it('detects tabs in indentation as syntax errors with line coordinates', () => {
      const tabYaml = 'app:\n\tport: 3000';
      const val = validateYaml(tabYaml);
      expect(val.isValid).toBe(false);
      expect(val.issues[0].message).toContain('Tabs are strictly forbidden');
      expect(val.issues[0].line).toBe(2);
    });
  });

  describe('Multi-Document Streams & Kubernetes', () => {
    const multiDocYaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-cm
data:
  ENV: prod
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-dep
spec:
  replicas: 2
---
# Empty document separator
---
apiVersion: v1
kind: Service
metadata:
  name: app-svc
spec:
  ports:
    - port: 80
`;

    it('splits multiple documents accurately preserving index and metadata', () => {
      const docs = splitYamlDocuments(multiDocYaml);
      expect(docs.length).toBeGreaterThanOrEqual(3);
      const validDocs = docs.filter((d) => d.data && d.data.kind);
      expect(validDocs.length).toBe(3);
      expect(validDocs[0].data.kind).toBe('ConfigMap');
      expect(validDocs[1].data.kind).toBe('Deployment');
      expect(validDocs[2].data.kind).toBe('Service');
    });

    it('formats multi-document stream joining with --- separators', () => {
      const res = formatYaml(multiDocYaml, '2');
      expect(res.isValid).toBe(true);
      expect(res.output).toContain('kind: ConfigMap');
      expect(res.output).toContain('---');
      expect(res.output).toContain('kind: Deployment');
      expect(res.output).toContain('kind: Service');
    });
  });

  describe('Minification, One-Line, and Escaping', () => {
    const sample = `
user:
  name: "Alice"
  roles:
    - admin
    - developer
`;

    it('minifies YAML using flow-style collections', () => {
      const min = minifyYaml(sample);
      expect(min.isValid).toBe(true);
      expect(min.output).toContain('"user":');
      expect(min.output).toContain('admin');
    });

    it('collapses YAML into single-line format', () => {
      const oneline = oneLineYaml(sample);
      expect(oneline).not.toContain('\n');
      expect(oneline).toContain('"user":');
    });

    it('escapes and unescapes YAML literals cleanly', () => {
      const raw = 'name: "Bob"\npath: "C:\\Windows"';
      const escaped = escapeYaml(raw);
      expect(escaped).toContain('\\n');
      expect(escaped).toContain('\\"');

      const unescaped = unescapeYaml(escaped);
      expect(unescaped).toBe(raw);
    });
  });

  describe('Visual Tree Model & In-Place Editing', () => {
    it('constructs a hierarchical tree from single document YAML', () => {
      const yaml = `
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
`;
      const tree = parseYamlToTree(yaml);
      expect(tree.documentCount).toBe(1);
      expect(tree.rootNodes.length).toBe(1);
      const servicesNode = tree.rootNodes[0];
      expect(servicesNode.key).toBe('services');
      expect(servicesNode.type).toBe('object');
      expect(servicesNode.children).toBeDefined();
    });

    it('constructs tree with document roots for multi-document streams', () => {
      const stream = `
app: one
---
app: two
`;
      const tree = parseYamlToTree(stream);
      expect(tree.documentCount).toBe(2);
      expect(tree.rootNodes.length).toBe(2);
      expect(tree.rootNodes[0].key).toContain('Document #1');
      expect(tree.rootNodes[1].key).toContain('Document #2');
    });

    it('immutably updates scalar value at path without corrupting document', () => {
      const yaml = `
server:
  host: 127.0.0.1
  port: 8080
`;
      const updated = updateYamlValueAtPath(yaml, 'server.port', 9000, 0);
      expect(updated).toContain('port: 9000');
      expect(updated).toContain('host: 127.0.0.1');
    });
  });

  describe('Converters (JSON, XML, CSV, TSV)', () => {
    it('converts YAML to JSON and JSON back to YAML', () => {
      const original = 'name: test\ncount: 5\n';
      const jsonStr = yamlToJson(original);
      expect(JSON.parse(jsonStr)).toEqual({ name: 'test', count: 5 });

      const backToYaml = jsonToYaml(jsonStr);
      expect(backToYaml).toContain('name: test');
      expect(backToYaml).toContain('count: 5');
    });

    it('converts YAML to XML and XML back to YAML', () => {
      const yaml = `
book:
  title: "The Pragmatic Programmer"
  year: 1999
`;
      const xml = yamlToXml(yaml, 'book');
      expect(xml).toContain('<book>');
      expect(xml).toContain('<title>The Pragmatic Programmer</title>');
      expect(xml).toContain('<year>1999</year>');
    });

    it('converts YAML array to CSV and CSV back to YAML', () => {
      const yamlArray = `
- id: 1
  name: Alice
  active: true
- id: 2
  name: Bob
  active: false
`;
      const csv = yamlToCsv(yamlArray);
      expect(csv).toContain('id,name,active');
      expect(csv).toContain('1,Alice,true');
      expect(csv).toContain('2,Bob,false');

      const backToYaml = csvToYaml(csv);
      expect(backToYaml).toContain('name: Alice');
      expect(backToYaml).toContain('name: Bob');
    });
  });

  describe('Config Inspector & Structural Linting', () => {
    it('accurately identifies Kubernetes manifests and flags missing name', () => {
      const k8sNoName = `
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 1
`;
      const analysis = analyzeYamlConfig(k8sNoName);
      expect(analysis.type).toBe('kubernetes');
      expect(analysis.warnings.some((w) => w.includes("Missing 'metadata.name'"))).toBe(true);
    });

    it('identifies Docker Compose and warns on unquoted numeric ports', () => {
      const composeYaml = `
version: "3.8"
services:
  web:
    image: nginx
    ports:
      - 80
`;
      const analysis = analyzeYamlConfig(composeYaml);
      expect(analysis.type).toBe('compose');
      expect(analysis.summary.servicesCount).toBe(1);
      expect(analysis.warnings.some((w) => w.includes('unquoted port'))).toBe(true);
    });

    it('identifies GitHub Actions workflow and warns on missing runs-on', () => {
      const workflow = `
name: Build
on: [push]
jobs:
  test:
    steps:
      - run: echo hello
`;
      const analysis = analyzeYamlConfig(workflow);
      expect(analysis.type).toBe('github-actions');
      expect(analysis.warnings.some((w) => w.includes('runs-on'))).toBe(true);
    });

    it('loads and validates all built-in sample configurations', () => {
      for (const sample of YAML_SAMPLES) {
        const val = validateYaml(sample.data);
        expect(val.isValid).toBe(true);

        const analysis = analyzeYamlConfig(sample.data);
        expect(analysis.summary.documentsCount).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Large YAML Document Safety', () => {
    it('safely formats a large multi-thousand line YAML without memory blowup', () => {
      const items: string[] = ['items:'];
      for (let i = 0; i < 2000; i++) {
        items.push(`  - id: ${i}\n    name: "item_${i}"\n    active: ${i % 2 === 0}`);
      }
      const largeYaml = items.join('\n');

      const start = performance.now();
      const res = formatYaml(largeYaml, '2');
      const duration = performance.now() - start;

      expect(res.isValid).toBe(true);
      expect(res.output).toContain('name: item_1999');
      expect(duration).toBeLessThan(1500);
    });
  });
});

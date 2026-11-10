import { describe, it, expect } from 'vitest';
import { formatYaml, validateYaml } from '../services/yaml-service';

describe('yaml-service', () => {
  const validYaml = `
version: "3.8"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: app_db
`;

  it('formats valid YAML with clean 2-space indentation', () => {
    const result = formatYaml(validYaml, '2');
    expect(result.isValid).toBe(true);
    expect(result.output).toContain('version: "3.8"');
    expect(result.output).toContain('services:');
  });

  it('detects tab characters as illegal indentation', () => {
    const tabYaml = 'services:\n\tweb:\n\t\timage: nginx';
    const validation = validateYaml(tabYaml);
    expect(validation.isValid).toBe(false);
    expect(validation.issues[0].message).toContain('Tabs are strictly forbidden');
  });

  it('identifies bad indentation in YAML mapping', () => {
    const brokenYaml = 'server:\n  host: localhost\n port: 8080';
    const validation = validateYaml(brokenYaml);
    expect(validation.isValid).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);
  });
});

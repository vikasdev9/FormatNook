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

  describe('multi-document and Kubernetes YAML formatting', () => {
    it('validates and formats multiple Kubernetes resources separated by ---', () => {
      const k8sManifest = `
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
spec:
  replicas: 3
`;
      const val = validateYaml(k8sManifest);
      expect(val.isValid).toBe(true);

      const formatted = formatYaml(k8sManifest, '2');
      expect(formatted.isValid).toBe(true);
      expect(formatted.output).toContain('kind: Service');
      expect(formatted.output).toContain('---');
      expect(formatted.output).toContain('kind: Deployment');
      expect(formatted.output).toContain('name: web-deployment');
    });

    it('formats multiple resources with comments without crashing', () => {
      const yamlWithComments = `
# First document: ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: production
---
# Second document: Secret
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
`;
      const val = validateYaml(yamlWithComments);
      expect(val.isValid).toBe(true);

      const formatted = formatYaml(yamlWithComments, '2');
      expect(formatted.isValid).toBe(true);
      expect(formatted.output).toContain('name: app-config');
      expect(formatted.output).toContain('name: app-secret');
      expect(formatted.output).toContain('---');
    });

    it('handles empty documents between separators safely', () => {
      const multiWithEmpty = `
app: frontend
---
---
app: backend
`;
      const val = validateYaml(multiWithEmpty);
      expect(val.isValid).toBe(true);

      const formatted = formatYaml(multiWithEmpty, '2');
      expect(formatted.isValid).toBe(true);
      expect(formatted.output).toContain('app: frontend');
      expect(formatted.output).toContain('app: backend');
      expect(formatted.output).toContain('---');
    });

    it('reports error when one document in a multi-document stream is invalid', () => {
      const partiallyInvalid = `
apiVersion: v1
kind: Service
metadata:
  name: valid-svc
---
apiVersion: apps/v1
  invalid: [bad indentation
`;
      const val = validateYaml(partiallyInvalid);
      expect(val.isValid).toBe(false);
      expect(val.issues.length).toBeGreaterThan(0);
      expect(val.issues[0].severity).toBe('error');

      const formatted = formatYaml(partiallyInvalid, '2');
      expect(formatted.isValid).toBe(false);
      expect(formatted.output).toBe(partiallyInvalid);
    });

    it('preserves complete Kubernetes Deployment and Service definitions and document order', () => {
      const fullK8s = `
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  labels:
    tier: api
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-deployment
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: auth-app
          image: "registry.example.com/auth:1.2.0"
`;
      const result = formatYaml(fullK8s, '2');
      expect(result.isValid).toBe(true);

      const svcIndex = result.output.indexOf('auth-service');
      const deployIndex = result.output.indexOf('auth-deployment');
      expect(svcIndex).toBeGreaterThan(-1);
      expect(deployIndex).toBeGreaterThan(-1);
      expect(svcIndex).toBeLessThan(deployIndex); // Order preserved
    });
  });
});

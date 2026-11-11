import yaml from 'js-yaml';
import { YamlConfigAnalysis, YamlConfigType } from '../types/yaml.types';

/**
 * Static client-side analyzer for developer YAML configurations.
 * Performs structural linting for Kubernetes, Docker Compose, GitHub Actions, and Ansible.
 * Note: Performs structural validation only; full server-side API schema validation is not performed.
 */
export function analyzeYamlConfig(input: string): YamlConfigAnalysis {
  if (!input || !input.trim()) {
    return {
      type: 'generic',
      title: 'Empty Configuration',
      summary: { documentsCount: 0 },
      details: [],
      warnings: [],
      suggestions: ['Paste or load a YAML configuration to inspect its structure.'],
    };
  }

  let docs: any[] = [];
  try {
    docs = yaml.loadAll(input);
  } catch {
    return {
      type: 'generic',
      title: 'Invalid YAML Syntax',
      summary: { documentsCount: 0 },
      details: [],
      warnings: ['Cannot analyze configuration because YAML syntax contains errors.'],
      suggestions: ['Check syntax errors in the editor or run Validate.'],
    };
  }

  const validDocs = docs.filter((d) => d && typeof d === 'object');
  if (validDocs.length === 0) {
    return {
      type: 'generic',
      title: 'Generic Scalar / Empty Stream',
      summary: { documentsCount: docs.length },
      details: [{ label: 'Items', value: docs.length }],
      warnings: [],
      suggestions: [],
    };
  }

  const firstDoc = validDocs[0];

  // 1. Check Kubernetes
  if (firstDoc.apiVersion && firstDoc.kind) {
    const kinds = validDocs.map((d) => d.kind).filter(Boolean);
    const warnings: string[] = [];
    const suggestions: string[] = [];

    validDocs.forEach((d, idx) => {
      const docLabel = `Doc #${idx + 1} (${d.kind || 'Unknown'})`;
      if (!d.metadata || !d.metadata.name) {
        warnings.push(`${docLabel}: Missing 'metadata.name'. Resources should have an explicit name.`);
      }

      if (['Deployment', 'StatefulSet', 'DaemonSet'].includes(d.kind)) {
        if (!d.spec?.template?.spec?.containers || d.spec.template.spec.containers.length === 0) {
          warnings.push(`${docLabel}: No container definitions found in 'spec.template.spec.containers'.`);
        }
        if (!d.spec?.selector?.matchLabels) {
          warnings.push(`${docLabel}: 'spec.selector.matchLabels' is recommended to match pod template labels.`);
        }
      }

      if (d.kind === 'Service') {
        if (!d.spec?.ports || d.spec.ports.length === 0) {
          warnings.push(`${docLabel}: Service has no 'spec.ports' defined.`);
        }
      }

      if (d.kind === 'Secret' && d.data) {
        suggestions.push(`${docLabel}: Values in 'data' must be Base64-encoded. For raw strings, consider 'stringData'.`);
      }
    });

    return {
      type: 'kubernetes',
      title: `Kubernetes Manifest (${kinds.join(', ')})`,
      summary: {
        documentsCount: validDocs.length,
        primaryKind: kinds[0],
      },
      details: [
        { label: 'API Version', value: firstDoc.apiVersion },
        { label: 'Primary Kind', value: firstDoc.kind },
        { label: 'Resource Name', value: firstDoc.metadata?.name || 'Unnamed' },
        { label: 'Total Resources', value: validDocs.length },
      ],
      warnings,
      suggestions,
    };
  }

  // 2. Check Docker Compose
  if (firstDoc.services && typeof firstDoc.services === 'object') {
    const serviceNames = Object.keys(firstDoc.services);
    const warnings: string[] = [];
    const suggestions: string[] = [];

    serviceNames.forEach((sName) => {
      const s = firstDoc.services[sName];
      if (!s.image && !s.build) {
        warnings.push(`Service '${sName}' has neither 'image' nor 'build' defined.`);
      }
      if (s.ports && Array.isArray(s.ports)) {
        s.ports.forEach((p: any) => {
          if (typeof p === 'number') {
            warnings.push(`Service '${sName}' has raw unquoted port '${p}'. In YAML, '80:80' should be quoted as "80:80" to avoid octal/sexagesimal parsing.`);
          }
        });
      }
    });

    return {
      type: 'compose',
      title: 'Docker Compose Configuration',
      summary: {
        documentsCount: 1,
        servicesCount: serviceNames.length,
        version: firstDoc.version || 'compose-spec',
      },
      details: [
        { label: 'Compose Version', value: firstDoc.version || 'v3 (Compose Spec)' },
        { label: 'Defined Services', value: serviceNames.length },
        { label: 'Networks', value: firstDoc.networks ? Object.keys(firstDoc.networks).length : 0 },
        { label: 'Volumes', value: firstDoc.volumes ? Object.keys(firstDoc.volumes).length : 0 },
      ],
      warnings,
      suggestions,
    };
  }

  // 3. Check GitHub Actions Workflow
  if (firstDoc.jobs && (firstDoc.on !== undefined || firstDoc.name)) {
    const jobKeys = Object.keys(firstDoc.jobs);
    const warnings: string[] = [];
    const suggestions: string[] = [];

    jobKeys.forEach((jobKey) => {
      const job = firstDoc.jobs[jobKey];
      if (!job['runs-on']) {
        warnings.push(`Job '${jobKey}' is missing 'runs-on' (e.g., ubuntu-latest).`);
      }
      if (!job.steps || !Array.isArray(job.steps) || job.steps.length === 0) {
        warnings.push(`Job '${jobKey}' has no steps defined.`);
      }
    });

    return {
      type: 'github-actions',
      title: `GitHub Actions Workflow (${firstDoc.name || 'Unnamed'})`,
      summary: {
        documentsCount: 1,
        jobsCount: jobKeys.length,
      },
      details: [
        { label: 'Workflow Name', value: firstDoc.name || 'Unnamed Workflow' },
        { label: 'Total Jobs', value: jobKeys.length },
        { label: 'Triggers (on)', value: typeof firstDoc.on === 'object' ? Object.keys(firstDoc.on).join(', ') : String(firstDoc.on) },
      ],
      warnings,
      suggestions,
    };
  }

  // 4. Check Ansible Playbook
  if (Array.isArray(firstDoc) && firstDoc.some((item) => item && (item.hosts || item.tasks || item.roles))) {
    let totalTasks = 0;
    firstDoc.forEach((play) => {
      if (Array.isArray(play.tasks)) {
        totalTasks += play.tasks.length;
      }
    });

    return {
      type: 'ansible',
      title: 'Ansible Playbook',
      summary: {
        documentsCount: 1,
        tasksCount: totalTasks,
      },
      details: [
        { label: 'Plays', value: firstDoc.length },
        { label: 'Total Tasks', value: totalTasks },
        { label: 'Target Hosts', value: firstDoc.map((p) => p.hosts).filter(Boolean).join(', ') || 'all' },
      ],
      warnings: [],
      suggestions: ['Ensure Ansible secrets are encrypted with ansible-vault before committing to public repositories.'],
    };
  }

  // 5. Generic Configuration
  return {
    type: 'generic',
    title: 'Generic YAML Configuration',
    summary: {
      documentsCount: validDocs.length,
    },
    details: [
      { label: 'Document Count', value: validDocs.length },
      { label: 'Top-Level Keys', value: typeof firstDoc === 'object' ? Object.keys(firstDoc).length : 0 },
    ],
    warnings: [],
    suggestions: [],
  };
}


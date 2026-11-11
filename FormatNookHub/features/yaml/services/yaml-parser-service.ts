import yaml from 'js-yaml';
import { YamlDataType, YamlTreeNode } from '../types/yaml.types';
import { splitYamlDocuments } from './yaml-service';

export function getYamlDataType(val: any): YamlDataType {
  if (val === null || val === undefined) return 'null';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'object') return 'object';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  return 'string';
}

/**
 * Builds an interactive tree representation from a JavaScript value.
 */
function buildTreeFromValue(
  key: string,
  val: any,
  path: string,
  docIndex: number,
  depth: number,
  idPrefix: string
): YamlTreeNode {
  const type = getYamlDataType(val);
  const nodeId = `${idPrefix}-${key}`;

  if (type === 'object') {
    const keys = Object.keys(val);
    const children = keys.map((k) => {
      const childPath = path ? `${path}.${k}` : k;
      return buildTreeFromValue(k, val[k], childPath, docIndex, depth + 1, nodeId);
    });

    return {
      id: nodeId,
      key,
      value: val,
      type: 'object',
      path,
      docIndex,
      depth,
      itemCount: keys.length,
      children,
    };
  }

  if (type === 'array') {
    const children = (val as any[]).map((item, idx) => {
      const childPath = `${path}[${idx}]`;
      return buildTreeFromValue(`[${idx}]`, item, childPath, docIndex, depth + 1, `${nodeId}-${idx}`);
    });

    return {
      id: nodeId,
      key,
      value: val,
      type: 'array',
      path,
      docIndex,
      depth,
      itemCount: (val as any[]).length,
      children,
    };
  }

  return {
    id: nodeId,
    key,
    value: val,
    type,
    path,
    docIndex,
    depth,
  };
}

/**
 * Parses a YAML string and converts it into a hierarchical tree node structure.
 */
export function parseYamlToTree(input: string): { rootNodes: YamlTreeNode[]; totalNodes: number; documentCount: number } {
  const docInfos = splitYamlDocuments(input);
  if (docInfos.length === 0) {
    return { rootNodes: [], totalNodes: 0, documentCount: 0 };
  }

  let totalNodes = 0;
  function countNodes(node: YamlTreeNode) {
    totalNodes++;
    if (node.children) {
      for (const child of node.children) {
        countNodes(child);
      }
    }
  }

  if (docInfos.length === 1) {
    const doc = docInfos[0];
    if (doc.data == null) {
      return { rootNodes: [], totalNodes: 0, documentCount: 1 };
    }

    const type = getYamlDataType(doc.data);
    if (type === 'object') {
      const rootNodes = Object.keys(doc.data).map((k) =>
        buildTreeFromValue(k, doc.data[k], k, 0, 0, `d0`)
      );
      rootNodes.forEach(countNodes);
      return { rootNodes, totalNodes, documentCount: 1 };
    } else if (type === 'array') {
      const rootNodes = (doc.data as any[]).map((item, idx) =>
        buildTreeFromValue(`[${idx}]`, item, `[${idx}]`, 0, 0, `d0-${idx}`)
      );
      rootNodes.forEach(countNodes);
      return { rootNodes, totalNodes, documentCount: 1 };
    } else {
      const singleNode = buildTreeFromValue('root', doc.data, 'root', 0, 0, 'd0-root');
      countNodes(singleNode);
      return { rootNodes: [singleNode], totalNodes, documentCount: 1 };
    }
  }

  // Multi-document stream: wrap each document under a root document node
  const rootNodes: YamlTreeNode[] = docInfos.map((doc, idx) => {
    const docName = `Document #${idx + 1}${
      doc.data && typeof doc.data === 'object' && doc.data.kind ? ` (${doc.data.kind})` : ''
    }`;

    if (doc.data == null) {
      return {
        id: `doc-${idx}`,
        key: docName,
        value: null,
        type: 'null',
        path: `doc[${idx}]`,
        docIndex: idx,
        depth: 0,
      };
    }

    const docTree = buildTreeFromValue(docName, doc.data, `doc[${idx}]`, idx, 0, `doc-${idx}`);
    return docTree;
  });

  rootNodes.forEach(countNodes);
  return { rootNodes, totalNodes, documentCount: docInfos.length };
}

/**
 * Updates a scalar value at a given path within a YAML document string.
 */
export function updateYamlValueAtPath(
  rawYaml: string,
  targetPath: string,
  newValue: any,
  docIndex: number = 0
): string {
  try {
    const docs = yaml.loadAll(rawYaml);
    if (docIndex < 0 || docIndex >= docs.length) return rawYaml;

    const targetDoc = docs[docIndex];
    if (typeof targetDoc !== 'object' || targetDoc === null) return rawYaml;

    // Remove doc prefix if present: e.g. doc[0].spec -> spec
    const cleanPath = targetPath.replace(/^doc\[\d+\]\.?/, '');
    if (!cleanPath) return rawYaml;

    // Tokenize path into keys and array indices: e.g. "services.web.ports[0]" -> ["services", "web", "ports", 0]
    const segments: (string | number)[] = [];
    const regex = /([a-zA-Z0-9_\-./]+)|\[(\d+)\]/g;
    let m;
    while ((m = regex.exec(cleanPath)) !== null) {
      if (m[1] !== undefined) {
        segments.push(m[1]);
      } else if (m[2] !== undefined) {
        segments.push(parseInt(m[2], 10));
      }
    }

    if (segments.length === 0) return rawYaml;

    // Mutate copy
    const clonedDoc = JSON.parse(JSON.stringify(targetDoc));
    let cur: any = clonedDoc;
    for (let i = 0; i < segments.length - 1; i++) {
      const key = segments[i];
      if (cur[key] === undefined || cur[key] === null) {
        return rawYaml;
      }
      cur = cur[key];
    }

    const lastKey = segments[segments.length - 1];
    cur[lastKey] = newValue;

    docs[docIndex] = clonedDoc;

    if (docs.length === 1) {
      return yaml.dump(docs[0], { indent: 2, lineWidth: -1, noRefs: true }).trimEnd() + '\n';
    } else {
      return docs
        .map((d) => (d == null ? '' : yaml.dump(d, { indent: 2, lineWidth: -1, noRefs: true }).trimEnd()))
        .join('\n---\n') + '\n';
    }
  } catch {
    return rawYaml;
  }
}


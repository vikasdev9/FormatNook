import { ShareFormatOption, SharePayload } from '@/features/shared/types/share.types';

function computeJsonMetrics(jsonText: string): {
  valid: boolean;
  totalKeys: number;
  maxDepth: number;
  types: Record<string, number>;
  rawLength: number;
  minifiedLength: number;
} {
  try {
    const parsed = JSON.parse(jsonText);
    let totalKeys = 0;
    let maxDepth = 0;
    const types: Record<string, number> = {
      objects: 0,
      arrays: 0,
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
    };

    function traverse(node: any, depth: number) {
      if (depth > maxDepth) maxDepth = depth;
      if (node === null) {
        types.nulls++;
      } else if (Array.isArray(node)) {
        types.arrays++;
        for (const item of node) {
          traverse(item, depth + 1);
        }
      } else if (typeof node === 'object') {
        types.objects++;
        const keys = Object.keys(node);
        totalKeys += keys.length;
        for (const k of keys) {
          traverse(node[k], depth + 1);
        }
      } else if (typeof node === 'string') {
        types.strings++;
      } else if (typeof node === 'number') {
        types.numbers++;
      } else if (typeof node === 'boolean') {
        types.booleans++;
      }
    }

    traverse(parsed, 1);
    const minified = JSON.stringify(parsed);

    return {
      valid: true,
      totalKeys,
      maxDepth,
      types,
      rawLength: jsonText.length,
      minifiedLength: minified.length,
    };
  } catch {
    return {
      valid: false,
      totalKeys: 0,
      maxDepth: 0,
      types: {},
      rawLength: jsonText.length,
      minifiedLength: jsonText.length,
    };
  }
}

export function createJsonSharePayload(outputJson: string): SharePayload | null {
  if (!outputJson || !outputJson.trim()) return null;

  const metrics = computeJsonMetrics(outputJson);

  let formatted = outputJson;
  let minified = outputJson;
  if (metrics.valid) {
    try {
      const parsed = JSON.parse(outputJson);
      formatted = JSON.stringify(parsed, null, 2);
      minified = JSON.stringify(parsed);
    } catch {
      // Keep existing string
    }
  }

  const options: ShareFormatOption[] = [];

  // Option 1: Formatted JSON
  options.push({
    id: 'formatted-json',
    label: 'Formatted JSON',
    description: 'Cleanly indented, readable JSON payload with 2-space indentation',
    extension: '.json',
    mimeType: 'application/json',
    badge: 'Pretty',
    estimatedSize: `${(formatted.length / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: formatted,
      fileName: 'formatted.json',
      mimeType: 'application/json;charset=utf-8',
      textForClipboard: formatted,
    }),
  });

  // Option 2: Minified JSON
  options.push({
    id: 'minified-json',
    label: 'Minified JSON',
    description: 'Stripped of all whitespace, ideal for network transmission and storage',
    extension: '.json',
    mimeType: 'application/json',
    badge: 'Compact',
    estimatedSize: `${(minified.length / 1024).toFixed(1)} KB`,
    generate: () => ({
      content: minified,
      fileName: 'minified.json',
      mimeType: 'application/json;charset=utf-8',
      textForClipboard: minified,
    }),
  });

  // Option 3: JSON Metrics & Structure Report
  options.push({
    id: 'json-metrics',
    label: 'JSON Metrics & Structure Report',
    description: 'Detailed analysis of key counts, nesting depth, and data types',
    extension: '.json',
    mimeType: 'application/json',
    badge: 'Analytics',
    estimatedSize: '< 2 KB',
    generate: () => {
      const report = {
        tool: 'FormatNook JSON Workspace',
        timestamp: new Date().toISOString(),
        valid: metrics.valid,
        metrics: {
          totalKeys: metrics.totalKeys,
          maxDepth: metrics.maxDepth,
          formattedLengthChars: formatted.length,
          minifiedLengthChars: minified.length,
          compressionSavingsPercent:
            formatted.length > 0
              ? `${Math.round(((formatted.length - minified.length) / formatted.length) * 100)}%`
              : '0%',
        },
        typeDistribution: metrics.types,
      };

      const jsonStr = JSON.stringify(report, null, 2);
      return {
        content: jsonStr,
        fileName: 'json-metrics-report.json',
        mimeType: 'application/json;charset=utf-8',
        textForClipboard: jsonStr,
      };
    },
  });

  return {
    toolTitle: 'JSON Workspace',
    defaultFileName: 'formatted.json',
    options,
    metadata: {
      keys: metrics.totalKeys,
      depth: metrics.maxDepth,
      size: formatted.length,
    },
  };
}

import { DiffFormat } from '../../types/diff.types';
import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { textEngine } from './text-engine';
import { jsonEngine } from './json-engine';
import { xmlEngine } from './xml-engine';
import { yamlEngine } from './yaml-engine';
import { csvEngine } from './csv-engine';
import { sqlEngine } from './sql-engine';
import { htmlEngine } from './html-engine';
import { cssEngine } from './css-engine';
import { jsEngine } from './js-engine';
import { genericCodeEngine } from './generic-code-engine';

export * from './types';
export { textEngine } from './text-engine';
export { jsonEngine } from './json-engine';
export { xmlEngine } from './xml-engine';
export { yamlEngine } from './yaml-engine';
export { csvEngine } from './csv-engine';
export { sqlEngine } from './sql-engine';
export { htmlEngine } from './html-engine';
export { cssEngine } from './css-engine';
export { jsEngine } from './js-engine';
export { genericCodeEngine } from './generic-code-engine';

export const ENGINE_REGISTRY: Record<DiffFormat, DiffEngine> = {
  text: textEngine,
  json: jsonEngine,
  xml: xmlEngine,
  yaml: yamlEngine,
  csv: csvEngine,
  sql: sqlEngine,
  html: htmlEngine,
  css: cssEngine,
  javascript: jsEngine,
  code: genericCodeEngine,
  auto: textEngine,
};

/**
 * Retrieve the dedicated comparison engine for a given format.
 * Defaults to textEngine if format is unhandled or 'auto'.
 */
export function getEngine(format: DiffFormat): DiffEngine {
  return ENGINE_REGISTRY[format] || textEngine;
}

/**
 * Run comparison through the appropriate engine based on input options.
 */
export function compareWithEngine(input: DiffEngineInput): DiffEngineResult {
  const engine = getEngine(input.options.format);
  return engine.compare(input);
}


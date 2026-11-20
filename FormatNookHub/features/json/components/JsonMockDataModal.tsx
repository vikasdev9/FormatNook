'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Database,
  Sparkles,
  Copy,
  Download,
  Check,
  RefreshCw,
  Sliders,
  Code,
  FileJson,
  Layers,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import {
  MockFieldCategory,
  MockFieldRule,
  MockGeneratorConfig,
  MockSourceType,
} from '../types/mock-generator.types';
import {
  MOCK_PRESETS,
  detectFieldCategory,
  extractRulesFromSample,
  extractRulesFromSchema,
  generateMockData,
} from '../services/json-mock-generator';
import { downloadFile } from '@/lib/download';

interface JsonMockDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentJsonText: string;
  onInsertIntoEditor: (generatedJson: string) => void;
}

const CATEGORY_OPTIONS: { label: string; value: MockFieldCategory }[] = [
  { label: 'Full Name', value: 'fullName' },
  { label: 'First Name', value: 'firstName' },
  { label: 'Last Name', value: 'lastName' },
  { label: 'Email', value: 'email' },
  { label: 'Phone Number', value: 'phone' },
  { label: 'Street Address', value: 'address' },
  { label: 'City', value: 'city' },
  { label: 'Country', value: 'country' },
  { label: 'Zip Code', value: 'zipCode' },
  { label: 'Company Name', value: 'company' },
  { label: 'Job Title', value: 'jobTitle' },
  { label: 'UUID (v4)', value: 'uuid' },
  { label: 'Integer', value: 'integer' },
  { label: 'Decimal', value: 'decimal' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date (YYYY-MM-DD)', value: 'date' },
  { label: 'DateTime (ISO)', value: 'datetime' },
  { label: 'URL', value: 'url' },
  { label: 'Enum / Choices', value: 'enum' },
  { label: 'Random Text', value: 'text' },
  { label: 'Custom Template', value: 'custom' },
];

export function JsonMockDataModal({
  isOpen,
  onClose,
  currentJsonText,
  onInsertIntoEditor,
}: JsonMockDataModalProps) {
  // Source type: sample, schema, or preset
  const [sourceType, setSourceType] = useState<MockSourceType>('sample');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('users');

  // Schema input text if schema mode
  const [schemaText, setSchemaText] = useState<string>(() => {
    return JSON.stringify(
      {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1, maximum: 1000 },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
        },
      },
      null,
      2
    );
  });

  // Generator configuration state
  const [recordCount, setRecordCount] = useState<number>(10);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 999999));
  const [asArray, setAsArray] = useState<boolean>(true);

  // Field customization rules
  const [rules, setRules] = useState<MockFieldRule[]>([]);
  const [activeTemplateObj, setActiveTemplateObj] = useState<any>(null);

  // Generation output state
  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [previewSnippet, setPreviewSnippet] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize rules when modal opens or source changes
  const refreshSourceRules = useCallback(() => {
    setErrorMsg(null);
    let targetObj: any = null;

    try {
      if (sourceType === 'sample') {
        if (currentJsonText && currentJsonText.trim()) {
          targetObj = JSON.parse(currentJsonText);
        } else {
          targetObj = MOCK_PRESETS[0].sample;
        }
        setActiveTemplateObj(targetObj);
        const extracted = extractRulesFromSample(targetObj);
        setRules(extracted);
      } else if (sourceType === 'preset') {
        const preset = MOCK_PRESETS.find((p) => p.id === selectedPresetId) || MOCK_PRESETS[0];
        targetObj = preset.sample;
        setActiveTemplateObj(targetObj);
        const extracted = extractRulesFromSample(targetObj);
        setRules(extracted);
      } else if (sourceType === 'schema') {
        const parsedSchema = JSON.parse(schemaText);
        targetObj = parsedSchema;
        setActiveTemplateObj(targetObj);
        const extracted = extractRulesFromSchema(parsedSchema);
        setRules(extracted);
      }
    } catch (err: any) {
      setErrorMsg(`Failed to parse source: ${err.message || 'Invalid syntax'}`);
    }
  }, [sourceType, selectedPresetId, currentJsonText, schemaText]);

  useEffect(() => {
    if (isOpen) {
      refreshSourceRules();
    }
  }, [isOpen, refreshSourceRules]);

  // Generate mock data function
  const executeGeneration = useCallback(
    (countToGen: number, customSeed: number) => {
      if (!activeTemplateObj) return;

      const config: MockGeneratorConfig = {
        sourceType,
        recordCount: countToGen,
        seed: customSeed,
        asArray: countToGen > 1 || asArray,
        rules,
      };

      try {
        const result = generateMockData(config, activeTemplateObj);
        const jsonStr = JSON.stringify(result, null, 2);
        setGeneratedJson(jsonStr);

        // Preview snippet (first 1-2 items)
        const previewObj = Array.isArray(result) ? result.slice(0, 2) : result;
        setPreviewSnippet(JSON.stringify(previewObj, null, 2));
      } catch (err: any) {
        setErrorMsg(`Generation failed: ${err.message || 'Unknown error'}`);
      }
    },
    [activeTemplateObj, sourceType, asArray, rules]
  );

  // Auto-generate preview on config or rules change
  useEffect(() => {
    if (activeTemplateObj && rules.length > 0) {
      executeGeneration(Math.min(recordCount, 5), seed);
    }
  }, [activeTemplateObj, rules, seed, executeGeneration, recordCount]);

  // Handler for full generation
  const handleFullGenerate = () => {
    executeGeneration(recordCount, seed);
  };

  const handleRandomizeSeed = () => {
    const nextSeed = Math.floor(Math.random() * 999999);
    setSeed(nextSeed);
  };

  // Rule updater
  const handleUpdateRuleType = (rulePath: string, newType: MockFieldCategory) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.path === rulePath) {
          return { ...r, type: newType };
        }
        return r;
      })
    );
  };

  const handleUpdateRuleParams = (rulePath: string, updates: Partial<MockFieldRule>) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.path === rulePath) {
          return { ...r, ...updates };
        }
        return r;
      })
    );
  };

  // Action handlers
  const handleCopy = () => {
    if (!generatedJson) return;
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedJson) return;
    downloadFile(generatedJson, `mock-data-${recordCount}-records.json`, 'application/json');
  };

  const handleInsert = () => {
    if (!generatedJson) {
      handleFullGenerate();
    }
    onInsertIntoEditor(generatedJson);
    onClose();
  };

  const handleClear = () => {
    setGeneratedJson('');
    setPreviewSnippet('');
    setSeed(1001);
  };

  if (!isOpen) return null;

  return (
    <div className="json-mock-modal-backdrop" data-testid="json-mock-data-modal">
      <div className="json-mock-modal-dialog">
        {/* Header */}
        <div className="json-mock-modal-header">
          <div className="header-title-group">
            <Database size={18} className="text-accent" />
            <h3>Generate Realistic JSON Mock Data</h3>
          </div>
          <button
            className="btn btn-secondary btn-icon-only btn-sm"
            onClick={onClose}
            aria-label="Close mock data generator"
            data-testid="mock-modal-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="json-mock-modal-body">
          {errorMsg && (
            <div className="json-mock-error-banner" data-testid="mock-error-banner">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Source Tabs */}
          <div className="json-mock-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={sourceType === 'sample'}
              className={`mock-tab-btn ${sourceType === 'sample' ? 'active' : ''}`}
              onClick={() => setSourceType('sample')}
              data-testid="mock-source-sample"
            >
              <FileJson size={14} />
              <span>Current JSON Sample</span>
            </button>
            <button
              role="tab"
              aria-selected={sourceType === 'preset'}
              className={`mock-tab-btn ${sourceType === 'preset' ? 'active' : ''}`}
              onClick={() => setSourceType('preset')}
              data-testid="mock-source-preset"
            >
              <Layers size={14} />
              <span>Built-in Presets</span>
            </button>
            <button
              role="tab"
              aria-selected={sourceType === 'schema'}
              className={`mock-tab-btn ${sourceType === 'schema' ? 'active' : ''}`}
              onClick={() => setSourceType('schema')}
              data-testid="mock-source-schema"
            >
              <Code size={14} />
              <span>JSON Schema</span>
            </button>
          </div>

          {/* Preset Selector */}
          {sourceType === 'preset' && (
            <div className="json-mock-preset-selector">
              <label>Select Template:</label>
              <div className="preset-pill-list">
                {MOCK_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className={`preset-pill ${selectedPresetId === p.id ? 'active' : ''}`}
                    onClick={() => setSelectedPresetId(p.id)}
                    data-testid={`mock-preset-${p.id}`}
                  >
                    <strong>{p.label}</strong>
                    <span>{p.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Schema Input if Schema Mode */}
          {sourceType === 'schema' && (
            <div className="json-mock-schema-editor">
              <label>Paste JSON Schema (draft-04/07/2020-12):</label>
              <textarea
                className="schema-textarea"
                rows={4}
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                data-testid="mock-schema-textarea"
              />
              <button
                className="btn btn-secondary btn-xs mt-1"
                onClick={refreshSourceRules}
              >
                Apply Schema Rules
              </button>
            </div>
          )}

          {/* Generator Controls Grid */}
          <div className="json-mock-controls-grid">
            {/* Record Count */}
            <div className="control-col">
              <label>Record Count (1 - 10,000):</label>
              <div className="count-input-row">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  className="input-control"
                  value={recordCount}
                  onChange={(e) => setRecordCount(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
                  data-testid="mock-record-count-input"
                />
                <div className="quick-count-pills">
                  {[5, 25, 100, 500, 1000].map((c) => (
                    <button
                      key={c}
                      className={`quick-pill ${recordCount === c ? 'active' : ''}`}
                      onClick={() => setRecordCount(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seed / Reproducibility */}
            <div className="control-col">
              <label>Deterministic Seed (Reproducible):</label>
              <div className="seed-input-row">
                <input
                  type="number"
                  className="input-control"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  data-testid="mock-seed-input"
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleRandomizeSeed}
                  title="Randomize seed"
                  data-testid="mock-randomize-seed-btn"
                >
                  <RefreshCw size={13} />
                  <span>Dice</span>
                </button>
              </div>
            </div>

            {/* Output Shape */}
            <div className="control-col">
              <label>Output Format:</label>
              <div className="format-toggle-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={asArray || recordCount > 1}
                    disabled={recordCount > 1}
                    onChange={(e) => setAsArray(e.target.checked)}
                    data-testid="mock-array-checkbox"
                  />
                  <span>Wrap in JSON Array <code>[...]</code></span>
                </label>
              </div>
            </div>
          </div>

          {/* Field Customization Rules Table */}
          <div className="json-mock-rules-section">
            <div className="rules-section-header">
              <Sliders size={14} />
              <h4>Detected Fields & Custom Generation Rules ({rules.length})</h4>
            </div>

            <div className="rules-table-container">
              <table className="rules-table" data-testid="mock-rules-table">
                <thead>
                  <tr>
                    <th>Field Path</th>
                    <th>Data Type</th>
                    <th>Parameters / Format</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.path} data-testid={`rule-row-${rule.path}`}>
                      <td className="rule-path-cell">
                        <code>{rule.path}</code>
                        {rule.isArray && <span className="array-pill">Array</span>}
                      </td>
                      <td>
                        <select
                          className="select-control select-xs"
                          value={rule.type}
                          onChange={(e) => handleUpdateRuleType(rule.path, e.target.value as MockFieldCategory)}
                          data-testid={`rule-type-select-${rule.path}`}
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="rule-params-cell">
                        {rule.type === 'integer' && (
                          <div className="param-range-inputs">
                            <span>Min:</span>
                            <input
                              type="number"
                              className="input-xs"
                              value={rule.min ?? 1}
                              onChange={(e) => handleUpdateRuleParams(rule.path, { min: Number(e.target.value) })}
                            />
                            <span>Max:</span>
                            <input
                              type="number"
                              className="input-xs"
                              value={rule.max ?? 1000}
                              onChange={(e) => handleUpdateRuleParams(rule.path, { max: Number(e.target.value) })}
                            />
                          </div>
                        )}
                        {rule.type === 'decimal' && (
                          <div className="param-range-inputs">
                            <span>Min:</span>
                            <input
                              type="number"
                              className="input-xs"
                              value={rule.min ?? 1}
                              onChange={(e) => handleUpdateRuleParams(rule.path, { min: Number(e.target.value) })}
                            />
                            <span>Max:</span>
                            <input
                              type="number"
                              className="input-xs"
                              value={rule.max ?? 1000}
                              onChange={(e) => handleUpdateRuleParams(rule.path, { max: Number(e.target.value) })}
                            />
                            <span>Decimals:</span>
                            <input
                              type="number"
                              className="input-xs"
                              value={rule.decimals ?? 2}
                              onChange={(e) => handleUpdateRuleParams(rule.path, { decimals: Number(e.target.value) })}
                            />
                          </div>
                        )}
                        {rule.type === 'enum' && (
                          <input
                            type="text"
                            placeholder="val1, val2, val3"
                            className="input-control input-xs"
                            value={(rule.enumValues || []).join(', ')}
                            onChange={(e) =>
                              handleUpdateRuleParams(rule.path, {
                                enumValues: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              })
                            }
                          />
                        )}
                        {rule.type === 'custom' && (
                          <input
                            type="text"
                            placeholder="ORD-#### or US-##"
                            className="input-control input-xs"
                            value={rule.customTemplate || ''}
                            onChange={(e) => handleUpdateRuleParams(rule.path, { customTemplate: e.target.value })}
                          />
                        )}
                        {!['integer', 'decimal', 'enum', 'custom'].includes(rule.type) && (
                          <span className="param-auto-label">Auto synthetic realistic generator</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="json-mock-preview-section">
            <div className="preview-header">
              <span>Preview Output (Sample Slice)</span>
              <span className="preview-badge">{recordCount} records configured</span>
            </div>
            <pre className="preview-code-block" data-testid="mock-preview-code">
              {previewSnippet || generatedJson || '// Configure fields and click Generate'}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="json-mock-modal-footer">
          <div className="footer-left">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClear}
              title="Clear generated data"
              data-testid="mock-clear-btn"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>

          <div className="footer-right">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleFullGenerate}
              data-testid="mock-generate-btn"
            >
              <Sparkles size={14} />
              <span>Generate ({recordCount})</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
              disabled={!generatedJson}
              data-testid="mock-copy-btn"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleDownload}
              disabled={!generatedJson}
              data-testid="mock-download-btn"
            >
              <Download size={14} />
              <span>Download</span>
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleInsert}
              data-testid="mock-insert-editor-btn"
            >
              <ArrowRight size={14} />
              <span>Insert into JSON Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Copy,
  Download,
  Check,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { JsonSchemaDraft, SchemaGeneratorOptions, SchemaValidationResult } from '../types/schema-wizard.types';
import {
  generateJsonSchema,
  validateJsonAgainstSchema,
  generateSampleFromSchema,
  DEFAULT_SCHEMA_OPTIONS,
} from '../services/json-schema-wizard-service';
import { downloadFile } from '@/lib/download';

interface JsonSchemaWizardViewProps {
  inputJson: string;
  onApplyJsonToWorkspace?: (jsonString: string) => void;
  isDark?: boolean;
}

export function JsonSchemaWizardView({
  inputJson,
  onApplyJsonToWorkspace,
  isDark = true,
}: JsonSchemaWizardViewProps) {
  // Generator options
  const [draft, setDraft] = useState<JsonSchemaDraft>('2020-12');
  const [includeRequired, setIncludeRequired] = useState<boolean>(true);
  const [detectEnums, setDetectEnums] = useState<boolean>(true);
  const [detectFormats, setDetectFormats] = useState<boolean>(true);

  // Schema text state
  const [schemaText, setSchemaText] = useState<string>('');
  const [validationResult, setValidationResult] = useState<SchemaValidationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedSample, setAppliedSample] = useState<boolean>(false);

  // Generate schema from current input JSON
  const handleGenerate = useCallback(() => {
    try {
      if (!inputJson || !inputJson.trim()) {
        const fallbackObj = {
          id: 1,
          name: 'FormatNook Hub',
          email: 'support@formatnook.dev',
          active: true,
          tags: ['json', 'schema', 'wizard'],
        };
        const s = generateJsonSchema(fallbackObj, {
          draft,
          includeRequired,
          detectEnums,
          detectFormats,
        });
        setSchemaText(JSON.stringify(s, null, 2));
        return;
      }

      const parsed = JSON.parse(inputJson);
      const s = generateJsonSchema(parsed, {
        draft,
        includeRequired,
        detectEnums,
        detectFormats,
      });
      setSchemaText(JSON.stringify(s, null, 2));
    } catch (err: any) {
      console.warn('Could not parse input JSON for schema generation:', err);
    }
  }, [inputJson, draft, includeRequired, detectEnums, detectFormats]);

  // Initial generation on mount or input change
  useEffect(() => {
    if (!schemaText) {
      handleGenerate();
    }
  }, [handleGenerate, schemaText]);

  // Validate JSON against active schema
  const handleValidate = useCallback(() => {
    if (!schemaText.trim()) return;

    try {
      const parsedSchema = JSON.parse(schemaText);
      const dataToValidate = inputJson && inputJson.trim() ? JSON.parse(inputJson) : {};
      const res = validateJsonAgainstSchema(dataToValidate, parsedSchema);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({
        isValid: false,
        errors: [{ path: '$', message: `Schema JSON syntax error: ${err.message}` }],
        evaluatedAt: Date.now(),
      });
    }
  }, [schemaText, inputJson]);

  // Auto-validate on schema or input change
  useEffect(() => {
    handleValidate();
  }, [handleValidate]);

  // Generate sample JSON from active schema
  const handleGenerateSample = () => {
    try {
      const parsedSchema = JSON.parse(schemaText);
      const sample = generateSampleFromSchema(parsedSchema);
      const sampleStr = JSON.stringify(sample, null, 2);

      if (onApplyJsonToWorkspace) {
        onApplyJsonToWorkspace(sampleStr);
        setAppliedSample(true);
        setTimeout(() => setAppliedSample(false), 2000);
      }
    } catch (err: any) {
      alert(`Invalid schema: ${err.message}`);
    }
  };

  // Copy Schema
  const handleCopySchema = () => {
    if (!schemaText) return;
    navigator.clipboard.writeText(schemaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Schema
  const handleDownloadSchema = () => {
    if (!schemaText) return;
    downloadFile(schemaText, `schema-${draft}.json`, 'application/json');
  };

  return (
    <div className="schema-wizard-container" data-testid="json-schema-wizard-view">
      {/* Top Toolbar */}
      <div className="schema-wizard-toolbar">
        <div className="toolbar-group-left">
          <div className="wizard-title-badge">
            <ShieldCheck size={16} className="text-accent" />
            <span>Schema Wizard</span>
          </div>

          <div className="wizard-draft-select">
            <label htmlFor="schema-draft-select">Draft:</label>
            <select
              id="schema-draft-select"
              className="select-control select-xs"
              value={draft}
              onChange={(e) => setDraft(e.target.value as JsonSchemaDraft)}
              data-testid="schema-draft-select"
            >
              <option value="2020-12">Draft 2020-12</option>
              <option value="2019-09">Draft 2019-09</option>
              <option value="draft-07">Draft-07</option>
            </select>
          </div>

          <div className="wizard-options-checkboxes">
            <label className="wizard-checkbox-label">
              <input
                type="checkbox"
                checked={includeRequired}
                onChange={(e) => setIncludeRequired(e.target.checked)}
                data-testid="schema-opt-required"
              />
              <span>Required</span>
            </label>

            <label className="wizard-checkbox-label">
              <input
                type="checkbox"
                checked={detectEnums}
                onChange={(e) => setDetectEnums(e.target.checked)}
                data-testid="schema-opt-enums"
              />
              <span>Enums</span>
            </label>

            <label className="wizard-checkbox-label">
              <input
                type="checkbox"
                checked={detectFormats}
                onChange={(e) => setDetectFormats(e.target.checked)}
                data-testid="schema-opt-formats"
              />
              <span>Formats</span>
            </label>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGenerate}
            title="Generate schema from workspace JSON"
            data-testid="schema-generate-btn"
          >
            <Sparkles size={14} />
            <span>Generate from JSON</span>
          </button>
        </div>

        <div className="toolbar-group-right">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGenerateSample}
            title="Generate sample JSON and insert into workspace"
            data-testid="schema-sample-btn"
          >
            {appliedSample ? <Check size={14} className="text-success" /> : <FileCode size={14} />}
            <span>{appliedSample ? 'Inserted' : 'Generate Sample'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopySchema}
            data-testid="schema-copy-btn"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadSchema}
            data-testid="schema-download-btn"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="schema-wizard-grid">
        {/* Left: Schema Editor */}
        <div className="schema-editor-pane">
          <div className="pane-header">
            <span>JSON Schema Definition</span>
            <span className="badge-draft">{draft}</span>
          </div>
          <textarea
            className="schema-code-textarea"
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            placeholder="JSON Schema will appear here..."
            data-testid="schema-editor-textarea"
          />
        </div>

        {/* Right: Live Schema Validation Results */}
        <div className="schema-validation-pane">
          <div className="pane-header">
            <span>Schema Validation Status</span>
            <button
              className="btn btn-secondary btn-xs"
              onClick={handleValidate}
              data-testid="schema-revalidate-btn"
            >
              <RotateCcw size={12} />
              <span>Validate</span>
            </button>
          </div>

          <div className="schema-validation-body" data-testid="schema-validation-results">
            {validationResult?.isValid ? (
              <div className="validation-success-card" data-testid="schema-valid-card">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <h4>Valid JSON Document</h4>
                  <p>The workspace JSON document fully satisfies this JSON Schema.</p>
                </div>
              </div>
            ) : (
              <div className="validation-errors-card" data-testid="schema-errors-card">
                <div className="errors-header">
                  <AlertTriangle size={20} className="text-danger" />
                  <h4>Validation Errors ({validationResult?.errors.length || 0})</h4>
                </div>
                <div className="errors-list">
                  {validationResult?.errors.map((err, i) => (
                    <div key={i} className="error-item-row" data-testid="schema-error-item">
                      <code className="error-path">{err.path}</code>
                      <span className="error-msg">{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="schema-quick-hint">
              <strong>Tip:</strong> You can edit the schema directly in the editor above. Add <code>minimum</code>, <code>pattern</code>, or custom <code>enum</code> constraints to test real-time validation feedback.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

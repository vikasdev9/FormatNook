'use client';

import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateJsonSchema, JsonSchemaError } from '../services/json-schema-service';

interface JsonSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonContent: string;
}

const SAMPLE_SCHEMAS = [
  {
    name: 'User Profile Schema',
    schema: JSON.stringify(
      {
        type: 'object',
        required: ['name', 'email', 'role'],
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string' },
          role: { type: 'string', enum: ['Staff Engineer', 'Developer', 'Admin', 'Guest'] },
          verified: { type: 'boolean' },
        },
      },
      null,
      2
    ),
  },
  {
    name: 'Users Array Schema',
    schema: JSON.stringify(
      {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'name', 'department'],
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            department: { type: 'string' },
          },
        },
      },
      null,
      2
    ),
  },
];

export function JsonSchemaModal({ isOpen, onClose, jsonContent }: JsonSchemaModalProps) {
  const [schemaText, setSchemaText] = useState<string>(SAMPLE_SCHEMAS[0].schema);

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(jsonContent);
    } catch {
      return null;
    }
  }, [jsonContent]);

  const validationResult = useMemo(() => {
    if (!schemaText.trim()) {
      return { isValid: null, errors: [] as JsonSchemaError[] };
    }
    if (parsedData === null) {
      return {
        isValid: false,
        errors: [{ path: '$', message: 'Input JSON is not valid JSON. Please fix syntax errors first.' }],
      };
    }
    try {
      const parsedSchema = JSON.parse(schemaText);
      return validateJsonSchema(parsedData, parsedSchema);
    } catch (e: any) {
      return {
        isValid: false,
        errors: [{ path: 'Schema', message: `Invalid schema definition: ${e?.message || 'JSON parse error'}` }],
      };
    }
  }, [parsedData, schemaText]);

  if (!isOpen) return null;

  return (
    <div
      className="json-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="json-schema-modal"
    >
      <div className="json-modal-card json-schema-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="json-modal-header">
          <div className="json-modal-title">
            <ShieldCheck size={18} className="text-accent" />
            <span>JSON Schema Validation</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="json-modal-body">
          {/* Preset Selector */}
          <div className="schema-preset-row">
            <label htmlFor="schema-preset-select">Preset Schema:</label>
            <select
              id="schema-preset-select"
              className="select-control select-sm"
              onChange={(e) => {
                const found = SAMPLE_SCHEMAS.find((s) => s.name === e.target.value);
                if (found) setSchemaText(found.schema);
              }}
              defaultValue={SAMPLE_SCHEMAS[0].name}
            >
              {SAMPLE_SCHEMAS.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="schema-editor-wrapper">
            <label className="stat-label">JSON Schema (draft-07 compatible):</label>
            <textarea
              className="schema-textarea"
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              placeholder="Paste or write JSON Schema here..."
              spellCheck="false"
            />
          </div>

          {/* Validation Status */}
          <div className="schema-status-wrapper">
            {validationResult.isValid === true && (
              <div className="schema-banner success" data-testid="schema-valid-banner">
                <CheckCircle2 size={16} className="text-success" />
                <span>JSON conforms perfectly to the specified schema!</span>
              </div>
            )}

            {validationResult.isValid === false && (
              <div className="schema-banner error" data-testid="schema-errors-banner">
                <div className="banner-title">
                  <AlertCircle size={16} className="text-danger" />
                  <span>Found {validationResult.errors.length} Schema Violation(s):</span>
                </div>
                <ul className="schema-error-list">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>
                      <code>{err.path}</code>: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="json-modal-footer">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


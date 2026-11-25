'use client';

import React from 'react';
import {
  ColumnConfig,
  ColumnType,
  CsvDelimiter,
  CsvParseOptions,
  CsvParseResult,
  DuplicateHeaderStrategy,
  DuplicateKeyStrategy,
  EmptyValueHandling,
  HeaderMode,
  IndentationMode,
  JsonOutputMode,
  TypeConversionMode,
} from '../types/csv.types';
import { Settings, Sliders, Check, HelpCircle, Columns } from 'lucide-react';

interface CsvSettingsPanelProps {
  options: CsvParseOptions;
  onOptionsChange: (newOptions: CsvParseOptions) => void;
  parseResult: CsvParseResult;
}

export function CsvSettingsPanel({
  options,
  onOptionsChange,
  parseResult,
}: CsvSettingsPanelProps) {
  const { headers, detectedDelimiter, hasDetectedHeader, detectedHeaderReason } = parseResult;

  const handleUpdate = (partial: Partial<CsvParseOptions>) => {
    onOptionsChange({ ...options, ...partial });
  };

  const handleColumnConfigChange = (
    headerName: string,
    partial: Partial<ColumnConfig>
  ) => {
    const existing = options.columnConfigs || {};
    const current = existing[headerName] || {
      name: headerName,
      targetKey: headerName,
      type: 'auto',
      included: true,
      order: 0,
    };

    handleUpdate({
      columnConfigs: {
        ...existing,
        [headerName]: { ...current, ...partial },
      },
    });
  };

  return (
    <div className="csv-settings-container" data-testid="csv-settings-panel">
      <div className="csv-settings-grid">
        {/* Delimiter Selector */}
        <div className="csv-setting-group">
          <label htmlFor="csv-delimiter-select" className="csv-setting-label">
            Field Delimiter
          </label>
          <div className="csv-setting-row">
            <select
              id="csv-delimiter-select"
              value={options.delimiter || ','}
              onChange={(e) => handleUpdate({ delimiter: e.target.value as CsvDelimiter })}
              className="select-control"
              data-testid="select-delimiter"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="&#9;">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
              <option value="custom">Custom Delimiter</option>
            </select>
            {options.delimiter === 'custom' && (
              <input
                type="text"
                placeholder="Delimiter"
                value={options.customDelimiter || ''}
                onChange={(e) => handleUpdate({ customDelimiter: e.target.value })}
                className="select-control"
                style={{ width: '90px' }}
                maxLength={4}
                aria-label="Custom delimiter"
                data-testid="input-custom-delimiter"
              />
            )}
          </div>
          <span className="csv-setting-hint">
            Auto-detected delimiter: <code>{detectedDelimiter === '\t' ? '\\t' : detectedDelimiter}</code>
          </span>
        </div>

        {/* Header Mode */}
        <div className="csv-setting-group">
          <label htmlFor="csv-header-mode-select" className="csv-setting-label">
            Header Detection
          </label>
          <select
            id="csv-header-mode-select"
            value={options.headerMode || 'first-row'}
            onChange={(e) => handleUpdate({ headerMode: e.target.value as HeaderMode })}
            className="select-control"
            data-testid="select-header-mode"
          >
            <option value="first-row">First Row Contains Headers</option>
            <option value="none">First Row Does Not Contain Headers</option>
            <option value="auto">Auto-Detect Headers</option>
          </select>
          <span className="csv-setting-hint" title={detectedHeaderReason}>
            {hasDetectedHeader ? 'Headers identified in first row.' : 'Default numeric columns active.'}
          </span>
        </div>

        {/* Duplicate Headers Strategy */}
        <div className="csv-setting-group">
          <label htmlFor="csv-duplicate-header-strategy" className="csv-setting-label">
            Duplicate Header Strategy
          </label>
          <select
            id="csv-duplicate-header-strategy"
            value={options.duplicateStrategy || 'numeric-suffix'}
            onChange={(e) =>
              handleUpdate({ duplicateStrategy: e.target.value as DuplicateHeaderStrategy })
            }
            className="select-control"
            data-testid="select-duplicate-strategy"
          >
            <option value="numeric-suffix">Append Numeric Suffix (col_2)</option>
            <option value="rename-duplicates">Rename Duplicates (col_dup1)</option>
            <option value="reject">Reject with Error Diagnostics</option>
          </select>
          <span className="csv-setting-hint">Guarantees unique JSON object keys.</span>
        </div>

        {/* Output Mode */}
        <div className="csv-setting-group">
          <label htmlFor="csv-output-mode-select" className="csv-setting-label">
            JSON Output Format
          </label>
          <select
            id="csv-output-mode-select"
            value={options.outputMode || 'array-of-objects'}
            onChange={(e) => handleUpdate({ outputMode: e.target.value as JsonOutputMode })}
            className="select-control"
            data-testid="select-output-mode"
          >
            <option value="array-of-objects">JSON Array of Objects (Standard)</option>
            <option value="array-of-arrays">JSON Array of Arrays (Matrix)</option>
            <option value="object-keyed">JSON Object Keyed by Column ID</option>
          </select>
          <span className="csv-setting-hint">Controls JSON hierarchy.</span>
        </div>

        {/* Key Column & Duplicate Strategy (When Object Keyed) */}
        {options.outputMode === 'object-keyed' && (
          <>
            <div className="csv-setting-group">
              <label htmlFor="csv-key-column-select" className="csv-setting-label">
                Row Key Column
              </label>
              <select
                id="csv-key-column-select"
                value={options.keyColumn || headers[0] || ''}
                onChange={(e) => handleUpdate({ keyColumn: e.target.value })}
                className="select-control"
                data-testid="select-key-column"
              >
                {headers.map((h, i) => (
                  <option key={i} value={h}>
                    {h} (Column #{i + 1})
                  </option>
                ))}
              </select>
              <span className="csv-setting-hint">Field value used as the object property key.</span>
            </div>

            <div className="csv-setting-group">
              <label htmlFor="csv-duplicate-key-strategy" className="csv-setting-label">
                Duplicate Row ID Action
              </label>
              <select
                id="csv-duplicate-key-strategy"
                value={options.duplicateKeyStrategy || 'error'}
                onChange={(e) =>
                  handleUpdate({ duplicateKeyStrategy: e.target.value as DuplicateKeyStrategy })
                }
                className="select-control"
                data-testid="select-duplicate-key-strategy"
              >
                <option value="error">Raise Error (Never Overwrite)</option>
                <option value="append-suffix">Append Suffix (key_2)</option>
              </select>
              <span className="csv-setting-hint">Prevents accidental data loss on collisions.</span>
            </div>
          </>
        )}

        {/* Type Conversion Mode */}
        <div className="csv-setting-group">
          <label htmlFor="csv-type-conversion-select" className="csv-setting-label">
            Data Type Conversion
          </label>
          <select
            id="csv-type-conversion-select"
            value={options.typeConversionMode || 'auto'}
            onChange={(e) =>
              handleUpdate({ typeConversionMode: e.target.value as TypeConversionMode })
            }
            className="select-control"
            data-testid="select-type-mode"
          >
            <option value="auto">Automatic (Numbers, Booleans, Preserve Leading Zeros)</option>
            <option value="string">All Values as Strings</option>
            <option value="custom">Custom Per-Column Mapping</option>
          </select>
          <span className="csv-setting-hint">Preserves leading zeros in codes and IDs.</span>
        </div>

        {/* Empty Value Handling */}
        <div className="csv-setting-group">
          <label htmlFor="csv-empty-value-select" className="csv-setting-label">
            Empty Field Representation
          </label>
          <select
            id="csv-empty-value-select"
            value={options.emptyValueHandling || 'empty-string'}
            onChange={(e) =>
              handleUpdate({ emptyValueHandling: e.target.value as EmptyValueHandling })
            }
            className="select-control"
            data-testid="select-empty-handling"
          >
            <option value="empty-string">Empty String (&quot;&quot;)</option>
            <option value="null">Null Value (null)</option>
          </select>
          <span className="csv-setting-hint">How missing or blank cells are serialized.</span>
        </div>

        {/* Indentation */}
        <div className="csv-setting-group">
          <label htmlFor="csv-indent-select" className="csv-setting-label">
            Indentation & Formatting
          </label>
          <select
            id="csv-indent-select"
            value={options.indent || '2'}
            onChange={(e) => handleUpdate({ indent: e.target.value as IndentationMode })}
            className="select-control"
            data-testid="select-indent"
          >
            <option value="2">2 Spaces (Readable)</option>
            <option value="4">4 Spaces (Standard)</option>
            <option value="compact">Compact / Minified (1 Line)</option>
          </select>
          <span className="csv-setting-hint">Output JSON spacing style.</span>
        </div>
      </div>

      {/* Advanced Checkbox Toggles */}
      <div className="csv-toggles-section">
        <label className="csv-checkbox-label">
          <input
            type="checkbox"
            checked={options.trimWhitespace ?? false}
            onChange={(e) => handleUpdate({ trimWhitespace: e.target.checked })}
            data-testid="toggle-trim-whitespace"
          />
          <span>Trim Whitespace from Unquoted Fields</span>
        </label>

        <label className="csv-checkbox-label">
          <input
            type="checkbox"
            checked={options.skipEmptyRows ?? true}
            onChange={(e) => handleUpdate({ skipEmptyRows: e.target.checked })}
            data-testid="toggle-skip-empty-rows"
          />
          <span>Skip Completely Empty Rows</span>
        </label>

        <label className="csv-checkbox-label">
          <input
            type="checkbox"
            checked={options.nestedJson ?? false}
            onChange={(e) => handleUpdate({ nestedJson: e.target.checked })}
            data-testid="toggle-nested-json"
          />
          <span>Generate Nested Objects from Dot-Delimited Keys (e.g. <code>user.name</code>)</span>
        </label>
      </div>

      {/* Per-Column Mapping Table (Shown when Custom Mapping is selected or toggled) */}
      {options.typeConversionMode === 'custom' && headers.length > 0 && (
        <div className="csv-column-mapping-card" data-testid="column-mapping-table">
          <div className="csv-column-mapping-header">
            <Columns size={16} />
            <span className="csv-column-mapping-title">Custom Column Configuration</span>
          </div>

          <div className="csv-table-scroll-wrap" style={{ maxHeight: '280px' }}>
            <table className="csv-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Include</th>
                  <th>Source CSV Column</th>
                  <th>JSON Output Key</th>
                  <th>Data Type</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h, i) => {
                  const cfg = options.columnConfigs?.[h] || {
                    name: h,
                    targetKey: h,
                    type: 'auto',
                    included: true,
                    order: i,
                  };

                  return (
                    <tr key={h}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={cfg.included !== false}
                          onChange={(e) =>
                            handleColumnConfigChange(h, { included: e.target.checked })
                          }
                          aria-label={`Include column ${h}`}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{h}</td>
                      <td>
                        <input
                          type="text"
                          value={cfg.targetKey}
                          onChange={(e) =>
                            handleColumnConfigChange(h, { targetKey: e.target.value })
                          }
                          className="select-control"
                          style={{ height: '32px', fontSize: '0.8125rem', width: '100%' }}
                          aria-label={`Rename key for ${h}`}
                        />
                      </td>
                      <td>
                        <select
                          value={cfg.type}
                          onChange={(e) =>
                            handleColumnConfigChange(h, { type: e.target.value as ColumnType })
                          }
                          className="select-control"
                          style={{ height: '32px', fontSize: '0.8125rem' }}
                          aria-label={`Type for ${h}`}
                        >
                          <option value="string">String</option>
                          <option value="number">Number (Float)</option>
                          <option value="integer">Integer</option>
                          <option value="boolean">Boolean</option>
                          <option value="null">Null</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

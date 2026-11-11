'use client';

import React, { useState, useMemo } from 'react';
import { X, ArrowRightLeft, Copy, Check, Download, AlertCircle, Sparkles, SlidersHorizontal } from 'lucide-react';
import {
  jsonToCsv,
  jsonToTsv,
  jsonToXml,
  jsonToYaml,
  flattenJson,
  unflattenJson,
  sortJsonKeys,
  sortJsonArray,
  filterJson,
  deduplicateJsonArrays,
  extractJsonFields,
  mergeJsonObjects,
  splitJsonArray,
  escapeJsonString,
  unescapeJsonString,
} from '../services/json-transform-service';
import {
  JsonTransformResult,
  JsonTransformType,
  CsvOptions,
  XmlOptions,
  FlattenOptions,
  SortKeysOptions,
  SortArrayOptions,
  FilterOptions,
  DeduplicateOptions,
} from '../types/json.types';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';

interface JsonTransformModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonContent: string;
  onApplyTransform: (transformedText: string) => void;
}

export function JsonTransformModal({
  isOpen,
  onClose,
  jsonContent,
  onApplyTransform,
}: JsonTransformModalProps) {
  const [selectedType, setSelectedType] = useState<JsonTransformType>('yaml');
  const [activeCategory, setActiveCategory] = useState<'converters' | 'structure' | 'string'>('converters');

  // Options states
  const [csvDelimiter, setCsvDelimiter] = useState<',' | ';' | '\t'>(',');
  const [csvNestedStrategy, setCsvNestedStrategy] = useState<'flatten' | 'json-string' | 'discard'>('json-string');
  const [xmlRootTag, setXmlRootTag] = useState<string>('root');
  const [xmlItemTag, setXmlItemTag] = useState<string>('item');
  const [flattenSep, setFlattenSep] = useState<string>('.');
  const [unflattenSep, setUnflattenSep] = useState<string>('.');
  const [sortKeysDir, setSortKeysDir] = useState<'asc' | 'desc'>('asc');
  const [sortKeysCase, setSortKeysCase] = useState<boolean>(true);
  const [sortArrayProp, setSortArrayProp] = useState<string>('');
  const [sortArrayDir, setSortArrayDir] = useState<'asc' | 'desc'>('asc');
  const [sortArrayType, setSortArrayType] = useState<'auto' | 'string' | 'number' | 'date'>('auto');
  const [filterField, setFilterField] = useState<string>('');
  const [filterOp, setFilterOp] = useState<'equals' | 'contains' | 'starts_with' | 'type'>('contains');
  const [filterVal, setFilterVal] = useState<string>('');
  const [dedupProp, setDedupProp] = useState<string>('');
  const [extractFieldsStr, setExtractFieldsStr] = useState<string>('');
  const [extractKeepStructure, setExtractKeepStructure] = useState<boolean>(false);
  const [mergeInputJson, setMergeInputJson] = useState<string>('{}');
  const [mergeStrategy, setMergeStrategy] = useState<'shallow' | 'deep'>('deep');
  const [splitChunkSize, setSplitChunkSize] = useState<number>(10);

  const { copy, copied } = useClipboard();

  // Parse input json safely
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(jsonContent);
    } catch {
      return null;
    }
  }, [jsonContent]);

  // Compute transform result
  const transformResult: JsonTransformResult = useMemo(() => {
    if (!jsonContent.trim()) {
      return { output: '', format: 'text' };
    }

    if (selectedType === 'escape') {
      return escapeJsonString(jsonContent);
    }

    if (selectedType === 'unescape') {
      return unescapeJsonString(jsonContent);
    }

    if (parsedData === null) {
      return {
        output: 'Error: Input is not valid JSON. Please format or repair your JSON first before converting.',
        format: 'text',
        notes: 'Invalid JSON input',
      };
    }

    switch (selectedType) {
      case 'csv':
        return jsonToCsv(parsedData, { delimiter: csvDelimiter, nestedStrategy: csvNestedStrategy });
      case 'tsv':
        return jsonToTsv(parsedData, { nestedStrategy: csvNestedStrategy });
      case 'extract': {
        const fields = extractFieldsStr.split(',').map((s) => s.trim()).filter(Boolean);
        return extractJsonFields(parsedData, { fields, keepStructure: extractKeepStructure });
      }
      case 'merge': {
        try {
          const second = JSON.parse(mergeInputJson || '{}');
          return mergeJsonObjects(parsedData, second, { strategy: mergeStrategy });
        } catch (err: any) {
          return { output: 'Error: Secondary merge input is not valid JSON.', format: 'text' };
        }
      }
      case 'split':
        return splitJsonArray(parsedData, { chunkSize: splitChunkSize });
      case 'xml':
        return jsonToXml(parsedData, { rootTag: xmlRootTag, itemTag: xmlItemTag });
      case 'yaml':
        return jsonToYaml(parsedData);
      case 'flatten':
        return flattenJson(parsedData, { separator: flattenSep });
      case 'unflatten':
        return unflattenJson(parsedData, { separator: unflattenSep });
      case 'sort-keys':
        return sortJsonKeys(parsedData, { direction: sortKeysDir, caseSensitive: sortKeysCase });
      case 'sort-array':
        return sortJsonArray(parsedData, { sortProperty: sortArrayProp, direction: sortArrayDir, propertyType: sortArrayType });
      case 'filter':
        return filterJson(parsedData, {
          conditions: filterField ? [{ field: filterField, operator: filterOp, value: filterVal }] : [],
        });
      case 'deduplicate':
      case 'text':
      default:
        return deduplicateJsonArrays(parsedData, { propertyKey: dedupProp || undefined });
    }
  }, [
    selectedType,
    parsedData,
    jsonContent,
    csvDelimiter,
    csvNestedStrategy,
    xmlRootTag,
    xmlItemTag,
    flattenSep,
    unflattenSep,
    sortKeysDir,
    sortKeysCase,
    sortArrayProp,
    sortArrayDir,
    sortArrayType,
    filterField,
    filterOp,
    filterVal,
    dedupProp,
    extractFieldsStr,
    extractKeepStructure,
    mergeInputJson,
    mergeStrategy,
    splitChunkSize,
  ]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      json: 'json',
      csv: 'csv',
      xml: 'xml',
      yaml: 'yaml',
      text: 'txt',
    };
    const mimeMap: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml',
      yaml: 'text/yaml',
      text: 'text/plain',
    };
    const ext = extMap[transformResult.format] || 'txt';
    downloadFile(transformResult.output, `converted.${ext}`, mimeMap[transformResult.format] || 'text/plain');
  };

  const handleApply = () => {
    onApplyTransform(transformResult.output);
    onClose();
  };

  return (
    <div
      className="json-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="json-transform-modal"
    >
      <div className="json-modal-card json-transform-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="json-modal-header">
          <div className="json-modal-title">
            <ArrowRightLeft size={18} className="text-accent" />
            <span>Transform & Convert JSON</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="json-modal-body">
          {/* Main Transformation Selection Pills */}
          <div className="transform-pill-group">
            <button
              className={`pill-btn ${selectedType === 'yaml' ? 'active' : ''}`}
              onClick={() => setSelectedType('yaml')}
            >
              JSON to YAML
            </button>
            <button
              className={`pill-btn ${selectedType === 'xml' ? 'active' : ''}`}
              onClick={() => setSelectedType('xml')}
            >
              JSON to XML
            </button>
            <button
              className={`pill-btn ${selectedType === 'csv' ? 'active' : ''}`}
              onClick={() => setSelectedType('csv')}
            >
              JSON to CSV
            </button>
            <button
              className={`pill-btn ${selectedType === 'tsv' ? 'active' : ''}`}
              onClick={() => setSelectedType('tsv')}
            >
              JSON to TSV
            </button>
            <button
              className={`pill-btn ${selectedType === 'extract' ? 'active' : ''}`}
              onClick={() => setSelectedType('extract')}
            >
              Extract Fields
            </button>
            <button
              className={`pill-btn ${selectedType === 'merge' ? 'active' : ''}`}
              onClick={() => setSelectedType('merge')}
            >
              Merge Objects
            </button>
            <button
              className={`pill-btn ${selectedType === 'split' ? 'active' : ''}`}
              onClick={() => setSelectedType('split')}
            >
              Split Array
            </button>
            <button
              className={`pill-btn ${selectedType === 'flatten' ? 'active' : ''}`}
              onClick={() => setSelectedType('flatten')}
            >
              Flatten
            </button>
            <button
              className={`pill-btn ${selectedType === 'unflatten' ? 'active' : ''}`}
              onClick={() => setSelectedType('unflatten')}
            >
              Unflatten
            </button>
            <button
              className={`pill-btn ${selectedType === 'sort-keys' ? 'active' : ''}`}
              onClick={() => setSelectedType('sort-keys')}
            >
              Sort Keys
            </button>
            <button
              className={`pill-btn ${selectedType === 'sort-array' ? 'active' : ''}`}
              onClick={() => setSelectedType('sort-array')}
            >
              Sort Array
            </button>
            <button
              className={`pill-btn ${selectedType === 'filter' ? 'active' : ''}`}
              onClick={() => setSelectedType('filter')}
            >
              Filter
            </button>
            <button
              className={`pill-btn ${selectedType === 'deduplicate' || selectedType === 'text' ? 'active' : ''}`}
              onClick={() => setSelectedType('deduplicate')}
            >
              Deduplicate
            </button>
            <button
              className={`pill-btn ${selectedType === 'escape' ? 'active' : ''}`}
              onClick={() => setSelectedType('escape')}
            >
              Escape String
            </button>
            <button
              className={`pill-btn ${selectedType === 'unescape' ? 'active' : ''}`}
              onClick={() => setSelectedType('unescape')}
            >
              Unescape String
            </button>
          </div>

          {/* Contextual Options Bar */}
          <div className="transform-options-bar">
            {selectedType === 'tsv' && (
              <div className="options-inline-row">
                <label>Tab-Separated Output</label>
                <label>Nested Objects:</label>
                <select
                  className="select-control select-xs"
                  value={csvNestedStrategy}
                  onChange={(e) => setCsvNestedStrategy(e.target.value as any)}
                >
                  <option value="json-string">JSON String</option>
                  <option value="flatten">Flatten Keys</option>
                  <option value="discard">Discard Nested</option>
                </select>
              </div>
            )}

            {selectedType === 'extract' && (
              <div className="options-inline-row" style={{ flex: 1 }}>
                <label>Fields (comma-separated):</label>
                <input
                  type="text"
                  className="input-xs"
                  style={{ flex: 1, minWidth: '180px' }}
                  value={extractFieldsStr}
                  onChange={(e) => setExtractFieldsStr(e.target.value)}
                  placeholder="e.g. id, name, user.email"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={extractKeepStructure}
                    onChange={(e) => setExtractKeepStructure(e.target.checked)}
                  />
                  <span>Keep hierarchy</span>
                </label>
              </div>
            )}

            {selectedType === 'merge' && (
              <div className="options-inline-row" style={{ flex: 1 }}>
                <label>Merge Strategy:</label>
                <select
                  className="select-control select-xs"
                  value={mergeStrategy}
                  onChange={(e) => setMergeStrategy(e.target.value as any)}
                >
                  <option value="deep">Deep Merge (recursive)</option>
                  <option value="shallow">Shallow Merge (top-level)</option>
                </select>
                <label>Merge with JSON:</label>
                <input
                  type="text"
                  className="input-xs"
                  style={{ flex: 1, minWidth: '200px' }}
                  value={mergeInputJson}
                  onChange={(e) => setMergeInputJson(e.target.value)}
                  placeholder='{"extraKey": "value"}'
                />
              </div>
            )}

            {selectedType === 'split' && (
              <div className="options-inline-row">
                <label>Chunk Size:</label>
                <input
                  type="number"
                  className="input-xs"
                  style={{ width: '80px' }}
                  min="1"
                  max="100000"
                  value={splitChunkSize}
                  onChange={(e) => setSplitChunkSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>elements per subarray</span>
              </div>
            )}

            {selectedType === 'xml' && (
              <div className="options-inline-row">
                <label>Root Tag:</label>
                <input
                  type="text"
                  className="input-xs"
                  value={xmlRootTag}
                  onChange={(e) => setXmlRootTag(e.target.value)}
                  placeholder="root"
                />
                <label>Item Tag:</label>
                <input
                  type="text"
                  className="input-xs"
                  value={xmlItemTag}
                  onChange={(e) => setXmlItemTag(e.target.value)}
                  placeholder="item"
                />
              </div>
            )}

            {selectedType === 'flatten' && (
              <div className="options-inline-row">
                <label>Separator:</label>
                <select
                  className="select-control select-xs"
                  value={flattenSep}
                  onChange={(e) => setFlattenSep(e.target.value)}
                >
                  <option value=".">Dot (.)</option>
                  <option value="/">Slash (/)</option>
                  <option value="_">Underscore (_)</option>
                </select>
              </div>
            )}

            {selectedType === 'unflatten' && (
              <div className="options-inline-row">
                <label>Separator:</label>
                <select
                  className="select-control select-xs"
                  value={unflattenSep}
                  onChange={(e) => setUnflattenSep(e.target.value)}
                >
                  <option value=".">Dot (.)</option>
                  <option value="/">Slash (/)</option>
                  <option value="_">Underscore (_)</option>
                </select>
              </div>
            )}

            {selectedType === 'sort-keys' && (
              <div className="options-inline-row">
                <label>Direction:</label>
                <select
                  className="select-control select-xs"
                  value={sortKeysDir}
                  onChange={(e) => setSortKeysDir(e.target.value as any)}
                  data-testid="sort-keys-dir-select"
                >
                  <option value="asc">Ascending (A-Z)</option>
                  <option value="desc">Descending (Z-A)</option>
                </select>
                <label>
                  <input
                    type="checkbox"
                    checked={sortKeysCase}
                    onChange={(e) => setSortKeysCase(e.target.checked)}
                  />{' '}
                  Case Sensitive
                </label>
              </div>
            )}

            {selectedType === 'sort-array' && (
              <div className="options-inline-row">
                <label>Property Name:</label>
                <input
                  type="text"
                  className="input-xs"
                  placeholder="e.g. name or price"
                  value={sortArrayProp}
                  onChange={(e) => setSortArrayProp(e.target.value)}
                />
                <label>Direction:</label>
                <select
                  className="select-control select-xs"
                  value={sortArrayDir}
                  onChange={(e) => setSortArrayDir(e.target.value as any)}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
                <label>Type:</label>
                <select
                  className="select-control select-xs"
                  value={sortArrayType}
                  onChange={(e) => setSortArrayType(e.target.value as any)}
                >
                  <option value="auto">Auto</option>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>
            )}

            {selectedType === 'filter' && (
              <div className="options-inline-row">
                <label>Field:</label>
                <input
                  type="text"
                  className="input-xs"
                  placeholder="e.g. active or role"
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                />
                <select
                  className="select-control select-xs"
                  value={filterOp}
                  onChange={(e) => setFilterOp(e.target.value as any)}
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                  <option value="starts_with">Starts With</option>
                  <option value="type">Type Is</option>
                </select>
                <input
                  type="text"
                  className="input-xs"
                  placeholder="Value to match"
                  value={filterVal}
                  onChange={(e) => setFilterVal(e.target.value)}
                />
              </div>
            )}

            {selectedType === 'deduplicate' && (
              <div className="options-inline-row">
                <label>Target Object Property (Optional):</label>
                <input
                  type="text"
                  className="input-xs"
                  placeholder="e.g. id (leave blank for deep equality)"
                  value={dedupProp}
                  onChange={(e) => setDedupProp(e.target.value)}
                />
              </div>
            )}
          </div>

          {transformResult.notes && (
            <div className="transform-warning-banner">
              <AlertCircle size={15} />
              <span>{transformResult.notes}</span>
            </div>
          )}

          {/* Result Preview Box */}
          <div className="transform-preview-container">
            <div className="preview-header">
              <span>Preview Output ({transformResult.format.toUpperCase()})</span>
              <div className="preview-actions">
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => copy(transformResult.output)}
                  data-testid="copy-transform-output"
                >
                  {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={handleDownload}
                  data-testid="download-transform-output"
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <textarea
              className="transform-preview-textarea"
              readOnly
              value={transformResult.output}
              spellCheck="false"
              data-testid="transform-preview-output"
            />
          </div>
        </div>

        <div className="json-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleApply}
            disabled={!transformResult.output || parsedData === null}
            data-testid="apply-transform-btn"
          >
            <Sparkles size={14} />
            <span>Apply to Editor</span>
          </button>
        </div>
      </div>
    </div>
  );
}

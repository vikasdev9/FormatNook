'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  CsvConversionResult,
  CsvParseOptions,
  CsvParseResult,
  CsvTabType,
} from '../types/csv.types';
import { parseCsv } from '../services/csv-parser';
import { convertCsvToJson } from '../services/csv-converter';
import { CsvPreviewTable } from './CsvPreviewTable';
import { CsvSettingsPanel } from './CsvSettingsPanel';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { CopyButton } from '@/components/workspace/CopyButton';
import { formatByteSize } from '@/lib/file-reader';

import {
  FileText,
  Table,
  Settings,
  FileJson,
  Upload,
  Download,
  Trash2,
  Sparkles,
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Clock,
  HardDrive,
  FileSpreadsheet,
} from 'lucide-react';

interface CsvWorkspaceProps {
  initialTab?: CsvTabType;
}

const SAMPLE_DATASETS: Record<string, { label: string; csv: string; nested?: boolean }> = {
  ecommerce: {
    label: 'E-Commerce Products',
    csv: `id,sku,title,category,price,in_stock,zip_code
101,A-100,Wireless Noise-Canceling Headphones,Audio,149.99,true,01001
102,B-200,Mechanical Gaming Keyboard,Accessories,89.50,true,02138
103,C-300,Ultra HD 4K Monitor,Displays,349.00,false,07001
104,D-400,Ergonomic Office Chair,Furniture,229.00,true,94103`,
  },
  quoted: {
    label: 'Quoted & Multiline Records',
    csv: `id,title,description,notes
1,"Heavy Duty Cordless Drill","High-torque brushless drill with ""Turbo"" power.","Included in box:
2x 20V Batteries
1x Fast Charger
1x Case"
2,"Precision Screwdriver Kit","64-in-1 magnetic driver set for smartphones.","Torx, Phillips, and Pentalobe bits."
3,"Industrial Heat Gun","Dual temperature heat gun (500°C / 800°C).","Ideal for shrink tubing & paint removal."`,
  },
  nested: {
    label: 'Dot-Nested Hierarchical JSON',
    nested: true,
    csv: `user.id,user.name,user.email,user.address.city,user.address.zip,stats.orders_count
1,Ada Lovelace,ada@formatnook.com,London,01001,15
2,Alan Turing,alan@formatnook.com,Manchester,01002,42
3,Grace Hopper,grace@formatnook.com,New York,10001,88`,
  },
};

export function CsvWorkspace({ initialTab = 'editor' }: CsvWorkspaceProps) {
  const [csvText, setCsvText] = useState<string>(SAMPLE_DATASETS.ecommerce.csv);
  const [activeTab, setActiveTab] = useState<CsvTabType>(initialTab);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<CsvParseOptions>({
    delimiter: ',',
    headerMode: 'first-row',
    duplicateStrategy: 'numeric-suffix',
    trimWhitespace: false,
    skipEmptyRows: true,
    emptyValueHandling: 'empty-string',
    typeConversionMode: 'auto',
    outputMode: 'array-of-objects',
    duplicateKeyStrategy: 'error',
    nestedJson: false,
    indent: '2',
  });

  // 1. Parse CSV Input with state-machine engine
  const parseResult: CsvParseResult = useMemo(() => {
    return parseCsv(csvText, options);
  }, [csvText, options]);

  // 2. Convert to JSON with configured options
  const conversionResult: CsvConversionResult = useMemo(() => {
    return convertCsvToJson(parseResult, options);
  }, [parseResult, options]);

  // Handle sample dataset change
  const handleSelectSample = (sampleKey: string) => {
    const item = SAMPLE_DATASETS[sampleKey];
    if (item) {
      setCsvText(item.csv);
      setUploadedFileName(null);
      setUploadedFileSize(null);
      if (item.nested) {
        setOptions((prev) => ({ ...prev, nestedJson: true }));
      } else {
        setOptions((prev) => ({ ...prev, nestedJson: false }));
      }
    }
  };

  // Handle Paste
  const handlePaste = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setCsvText(text);
          setUploadedFileName(null);
          setUploadedFileSize(null);
        }
      }
    } catch {
      // Fallback: direct textarea paste
    }
  }, []);

  // Handle Clear
  const handleClear = useCallback(() => {
    setCsvText('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // File Upload Process
  const processUploadedFile = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Download converted JSON
  const handleDownloadJson = useCallback(() => {
    if (!conversionResult.jsonOutput) return;
    const blob = new Blob([conversionResult.jsonOutput], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [conversionResult.jsonOutput]);

  const tabs: { id: CsvTabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'editor', label: 'CSV Input', icon: <FileText size={15} /> },
    {
      id: 'preview',
      label: 'Table Preview',
      icon: <Table size={15} />,
      badge: `${parseResult.totalRows} rows`,
    },
    { id: 'settings', label: 'Conversion Options', icon: <Settings size={15} /> },
    {
      id: 'output',
      label: 'JSON Output',
      icon: <FileJson size={15} />,
      badge: formatByteSize(conversionResult.stats.outputBytes),
    },
  ];

  return (
    <div className="csv-workspace-wrapper" data-testid="csv-workspace">
      {/* Top Controls Toolbar */}
      <div className="csv-toolbar-card">
        <div className="csv-toolbar-left">
          <label htmlFor="csv-sample-select" className="csv-toolbar-label">
            Sample:
          </label>
          <select
            id="csv-sample-select"
            className="select-control csv-sample-select"
            onChange={(e) => handleSelectSample(e.target.value)}
            defaultValue="ecommerce"
            aria-label="Load sample dataset"
            data-testid="select-sample-csv"
          >
            <option value="ecommerce">E-Commerce Products</option>
            <option value="quoted">Quoted & Multiline Records</option>
            <option value="nested">Dot-Nested Hierarchical JSON</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePaste}
            aria-label="Paste CSV from clipboard"
            data-testid="btn-paste-csv"
          >
            <ClipboardPaste size={14} /> Paste
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
            data-testid="file-upload-input"
          />

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload CSV or TSV file"
            data-testid="btn-upload-file"
          >
            <Upload size={14} /> Upload File
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleClear}
            disabled={!csvText && !uploadedFileName}
            aria-label="Clear all input data"
            data-testid="btn-clear-csv"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        <div className="csv-toolbar-right">
          <CopyButton
            text={conversionResult.jsonOutput}
            label="Copy JSON"
            className="btn btn-secondary btn-sm"
          />

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleDownloadJson}
            disabled={!conversionResult.jsonOutput || conversionResult.jsonOutput === '[]'}
            aria-label="Download converted JSON file"
            data-testid="btn-download-json"
          >
            <Download size={14} /> Download JSON
          </button>
        </div>
      </div>

      {/* Uploaded File Info Banner */}
      {uploadedFileName && (
        <div className="csv-file-banner" data-testid="csv-file-banner">
          <div className="csv-file-info">
            <FileSpreadsheet size={16} />
            <span className="csv-file-name">{uploadedFileName}</span>
            <span className="csv-file-size">({formatByteSize(uploadedFileSize || 0)})</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => {
              setUploadedFileName(null);
              setUploadedFileSize(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            aria-label="Remove uploaded file"
          >
            Remove
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="csv-tabs-bar" role="tablist" aria-label="CSV Converter sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`csv-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && <span className="csv-tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="csv-tab-content">
        {/* Tab 1: CSV Text Input & Dropzone */}
        {activeTab === 'editor' && (
          <div
            className={`csv-editor-wrapper ${isDragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            data-testid="csv-input-editor-pane"
          >
            <div className="csv-pane-header">
              <span className="csv-pane-title">Raw CSV / TSV Source</span>
              <div className="csv-pane-stats">
                <span>{parseResult.totalRows} records</span>
                <span>•</span>
                <span>{parseResult.totalColumns} cols</span>
                <span>•</span>
                <span>Delimiter: <code>{options.delimiter === '\t' ? '\\t' : options.delimiter}</code></span>
              </div>
            </div>

            <textarea
              className="csv-raw-textarea"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste or type CSV data here (e.g. name,age,city)..."
              spellCheck={false}
              aria-label="CSV input editor"
              data-testid="csv-textarea"
            />

            <div className="csv-editor-footer">
              <span className="csv-footer-hint">
                Tip: Drag and drop <code>.csv</code> or <code>.tsv</code> files directly into this area.
              </span>
              <span className="csv-footer-size">{formatByteSize(new Blob([csvText]).size)}</span>
            </div>
          </div>
        )}

        {/* Tab 2: Table Spreadsheet Preview */}
        {activeTab === 'preview' && <CsvPreviewTable parseResult={parseResult} />}

        {/* Tab 3: Conversion Settings & Column Mapping */}
        {activeTab === 'settings' && (
          <CsvSettingsPanel
            options={options}
            onOptionsChange={setOptions}
            parseResult={parseResult}
          />
        )}

        {/* Tab 4: JSON Output Viewer */}
        {activeTab === 'output' && (
          <div className="csv-output-wrapper" data-testid="csv-output-pane">
            <div className="csv-pane-header">
              <div className="csv-output-header-left">
                <span className="csv-pane-title">Formatted JSON Result</span>
                <span className="badge badge-neutral" data-testid="output-mode-badge">
                  {options.outputMode?.toUpperCase()}
                </span>
              </div>
              <div className="csv-pane-stats">
                <span>
                  <Layers size={13} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                  {conversionResult.stats.totalRows} items
                </span>
                <span>•</span>
                <span>
                  <HardDrive size={13} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                  {formatByteSize(conversionResult.stats.outputBytes)}
                </span>
                <span>•</span>
                <span>
                  <Clock size={13} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                  {conversionResult.stats.executionTimeMs} ms
                </span>
              </div>
            </div>

            {conversionResult.errors.length > 0 && (
              <div className="csv-alert-box csv-alert-error" role="alert" style={{ margin: '0.75rem 1rem' }}>
                <AlertTriangle size={16} />
                <div>
                  <strong>Conversion Diagnostics:</strong>
                  <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                    {conversionResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="csv-code-editor-container">
              <CodeEditor
                value={conversionResult.jsonOutput}
                language="json"
                readOnly={true}
                wordWrap={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

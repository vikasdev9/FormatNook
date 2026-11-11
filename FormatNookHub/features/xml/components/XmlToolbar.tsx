'use client';

import React from 'react';
import {
  Sparkles,
  Minimize2,
  CheckCircle2,
  AlignJustify,
  Compass,
  ArrowRightLeft,
  Cpu,
  GitCompare,
  FolderTree,
  Code2,
  Table as TableIcon,
  Maximize,
  Minimize,
  Keyboard,
} from 'lucide-react';
import { IndentOption } from '@/types/tool';
import { XmlViewMode } from '../types/xml.types';
import { XML_SAMPLES } from '../services/xml-samples';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { ResetButton } from '@/components/workspace/ResetButton';

interface XmlToolbarProps {
  viewMode: XmlViewMode;
  onViewModeChange: (mode: XmlViewMode) => void;
  activeAction: string;
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onOneLine: () => void;
  onOpenXPath: () => void;
  onOpenConverter: () => void;
  onOpenSpecialized: () => void;
  onOpenDiff?: () => void;
  onOpenShortcuts: () => void;
  onEscape?: () => void;
  onUnescape?: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  indent: IndentOption;
  onIndentChange: (indent: IndentOption) => void;
  onSelectSample: (sampleData: string) => void;
  onFileLoaded: (content: string) => void;
  onReset: () => void;
  useMonaco: boolean;
  onToggleMonaco: () => void;
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  statusMessage?: string;
  statusType?: 'ready' | 'formatting' | 'success' | 'error';
}

export function XmlToolbar({
  viewMode,
  onViewModeChange,
  activeAction,
  onFormat,
  onMinify,
  onValidate,
  onOneLine,
  onOpenXPath,
  onOpenConverter,
  onOpenSpecialized,
  onOpenDiff,
  onOpenShortcuts,
  onEscape,
  onUnescape,
  isFullScreen,
  onToggleFullScreen,
  indent,
  onIndentChange,
  onSelectSample,
  onFileLoaded,
  onReset,
  useMonaco,
  onToggleMonaco,
  wordWrap,
  onToggleWordWrap,
  fontSize,
  onFontSizeChange,
  statusMessage,
  statusType = 'ready',
}: XmlToolbarProps) {
  return (
    <div className="json-workspace-toolbar-wrapper">
      {/* Primary Toolbar */}
      <div className="tool-toolbar json-main-toolbar">
        <div className="toolbar-group-left">
          {/* View Mode Switcher */}
          <div className="json-view-mode-pills" role="tablist" aria-label="XML View Mode">
            <button
              role="tab"
              aria-selected={viewMode === 'code'}
              className={`json-view-pill ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => onViewModeChange('code')}
              data-testid="xml-view-code"
              title="XML Code Editor"
            >
              <Code2 size={14} />
              <span>Code</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'tree'}
              className={`json-view-pill ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => onViewModeChange('tree')}
              data-testid="xml-view-tree"
              title="Interactive Visual XML Tree View"
            >
              <FolderTree size={14} />
              <span>Tree View</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'structured'}
              className={`json-view-pill ${viewMode === 'structured' ? 'active' : ''}`}
              onClick={() => onViewModeChange('structured')}
              data-testid="xml-view-structured"
              title="Structured Elements & Attributes Grid"
            >
              <TableIcon size={14} />
              <span>Structured</span>
            </button>
          </div>

          <div className="toolbar-vertical-divider" />

          {/* Primary Actions Group */}
          <div className="toolbar-btn-group" role="group" aria-label="Primary Actions">
            <button
              className={`btn ${activeAction === 'format' ? 'btn-primary' : 'btn-secondary'} btn-prominent-action`}
              onClick={onFormat}
              aria-label="Format and beautify XML"
              title="Beautify and indent XML document (Ctrl+Enter)"
              data-testid="xml-beautify-btn"
            >
              <Sparkles size={15} />
              <span>Beautify</span>
            </button>

            <button
              className={`btn ${activeAction === 'minify' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={onMinify}
              aria-label="Minify XML"
              title="Minify XML by stripping extra whitespace"
              data-testid="xml-minify-btn"
            >
              <Minimize2 size={15} />
              <span>Minify</span>
            </button>

            <button
              className={`btn ${activeAction === 'validate' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={onValidate}
              aria-label="Validate XML syntax"
              title="Validate XML tags and well-formedness"
              data-testid="xml-validate-btn"
            >
              <CheckCircle2 size={15} />
              <span>Validate</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={onOneLine}
              title="Collapse XML into a single line"
              data-testid="xml-oneline-btn"
            >
              <AlignJustify size={15} />
              <span>One-Line</span>
            </button>
          </div>

          <div className="toolbar-vertical-divider" />

          {/* Secondary Actions Group */}
          <div className="toolbar-btn-group" role="group" aria-label="Advanced Tools">
            <button
              className="btn btn-secondary"
              onClick={onOpenXPath}
              title="Evaluate XPath expressions against the XML document"
              data-testid="xml-xpath-btn"
            >
              <Compass size={15} />
              <span>XPath</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={onOpenConverter}
              title="Convert XML to JSON, YAML, CSV, TSV, or String Literal"
              data-testid="xml-convert-btn"
            >
              <ArrowRightLeft size={15} />
              <span>Convert</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={onOpenSpecialized}
              title="Inspect SOAP envelopes, WSDL web services, and XSD schemas"
              data-testid="xml-specialized-btn"
            >
              <Cpu size={15} />
              <span>SOAP / WSDL / XSD</span>
            </button>

            {onOpenDiff && (
              <button
                className="btn btn-secondary"
                onClick={onOpenDiff}
                title="Compare input vs formatted XML"
                data-testid="xml-diff-btn"
              >
                <GitCompare size={15} />
                <span>Compare</span>
              </button>
            )}

            {onEscape && (
              <button
                className="btn btn-secondary"
                onClick={onEscape}
                title="Escape quotes and newlines for embedding"
              >
                <span>Escape</span>
              </button>
            )}

            {onUnescape && (
              <button
                className="btn btn-secondary"
                onClick={onUnescape}
                title="Unescape string literal back to raw XML"
              >
                <span>Unescape</span>
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-group-right">
          <FileDropzone
            onFileLoaded={onFileLoaded}
            acceptExtensions={['.xml', '.xsd', '.wsdl', '.soap', '.svg', '.txt']}
          />
          <ResetButton onReset={onReset} />
        </div>
      </div>

      {/* Secondary Options Strip */}
      <div className="json-secondary-toolbar">
        <div className="secondary-group-left">
          {/* Indent Selector */}
          <div className="options-control-group">
            <label htmlFor="xml-indent-select">Indent:</label>
            <select
              id="xml-indent-select"
              className="select-control"
              value={indent}
              onChange={(e) => onIndentChange(e.target.value as IndentOption)}
              data-testid="xml-indent-select"
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </div>

          {/* Sample Preset Dropdown */}
          <div className="options-control-group">
            <label htmlFor="xml-sample-select">Samples:</label>
            <select
              id="xml-sample-select"
              className="select-control select-sample"
              defaultValue=""
              onChange={(e) => {
                const sample = XML_SAMPLES.find((s) => s.id === e.target.value);
                if (sample) {
                  onSelectSample(sample.data);
                }
                e.target.value = '';
              }}
              data-testid="xml-sample-select"
            >
              <option value="" disabled>
                Load Sample XML...
              </option>
              <optgroup label="Standard Documents">
                <option value="catalog">Bookstore Catalog (Elements & Attributes)</option>
                <option value="rss">RSS 2.0 Newsfeed (Namespaces & CDATA)</option>
                <option value="svg">SVG Vector Graphic (Attributes & Nodes)</option>
              </optgroup>
              <optgroup label="Enterprise & Web Services">
                <option value="soap-request">SOAP 1.1 Request Envelope</option>
                <option value="soap-fault">SOAP 1.2 Fault Envelope</option>
                <option value="wsdl-sample">WSDL 1.1 Web Service Definition</option>
                <option value="xsd-schema">XML Schema (XSD) Definition</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="secondary-group-right">
          {/* Status Badge */}
          {statusMessage && (
            <span className={`status-badge status-${statusType}`}>
              {statusMessage}
            </span>
          )}

          {/* Monaco Editor Toggle */}
          <button
            type="button"
            className={`btn-subtle-toggle ${useMonaco ? 'active' : ''}`}
            onClick={onToggleMonaco}
            title={useMonaco ? 'Switch to Lightweight Text Editor' : 'Enable Monaco Code Editor'}
          >
            {useMonaco ? 'Monaco ON' : 'Monaco OFF'}
          </button>

          {/* Word Wrap Toggle */}
          <button
            type="button"
            className={`btn-subtle-toggle ${wordWrap ? 'active' : ''}`}
            onClick={onToggleWordWrap}
            title="Toggle Word Wrap"
          >
            Wrap {wordWrap ? 'ON' : 'OFF'}
          </button>

          {/* Font Size Stepper */}
          <div className="font-size-controls">
            <button
              type="button"
              className="btn-icon-subtle"
              onClick={() => onFontSizeChange(Math.max(11, fontSize - 1))}
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="font-size-indicator">{fontSize}px</span>
            <button
              type="button"
              className="btn-icon-subtle"
              onClick={() => onFontSizeChange(Math.min(18, fontSize + 1))}
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Keyboard Shortcuts Dialog */}
          <button
            type="button"
            className="btn-icon-subtle"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts Reference"
          >
            <Keyboard size={15} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="btn-icon-subtle"
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            data-testid="fullscreen-btn"
          >
            {isFullScreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}


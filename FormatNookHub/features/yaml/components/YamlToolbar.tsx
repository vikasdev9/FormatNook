'use client';

import React from 'react';
import {
  Sparkles,
  Minimize2,
  CheckCircle2,
  ArrowRightLeft,
  Cpu,
  FolderTree,
  Code2,
  Table as TableIcon,
  Maximize,
  Minimize,
  GitCompare,
  Quote,
  Keyboard,
  Layers,
  FileCode2,
  AlignJustify,
} from 'lucide-react';
import { IndentOption } from '@/types/tool';
import { YamlViewMode } from '../types/yaml.types';
import { YAML_SAMPLES } from '../services/yaml-samples';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { ResetButton } from '@/components/workspace/ResetButton';

interface YamlToolbarProps {
  viewMode: YamlViewMode;
  onViewModeChange: (mode: YamlViewMode) => void;
  activeAction: string;
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onOneLine: () => void;
  onOpenConverter: () => void;
  onOpenInspector: () => void;
  onOpenDiff?: () => void;
  onOpenShortcuts: () => void;
  onEscape?: () => void;
  onUnescape?: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  indent: IndentOption;
  onIndentChange: (indent: IndentOption) => void;
  quoteStyle: '"' | "'" | 'auto';
  onQuoteStyleChange: (style: '"' | "'" | 'auto') => void;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
  onSelectSample: (sampleData: string) => void;
  onFileLoaded: (content: string) => void;
  onReset: () => void;
  useMonaco: boolean;
  onToggleMonaco: () => void;
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  documentCount?: number;
  selectedDocIndex?: number | 'all';
  onSelectDocIndex?: (index: number | 'all') => void;
  statusMessage?: string;
  statusType?: 'ready' | 'formatting' | 'success' | 'error';
}

export function YamlToolbar({
  viewMode,
  onViewModeChange,
  activeAction,
  onFormat,
  onMinify,
  onValidate,
  onOneLine,
  onOpenConverter,
  onOpenInspector,
  onOpenDiff,
  onOpenShortcuts,
  onEscape,
  onUnescape,
  isFullScreen,
  onToggleFullScreen,
  indent,
  onIndentChange,
  quoteStyle,
  onQuoteStyleChange,
  lineWidth,
  onLineWidthChange,
  onSelectSample,
  onFileLoaded,
  onReset,
  useMonaco,
  onToggleMonaco,
  wordWrap,
  onToggleWordWrap,
  fontSize,
  onFontSizeChange,
  documentCount = 1,
  selectedDocIndex = 'all',
  onSelectDocIndex,
  statusMessage,
  statusType = 'ready',
}: YamlToolbarProps) {
  return (
    <div className="json-workspace-toolbar-wrapper">
      {/* Primary Toolbar */}
      <div className="tool-toolbar json-main-toolbar">
        <div className="toolbar-group-left">
          {/* View Mode Switcher */}
          <div className="json-view-mode-pills" role="tablist" aria-label="YAML View Mode">
            <button
              role="tab"
              aria-selected={viewMode === 'code'}
              className={`json-view-pill ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => onViewModeChange('code')}
              data-testid="yaml-view-code"
              title="YAML Code Editor"
            >
              <Code2 size={14} />
              <span>Code</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'tree'}
              className={`json-view-pill ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => onViewModeChange('tree')}
              data-testid="yaml-view-tree"
              title="Interactive YAML Tree View"
            >
              <FolderTree size={14} />
              <span>Tree View</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'structured'}
              className={`json-view-pill ${viewMode === 'structured' ? 'active' : ''}`}
              onClick={() => onViewModeChange('structured')}
              data-testid="yaml-view-structured"
              title="Structured Document Grid"
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
              aria-label="Format and beautify YAML"
              title="Format with standardized indentation and spacing (Ctrl+Enter)"
              data-testid="yaml-beautify-btn"
            >
              <Sparkles size={15} />
              <span>Beautify</span>
            </button>

            <button
              className={`btn ${activeAction === 'minify' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={onMinify}
              aria-label="Minify YAML"
              title="Compress to flow style without extra whitespace"
              data-testid="yaml-minify-btn"
            >
              <Minimize2 size={15} />
              <span>Minify</span>
            </button>

            <button
              className={`btn ${activeAction === 'validate' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={onValidate}
              aria-label="Validate YAML syntax"
              title="Validate YAML syntax and document structure"
              data-testid="yaml-validate-btn"
            >
              <CheckCircle2 size={15} />
              <span>Validate</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={onOneLine}
              title="Collapse YAML into a compact single line expression"
              data-testid="yaml-oneline-btn"
            >
              <AlignJustify size={15} />
              <span>One-Line</span>
            </button>
          </div>

          <div className="toolbar-vertical-divider" />

          {/* Secondary Actions Group */}
          <div className="toolbar-btn-group" role="group" aria-label="Secondary Actions">
            <button
              className="btn btn-secondary"
              onClick={onOpenConverter}
              title="Convert YAML to JSON, XML, CSV, or TSV"
              data-testid="yaml-convert-btn"
            >
              <ArrowRightLeft size={15} />
              <span>Convert</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={onOpenInspector}
              title="Analyze Kubernetes, Docker Compose, GitHub Actions, or Ansible config structure"
              data-testid="yaml-inspector-btn"
            >
              <Cpu size={15} />
              <span>Config Inspector</span>
            </button>

            {onOpenDiff && (
              <button
                className="btn btn-secondary"
                onClick={onOpenDiff}
                title="Compare input vs formatted or diff two documents"
                data-testid="yaml-diff-btn"
              >
                <GitCompare size={15} />
                <span>Compare</span>
              </button>
            )}

            {onEscape && (
              <button
                className="btn btn-secondary"
                onClick={onEscape}
                title="Escape quotes and newlines for embedding in strings"
              >
                <span>Escape</span>
              </button>
            )}

            {onUnescape && (
              <button
                className="btn btn-secondary"
                onClick={onUnescape}
                title="Unescape string literal back to raw YAML"
              >
                <span>Unescape</span>
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-group-right">
          <FileDropzone
            onFileLoaded={onFileLoaded}
            acceptExtensions={['.yaml', '.yml', '.txt']}
          />
          <ResetButton onReset={onReset} />
        </div>
      </div>

      {/* Secondary Options Strip */}
      <div className="json-secondary-toolbar">
        <div className="secondary-group-left">
          {/* Indent Selector */}
          <div className="options-control-group">
            <label htmlFor="yaml-indent-select">Indent:</label>
            <select
              id="yaml-indent-select"
              className="select-control"
              value={indent}
              onChange={(e) => onIndentChange(e.target.value as IndentOption)}
              data-testid="yaml-indent-select"
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="1">1 Space</option>
              <option value="3">3 Spaces</option>
              <option value="8">8 Spaces</option>
            </select>
          </div>

          {/* Quote Style */}
          <div className="options-control-group">
            <label htmlFor="yaml-quote-select">Quotes:</label>
            <select
              id="yaml-quote-select"
              className="select-control"
              value={quoteStyle}
              onChange={(e) => onQuoteStyleChange(e.target.value as any)}
            >
              <option value="auto">Auto / Unquoted</option>
              <option value={'"'}>Double Quotes (&quot;)</option>
              <option value="'">Single Quotes (&apos;)</option>
            </select>
          </div>

          {/* Line Width */}
          <div className="options-control-group">
            <label htmlFor="yaml-width-select">Wrap:</label>
            <select
              id="yaml-width-select"
              className="select-control"
              value={lineWidth}
              onChange={(e) => onLineWidthChange(parseInt(e.target.value, 10))}
            >
              <option value={-1}>No Auto Wrap</option>
              <option value={80}>80 Columns</option>
              <option value={120}>120 Columns</option>
            </select>
          </div>

          {/* Multi-Document Switcher if multiple documents exist */}
          {documentCount > 1 && onSelectDocIndex && (
            <div className="options-control-group" style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
              <Layers size={13} style={{ color: 'var(--accent-primary)' }} />
              <label htmlFor="yaml-doc-switcher" style={{ fontWeight: 600 }}>Stream ({documentCount} docs):</label>
              <select
                id="yaml-doc-switcher"
                className="select-control select-xs"
                value={selectedDocIndex}
                onChange={(e) => {
                  const val = e.target.value;
                  onSelectDocIndex(val === 'all' ? 'all' : parseInt(val, 10));
                }}
              >
                <option value="all">All Documents (Combined)</option>
                {Array.from({ length: documentCount }).map((_, i) => (
                  <option key={i} value={i}>
                    Document #{i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sample Preset Dropdown */}
          <div className="options-control-group">
            <label htmlFor="yaml-sample-select">Samples:</label>
            <select
              id="yaml-sample-select"
              className="select-control select-sample"
              defaultValue=""
              onChange={(e) => {
                const sample = YAML_SAMPLES.find((s) => s.id === e.target.value);
                if (sample) {
                  onSelectSample(sample.data);
                }
                e.target.value = '';
              }}
              data-testid="yaml-sample-select"
            >
              <option value="" disabled>
                Load Sample Config...
              </option>
              <optgroup label="Kubernetes">
                <option value="k8s-multi">Kubernetes Multi-Resource Stream</option>
                <option value="k8s-deployment">Kubernetes Deployment</option>
                <option value="k8s-service">Kubernetes Service (LoadBalancer)</option>
                <option value="k8s-ingress">Kubernetes Ingress (TLS)</option>
                <option value="k8s-secret">Kubernetes Secret</option>
                <option value="k8s-statefulset">Kubernetes StatefulSet</option>
              </optgroup>
              <optgroup label="Docker & Compose">
                <option value="docker-compose">Docker Compose Microservices Stack</option>
              </optgroup>
              <optgroup label="CI / CD & Automation">
                <option value="github-actions">GitHub Actions CI/CD Matrix Pipeline</option>
                <option value="ansible-playbook">Ansible Web Provisioning Playbook</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="secondary-group-right">
          {/* Status Message */}
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
            title="Toggle Soft Word Wrap"
          >
            Wrap {wordWrap ? 'ON' : 'OFF'}
          </button>

          {/* Font Size Controls */}
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


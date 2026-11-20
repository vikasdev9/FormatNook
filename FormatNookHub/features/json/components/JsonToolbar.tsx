'use client';

import React from 'react';
import {
  Sparkles,
  Minimize2,
  CheckCircle2,
  Wrench,
  ArrowRightLeft,
  Terminal,
  ShieldCheck,
  BarChart3,
  Code2,
  FolderTree,
  Table as TableIcon,
  Keyboard,
  History,
  Maximize,
  Minimize,
  Columns2,
  GitCompare,
  FileCode2,
  ArrowDownAZ,
  Quote,
  Palette,
  Network,
  Database,
} from 'lucide-react';
import { IndentOption } from '@/types/tool';
import { JsonViewMode } from '../types/json.types';
import { JSON_SAMPLES } from '../services/json-samples';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { ResetButton } from '@/components/workspace/ResetButton';
import { JsonFoldingMenu } from './JsonFoldingMenu';

interface JsonToolbarProps {
  viewMode: JsonViewMode;
  onViewModeChange: (mode: JsonViewMode) => void;
  activeAction: string;
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onOpenRepair: () => void;
  onOpenTransform: () => void;
  onToggleJsonPath: () => void;
  isJsonPathOpen: boolean;
  onOpenSchema: () => void;
  onOpenStats: () => void;
  onOpenShortcuts: () => void;
  onOpenRecent: () => void;
  onOpenMockData?: () => void;
  isJson5Mode?: boolean;
  onToggleJson5Mode?: () => void;
  onOpenCodeGen?: () => void;
  onOpenDiff?: () => void;
  onSortKeys?: () => void;
  onOneLine?: () => void;
  onStringify?: () => void;
  onUnstringify?: () => void;
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
  panelsRatio?: number;
  onResetPanelsRatio?: () => void;
  autoFormat?: boolean;
  onToggleAutoFormat?: () => void;
  statusMessage?: string;
  statusType?: 'ready' | 'formatting' | 'success' | 'error' | 'outdated';
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onFoldLevel?: (level: number) => void;
  activeFoldLevel?: number | null;
  onOpenColorPalette?: () => void;
  activePaletteThemeName?: string;
}

export function JsonToolbar({
  viewMode,
  onViewModeChange,
  activeAction,
  onFormat,
  onMinify,
  onValidate,
  onOpenRepair,
  onOpenTransform,
  onToggleJsonPath,
  isJsonPathOpen,
  onOpenSchema,
  onOpenStats,
  onOpenShortcuts,
  onOpenRecent,
  onOpenMockData,
  isJson5Mode = false,
  onToggleJson5Mode,
  onOpenCodeGen,
  onOpenDiff,
  onSortKeys,
  onOneLine,
  onStringify,
  onUnstringify,
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
  panelsRatio,
  onResetPanelsRatio,
  autoFormat = true,
  onToggleAutoFormat,
  statusMessage,
  statusType = 'ready',
  onExpandAll,
  onCollapseAll,
  onFoldLevel,
  activeFoldLevel,
  onOpenColorPalette,
  activePaletteThemeName,
}: JsonToolbarProps) {
  return (
    <div className="json-workspace-toolbar-wrapper" data-testid="json-toolbar">
      {/* Primary Toolbar Row */}
      <div className="tool-toolbar json-main-toolbar">
        <div className="toolbar-group-left">
          {/* Primary Actions Group */}
          <div className="toolbar-primary-group" role="group" aria-label="Primary JSON Actions">
            <button
              className={`btn ${activeAction === 'format' ? 'btn-primary' : 'btn-secondary'} btn-prominent-action`}
              onClick={onFormat}
              aria-label="Format and beautify JSON"
              title="Format and indent JSON document"
              data-testid="json-beautify-btn"
            >
              <Sparkles size={15} />
              <span>Beautify</span>
            </button>

            <button
              className={`btn ${activeAction === 'minify' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={onMinify}
              aria-label="Minify JSON"
              title="Compress and strip unnecessary whitespace"
              data-testid="json-minify-btn"
            >
              <Minimize2 size={15} />
              <span>Minify</span>
            </button>

            <button
              className={`btn ${activeAction === 'validate' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={onValidate}
              aria-label="Validate JSON syntax"
              title="Validate JSON syntax and well-formedness"
              data-testid="json-validate-btn"
            >
              <CheckCircle2 size={15} />
              <span>Validate</span>
            </button>
          </div>

          <div className="toolbar-vertical-divider" />

          {/* View Mode Switcher Segmented Pills */}
          <div className="json-view-mode-pills" role="tablist" aria-label="JSON View Mode">
            <button
              role="tab"
              aria-selected={viewMode === 'code'}
              className={`json-view-pill ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => onViewModeChange('code')}
              data-testid="view-mode-code"
              title="Code Editor View (Split / Full)"
            >
              <Code2 size={14} />
              <span>Code</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'tree'}
              className={`json-view-pill ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => onViewModeChange('tree')}
              data-testid="view-mode-tree"
              title="Interactive Visual Tree View"
            >
              <FolderTree size={14} />
              <span>Tree View</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'table'}
              className={`json-view-pill ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => onViewModeChange('table')}
              data-testid="view-mode-table"
              title="Tabular Grid View"
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'graph'}
              className={`json-view-pill ${viewMode === 'graph' ? 'active' : ''}`}
              onClick={() => onViewModeChange('graph')}
              data-testid="view-mode-graph"
              title="Interactive Hierarchical Graph Visualizer"
            >
              <Network size={14} />
              <span>Visualize</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'schema'}
              className={`json-view-pill ${viewMode === 'schema' ? 'active' : ''}`}
              onClick={() => onViewModeChange('schema')}
              data-testid="view-mode-schema"
              title="JSON Schema Generator & Validator Wizard"
            >
              <ShieldCheck size={14} />
              <span>Schema Wizard</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'patch'}
              className={`json-view-pill ${viewMode === 'patch' ? 'active' : ''}`}
              onClick={() => onViewModeChange('patch')}
              data-testid="view-mode-patch"
              title="RFC 6902 JSON Patch & RFC 7386 Merge Patch"
            >
              <GitCompare size={14} />
              <span>JSON Patch</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Action Modals, File Upload & Reset */}
        <div className="toolbar-group-right">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenRepair}
            title="Auto-repair common mistakes like single quotes, trailing commas, and unquoted keys"
            data-testid="json-repair-btn"
          >
            <Wrench size={14} />
            <span>Auto Repair</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenTransform}
            title="Transform JSON to CSV, XML, YAML, Flatten, Unflatten, Escape, or Sort"
            data-testid="json-transform-btn"
          >
            <ArrowRightLeft size={14} />
            <span>Transform</span>
          </button>

          <FileDropzone onFileLoaded={onFileLoaded} acceptExtensions={['.json', '.txt']} />
          <ResetButton onReset={onReset} />
        </div>
      </div>

      {/* Secondary Options Strip */}
      <div className="json-secondary-toolbar">
        <div className="secondary-group-left">
          {/* Secondary Modals Group */}
          <div className="toolbar-sub-group" role="group" aria-label="Extended Features">
            <button
              className={`btn-subtle-toggle ${isJsonPathOpen ? 'active' : ''}`}
              onClick={onToggleJsonPath}
              title="Toggle JSONPath query search panel"
              data-testid="json-path-toggle-btn"
            >
              <Terminal size={13} style={{ display: 'inline', marginRight: '4px' }} />
              <span>JSONPath</span>
            </button>

            <button
              className="btn-subtle-toggle"
              onClick={onOpenSchema}
              title="Validate JSON against a JSON Schema"
              data-testid="json-schema-btn"
            >
              <ShieldCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
              <span>Schema</span>
            </button>

            <button
              className="btn-subtle-toggle"
              onClick={onOpenStats}
              title="View detailed JSON metrics and statistics"
              data-testid="json-stats-btn"
            >
              <BarChart3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
              <span>Stats</span>
            </button>

            {onOpenDiff && (
              <button
                className="btn-subtle-toggle"
                onClick={onOpenDiff}
                title="Compare and diff JSON documents"
                data-testid="json-compare-btn"
              >
                <GitCompare size={13} style={{ display: 'inline', marginRight: '4px' }} />
                <span>Compare</span>
              </button>
            )}

            {onOpenCodeGen && (
              <button
                className="btn-subtle-toggle"
                onClick={onOpenCodeGen}
                title="Generate typed models and classes for 12 programming languages"
                data-testid="json-codegen-btn"
              >
                <FileCode2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                <span>Code Models</span>
              </button>
            )}

            {onOpenMockData && (
              <button
                className="btn-subtle-toggle"
                onClick={onOpenMockData}
                title="Generate realistic synthetic mock data from sample JSON, Schema, or presets"
                data-testid="json-mock-data-btn"
              >
                <Database size={13} style={{ display: 'inline', marginRight: '4px' }} />
                <span>Mock Data</span>
              </button>
            )}

            {onToggleJson5Mode && (
              <button
                className={`btn-subtle-toggle ${isJson5Mode ? 'active' : ''}`}
                onClick={onToggleJson5Mode}
                title="Toggle JSON5 syntax support (comments, unquoted keys, trailing commas, hex)"
                data-testid="json5-mode-btn"
              >
                <span>JSON5 {isJson5Mode ? 'ON' : 'OFF'}</span>
              </button>
            )}
          </div>

          <div className="toolbar-vertical-divider" />

          {/* Indent Selector */}
          <div className="options-control-group">
            <label htmlFor="json-indent-select">Indent:</label>
            <select
              id="json-indent-select"
              className="select-control select-xs"
              value={indent}
              onChange={(e) => onIndentChange(e.target.value as IndentOption)}
              data-testid="json-indent-select"
            >
              <option value="2">2 Spaces</option>
              <option value="3">3 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="6">6 Spaces</option>
              <option value="8">8 Spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </div>

          {/* Sample Datasets */}
          <div className="options-control-group">
            <label htmlFor="json-samples-select">Samples:</label>
            <select
              id="json-samples-select"
              className="select-control select-xs"
              onChange={(e) => {
                const sample = JSON_SAMPLES.find((s) => s.id === e.target.value);
                if (sample) onSelectSample(sample.data);
                e.target.value = '';
              }}
              defaultValue=""
              data-testid="json-samples-select"
            >
              <option value="" disabled>
                Load Sample...
              </option>
              {JSON_SAMPLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="options-control-group">
            <label htmlFor="json-fontsize-select">Font:</label>
            <select
              id="json-fontsize-select"
              className="select-control select-xs"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
            >
              <option value="12">12px</option>
              <option value="13">13px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
            </select>
          </div>

          {/* Wrap Toggle */}
          <button
            className={`btn-subtle-toggle ${wordWrap ? 'active' : ''}`}
            onClick={onToggleWordWrap}
            title="Toggle Word Wrap"
          >
            Wrap: {wordWrap ? 'On' : 'Off'}
          </button>

          {/* Auto Format Toggle */}
          {onToggleAutoFormat && (
            <button
              className={`btn-subtle-toggle ${autoFormat ? 'active' : ''}`}
              onClick={onToggleAutoFormat}
              title={autoFormat ? 'Auto Format is ON (formats valid JSON automatically)' : 'Auto Format is OFF (manual Beautify required)'}
              data-testid="toggle-auto-format-btn"
            >
              Auto Format: {autoFormat ? 'On' : 'Off'}
            </button>
          )}

          {/* Monaco Rich Editor Toggle */}
          <button
            className={`btn-subtle-toggle ${useMonaco ? 'active' : ''}`}
            onClick={onToggleMonaco}
            title="Toggle Monaco Rich Editor"
            data-testid="toggle-monaco-btn"
          >
            Editor: {useMonaco ? 'Monaco' : 'Standard'}
          </button>

          {/* Folding Controls Dropdown */}
          {onExpandAll && onCollapseAll && (
            <JsonFoldingMenu
              onExpandAll={onExpandAll}
              onCollapseAll={onCollapseAll}
              onFoldLevel={onFoldLevel}
              activeFoldLevel={activeFoldLevel}
            />
          )}

          {/* Color Palette Modal Trigger */}
          {onOpenColorPalette && (
            <button
              className="btn-subtle-toggle"
              onClick={onOpenColorPalette}
              title={`Customize JSON Syntax Color Palette (Active: ${activePaletteThemeName || 'FormatNook'})`}
              data-testid="json-color-palette-btn"
            >
              <Palette size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Palette: {activePaletteThemeName || 'Theme'}
            </button>
          )}

          {/* Core Tools Quick Buttons */}
          {onSortKeys && (
            <button
              className="btn-subtle-toggle"
              onClick={onSortKeys}
              title="Sort all keys alphabetically (A-Z)"
              data-testid="json-sort-keys-quick-btn"
            >
              <ArrowDownAZ size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Sort Keys
            </button>
          )}

          {onOneLine && (
            <button
              className="btn-subtle-toggle"
              onClick={onOneLine}
              title="Convert JSON to a single compact line"
              data-testid="json-one-line-quick-btn"
            >
              One-Line
            </button>
          )}

          {onStringify && (
            <button
              className="btn-subtle-toggle"
              onClick={onStringify}
              title="Escape JSON as a string literal for code embedding"
              data-testid="json-stringify-quick-btn"
            >
              Stringify
            </button>
          )}

          {onUnstringify && (
            <button
              className="btn-subtle-toggle"
              onClick={onUnstringify}
              title="Parse an escaped string literal back to JSON"
              data-testid="json-unstringify-quick-btn"
            >
              Unstringify
            </button>
          )}

          {/* Status Indicator Badge */}
          {statusMessage && (
            <div
              className={`json-status-indicator ${statusType || 'ready'}`}
              data-testid="json-status-badge"
              title={`Status: ${statusMessage}`}
            >
              <span className={`status-dot ${statusType === 'formatting' ? 'pulse' : ''}`} />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        <div className="secondary-group-right">
          {panelsRatio !== undefined && panelsRatio !== 50 && onResetPanelsRatio && (
            <button
              className="btn-icon-subtle"
              onClick={onResetPanelsRatio}
              title="Reset panels to equal 50/50 split (Double-click divider to reset)"
              aria-label="Reset panels split"
              data-testid="reset-split-btn"
            >
              <Columns2 size={14} />
              <span>Reset 50/50</span>
            </button>
          )}

          <button
            className="btn-icon-subtle"
            onClick={onOpenRecent}
            title="View recent files and favorite snippets"
            aria-label="Recent files and favorite snippets"
            data-testid="recents-modal-btn"
          >
            <History size={14} />
            <span>Recents & Favorites</span>
          </button>

          <button
            className={`btn-icon-subtle ${isFullScreen ? 'active' : ''}`}
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Editor'}
            aria-label="Full Screen Mode"
            data-testid="toggle-fullscreen-btn"
          >
            {isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
            <span>{isFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
          </button>

          <button
            className="btn-icon-subtle"
            onClick={onOpenShortcuts}
            title="View keyboard shortcuts"
            aria-label="Keyboard Shortcuts"
            data-testid="shortcuts-modal-btn"
          >
            <Keyboard size={14} />
            <span>Shortcuts</span>
          </button>
        </div>
      </div>
    </div>
  );
}

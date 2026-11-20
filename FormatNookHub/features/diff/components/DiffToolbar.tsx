'use client';

import React from 'react';
import {
  GitCompare,
  ArrowLeftRight,
  Trash2,
  Copy,
  Check,
  Download,
  SlidersHorizontal,
  Columns,
  AlignLeft,
  Sparkles,
  Loader2,
  Keyboard,
  ChevronUp,
  ChevronDown,
  Link2,
  Unlink2,
} from 'lucide-react';
import { DiffFormat, DiffOptions, DiffViewMode, DiffResultData } from '../types/diff.types';
import { useClipboard } from '@/hooks/useClipboard';
import { downloadFile } from '@/lib/download';
import { ShareButton } from '@/components/workspace/ShareButton';
import { createDiffSharePayload } from '../adapters/diff-share.adapter';

interface DiffToolbarProps {
  onCompare: () => void;
  onSwap: () => void;
  onClear: () => void;
  onPrettify?: () => void;
  options: DiffOptions;
  onOptionsChange: (newOptions: DiffOptions) => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  unifiedDiffText: string;
  isComparing?: boolean;
  diffResult?: DiffResultData | null;
  onOpenShortcuts?: () => void;
  totalDiffs?: number;
  currentDiffIndex?: number;
  onNextDiff?: () => void;
  onPrevDiff?: () => void;
  syncScroll?: boolean;
  onToggleSyncScroll?: () => void;
}

export const COMPARISON_MODES: { id: DiffFormat; label: string; shortLabel: string }[] = [
  { id: 'auto', label: 'Auto-Detect', shortLabel: 'Auto' },
  { id: 'text', label: 'Plain Text', shortLabel: 'Text' },
  { id: 'json', label: 'JSON', shortLabel: 'JSON' },
  { id: 'xml', label: 'XML', shortLabel: 'XML' },
  { id: 'yaml', label: 'YAML', shortLabel: 'YAML' },
  { id: 'csv', label: 'CSV', shortLabel: 'CSV' },
  { id: 'sql', label: 'SQL', shortLabel: 'SQL' },
  { id: 'html', label: 'HTML', shortLabel: 'HTML' },
  { id: 'css', label: 'CSS', shortLabel: 'CSS' },
  { id: 'javascript', label: 'JavaScript', shortLabel: 'JS' },
  { id: 'code', label: 'Generic Code', shortLabel: 'Code' },
];

export function DiffToolbar({
  onCompare,
  onSwap,
  onClear,
  onPrettify,
  options,
  onOptionsChange,
  showSettings,
  onToggleSettings,
  unifiedDiffText,
  isComparing = false,
  diffResult,
  onOpenShortcuts,
  totalDiffs = 0,
  currentDiffIndex = 0,
  onNextDiff,
  onPrevDiff,
  syncScroll = true,
  onToggleSyncScroll,
}: DiffToolbarProps) {
  const { copied, copy } = useClipboard();

  const handleDownload = () => {
    if (!unifiedDiffText) return;
    downloadFile(unifiedDiffText, 'text-diff.txt', 'text/plain');
  };

  const setViewMode = (mode: DiffViewMode) => {
    onOptionsChange({ ...options, viewMode: mode });
  };

  const setFormat = (format: DiffFormat) => {
    onOptionsChange({ ...options, format });
  };

  return (
    <div className="diff-toolbar-wrapper">
      {/* Prominent Mode Selector Bar */}
      <div className="diff-mode-bar" role="tablist" aria-label="Comparison Mode Selector">
        <span className="diff-mode-bar-label">Mode:</span>
        <div className="diff-mode-pills-scroll">
          {COMPARISON_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={options.format === mode.id}
              className={`diff-mode-pill ${options.format === mode.id ? 'active' : ''}`}
              onClick={() => setFormat(mode.id)}
              data-testid={`btn-mode-${mode.id}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Diff Actions Toolbar */}
      <div className="diff-toolbar" role="toolbar" aria-label="Diff Checker Controls">
        {/* Primary Row */}
        <div className="diff-toolbar-primary">
          <div className="toolbar-group-left">
            <button
              type="button"
              className="btn btn-primary btn-compare"
              onClick={onCompare}
              disabled={isComparing}
              data-testid="btn-compare"
              aria-label="Compare text"
            >
              {isComparing ? (
                <Loader2 size={16} className="spin-animation" />
              ) : (
                <GitCompare size={16} />
              )}
              <span>{isComparing ? 'Comparing...' : 'Compare'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSwap}
              data-testid="btn-swap"
              title="Swap Original and Modified text (Ctrl+Shift+S)"
              aria-label="Swap Original and Modified text"
            >
              <ArrowLeftRight size={14} />
              <span>Swap</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClear}
              data-testid="btn-clear"
              title="Clear both editors"
              aria-label="Clear both editors"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>

            <div className="diff-viewmode-switcher" role="group" aria-label="View Mode Switcher">
              <button
                type="button"
                className={`viewmode-btn ${options.viewMode === 'side-by-side' ? 'active' : ''}`}
                onClick={() => setViewMode('side-by-side')}
                title="Side-by-Side view"
                aria-label="Side-by-Side view"
                data-testid="btn-view-side-by-side"
              >
                <Columns size={14} />
                <span>Split</span>
              </button>
              <button
                type="button"
                className={`viewmode-btn ${options.viewMode === 'inline' ? 'active' : ''}`}
                onClick={() => setViewMode('inline')}
                title="Unified Inline view"
                aria-label="Unified Inline view"
                data-testid="btn-view-inline"
              >
                <AlignLeft size={14} />
                <span>Inline</span>
              </button>
            </div>

            {/* Difference Navigation Stepper */}
            <div className="diff-nav-group" role="group" aria-label="Difference Navigation">
              <button
                type="button"
                className="btn btn-ghost btn-sm diff-nav-btn"
                onClick={onPrevDiff}
                disabled={!totalDiffs || totalDiffs === 0}
                title="Previous difference (Alt+Up / Shift+F7)"
                aria-label="Previous difference"
                data-testid="btn-prev-diff"
              >
                <ChevronUp size={14} />
              </button>
              <span className="diff-counter-pill" data-testid="diff-counter">
                {totalDiffs && totalDiffs > 0
                  ? `${currentDiffIndex + 1} of ${totalDiffs}`
                  : '0 diffs'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm diff-nav-btn"
                onClick={onNextDiff}
                disabled={!totalDiffs || totalDiffs === 0}
                title="Next difference (Alt+Down / F7)"
                aria-label="Next difference"
                data-testid="btn-next-diff"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="toolbar-group-right">
            {onToggleSyncScroll && (
              <button
                type="button"
                className={`btn btn-sm ${syncScroll ? 'btn-secondary active' : 'btn-ghost'}`}
                onClick={onToggleSyncScroll}
                title={syncScroll ? 'Synchronized scrolling enabled' : 'Synchronized scrolling disabled'}
                aria-label="Toggle synchronized scrolling"
                data-testid="btn-toggle-sync-scroll"
              >
                {syncScroll ? <Link2 size={14} /> : <Unlink2 size={14} />}
                <span>Sync Scroll</span>
              </button>
            )}

            {onOpenShortcuts && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts Reference (?)"
                aria-label="Keyboard Shortcuts Reference"
                data-testid="btn-shortcuts"
              >
                <Keyboard size={14} />
                <span>Shortcuts</span>
              </button>
            )}

            <button
              type="button"
              className={`btn ${showSettings ? 'btn-secondary active' : 'btn-ghost'}`}
              onClick={onToggleSettings}
              data-testid="btn-toggle-settings"
              title="Toggle comparison options"
              aria-label="Toggle comparison options"
            >
              <SlidersHorizontal size={14} />
              <span>Settings</span>
            </button>

            <ShareButton
              getPayload={() => createDiffSharePayload(diffResult || null, options)}
              disabled={!unifiedDiffText}
            />

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => copy(unifiedDiffText)}
              disabled={!unifiedDiffText}
              data-testid="btn-copy-diff"
              title="Copy diff to clipboard"
              aria-label="Copy diff to clipboard"
            >
              {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Diff'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownload}
              disabled={!unifiedDiffText}
              data-testid="btn-download-diff"
              title="Download diff as text file"
              aria-label="Download diff as text file"
            >
              <Download size={14} />
              <span>Download Diff</span>
            </button>
          </div>
        </div>

        {/* Secondary Options / Quick Toggles */}
        <div className="diff-toolbar-secondary">
          <div className="diff-secondary-left">
            <div className="options-control-group diff-format-select-group">
              <label htmlFor="diff-format-select" className="sr-only">Format:</label>
              <select
                id="diff-format-select"
                className="select-control diff-format-select"
                value={options.format}
                onChange={(e) => setFormat(e.target.value as DiffFormat)}
                data-testid="select-diff-format"
                aria-label="Format selection"
              >
                {COMPARISON_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    Format: {m.label}
                  </option>
                ))}
              </select>
            </div>

            {onPrettify && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onPrettify}
                data-testid="btn-prettify"
                title="Prettify / format both inputs"
                aria-label="Prettify inputs"
              >
                <Sparkles size={14} />
                <span>Prettify</span>
              </button>
            )}

            <div className="diff-quick-toggles" role="group" aria-label="Quick Comparison Options">
              <button
                type="button"
                className={`diff-quick-toggle ${options.ignoreWhitespace ? 'active' : ''}`}
                onClick={() => onOptionsChange({ ...options, ignoreWhitespace: !options.ignoreWhitespace })}
                title="Ignore whitespace differences"
                aria-pressed={options.ignoreWhitespace}
                data-testid="toggle-ignore-whitespace"
              >
                Ignore Whitespace
              </button>
              <button
                type="button"
                className={`diff-quick-toggle ${options.ignoreCase ? 'active' : ''}`}
                onClick={() => onOptionsChange({ ...options, ignoreCase: !options.ignoreCase })}
                title="Ignore casing differences"
                aria-pressed={options.ignoreCase}
                data-testid="toggle-ignore-case"
              >
                Ignore Case
              </button>
              <button
                type="button"
                className={`diff-quick-toggle ${options.ignoreBlankLines ? 'active' : ''}`}
                onClick={() => onOptionsChange({ ...options, ignoreBlankLines: !options.ignoreBlankLines })}
                title="Ignore empty or blank lines"
                aria-pressed={options.ignoreBlankLines}
                data-testid="toggle-ignore-blank-lines"
              >
                Ignore Blank Lines
              </button>
            </div>
          </div>

          <div className="diff-secondary-right">
            {diffResult && !diffResult.isEmpty && (
              <span className={`diff-status-pill ${diffResult.isIdentical ? 'status-identical' : 'status-changes'}`}>
                {diffResult.isIdentical ? 'Identical' : `${totalDiffs || 0} Differences`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

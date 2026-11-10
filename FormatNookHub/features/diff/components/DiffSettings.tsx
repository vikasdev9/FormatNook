'use client';

import React from 'react';
import { DiffFormat, DiffGranularity, DiffOptions, DiffViewMode } from '../types/diff.types';

interface DiffSettingsProps {
  options: DiffOptions;
  onOptionsChange: (newOptions: DiffOptions) => void;
}

export function DiffSettings({ options, onOptionsChange }: DiffSettingsProps) {
  const updateOption = <K extends keyof DiffOptions>(key: K, value: DiffOptions[K]) => {
    onOptionsChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <div className="diff-settings-card" role="region" aria-label="Comparison Settings">
      <div className="diff-settings-section">
        <span className="diff-settings-section-title">Format:</span>
        <div className="diff-pill-group" role="group" aria-label="Content Format">
          {(['auto', 'text', 'json', 'xml', 'yaml', 'html', 'css', 'javascript', 'sql'] as DiffFormat[]).map(
            (fmt) => (
              <button
                key={fmt}
                type="button"
                className={`diff-pill-btn ${options.format === fmt ? 'active' : ''}`}
                onClick={() => updateOption('format', fmt)}
                data-testid={`format-${fmt}`}
              >
                {fmt === 'auto' ? 'Auto-Detect' : fmt.toUpperCase()}
              </button>
            )
          )}
        </div>
      </div>

      <div className="diff-settings-section">
        <span className="diff-settings-section-title">Granularity:</span>
        <div className="diff-pill-group" role="group" aria-label="Diff Granularity">
          <button
            type="button"
            className={`diff-pill-btn ${options.granularity === 'line' ? 'active' : ''}`}
            onClick={() => updateOption('granularity', 'line' as DiffGranularity)}
            data-testid="granularity-line"
          >
            Line-by-Line
          </button>
          <button
            type="button"
            className={`diff-pill-btn ${options.granularity === 'word' ? 'active' : ''}`}
            onClick={() => updateOption('granularity', 'word' as DiffGranularity)}
            data-testid="granularity-word"
          >
            Word-by-Word
          </button>
          <button
            type="button"
            className={`diff-pill-btn ${options.granularity === 'char' ? 'active' : ''}`}
            onClick={() => updateOption('granularity', 'char' as DiffGranularity)}
            data-testid="granularity-char"
          >
            Character-by-Character
          </button>
        </div>
      </div>

      <div className="diff-settings-section">
        <span className="diff-settings-section-title">View Mode:</span>
        <div className="diff-pill-group" role="group" aria-label="View Mode">
          <button
            type="button"
            className={`diff-pill-btn ${options.viewMode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => updateOption('viewMode', 'side-by-side' as DiffViewMode)}
            data-testid="view-side-by-side"
          >
            Side-by-Side
          </button>
          <button
            type="button"
            className={`diff-pill-btn ${options.viewMode === 'inline' ? 'active' : ''}`}
            onClick={() => updateOption('viewMode', 'inline' as DiffViewMode)}
            data-testid="view-inline"
          >
            Inline
          </button>
        </div>
      </div>

      <div className="diff-settings-divider" />

      <div className="diff-options-grid">
        <label className="diff-checkbox-label" htmlFor="opt-prettify-before-compare">
          <input
            id="opt-prettify-before-compare"
            type="checkbox"
            checked={options.prettifyBeforeCompare}
            onChange={(e) => updateOption('prettifyBeforeCompare', e.target.checked)}
            data-testid="checkbox-prettify-before-compare"
          />
          <span>Prettify Before Compare</span>
        </label>

        <label className="diff-checkbox-label" htmlFor="opt-sort-keys">
          <input
            id="opt-sort-keys"
            type="checkbox"
            checked={options.sortKeys}
            onChange={(e) => updateOption('sortKeys', e.target.checked)}
            data-testid="checkbox-sort-keys"
          />
          <span>Sort Keys Alphabetically (JSON/YAML)</span>
        </label>

        <label className="diff-checkbox-label" htmlFor="opt-ignore-whitespace">
          <input
            id="opt-ignore-whitespace"
            type="checkbox"
            checked={options.ignoreWhitespace}
            onChange={(e) => updateOption('ignoreWhitespace', e.target.checked)}
            data-testid="checkbox-ignore-whitespace"
          />
          <span>Ignore Whitespace</span>
        </label>

        <label className="diff-checkbox-label" htmlFor="opt-ignore-case">
          <input
            id="opt-ignore-case"
            type="checkbox"
            checked={options.ignoreCase}
            onChange={(e) => updateOption('ignoreCase', e.target.checked)}
            data-testid="checkbox-ignore-case"
          />
          <span>Ignore Case</span>
        </label>

        <label className="diff-checkbox-label" htmlFor="opt-ignore-blank-lines">
          <input
            id="opt-ignore-blank-lines"
            type="checkbox"
            checked={options.ignoreBlankLines}
            onChange={(e) => updateOption('ignoreBlankLines', e.target.checked)}
            data-testid="checkbox-ignore-blank-lines"
          />
          <span>Ignore Blank Lines</span>
        </label>

        <label className="diff-checkbox-label" htmlFor="opt-ignore-trailing-spaces">
          <input
            id="opt-ignore-trailing-spaces"
            type="checkbox"
            checked={options.ignoreTrailingWhitespace}
            onChange={(e) => updateOption('ignoreTrailingWhitespace', e.target.checked)}
            data-testid="checkbox-ignore-trailing-spaces"
          />
          <span>Ignore Trailing Spaces</span>
        </label>
      </div>
    </div>
  );
}

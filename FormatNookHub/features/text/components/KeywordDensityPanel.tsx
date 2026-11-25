'use client';

import React, { useState } from 'react';
import { KeywordDensityResult, KeywordOptions } from '../types/text.types';
import { Filter, SlidersHorizontal, Hash } from 'lucide-react';

interface KeywordDensityPanelProps {
  density: KeywordDensityResult;
  options: KeywordOptions;
  onOptionsChange: (options: KeywordOptions) => void;
}

type NgramTab = 'oneWord' | 'twoWord' | 'threeWord';

export function KeywordDensityPanel({
  density,
  options,
  onOptionsChange,
}: KeywordDensityPanelProps) {
  const [activeTab, setActiveTab] = useState<NgramTab>('oneWord');

  const currentItems = density[activeTab] || [];

  return (
    <div className="text-keywords-container" data-testid="keyword-density-panel">
      {/* Controls & Options Bar */}
      <div className="keywords-toolbar">
        <div className="keywords-tabs">
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'oneWord' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('oneWord')}
            data-testid="tab-1word"
          >
            1-Word ({density.oneWord.length})
          </button>
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'twoWord' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('twoWord')}
            data-testid="tab-2word"
          >
            2-Word ({density.twoWord.length})
          </button>
          <button
            type="button"
            className={`btn btn-xs ${activeTab === 'threeWord' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('threeWord')}
            data-testid="tab-3word"
          >
            3-Word ({density.threeWord.length})
          </button>
        </div>

        <div className="keywords-options">
          <label className="checkbox-label" title="Include common English stop words (the, is, at, which, etc.)">
            <input
              type="checkbox"
              checked={options.includeStopWords}
              onChange={(e) => onOptionsChange({ ...options, includeStopWords: e.target.checked })}
              className="checkbox-control"
              data-testid="checkbox-stopwords"
            />
            <span>Include Stop Words</span>
          </label>

          <label className="checkbox-label" title="Distinguish between uppercase and lowercase letters">
            <input
              type="checkbox"
              checked={options.caseSensitive}
              onChange={(e) => onOptionsChange({ ...options, caseSensitive: e.target.checked })}
              className="checkbox-control"
              data-testid="checkbox-casesensitive"
            />
            <span>Case Sensitive</span>
          </label>
        </div>
      </div>

      {/* Keywords Table */}
      {currentItems.length > 0 ? (
        <div className="keywords-table-wrap">
          <table className="keywords-table" data-testid="keywords-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Keyword / Phrase</th>
                <th style={{ textAlign: 'right', width: '80px' }}>Count</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Density</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, idx) => (
                <tr key={`${item.keyword}-${idx}`} data-testid={`keyword-row-${idx}`}>
                  <td className="keyword-name" style={{ textAlign: 'left' }}>
                    <code>{item.keyword}</code>
                  </td>
                  <td className="keyword-count" style={{ textAlign: 'right' }}>
                    <span className="badge badge-secondary">{item.count}</span>
                  </td>
                  <td className="keyword-density" style={{ textAlign: 'right' }}>
                    <span className="density-text">{item.density}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-keywords-state">
          <Hash size={24} className="text-muted-icon" />
          <p>No keywords found in current text.</p>
          <span className="empty-sub">Type or paste text in the editor to analyze keyword frequency.</span>
        </div>
      )}
    </div>
  );
}

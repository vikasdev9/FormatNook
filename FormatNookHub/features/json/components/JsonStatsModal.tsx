'use client';

import React from 'react';
import { X, BarChart3, Copy, Check } from 'lucide-react';
import { JsonStats } from '../types/json.types';
import { formatByteSize } from '@/lib/file-reader';
import { useClipboard } from '@/hooks/useClipboard';

interface JsonStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: JsonStats | null;
}

export function JsonStatsModal({ isOpen, onClose, stats }: JsonStatsModalProps) {
  const { copy, copied } = useClipboard();

  if (!isOpen || !stats) return null;

  const handleCopySummary = () => {
    const summary = [
      '# JSON Metrics & Statistics',
      `- File Size: ${formatByteSize(stats.fileSizeBytes)}`,
      `- Total Lines: ${stats.lineCount.toLocaleString()}`,
      `- Character Count: ${stats.characterCount.toLocaleString()}`,
      `- Max Nesting Depth: ${stats.maxDepth}`,
      `- Total Objects: ${stats.totalObjects.toLocaleString()} (${stats.emptyObjects} empty)`,
      `- Total Arrays: ${stats.totalArrays.toLocaleString()} (${stats.emptyArrays} empty)`,
      `- Total Keys: ${stats.totalKeys.toLocaleString()}`,
      `- Total Values: ${stats.totalValues.toLocaleString()}`,
      '- Type Breakdown:',
      `  • Strings: ${stats.stringsCount.toLocaleString()}`,
      `  • Numbers: ${stats.numbersCount.toLocaleString()}`,
      `  • Booleans: ${stats.booleansCount.toLocaleString()}`,
      `  • Nulls: ${stats.nullsCount.toLocaleString()}`,
    ].join('\n');

    copy(summary);
  };

  return (
    <div className="json-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" data-testid="json-stats-modal">
      <div className="json-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="json-modal-header">
          <div className="json-modal-title">
            <BarChart3 size={18} className="text-accent" />
            <span>JSON Detailed Metrics & Statistics</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="json-modal-body">
          {/* Sizing & Structure Summary */}
          <div className="stats-section-title">Size & Depth</div>
          <div className="json-stats-grid">
            <div className="json-stat-box">
              <span className="stat-label">File Size</span>
              <span className="stat-value">{formatByteSize(stats.fileSizeBytes)}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Lines</span>
              <span className="stat-value">{stats.lineCount.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Characters</span>
              <span className="stat-value">{stats.characterCount.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Max Depth</span>
              <span className="stat-value">{stats.maxDepth}</span>
            </div>
          </div>

          {/* Counts */}
          <div className="stats-section-title" style={{ marginTop: '1.25rem' }}>Structural Counts</div>
          <div className="json-stats-grid">
            <div className="json-stat-box">
              <span className="stat-label">Total Objects</span>
              <span className="stat-value">{stats.totalObjects.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Total Arrays</span>
              <span className="stat-value">{stats.totalArrays.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Total Keys</span>
              <span className="stat-value">{stats.totalKeys.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Total Values</span>
              <span className="stat-value">{stats.totalValues.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Empty Objects</span>
              <span className="stat-value text-muted">{stats.emptyObjects.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Empty Arrays</span>
              <span className="stat-value text-muted">{stats.emptyArrays.toLocaleString()}</span>
            </div>
          </div>

          {/* Data Types */}
          <div className="stats-section-title" style={{ marginTop: '1.25rem' }}>Data Type Breakdown</div>
          <div className="json-stats-grid">
            <div className="json-stat-box">
              <span className="stat-label">Strings</span>
              <span className="stat-value text-success">{stats.stringsCount.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Numbers</span>
              <span className="stat-value text-primary">{stats.numbersCount.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Booleans</span>
              <span className="stat-value text-warning">{stats.booleansCount.toLocaleString()}</span>
            </div>
            <div className="json-stat-box">
              <span className="stat-label">Nulls</span>
              <span className="stat-value text-muted">{stats.nullsCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="json-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={handleCopySummary} data-testid="copy-stats-btn">
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Summary' : 'Copy Metrics Report'}</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


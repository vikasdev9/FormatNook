'use client';

import React from 'react';
import { PlusCircle, MinusCircle, Edit3, CheckCircle2, Hash, Percent } from 'lucide-react';
import { DiffStatistics as DiffStatsType } from '../types/diff.types';

interface DiffStatisticsProps {
  stats: DiffStatsType;
  isIdentical: boolean;
}

export function DiffStatistics({ stats, isIdentical }: DiffStatisticsProps) {
  return (
    <div className="diff-stats-wrapper" role="region" aria-label="Difference Statistics">
      <div className="diff-stats-grid">
        <div className="diff-stat-card" data-testid="stat-total-lines">
          <div className="diff-stat-icon">
            <Hash size={16} />
          </div>
          <div className="diff-stat-info">
            <span className="diff-stat-value">{stats.totalLines}</span>
            <span className="diff-stat-label">Total Lines</span>
          </div>
        </div>

        <div className="diff-stat-card diff-stat-added" data-testid="stat-added-lines">
          <div className="diff-stat-icon text-success">
            <PlusCircle size={16} />
          </div>
          <div className="diff-stat-info">
            <span className="diff-stat-value text-success">+{stats.addedLines}</span>
            <span className="diff-stat-label">Added Lines</span>
          </div>
        </div>

        <div className="diff-stat-card diff-stat-removed" data-testid="stat-removed-lines">
          <div className="diff-stat-icon text-error">
            <MinusCircle size={16} />
          </div>
          <div className="diff-stat-info">
            <span className="diff-stat-value text-error">-{stats.removedLines}</span>
            <span className="diff-stat-label">Removed Lines</span>
          </div>
        </div>

        <div className="diff-stat-card diff-stat-modified" data-testid="stat-modified-lines">
          <div className="diff-stat-icon text-warning">
            <Edit3 size={16} />
          </div>
          <div className="diff-stat-info">
            <span className="diff-stat-value text-warning">~{stats.modifiedLines}</span>
            <span className="diff-stat-label">Modified Lines</span>
          </div>
        </div>

        <div className="diff-stat-card diff-stat-unchanged" data-testid="stat-unchanged-lines">
          <div className="diff-stat-icon text-muted">
            <CheckCircle2 size={16} />
          </div>
          <div className="diff-stat-info">
            <span className="diff-stat-value">{stats.unchangedLines}</span>
            <span className="diff-stat-label">Unchanged</span>
          </div>
        </div>

        <div className="diff-stat-card diff-stat-diff-percent" data-testid="stat-difference-percentage">
          <div className="diff-stat-icon text-info">
            <Percent size={16} />
          </div>
          <div className="diff-stat-info">
            <span className="diff-stat-value">
              {isIdentical ? '0%' : `${stats.differencePercentage}%`}
            </span>
            <span className="diff-stat-label">Difference</span>
          </div>
        </div>
      </div>
    </div>
  );
}


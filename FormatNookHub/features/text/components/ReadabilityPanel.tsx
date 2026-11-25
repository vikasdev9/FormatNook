'use client';

import React from 'react';
import { ReadabilityMetrics } from '../types/text.types';
import { Award, GraduationCap, AlertCircle, Info, BookOpen } from 'lucide-react';

interface ReadabilityPanelProps {
  metrics: ReadabilityMetrics;
}

export function ReadabilityPanel({ metrics }: ReadabilityPanelProps) {
  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'badge-success';
    if (score >= 60) return 'badge-accent';
    if (score >= 50) return 'badge-warning';
    return 'badge-error';
  };

  return (
    <div className="text-readability-container" data-testid="readability-panel">
      {/* Overview Cards */}
      <div className="text-readability-scores">
        <div className="readability-score-card">
          <div className="score-header">
            <span className="score-label">Flesch Reading Ease</span>
            <Award size={18} className="score-icon" />
          </div>
          <div className="score-number" data-testid="reading-ease-score">
            {metrics.fleschReadingEase}
            <span className="score-scale">/ 100</span>
          </div>
          <div className="score-status">
            <span className={`badge ${getScoreBadgeClass(metrics.fleschReadingEase)}`}>
              {metrics.interpretation}
            </span>
          </div>
        </div>

        <div className="readability-score-card">
          <div className="score-header">
            <span className="score-label">Flesch-Kincaid Grade Level</span>
            <GraduationCap size={18} className="score-icon" />
          </div>
          <div className="score-number" data-testid="kincaid-grade-score">
            {metrics.fleschKincaidGrade}
          </div>
          <div className="score-status">
            <span className="badge badge-secondary">{metrics.schoolLevel}</span>
          </div>
        </div>
      </div>

      {/* Structural Breakdown */}
      <div className="readability-breakdown-card">
        <div className="breakdown-title">
          <BookOpen size={16} />
          <span>Formula Components</span>
        </div>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <span className="breakdown-label">Avg Sentence Length</span>
            <span className="breakdown-value">{metrics.avgSentenceLength} words</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Avg Syllables per Word</span>
            <span className="breakdown-value">{metrics.avgSyllablesPerWord} syllables</span>
          </div>
        </div>
      </div>

      {/* Language Calibration Notice */}
      <div className={`readability-notice ${!metrics.isReliableLanguage ? 'notice-warning' : 'notice-info'}`}>
        <div className="notice-icon">
          {!metrics.isReliableLanguage ? <AlertCircle size={18} /> : <Info size={18} />}
        </div>
        <div className="notice-body">
          <p className="notice-text">{metrics.notes}</p>
          <p className="notice-sub">
            The Flesch-Kincaid scale is calibrated for the English language and assumes standard syllable phonetics.
            Higher reading ease scores reflect simpler sentence construction and shorter words.
          </p>
        </div>
      </div>
    </div>
  );
}

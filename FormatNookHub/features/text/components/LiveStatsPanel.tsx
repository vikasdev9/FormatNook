'use client';

import React from 'react';
import { TextStatistics } from '../types/text.types';
import { Clock, Volume2, AlignLeft, Hash, FileText, BookOpen, Layers } from 'lucide-react';

interface LiveStatsPanelProps {
  stats: TextStatistics;
  readingWpm: number;
  speakingWpm: number;
  onReadingWpmChange: (wpm: number) => void;
  onSpeakingWpmChange: (wpm: number) => void;
}

export function LiveStatsPanel({
  stats,
  readingWpm,
  speakingWpm,
  onReadingWpmChange,
  onSpeakingWpmChange,
}: LiveStatsPanelProps) {
  const statCards = [
    { label: 'Words', value: stats.words.toLocaleString(), icon: <FileText size={16} /> },
    { label: 'Characters', value: stats.characters.toLocaleString(), sub: 'With spaces', icon: <Hash size={16} /> },
    { label: 'Characters', value: stats.charactersNoSpaces.toLocaleString(), sub: 'No spaces', icon: <Hash size={16} /> },
    { label: 'Sentences', value: stats.sentences.toLocaleString(), icon: <AlignLeft size={16} /> },
    { label: 'Paragraphs', value: stats.paragraphs.toLocaleString(), icon: <Layers size={16} /> },
    { label: 'Lines', value: stats.lines.toLocaleString(), icon: <AlignLeft size={16} /> },
    { label: 'Avg Word Length', value: `${stats.avgWordLength}`, sub: 'Characters', icon: <BookOpen size={16} /> },
    { label: 'Words / Sentence', value: `${stats.avgWordsPerSentence}`, sub: 'Average', icon: <AlignLeft size={16} /> },
  ];

  return (
    <div className="text-stats-container" data-testid="live-stats-panel">
      {/* Primary Key Stats Grid */}
      <div className="text-stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="text-stat-card" data-testid={`stat-${card.label.toLowerCase().replace(/[^a-z]/g, '-')}-${idx}`}>
            <div className="text-stat-header">
              <span className="text-stat-label">{card.label}</span>
              <span className="text-stat-icon" aria-hidden="true">{card.icon}</span>
            </div>
            <div className="text-stat-value">{card.value}</div>
            {card.sub && <div className="text-stat-sub">{card.sub}</div>}
          </div>
        ))}
      </div>

      {/* Reading & Speaking Times with Speed Customization */}
      <div className="text-time-grid">
        <div className="text-time-card" data-testid="reading-time-card">
          <div className="text-time-header">
            <div className="text-time-title">
              <Clock size={16} className="text-accent-icon" />
              <span>Reading Time</span>
            </div>
            <span className="text-time-badge" data-testid="reading-time-value">{stats.readingTimeFormatted}</span>
          </div>
          <div className="text-time-controls">
            <label htmlFor="reading-wpm-input" className="text-time-label">
              Speed: {readingWpm} WPM
            </label>
            <input
              id="reading-wpm-input"
              type="range"
              min={100}
              max={400}
              step={10}
              value={readingWpm}
              onChange={(e) => onReadingWpmChange(Number(e.target.value))}
              className="text-slider"
              aria-label="Reading speed in words per minute"
            />
          </div>
        </div>

        <div className="text-time-card" data-testid="speaking-time-card">
          <div className="text-time-header">
            <div className="text-time-title">
              <Volume2 size={16} className="text-accent-icon" />
              <span>Speaking Time</span>
            </div>
            <span className="text-time-badge" data-testid="speaking-time-value">{stats.speakingTimeFormatted}</span>
          </div>
          <div className="text-time-controls">
            <label htmlFor="speaking-wpm-input" className="text-time-label">
              Speed: {speakingWpm} WPM
            </label>
            <input
              id="speaking-wpm-input"
              type="range"
              min={80}
              max={250}
              step={5}
              value={speakingWpm}
              onChange={(e) => onSpeakingWpmChange(Number(e.target.value))}
              className="text-slider"
              aria-label="Speaking speed in words per minute"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

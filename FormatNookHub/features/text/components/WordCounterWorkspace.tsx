'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  TextTabType,
  KeywordOptions,
} from '../types/text.types';
import { calculateTextStatistics } from '../services/text-counter';
import { calculateReadability } from '../services/readability';
import { calculateKeywordDensity } from '../services/keyword-density';
import { calculateSocialLimits } from '../services/social-counter';

import { LiveStatsPanel } from './LiveStatsPanel';
import { ReadabilityPanel } from './ReadabilityPanel';
import { KeywordDensityPanel } from './KeywordDensityPanel';
import { SocialMediaPanel } from './SocialMediaPanel';
import { TextCleanerPanel } from './TextCleanerPanel';

import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import {
  FileText,
  Award,
  Hash,
  Share2,
  Sparkles,
  Upload,
  ClipboardPaste,
} from 'lucide-react';

interface WordCounterWorkspaceProps {
  initialTab?: TextTabType;
}

const SAMPLE_TEXT = `FormatNook is an open developer utilities platform designed for fast, private, and client-side code transformation.

Whether you are formatting JSON, comparing text diffs, compressing images, or analyzing writing style, all processing occurs directly in your browser without uploading data to external servers.

Try typing or pasting your own content here to inspect real-time word counts, sentence lengths, reading ease scores, and social media constraints. It's fast, flexible, and 100% private!`;

export function WordCounterWorkspace({ initialTab = 'counter' }: WordCounterWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TextTabType>(initialTab);
  const [text, setText] = useState<string>(SAMPLE_TEXT);

  // Speed preferences
  const [readingWpm, setReadingWpm] = useState<number>(200);
  const [speakingWpm, setSpeakingWpm] = useState<number>(130);

  // Keyword density options
  const [keywordOptions, setKeywordOptions] = useState<KeywordOptions>({
    includeStopWords: false,
    caseSensitive: false,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized calculations for maximum responsiveness
  const stats = useMemo(
    () => calculateTextStatistics(text, readingWpm, speakingWpm),
    [text, readingWpm, speakingWpm]
  );

  const readability = useMemo(() => calculateReadability(text), [text]);

  const keywordDensity = useMemo(
    () => calculateKeywordDensity(text, keywordOptions),
    [text, keywordOptions]
  );

  const socialLimits = useMemo(() => calculateSocialLimits(text), [text]);

  // Editor Actions
  const handleClear = useCallback(() => {
    setText('');
    textareaRef.current?.focus();
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setText((prev) => (prev ? `${prev}\n${clipText}` : clipText));
        }
      }
    } catch {
      // Fallback: user can paste directly into textarea
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setText(content);
      }
    };
    reader.readAsText(file);
    // Reset file input value so user can re-upload same file if needed
    e.target.value = '';
  };

  const tabs: { id: TextTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'counter', label: 'Live Statistics', icon: <FileText size={15} /> },
    { id: 'readability', label: 'Readability Analyzer', icon: <Award size={15} /> },
    { id: 'keywords', label: 'Keyword Density', icon: <Hash size={15} /> },
    { id: 'social', label: 'Social Media Limits', icon: <Share2 size={15} /> },
    { id: 'cleaner', label: 'Text Cleaner', icon: <Sparkles size={15} /> },
  ];

  return (
    <div className="text-workspace-wrapper" data-testid="word-counter-workspace">
      {/* Workspace Navigation Tabs */}
      <div className="workspace-tab-nav" role="tablist" aria-label="Text Productivity Tools">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="text-workspace-columns">
        {/* Left Column: Large Text Editor */}
        <div className="text-editor-container">
          <div className="text-editor-header">
            <div className="text-editor-title-group">
              <span className="text-editor-heading">Text Editor</span>
              <span className="badge badge-secondary" data-testid="badge-word-count">
                {stats.words.toLocaleString()} words
              </span>
              <span className="badge badge-accent" data-testid="badge-char-count">
                {stats.characters.toLocaleString()} chars
              </span>
            </div>

            <div className="text-editor-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handlePaste}
                title="Paste text from clipboard"
                aria-label="Paste text from clipboard"
                data-testid="btn-paste-text"
              >
                <ClipboardPaste size={14} />
                <span className="hide-on-mobile">Paste</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileInputRef.current?.click()}
                title="Upload plain text file"
                aria-label="Upload text file"
                data-testid="btn-upload-file"
              >
                <Upload size={14} />
                <span className="hide-on-mobile">Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text,.rtf,.log"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                data-testid="input-file-hidden"
              />

              <CopyButton text={text} label="Copy" disabled={!text} />

              <DownloadButton
                content={text}
                fileName="text-content.txt"
                mimeType="text/plain"
                label="Download"
                disabled={!text}
              />

              <ResetButton onReset={handleClear} label="Clear" disabled={!text} />
            </div>
          </div>

          <div className="text-editor-body">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here to begin live analysis..."
              className="text-main-textarea"
              aria-label="Main text input area"
              data-testid="main-text-input"
              spellCheck="false"
            />
          </div>

          <div className="text-editor-footer">
            <div className="footer-meta">
              <span>Lines: {stats.lines}</span>
              <span>•</span>
              <span>Sentences: {stats.sentences}</span>
              <span>•</span>
              <span>Paragraphs: {stats.paragraphs}</span>
            </div>
            <div className="footer-status">100% Client-Side</div>
          </div>
        </div>

        {/* Right Column: Active Productivity Panel */}
        <div className="text-panel-container">
          {activeTab === 'counter' && (
            <LiveStatsPanel
              stats={stats}
              readingWpm={readingWpm}
              speakingWpm={speakingWpm}
              onReadingWpmChange={setReadingWpm}
              onSpeakingWpmChange={setSpeakingWpm}
            />
          )}

          {activeTab === 'readability' && <ReadabilityPanel metrics={readability} />}

          {activeTab === 'keywords' && (
            <KeywordDensityPanel
              density={keywordDensity}
              options={keywordOptions}
              onOptionsChange={setKeywordOptions}
            />
          )}

          {activeTab === 'social' && <SocialMediaPanel limits={socialLimits} text={text} />}

          {activeTab === 'cleaner' && (
            <TextCleanerPanel originalText={text} onApplyToEditor={setText} />
          )}
        </div>
      </div>
    </div>
  );
}

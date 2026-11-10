'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DiffFormat, DiffOptions, DiffResultData } from '../types/diff.types';
import {
  computeDiff,
  detectFormat,
  preprocessContent,
  DEFAULT_DIFF_OPTIONS,
} from '../services/diff-service';
import { DiffToolbar } from './DiffToolbar';
import { DiffSettings } from './DiffSettings';
import { DiffStatistics } from './DiffStatistics';
import { DiffResult } from './DiffResult';
import { TextEditor } from './TextEditor';

const DEFAULT_ORIGINAL_SAMPLE = `{
  "name": "FormatNook",
  "version": "1.0.0",
  "description": "Developer utilities platform",
  "features": [
    "JSON Formatter",
    "XML Formatter",
    "Base64 Encoder"
  ],
  "author": "Antigravity Team",
  "status": "beta"
}`;

const DEFAULT_MODIFIED_SAMPLE = `{
  "name": "FormatNook Hub",
  "version": "1.1.0",
  "description": "Fast and modular developer utilities platform",
  "features": [
    "JSON Formatter",
    "XML Formatter",
    "YAML Formatter",
    "Text Diff Checker",
    "Base64 Encoder"
  ],
  "author": "FormatNook Team",
  "license": "MIT",
  "status": "production"
}`;

export function TextDiffWorkspace() {
  const [originalText, setOriginalText] = useState<string>(DEFAULT_ORIGINAL_SAMPLE);
  const [modifiedText, setModifiedText] = useState<string>(DEFAULT_MODIFIED_SAMPLE);
  const [options, setOptions] = useState<DiffOptions>(DEFAULT_DIFF_OPTIONS);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<DiffResultData | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  const origEditorRef = useRef<HTMLTextAreaElement>(null);
  const modEditorRef = useRef<HTMLTextAreaElement>(null);
  const isSyncingScroll = useRef<boolean>(false);

  // Synchronized scroll handlers between input editors
  const handleOrigScrollSync = useCallback((scrollTop: number, scrollLeft: number) => {
    if (isSyncingScroll.current) return;
    if (modEditorRef.current) {
      isSyncingScroll.current = true;
      modEditorRef.current.scrollTop = scrollTop;
      modEditorRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  }, []);

  const handleModScrollSync = useCallback((scrollTop: number, scrollLeft: number) => {
    if (isSyncingScroll.current) return;
    if (origEditorRef.current) {
      isSyncingScroll.current = true;
      origEditorRef.current.scrollTop = scrollTop;
      origEditorRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  }, []);

  // Compute diff execution
  const executeDiff = useCallback(
    (orig: string, mod: string, currentOptions: DiffOptions) => {
      setIsComparing(true);
      try {
        const result = computeDiff(orig, mod, currentOptions);
        setDiffResult(result);
      } finally {
        setIsComparing(false);
      }
    },
    []
  );

  // Live comparison on input or options change
  useEffect(() => {
    executeDiff(originalText, modifiedText, options);
  }, [originalText, modifiedText, options, executeDiff]);

  const handleCompareClick = () => {
    executeDiff(originalText, modifiedText, options);
  };

  const handleSwap = () => {
    const nextOrig = modifiedText;
    const nextMod = originalText;
    setOriginalText(nextOrig);
    setModifiedText(nextMod);
    executeDiff(nextOrig, nextMod, options);
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
    executeDiff('', '', options);
  };

  const handlePrettifyBoth = () => {
    const effectiveFormat: DiffFormat =
      options.format === 'auto'
        ? (detectFormat(originalText) !== 'text'
            ? detectFormat(originalText)
            : detectFormat(modifiedText))
        : options.format;

    if (effectiveFormat === 'text') return;

    const prepOrig = preprocessContent(originalText, effectiveFormat, {
      prettifyBeforeCompare: true,
      sortKeys: options.sortKeys,
    });
    const prepMod = preprocessContent(modifiedText, effectiveFormat, {
      prettifyBeforeCompare: true,
      sortKeys: options.sortKeys,
    });

    setOriginalText(prepOrig.text);
    setModifiedText(prepMod.text);
  };

  return (
    <div className="diff-workspace-container" data-testid="diff-workspace">
      {/* Diff Toolbar */}
      <DiffToolbar
        onCompare={handleCompareClick}
        onSwap={handleSwap}
        onClear={handleClear}
        onPrettify={handlePrettifyBoth}
        options={options}
        onOptionsChange={setOptions}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((prev) => !prev)}
        unifiedDiffText={diffResult?.unifiedDiffText ?? ''}
        isComparing={isComparing}
      />

      {/* Collapsible Comparison Settings */}
      {showSettings && (
        <DiffSettings options={options} onOptionsChange={setOptions} />
      )}

      {/* Dual Text Editors for Original and Modified Input */}
      <div className="editor-workspace-grid diff-editor-grid">
        <TextEditor
          id="original-editor"
          title="Original Text"
          value={originalText}
          onChange={setOriginalText}
          placeholder="Paste or type original text here..."
          scrollRef={origEditorRef}
          onScrollSync={handleOrigScrollSync}
          testId="editor-original"
        />

        <TextEditor
          id="modified-editor"
          title="Modified Text"
          value={modifiedText}
          onChange={setModifiedText}
          placeholder="Paste or type modified text here..."
          scrollRef={modEditorRef}
          onScrollSync={handleModScrollSync}
          testId="editor-modified"
        />
      </div>

      {/* Difference Statistics */}
      {diffResult && !diffResult.isEmpty && (
        <DiffStatistics
          stats={diffResult.statistics}
          isIdentical={diffResult.isIdentical}
        />
      )}

      {/* Diff Result Highlighted View */}
      <DiffResult
        diffResult={diffResult}
        viewMode={options.viewMode}
      />
    </div>
  );
}

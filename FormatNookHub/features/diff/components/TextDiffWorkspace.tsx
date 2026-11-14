'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DiffFormat, DiffOptions, DiffResultData } from '../types/diff.types';
import { DiffEngineResult } from '../services/engines/types';
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

interface ModeConfig {
  label: string;
  placeholder: string;
  extensions: string[];
  sampleOriginal: string;
  sampleModified: string;
}

const DEFAULT_JSON_ORIGINAL = `{
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

const DEFAULT_JSON_MODIFIED = `{
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

const MODE_CONFIGS: Record<DiffFormat, ModeConfig> = {
  auto: {
    label: 'Auto-Detect',
    placeholder: 'Paste or type text, code, JSON, XML, YAML, CSV or SQL here...',
    extensions: ['.txt', '.json', '.xml', '.yaml', '.yml', '.csv', '.sql', '.html', '.css', '.js', '.ts', '.md'],
    sampleOriginal: DEFAULT_JSON_ORIGINAL,
    sampleModified: DEFAULT_JSON_MODIFIED,
  },
  text: {
    label: 'Plain Text',
    placeholder: 'Paste or type original plain text here...',
    extensions: ['.txt', '.md', '.log', '.diff'],
    sampleOriginal: `The quick brown fox jumps over the lazy dog.\nFormatNook helps developers format, validate and compare code.\nFast, modern, and reliable developer utilities.`,
    sampleModified: `The fast brown fox jumps over the lazy dog.\nFormatNook helps developers format, validate and compare code.\nSupercharged, modern, and reliable developer utilities.\nAdded universal diff inspection.`,
  },
  json: {
    label: 'JSON',
    placeholder: 'Paste or type JSON document here...',
    extensions: ['.json'],
    sampleOriginal: DEFAULT_JSON_ORIGINAL,
    sampleModified: DEFAULT_JSON_MODIFIED,
  },
  xml: {
    label: 'XML',
    placeholder: '<catalog>\n  <item id="1">Value</item>\n</catalog>',
    extensions: ['.xml', '.svg', '.xaml'],
    sampleOriginal: `<catalog>\n  <product id="101" category="tools">\n    <name>Diff Checker</name>\n    <version>1.0</version>\n  </product>\n</catalog>`,
    sampleModified: `<catalog>\n  <product id="101" category="utilities" inStock="true">\n    <name>Universal Diff Checker</name>\n    <version>2.0</version>\n  </product>\n</catalog>`,
  },
  yaml: {
    label: 'YAML',
    placeholder: 'app:\n  name: FormatNook\n  port: 3000',
    extensions: ['.yaml', '.yml'],
    sampleOriginal: `app:\n  name: FormatNook\n  version: 1.0.0\n  port: 3000\n  debug: false`,
    sampleModified: `app:\n  name: FormatNook Hub\n  version: 1.1.0\n  port: 8080\n  debug: true\n  status: active`,
  },
  csv: {
    label: 'CSV',
    placeholder: 'ID,Name,Department,Salary\n101,Alice,Engineering,95000',
    extensions: ['.csv', '.tsv'],
    sampleOriginal: `ID,Name,Department,Salary\n101,Alice Smith,Engineering,95000\n102,Bob Jones,Design,80000\n103,Carol White,Marketing,75000`,
    sampleModified: `ID,Name,Department,Salary,Status\n101,Alice Smith,Engineering,98000,Active\n102,Bob Jones,Product Design,85000,Active\n104,David Brown,QA,72000,New`,
  },
  sql: {
    label: 'SQL',
    placeholder: 'SELECT id, name FROM users WHERE status = 1;',
    extensions: ['.sql'],
    sampleOriginal: `SELECT id, name, email FROM users WHERE status = 'active';`,
    sampleModified: `SELECT id, name, email, role FROM users WHERE status = 'active' AND verified = 1 ORDER BY name ASC;`,
  },
  html: {
    label: 'HTML',
    placeholder: '<div class="container">\n  <h1>Title</h1>\n</div>',
    extensions: ['.html', '.htm'],
    sampleOriginal: `<div class="container">\n  <h1>Welcome</h1>\n  <p>FormatNook developer tools</p>\n</div>`,
    sampleModified: `<div class="container main">\n  <h1>Welcome to FormatNook</h1>\n  <p>FormatNook developer tools</p>\n  <button class="btn">Get Started</button>\n</div>`,
  },
  css: {
    label: 'CSS',
    placeholder: '.card {\n  color: #333;\n  padding: 16px;\n}',
    extensions: ['.css', '.scss'],
    sampleOriginal: `.card {\n  color: #333;\n  padding: 16px;\n  margin-bottom: 24px;\n}`,
    sampleModified: `.card {\n  color: #111;\n  padding: 20px;\n  border-radius: 8px;\n}\n.card:hover {\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n}`,
  },
  javascript: {
    label: 'JavaScript',
    placeholder: 'function calculate() {\n  return true;\n}',
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
    sampleOriginal: `function calculateTotal(items) {\n  let total = 0;\n  for (const item of items) {\n    total += item.price;\n  }\n  return total;\n}`,
    sampleModified: `function calculateTotal(items, discount = 0) {\n  const total = items.reduce((acc, item) => acc + item.price, 0);\n  return total * (1 - discount);\n}\nexport { calculateTotal };`,
  },
  code: {
    label: 'Generic Code',
    placeholder: '# Function definition\ndef run():\n    pass',
    extensions: ['.py', '.rs', '.go', '.java', '.c', '.cpp', '.rb', '.php'],
    sampleOriginal: `# Authentication module\ndef verify_user(username, password):\n    # Query database\n    return db.query(username, password)`,
    sampleModified: `# Authentication module v2\ndef verify_user(username, password):\n    # Hash and query\n    hashed = hash_password(password)\n    return db.query(username, hashed)`,
  },
};

export function TextDiffWorkspace() {
  const [originalText, setOriginalText] = useState<string>(DEFAULT_JSON_ORIGINAL);
  const [modifiedText, setModifiedText] = useState<string>(DEFAULT_JSON_MODIFIED);
  const [options, setOptions] = useState<DiffOptions>(DEFAULT_DIFF_OPTIONS);
  const [mobileTab, setMobileTab] = useState<'both' | 'original' | 'modified'>('both');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<DiffEngineResult | DiffResultData | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  const prevFormatRef = useRef<DiffFormat>(options.format);
  const origEditorRef = useRef<HTMLTextAreaElement>(null);
  const modEditorRef = useRef<HTMLTextAreaElement>(null);
  const isSyncingScroll = useRef<boolean>(false);

  const currentModeConfig = MODE_CONFIGS[options.format] || MODE_CONFIGS.auto;

  // Handle format switching and sample updating
  useEffect(() => {
    const prevFormat = prevFormatRef.current;
    if (prevFormat !== options.format) {
      const prevConfig = MODE_CONFIGS[prevFormat] || MODE_CONFIGS.auto;
      const isDefaultSample =
        (originalText === prevConfig.sampleOriginal && modifiedText === prevConfig.sampleModified) ||
        (!originalText.trim() && !modifiedText.trim());

      if (isDefaultSample && options.format !== 'auto') {
        const nextConfig = MODE_CONFIGS[options.format] || MODE_CONFIGS.auto;
        setOriginalText(nextConfig.sampleOriginal);
        setModifiedText(nextConfig.sampleModified);
      }
      prevFormatRef.current = options.format;
    }
  }, [options.format, originalText, modifiedText]);

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

  const engineRes = diffResult as DiffEngineResult | null;
  const originalError = engineRes?.errors?.original || diffResult?.formatWarnings?.original;
  const modifiedError = engineRes?.errors?.modified || diffResult?.formatWarnings?.modified;

  return (
    <div className="diff-workspace-container" data-testid="diff-workspace">
      {/* Diff Toolbar with 10-Mode Selector */}
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

      {/* Mobile Editor Switcher for Touch Viewports */}
      <div className="workspace-mobile-tabs" role="tablist" aria-label="Diff editors selection">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'both'}
          className={`workspace-mobile-tab ${mobileTab === 'both' ? 'active' : ''}`}
          onClick={() => setMobileTab('both')}
        >
          Both Editors
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'original'}
          className={`workspace-mobile-tab ${mobileTab === 'original' ? 'active' : ''}`}
          onClick={() => setMobileTab('original')}
        >
          Original
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'modified'}
          className={`workspace-mobile-tab ${mobileTab === 'modified' ? 'active' : ''}`}
          onClick={() => setMobileTab('modified')}
        >
          Modified
        </button>
      </div>

      {/* Dual Text Editors for Original and Modified Input */}
      <div className="editor-workspace-grid diff-editor-grid">
        <TextEditor
          id="original-editor"
          title={`Original ${currentModeConfig.label}`}
          value={originalText}
          onChange={setOriginalText}
          placeholder={currentModeConfig.placeholder}
          scrollRef={origEditorRef}
          onScrollSync={handleOrigScrollSync}
          testId="editor-original"
          error={originalError}
          acceptExtensions={currentModeConfig.extensions}
          className={mobileTab === 'modified' ? 'mobile-panel-hidden' : ''}
        />

        <TextEditor
          id="modified-editor"
          title={`Modified ${currentModeConfig.label}`}
          value={modifiedText}
          onChange={setModifiedText}
          placeholder={currentModeConfig.placeholder}
          scrollRef={modEditorRef}
          onScrollSync={handleModScrollSync}
          testId="editor-modified"
          error={modifiedError}
          acceptExtensions={currentModeConfig.extensions}
          className={mobileTab === 'original' ? 'mobile-panel-hidden' : ''}
        />
      </div>

      {/* Difference Statistics */}
      {diffResult && !diffResult.isEmpty && (
        <DiffStatistics
          stats={diffResult.statistics}
          isIdentical={diffResult.isIdentical}
        />
      )}

      {/* Diff Result Highlighted View and Structured Inspector */}
      <DiffResult
        diffResult={diffResult}
        viewMode={options.viewMode}
        isComparing={isComparing}
      />
    </div>
  );
}

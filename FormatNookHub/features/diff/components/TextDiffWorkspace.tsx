'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DiffFormat, DiffOptions, DiffResultData } from '../types/diff.types';
import { DiffEngineResult } from '../services/engines/types';
import {
  computeDiff,
  detectFormat,
  preprocessContent,
  DEFAULT_DIFF_OPTIONS,
} from '../services/diff-service';
import { diffWorkerClient } from '../services/diff-worker-client';
import { DiffToolbar } from './DiffToolbar';
import { DiffSettings } from './DiffSettings';
import { DiffStatistics } from './DiffStatistics';
import { DiffResult } from './DiffResult';
import { TextEditor } from './TextEditor';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcuts,
  useModalShortcuts,
} from '@/features/keyboard-shortcuts';

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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [panelsRatio, setPanelsRatio] = useState<number>(50);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [currentDiffIndex, setCurrentDiffIndex] = useState<number>(0);
  const [activeDiffLineId, setActiveDiffLineId] = useState<string | number | null>(null);

  const prevFormatRef = useRef<DiffFormat>(options.format);
  const origEditorRef = useRef<HTMLTextAreaElement>(null);
  const modEditorRef = useRef<HTMLTextAreaElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isSyncingScroll = useRef<boolean>(false);
  const requestIdRef = useRef<number>(0);

  // Modal stack management for Diff Shortcuts Help
  useModalShortcuts('diff-shortcuts-modal', isShortcutsOpen, () => setIsShortcutsOpen(false));

  // Compute Difference Chunks for Next/Prev Stepper
  const diffChunks = useMemo(() => {
    if (!diffResult || !diffResult.lines) return [];
    const chunks: { id: string | number; lineId: string | number; origLine?: number; modLine?: number }[] = [];
    let inChunk = false;
    for (const line of diffResult.lines) {
      if (line.type !== 'equal') {
        if (!inChunk) {
          inChunk = true;
          chunks.push({
            id: line.id,
            lineId: line.id,
            origLine: line.originalLineNumber,
            modLine: line.modifiedLineNumber,
          });
        }
      } else {
        inChunk = false;
      }
    }
    return chunks;
  }, [diffResult]);

  // Reset or adjust diff index when chunks change
  useEffect(() => {
    if (diffChunks.length === 0) {
      setCurrentDiffIndex(0);
      setActiveDiffLineId(null);
    } else if (currentDiffIndex >= diffChunks.length) {
      setCurrentDiffIndex(0);
      setActiveDiffLineId(diffChunks[0].lineId);
    }
  }, [diffChunks, currentDiffIndex]);

  const scrollToDiff = useCallback(
    (chunk: { id: string | number; lineId: string | number; origLine?: number; modLine?: number }) => {
      setActiveDiffLineId(chunk.lineId);

      // Scroll Diff viewer if rendered
      if (typeof document !== 'undefined') {
        const el = document.getElementById(`diff-line-${chunk.lineId}`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Scroll input editors to matching lines
      const lineHeight = 24;
      if (chunk.origLine && origEditorRef.current) {
        origEditorRef.current.scrollTop = Math.max(0, (chunk.origLine - 3) * lineHeight);
      }
      if (chunk.modLine && modEditorRef.current) {
        modEditorRef.current.scrollTop = Math.max(0, (chunk.modLine - 3) * lineHeight);
      }
    },
    []
  );

  const handleNextDiff = useCallback(() => {
    if (diffChunks.length === 0) return;
    const nextIdx = (currentDiffIndex + 1) % diffChunks.length;
    setCurrentDiffIndex(nextIdx);
    scrollToDiff(diffChunks[nextIdx]);
  }, [diffChunks, currentDiffIndex, scrollToDiff]);

  const handlePrevDiff = useCallback(() => {
    if (diffChunks.length === 0) return;
    const prevIdx = currentDiffIndex <= 0 ? diffChunks.length - 1 : currentDiffIndex - 1;
    setCurrentDiffIndex(prevIdx);
    scrollToDiff(diffChunks[prevIdx]);
  }, [diffChunks, currentDiffIndex, scrollToDiff]);

  // Window key listener for Alt+Down / Alt+Up and F7 / Shift+F7
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key === 'ArrowDown') || (e.key === 'F7' && !e.shiftKey)) {
        e.preventDefault();
        handleNextDiff();
      } else if ((e.altKey && e.key === 'ArrowUp') || (e.key === 'F7' && e.shiftKey)) {
        e.preventDefault();
        handlePrevDiff();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextDiff, handlePrevDiff]);

  // Resizable Panels Handlers (Pointer events, touch & keyboard accessible)
  const handlePointerDownResizer = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const pointerId = e.pointerId;
    const targetElement = e.currentTarget;

    if (targetElement.setPointerCapture) {
      try {
        targetElement.setPointerCapture(pointerId);
      } catch {
        // ignore
      }
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const newRatio = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      if (newRatio >= 20 && newRatio <= 80) {
        setPanelsRatio(Math.round(newRatio));
      }
    };

    const handlePointerUpOrCancel = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (targetElement.releasePointerCapture) {
        try {
          targetElement.releasePointerCapture(pointerId);
        } catch {
          // ignore
        }
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUpOrCancel);
      window.removeEventListener('pointercancel', handlePointerUpOrCancel);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUpOrCancel);
    window.addEventListener('pointercancel', handlePointerUpOrCancel);
  };

  const handleResizerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPanelsRatio((prev) => Math.max(20, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPanelsRatio((prev) => Math.min(80, prev + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setPanelsRatio(50);
    } else if (e.key === 'End') {
      e.preventDefault();
      setPanelsRatio(50);
    }
  };

  const handleResizerDoubleClick = () => {
    setPanelsRatio(50);
  };

  // Acquire background Diff Worker lifecycle
  useEffect(() => {
    return diffWorkerClient.acquire();
  }, []);

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
  const handleOrigScrollSync = useCallback(
    (scrollTop: number, scrollLeft: number) => {
      if (!syncScroll || isSyncingScroll.current) return;
      if (modEditorRef.current) {
        isSyncingScroll.current = true;
        modEditorRef.current.scrollTop = scrollTop;
        modEditorRef.current.scrollLeft = scrollLeft;
        requestAnimationFrame(() => {
          isSyncingScroll.current = false;
        });
      }
    },
    [syncScroll]
  );

  const handleModScrollSync = useCallback(
    (scrollTop: number, scrollLeft: number) => {
      if (!syncScroll || isSyncingScroll.current) return;
      if (origEditorRef.current) {
        isSyncingScroll.current = true;
        origEditorRef.current.scrollTop = scrollTop;
        origEditorRef.current.scrollLeft = scrollLeft;
        requestAnimationFrame(() => {
          isSyncingScroll.current = false;
        });
      }
    },
    [syncScroll]
  );

  // Compute diff execution via background Web Worker for large payloads (with synchronous fallback)
  const executeDiff = useCallback(
    (orig: string, mod: string, currentOptions: DiffOptions) => {
      const reqId = ++requestIdRef.current;
      const totalLen = (orig || '').length + (mod || '').length;

      // Synchronous fallback for small payloads or SSR/test environments
      if (typeof window === 'undefined' || typeof Worker === 'undefined' || totalLen <= 10000) {
        setIsComparing(false);
        setDiffResult(computeDiff(orig, mod, currentOptions));
        return;
      }

      // Background Web Worker for large payloads
      setIsComparing(true);
      diffWorkerClient
        .computeDiff(orig, mod, currentOptions)
        .then((res) => {
          if (reqId === requestIdRef.current) {
            if (res.success && res.data) {
              setDiffResult(res.data);
            } else {
              setDiffResult(computeDiff(orig, mod, currentOptions));
            }
          }
        })
        .catch(() => {
          if (reqId === requestIdRef.current) {
            setDiffResult(computeDiff(orig, mod, currentOptions));
          }
        })
        .finally(() => {
          if (reqId === requestIdRef.current) {
            setIsComparing(false);
          }
        });
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

  // Centralized Diff Keyboard Shortcuts
  useKeyboardShortcuts({
    scope: 'workspace',
    category: 'diff',
    bindings: {
      'diff-compare': () => handleCompareClick(),
      'diff-swap': () => handleSwap(),
      'diff-copy': () => {
        const unified = diffResult ? (diffResult as any).unifiedText || (diffResult as any).diffText || '' : '';
        if (unified && typeof navigator !== 'undefined') {
          navigator.clipboard?.writeText(unified);
        }
      },
      'diff-clear': () => handleClear(),
      'diff-shortcuts': () => setIsShortcutsOpen(true),
    },
  });

  const engineRes = diffResult as DiffEngineResult | null;
  const originalError = engineRes?.errors?.original || diffResult?.formatWarnings?.original;
  const modifiedError = engineRes?.errors?.modified || diffResult?.formatWarnings?.modified;

  return (
    <div className="diff-workspace-container" data-testid="diff-workspace">
      {/* Diff Toolbar with 10-Mode Selector and Hierarchy */}
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
        diffResult={diffResult}
        isComparing={isComparing}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        totalDiffs={diffChunks.length}
        currentDiffIndex={currentDiffIndex}
        onNextDiff={handleNextDiff}
        onPrevDiff={handlePrevDiff}
        syncScroll={syncScroll}
        onToggleSyncScroll={() => setSyncScroll((prev) => !prev)}
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

      {/* Resizable Dual Text Editors for Original and Modified Input */}
      <div
        ref={gridRef}
        className="editor-workspace-grid json-resizable-grid diff-resizable-grid"
        style={
          {
            '--panels-left': `${panelsRatio}fr`,
            '--panels-right': `${100 - panelsRatio}fr`,
          } as React.CSSProperties
        }
      >
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
          onClear={() => setOriginalText('')}
        />

        {/* Resizable Splitter */}
        <div
          className="workspace-split-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize original and modified editor panels"
          aria-valuenow={panelsRatio}
          aria-valuemin={20}
          aria-valuemax={80}
          tabIndex={0}
          onPointerDown={handlePointerDownResizer}
          onKeyDown={handleResizerKeyDown}
          onDoubleClick={handleResizerDoubleClick}
          title="Drag to resize panels, double-click to reset (50/50)"
        >
          <div className="workspace-split-resizer-line" />
        </div>

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
          onClear={() => setModifiedText('')}
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
        activeDiffLineId={activeDiffLineId}
      />

      {/* Keyboard Shortcuts Reference Dialog */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        initialCategory="diff"
      />
    </div>
  );
}

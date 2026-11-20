'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Minimize2,
  ShieldCheck,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { IndentOption, ValidationIssue } from '@/types/tool';
import {
  formatHtml,
  formatCss,
  formatJavascript,
  formatSql,
  minifyJavascript,
  minifyHtml,
  minifyCss,
  minifySql,
  validateCode,
  BeautifierLanguage,
  SqlFormatOptions,
  JsFormatOptions,
  CssFormatOptions,
  HtmlFormatOptions,
} from '../services/beautifier-service';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ShareButton } from '@/components/workspace/ShareButton';
import { createBeautifierSharePayload } from '../adapters/beautifier-share.adapter';
import { ResetButton } from '@/components/workspace/ResetButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcuts,
  useModalShortcuts,
} from '@/features/keyboard-shortcuts';

export type { BeautifierLanguage };

interface BeautifierWorkspaceProps {
  language: BeautifierLanguage;
  defaultSample: string;
  outputFileName: string;
  mimeType: string;
  fileExtensions: string[];
}

const LANGUAGE_CONFIGS: Record<
  BeautifierLanguage,
  {
    label: string;
    sample: string;
    fileName: string;
    mimeType: string;
    extensions: string[];
  }
> = {
  javascript: {
    label: 'JavaScript',
    sample:
      'function processUserData(user, options = {}) {\n  if (!user || !user.id) return null;\n  const sanitized = { id: user.id, name: user.name.trim(), active: Boolean(user.active) };\n  return sanitized;\n}',
    fileName: 'formatted.js',
    mimeType: 'application/javascript',
    extensions: ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.txt'],
  },
  html: {
    label: 'HTML',
    sample:
      '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Demo</title>\n  </head>\n  <body>\n    <main class="container">\n      <h1>Hello FormatNook</h1>\n      <p>Fast, clean HTML formatting.</p>\n    </main>\n  </body>\n</html>',
    fileName: 'formatted.html',
    mimeType: 'text/html',
    extensions: ['.html', '.htm', '.txt'],
  },
  css: {
    label: 'CSS',
    sample:
      '.hero-banner {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 2rem;\n  background: #0f172a;\n  border-radius: 12px;\n  color: #fff;\n}\n.hero-title {\n  font-size: 2rem;\n  font-weight: 700;\n}',
    fileName: 'formatted.css',
    mimeType: 'text/css',
    extensions: ['.css', '.scss', '.less', '.txt'],
  },
  sql: {
    label: 'SQL',
    sample:
      "SELECT u.id, u.username, u.email, COUNT(o.id) AS total_orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = 1 AND u.created_at >= '2025-01-01'\nGROUP BY u.id, u.username, u.email\nORDER BY total_orders DESC\nLIMIT 50;",
    fileName: 'formatted.sql',
    mimeType: 'application/sql',
    extensions: ['.sql', '.txt'],
  },
};

const FORMAT_TABS: BeautifierLanguage[] = ['javascript', 'html', 'css', 'sql'];

export function BeautifierWorkspace({
  language: initialLanguage,
  defaultSample,
  outputFileName: initialOutputFileName,
  mimeType: initialMimeType,
  fileExtensions: initialFileExtensions,
}: BeautifierWorkspaceProps) {
  const [currentLanguage, setCurrentLanguage] = useState<BeautifierLanguage>(initialLanguage);
  const [input, setInput] = useState<string>(defaultSample);
  const [output, setOutput] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'format' | 'minify' | 'validate'>('format');

  // Options
  const [indent, setIndent] = useState<IndentOption>('2');
  const [jsQuotes, setJsQuotes] = useState<'as-is' | 'single' | 'double'>('as-is');
  const [htmlPreserveComments, setHtmlPreserveComments] = useState<boolean>(true);
  const [cssPreserveComments, setCssPreserveComments] = useState<boolean>(true);
  const [sqlKeywordCase, setSqlKeywordCase] = useState<'upper' | 'lower' | 'preserve'>('upper');

  // UI & Layout
  const [mobileTab, setMobileTab] = useState<'both' | 'input' | 'output'>('both');
  const [panelsRatio, setPanelsRatio] = useState<number>(50);
  const isDraggingRef = useRef(false);

  const [validationState, setValidationState] = useState<{
    isValid: boolean | null;
    issues: ValidationIssue[];
  }>({
    isValid: null,
    issues: [],
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const config = LANGUAGE_CONFIGS[currentLanguage];
  const activeFileName =
    currentLanguage === initialLanguage ? initialOutputFileName : config.fileName;
  const activeMime =
    currentLanguage === initialLanguage ? initialMimeType : config.mimeType;
  const activeExtensions =
    currentLanguage === initialLanguage ? initialFileExtensions : config.extensions;

  // Execute processing according to current activeMode, language, and options
  const executeJob = useCallback(
    (
      mode: 'format' | 'minify' | 'validate',
      contentToProcess: string = input,
      lang: BeautifierLanguage = currentLanguage
    ) => {
      setIsProcessing(true);
      try {
        if (mode === 'minify') {
          let res;
          if (lang === 'sql') res = minifySql(contentToProcess);
          else if (lang === 'html') res = minifyHtml(contentToProcess);
          else if (lang === 'css') res = minifyCss(contentToProcess);
          else res = minifyJavascript(contentToProcess);

          setOutput(res.output);
          setValidationState({ isValid: res.isValid, issues: res.issues });
        } else if (mode === 'validate') {
          const res = validateCode(contentToProcess, lang);
          setOutput(contentToProcess);
          setValidationState({ isValid: res.isValid, issues: res.issues });
        } else {
          // Format
          let res;
          if (lang === 'sql') {
            res = formatSql(contentToProcess, {
              indent,
              keywordCase: sqlKeywordCase,
            } as SqlFormatOptions);
          } else if (lang === 'html') {
            res = formatHtml(contentToProcess, {
              indent,
              preserveComments: htmlPreserveComments,
            } as HtmlFormatOptions);
          } else if (lang === 'css') {
            res = formatCss(contentToProcess, {
              indent,
              preserveComments: cssPreserveComments,
            } as CssFormatOptions);
          } else {
            res = formatJavascript(contentToProcess, {
              indent,
              quotes: jsQuotes,
            } as JsFormatOptions);
          }

          setOutput(res.output);
          setValidationState({ isValid: res.isValid, issues: res.issues });
        }
      } catch (err: any) {
        setOutput(contentToProcess);
        setValidationState({
          isValid: false,
          issues: [{ message: err?.message || 'Processing failed', severity: 'error' }],
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [
      input,
      currentLanguage,
      indent,
      jsQuotes,
      htmlPreserveComments,
      cssPreserveComments,
      sqlKeywordCase,
    ]
  );

  // Initial format on mount or when language / mode changes
  useEffect(() => {
    executeJob(activeMode, input, currentLanguage);
  }, [executeJob, activeMode, currentLanguage]);

  // Modal stack management for Beautifier Shortcuts Help
  useModalShortcuts('beautifier-shortcuts-modal', isShortcutsOpen, () =>
    setIsShortcutsOpen(false)
  );

  // Centralized Beautifiers Keyboard Shortcuts
  useKeyboardShortcuts({
    scope: 'workspace',
    category: 'beautifiers',
    bindings: {
      'beautifier-format': () => {
        setActiveMode('format');
        executeJob('format');
      },
      'beautifier-minify': () => {
        setActiveMode('minify');
        executeJob('minify');
      },
      'beautifier-validate': () => {
        setActiveMode('validate');
        executeJob('validate');
      },
      'beautifier-copy': () => {
        if (output && typeof navigator !== 'undefined') {
          navigator.clipboard?.writeText(output);
        }
      },
      'beautifier-clear': () => {
        handleReset();
      },
      'beautifier-shortcuts': () => setIsShortcutsOpen(true),
    },
  });

  const handleFormatClick = () => {
    setActiveMode('format');
    executeJob('format');
  };

  const handleMinifyClick = () => {
    setActiveMode('minify');
    executeJob('minify');
  };

  const handleValidateClick = () => {
    setActiveMode('validate');
    executeJob('validate');
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
    setValidationState({ isValid: null, issues: [] });
  };

  const handleFileLoaded = (content: string) => {
    setInput(content);
    executeJob(activeMode, content);
  };

  const handleLanguageSwitch = (targetLang: BeautifierLanguage) => {
    if (targetLang === currentLanguage) return;

    const isSampleInput =
      !input.trim() ||
      input.trim() === defaultSample.trim() ||
      Object.values(LANGUAGE_CONFIGS).some((c) => c.sample.trim() === input.trim());

    const nextInput = isSampleInput ? LANGUAGE_CONFIGS[targetLang].sample : input;
    if (isSampleInput) {
      setInput(nextInput);
    }
    setCurrentLanguage(targetLang);
    executeJob(activeMode, nextInput, targetLang);
  };

  // Resizer pointer / keyboard handlers
  const handlePointerDownResizer = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveResizer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const grid = e.currentTarget.parentElement;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.round((x / rect.width) * 100);
    setPanelsRatio(Math.min(80, Math.max(20, pct)));
  };

  const handlePointerUpResizer = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleResizerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPanelsRatio((prev) => Math.max(20, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPanelsRatio((prev) => Math.min(80, prev + 5));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setPanelsRatio(50);
    }
  };

  const handleResizerDoubleClick = () => {
    setPanelsRatio(50);
  };

  // Metrics calculation
  const inputChars = input.length;
  const inputBytes = new Blob([input]).size;
  const inputLines = input ? input.split('\n').length : 0;

  const outputChars = output.length;
  const outputBytes = new Blob([output]).size;
  const outputLines = output ? output.split('\n').length : 0;

  const modeTitle =
    activeMode === 'minify'
      ? 'Minified'
      : activeMode === 'validate'
      ? 'Validated'
      : 'Beautified';

  return (
    <div className="tool-workspace-container" data-testid="beautifier-workspace">
      {/* Two-Tier Toolbar */}
      <div className="beautifier-toolbar" role="toolbar" aria-label="Code Beautifier Controls">
        {/* Tier 1: Primary Actions & Format Switcher */}
        <div className="beautifier-toolbar-primary">
          <div className="toolbar-group-left">
            <button
              type="button"
              className={`btn btn-sm ${activeMode === 'format' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleFormatClick}
              title={`Beautify & Format ${currentLanguage.toUpperCase()} (Ctrl+Enter)`}
              aria-label={`Beautify ${currentLanguage.toUpperCase()}`}
              data-testid="btn-format"
            >
              <Sparkles size={14} />
              <span>Beautify</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${activeMode === 'minify' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleMinifyClick}
              title={`Minify ${currentLanguage.toUpperCase()} (Ctrl+Shift+M)`}
              aria-label={`Minify ${currentLanguage.toUpperCase()}`}
              data-testid="btn-minify"
            >
              <Minimize2 size={14} />
              <span>Minify</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${activeMode === 'validate' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleValidateClick}
              title={`Validate ${currentLanguage.toUpperCase()} Syntax (Ctrl+Shift+V)`}
              aria-label={`Validate ${currentLanguage.toUpperCase()}`}
              data-testid="btn-validate"
            >
              <ShieldCheck size={14} />
              <span>Validate</span>
            </button>

            <ResetButton onReset={handleReset} />

            {/* Language Selector Pills */}
            <div
              className="beautifier-format-pill-group"
              role="group"
              aria-label="Language Format Selection"
            >
              {FORMAT_TABS.map((langKey) => (
                <button
                  key={langKey}
                  type="button"
                  className={`beautifier-format-pill ${currentLanguage === langKey ? 'active' : ''}`}
                  onClick={() => handleLanguageSwitch(langKey)}
                  data-testid={`btn-format-${langKey}`}
                >
                  {LANGUAGE_CONFIGS[langKey].label}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-group-right">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setIsShortcutsOpen(true)}
              title="Keyboard Shortcuts Reference (?)"
              aria-label="Keyboard Shortcuts"
              data-testid="btn-shortcuts"
            >
              <Keyboard size={14} />
              <span>Shortcuts</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Format-Specific Secondary Options */}
        <div className="beautifier-toolbar-secondary">
          <div className="beautifier-secondary-left">
            {/* Shared Indent Option */}
            <div className="options-control-group">
              <label htmlFor="beautifier-indent">Indent:</label>
              <select
                id="beautifier-indent"
                className="select-control"
                value={indent}
                onChange={(e) => setIndent(e.target.value as IndentOption)}
                data-testid="select-indent"
              >
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
                <option value="tab">Tabs</option>
              </select>
            </div>

            {/* JavaScript Options */}
            {currentLanguage === 'javascript' && (
              <div className="options-control-group">
                <label htmlFor="js-quotes-select">Quotes:</label>
                <select
                  id="js-quotes-select"
                  className="select-control"
                  value={jsQuotes}
                  onChange={(e) => setJsQuotes(e.target.value as any)}
                  data-testid="select-quotes"
                >
                  <option value="as-is">Preserve (As-is)</option>
                  <option value="single">Single (&apos;)</option>
                  <option value="double">Double (&quot;)</option>
                </select>
              </div>
            )}

            {/* HTML Options */}
            {currentLanguage === 'html' && (
              <label
                className="options-control-group"
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <input
                  type="checkbox"
                  checked={htmlPreserveComments}
                  onChange={(e) => setHtmlPreserveComments(e.target.checked)}
                  data-testid="checkbox-html-comments"
                />
                <span>Preserve Comments</span>
              </label>
            )}

            {/* CSS Options */}
            {currentLanguage === 'css' && (
              <label
                className="options-control-group"
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <input
                  type="checkbox"
                  checked={cssPreserveComments}
                  onChange={(e) => setCssPreserveComments(e.target.checked)}
                  data-testid="checkbox-css-comments"
                />
                <span>Preserve Comments</span>
              </label>
            )}

            {/* SQL Options */}
            {currentLanguage === 'sql' && (
              <div className="options-control-group">
                <label htmlFor="sql-keyword-case">Keywords:</label>
                <select
                  id="sql-keyword-case"
                  className="select-control"
                  value={sqlKeywordCase}
                  onChange={(e) => setSqlKeywordCase(e.target.value as any)}
                  data-testid="select-sql-keyword-case"
                >
                  <option value="upper">UPPERCASE</option>
                  <option value="lower">lowercase</option>
                  <option value="preserve">Preserve</option>
                </select>
              </div>
            )}
          </div>

          <div className="beautifier-secondary-right">
            {isProcessing ? (
              <span className="beautifier-status-badge status-processing">
                <Clock size={13} />
                <span>Processing</span>
              </span>
            ) : validationState.isValid === true ? (
              <span
                className="beautifier-status-badge status-valid"
                data-testid="beautifier-status-badge"
              >
                <CheckCircle2 size={13} />
                <span>Valid Syntax</span>
              </span>
            ) : validationState.isValid === false ? (
              <span
                className="beautifier-status-badge status-invalid"
                data-testid="beautifier-status-badge"
              >
                <AlertCircle size={13} />
                <span>
                  {validationState.issues.length > 0
                    ? `${validationState.issues.length} Issue(s)`
                    : 'Invalid Syntax'}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <ValidationResult isValid={validationState.isValid} issues={validationState.issues} />

      {/* Mobile Segmented Panel Switcher */}
      <div className="workspace-mobile-tabs" role="tablist" aria-label="Editor view selection">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'both'}
          className={`workspace-mobile-tab ${mobileTab === 'both' ? 'active' : ''}`}
          onClick={() => setMobileTab('both')}
          data-testid="tab-mobile-both"
        >
          Both Panels
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'input'}
          className={`workspace-mobile-tab ${mobileTab === 'input' ? 'active' : ''}`}
          onClick={() => setMobileTab('input')}
          data-testid="tab-mobile-input"
        >
          Input
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'output'}
          className={`workspace-mobile-tab ${mobileTab === 'output' ? 'active' : ''}`}
          onClick={() => setMobileTab('output')}
          data-testid="tab-mobile-output"
        >
          {modeTitle} Output
        </button>
      </div>

      {/* Resizable Grid Layout */}
      <div
        className="beautifier-resizable-grid editor-workspace-grid"
        style={{
          gridTemplateColumns:
            mobileTab === 'both' ? `${panelsRatio}% 12px 1fr` : undefined,
        }}
        data-testid="beautifier-grid"
      >
        {/* Left Column: Input Panel */}
        <div
          className={`editor-panel ${mobileTab === 'output' ? 'mobile-panel-hidden' : ''}`}
          data-testid="beautifier-input-panel"
        >
          <div className="panel-header">
            <div className="panel-title-group">
              <span className="panel-title-text">
                Input ({config.label})
              </span>
              <span className="panel-stats">
                {inputLines} lines &bull; {inputChars} chars ({formatByteSize(inputBytes)})
              </span>
            </div>
            <div className="panel-actions">
              <FileDropzone
                onFileLoaded={handleFileLoaded}
                acceptExtensions={activeExtensions}
              />
              <CopyButton text={input} label="Copy" />
            </div>
          </div>
          <div className="panel-body">
            <CodeEditor
              value={input}
              onChange={setInput}
              language={currentLanguage}
              placeholder={`Paste unformatted ${config.label} here...`}
            />
          </div>
        </div>

        {/* Accessible Resizer */}
        <div
          className="workspace-split-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize beautifier input and output panels"
          aria-valuenow={panelsRatio}
          aria-valuemin={20}
          aria-valuemax={80}
          tabIndex={0}
          onPointerDown={handlePointerDownResizer}
          onPointerMove={handlePointerMoveResizer}
          onPointerUp={handlePointerUpResizer}
          onKeyDown={handleResizerKeyDown}
          onDoubleClick={handleResizerDoubleClick}
          title="Drag to resize panels, double-click to reset (50/50)"
        >
          <div className="workspace-split-resizer-line" />
        </div>

        {/* Right Column: Output Panel */}
        <div
          className={`editor-panel ${mobileTab === 'input' ? 'mobile-panel-hidden' : ''}`}
          data-testid="beautifier-output-panel"
        >
          <div className="panel-header">
            <div className="panel-title-group">
              <span className="panel-title-text">
                Output ({modeTitle})
              </span>
              <span className="panel-stats">
                {outputLines} lines &bull; {outputChars} chars ({formatByteSize(outputBytes)})
              </span>
            </div>
            <div className="panel-actions">
              <ShareButton
                getPayload={() =>
                  createBeautifierSharePayload(output, currentLanguage, activeFileName)
                }
                disabled={!output}
              />
              <CopyButton text={output} label="Copy Output" />
              <DownloadButton
                content={output}
                fileName={activeFileName}
                mimeType={activeMime}
                disabled={!output}
              />
            </div>
          </div>
          <div className="panel-body">
            <CodeEditor
              value={output}
              readOnly
              language={currentLanguage}
              placeholder={`${modeTitle} output will appear here...`}
            />
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference Dialog */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        initialCategory="beautifiers"
      />
    </div>
  );
}

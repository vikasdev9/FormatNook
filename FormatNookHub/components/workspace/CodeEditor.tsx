'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatByteSize } from '@/lib/file-reader';
import { JsonColorPalette } from '@/features/json/types/palette.types';
import {
  computeVisibleLines,
  toggleLineFold,
  collapseAllLines,
  expandAllLines,
  foldLinesForLevel,
  tokenizeJsonLine,
  getTokenColor,
} from '@/features/json/services/json-folding-controller';
import { computeFoldingRanges } from '@/features/json/services/json-folding-service';

// Lazy load Monaco Editor for optional rich mode with offline resilience
const MonacoEditor = dynamic(
  () =>
    import('@monaco-editor/react').catch(() => {
      return () => <div className="editor-loading">Monaco unavailable (offline mode).</div>;
    }),
  {
    ssr: false,
    loading: () => <div className="editor-loading">Loading editor engine...</div>,
  }
);

// Accurate logical line count helper for any LF/CRLF/empty text
export function countLogicalLines(text: string): number {
  if (!text || text.length === 0) return 0;
  return text.split(/\r\n|\r|\n/).length;
}

export interface CodeEditorActions {
  foldAll: () => void;
  unfoldAll: () => void;
  foldLevel: (level: number) => void;
  fold: () => void;
  unfold: () => void;
}

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  placeholder?: string;
  useMonaco?: boolean;
  fontSize?: number;
  wordWrap?: boolean;
  footerLabel?: string;
  palette?: JsonColorPalette;
  paletteThemeId?: string;
  collapsedLines?: Set<number>;
  onCollapsedLinesChange?: (lines: Set<number>) => void;
  onEditorReady?: (actions: CodeEditorActions) => void;
}

function registerMonacoTheme(
  monaco: any,
  themeId: string,
  mode: 'light' | 'dark',
  palette: JsonColorPalette
): string {
  const themeName = `fn-${mode}-${themeId || 'custom'}`;
  const base = mode === 'dark' ? 'vs-dark' : 'vs';

  try {
    monaco.editor.defineTheme(themeName, {
      base,
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: palette.property.replace('#', '') },
        { token: 'string.value.json', foreground: palette.string.replace('#', '') },
        { token: 'number.json', foreground: palette.number.replace('#', '') },
        { token: 'keyword.json', foreground: palette.boolean.replace('#', '') },
        { token: 'delimiter.bracket.json', foreground: palette.punctuation.replace('#', '') },
        { token: 'delimiter.colon.json', foreground: palette.punctuation.replace('#', '') },
        { token: 'delimiter.comma.json', foreground: palette.punctuation.replace('#', '') },
      ],
      colors: {
        'editor.selectionBackground': palette.selection || (mode === 'dark' ? '#264f78' : '#add6ff'),
        'editorBracketMatch.border': palette.activeBracket || (mode === 'dark' ? '#38bdf8' : '#0369a1'),
        'editorBracketMatch.background': `${palette.activeBracket}33` || '#38bdf833',
      },
    });
    return themeName;
  } catch {
    return base;
  }
}

export function CodeEditor({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  placeholder = 'Paste or type code here...',
  useMonaco = false,
  fontSize = 13,
  wordWrap = true,
  footerLabel = 'Editor',
  palette,
  paletteThemeId = 'formatnook',
  collapsedLines,
  onCollapsedLinesChange,
  onEditorReady,
}: CodeEditorProps) {
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  // Local state for collapsed lines if not externally managed
  const [localCollapsedLines, setLocalCollapsedLines] = useState<Set<number>>(() => new Set());
  const activeCollapsedLines = collapsedLines !== undefined ? collapsedLines : localCollapsedLines;

  const setCollapsedLines = useCallback(
    (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
      if (typeof updater === 'function') {
        const next = updater(activeCollapsedLines);
        if (onCollapsedLinesChange) onCollapsedLinesChange(next);
        else setLocalCollapsedLines(next);
      } else {
        if (onCollapsedLinesChange) onCollapsedLinesChange(updater);
        else setLocalCollapsedLines(updater);
      }
    },
    [activeCollapsedLines, onCollapsedLinesChange]
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const structuredViewRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setCurrentTheme(isDark ? 'dark' : 'light');
    };
    updateTheme();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          updateTheme();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Compute folding ranges for JSON
  const ranges = useMemo(() => {
    if (language === 'json') {
      return computeFoldingRanges(value);
    }
    return [];
  }, [value, language]);

  const lines = useMemo(() => (value || '').split(/\r\n|\r|\n/), [value]);

  const visibleLines = useMemo(() => {
    return computeVisibleLines(lines, ranges, activeCollapsedLines);
  }, [lines, ranges, activeCollapsedLines]);

  const handleToggleFold = useCallback(
    (lineNo: number) => {
      const next = toggleLineFold(activeCollapsedLines, lineNo, ranges);
      setCollapsedLines(next);
    },
    [activeCollapsedLines, ranges, setCollapsedLines]
  );

  // Update Monaco theme dynamically whenever currentTheme or palette changes
  useEffect(() => {
    if (monacoRef.current && palette) {
      const activeThemeName = registerMonacoTheme(
        monacoRef.current,
        paletteThemeId,
        currentTheme,
        palette
      );
      monacoRef.current.editor.setTheme(activeThemeName);
    }
  }, [palette, paletteThemeId, currentTheme]);

  // Handle Monaco Mount with Bidirectional Folding State Synchronization
  const handleMonacoMount = useCallback(
    (editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      editor.onDidChangeCursorPosition((e: any) => {
        setCursor({
          line: e.position.lineNumber,
          col: e.position.column,
        });
      });

      if (palette) {
        const activeThemeName = registerMonacoTheme(
          monaco,
          paletteThemeId,
          currentTheme,
          palette
        );
        monaco.editor.setTheme(activeThemeName);
      }

      // Synchronize Monaco folding state with shared folding state
      try {
        const foldingController = editor.getContribution('editor.contrib.folding');
        foldingController?.getFoldingModel()?.then((foldingModel: any) => {
          if (!foldingModel) return;

          // Apply pre-existing collapsed lines to Monaco
          if (activeCollapsedLines.size > 0) {
            for (const lineNo of activeCollapsedLines) {
              const region = foldingModel.getRegionAtLine(lineNo);
              if (region && !region.isCollapsed) {
                foldingModel.toggleCollapseState([region]);
              }
            }
          }

          // Listen for folding changes made directly inside Monaco
          foldingModel.onDidChange(() => {
            const monacoCollapsed = new Set<number>();
            const regions = foldingModel.regions;
            if (regions) {
              for (let i = 0; i < regions.length; i++) {
                if (regions.isCollapsed(i)) {
                  monacoCollapsed.add(regions.getStartLineNumber(i));
                }
              }
            }
            setCollapsedLines(monacoCollapsed);
          });
        });
      } catch {
        // Fallback gracefully if internal contribution is unavailable
      }

      // Register native Monaco command for Ctrl/Cmd+Enter to trigger workspace formatting
      try {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent || '');
          const evt = new KeyboardEvent('keydown', {
            key: 'Enter',
            ctrlKey: !isMac,
            metaKey: isMac,
            bubbles: true,
          });
          window.dispatchEvent(evt);
        });
      } catch {
        // ignore
      }

      if (onEditorReady) {
        onEditorReady({
          foldAll: () => {
            editor.getAction('editor.foldAll')?.run();
          },
          unfoldAll: () => {
            editor.getAction('editor.unfoldAll')?.run();
          },
          foldLevel: (level: number) => {
            const safeLevel = Math.min(Math.max(level, 1), 7);
            editor.getAction(`editor.foldLevel${safeLevel}`)?.run();
          },
          fold: () => {
            editor.getAction('editor.fold')?.run();
          },
          unfold: () => {
            editor.getAction('editor.unfold')?.run();
          },
        });
      }
    },
    [palette, paletteThemeId, currentTheme, onEditorReady, activeCollapsedLines, setCollapsedLines]
  );

  // Expose onEditorReady in Standalone Mode
  useEffect(() => {
    if (!useMonaco && onEditorReady) {
      onEditorReady({
        foldAll: () => {
          const next = collapseAllLines(ranges);
          setCollapsedLines(next);
        },
        unfoldAll: () => {
          const next = expandAllLines();
          setCollapsedLines(next);
        },
        foldLevel: (level: number) => {
          const next = foldLinesForLevel(ranges, level);
          setCollapsedLines(next);
        },
        fold: () => {
          const lineNo = cursor.line;
          const target = ranges.find(
            (r) => r.startLine === lineNo || (r.startLine <= lineNo && lineNo <= r.endLine)
          );
          if (target) {
            const next = new Set(activeCollapsedLines);
            next.add(target.startLine);
            setCollapsedLines(next);
          }
        },
        unfold: () => {
          const lineNo = cursor.line;
          const target = ranges.find(
            (r) => r.startLine === lineNo || (r.startLine <= lineNo && lineNo <= r.endLine)
          );
          if (target) {
            const next = new Set(activeCollapsedLines);
            next.delete(target.startLine);
            setCollapsedLines(next);
          }
        },
      });
    }
  }, [useMonaco, ranges, onEditorReady, cursor.line, activeCollapsedLines, setCollapsedLines]);

  const totalLines = countLogicalLines(value);
  const totalChars = (value || '').length;
  const totalBytes = new Blob([value || '']).size;

  const updateCursor = (el: HTMLTextAreaElement) => {
    const selStart = el.selectionStart || 0;
    const before = el.value.slice(0, selStart);
    const lineList = before.split(/\r\n|\r|\n/);
    setCursor({
      line: Math.max(1, lineList.length),
      col: Math.max(1, (lineList[lineList.length - 1] || '').length + 1),
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const tabSpaces = '  ';

      const updated = value.substring(0, start) + tabSpaces + value.substring(end);
      onChange?.(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
        updateCursor(textarea);
      }, 0);
    }
  };

  // Allow editing visible lines in structured mode without corrupting collapsed lines
  const handleLineContentChange = (lineNo: number, newLineText: string) => {
    const lineIdx = lineNo - 1;
    if (lines[lineIdx] === newLineText) return;
    const nextLines = [...lines];
    nextLines[lineIdx] = newLineText;
    onChange?.(nextLines.join('\n'));
  };

  if (useMonaco) {
    return (
      <div className="custom-editor-with-footer">
        <div className="custom-editor-container">
          <MonacoEditor
            height="100%"
            language={language}
            value={value}
            onChange={(val) => onChange?.(val || '')}
            onMount={handleMonacoMount}
            loading={<div className="editor-loading">Loading editor engine...</div>}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: wordWrap ? 'on' : 'off',
              automaticLayout: true,
              folding: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
              foldingHighlight: true,
              unfoldOnClickAfterEndOfLine: true,
              matchBrackets: 'always',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
            }}
            theme={currentTheme === 'dark' ? 'vs-dark' : 'vs'}
          />
        </div>
        <div className="editor-status-bar" data-testid={`${footerLabel.toLowerCase()}-status-bar`}>
          <div className="status-bar-left">
            <span data-testid="status-cursor-line">Ln: {cursor.line}</span>
            <span className="status-sep">|</span>
            <span data-testid="status-cursor-col">Col: {cursor.col}</span>
            <span className="status-sep">|</span>
            <span data-testid="status-total-lines">Total Lines: {totalLines}</span>
          </div>
          <div className="status-bar-right">
            <span>{totalChars.toLocaleString()} chars</span>
            <span className="status-sep">|</span>
            <span>{formatByteSize(totalBytes)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Standalone Editor with Gutter Folding Buttons, Syntax Highlighting, and Collapsible Nodes
  const isFoldedViewActive = activeCollapsedLines.size > 0 || (readOnly && language === 'json');

  return (
    <div className="custom-editor-with-footer" data-testid="standalone-editor">
      <div className="custom-editor-container">
        {/* Gutter with Synchronized Line Numbers and Folding Chevrons */}
        <div
          ref={gutterRef}
          className="editor-line-gutter editor-line-gutter-with-folds"
          aria-hidden="true"
        >
          {visibleLines.map((vl) => (
            <div
              key={vl.originalLineNumber}
              className="gutter-row"
              data-line={vl.originalLineNumber}
            >
              <span className="gutter-line-number">{vl.originalLineNumber}</span>
              {vl.isFoldStart ? (
                <button
                  type="button"
                  className="standalone-fold-btn"
                  onClick={() => handleToggleFold(vl.originalLineNumber)}
                  aria-label={
                    vl.isCollapsed
                      ? `Expand line ${vl.originalLineNumber}`
                      : `Collapse line ${vl.originalLineNumber}`
                  }
                  title={
                    vl.isCollapsed
                      ? `Expand line ${vl.originalLineNumber}`
                      : `Collapse line ${vl.originalLineNumber}`
                  }
                  data-testid={`fold-toggle-line-${vl.originalLineNumber}`}
                  tabIndex={-1}
                >
                  {vl.isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
              ) : (
                <span style={{ width: 16, display: 'inline-block' }} />
              )}
            </div>
          ))}
        </div>

        {/* Editor Body */}
        {isFoldedViewActive ? (
          <div
            ref={structuredViewRef}
            className="standalone-structured-view"
            onScroll={handleScroll}
            data-testid="standalone-structured-view"
            style={{
              fontSize: `${fontSize}px`,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: wordWrap ? 'break-all' : 'normal',
              overflowWrap: wordWrap ? 'anywhere' : 'normal',
            }}
          >
            {visibleLines.map((vl) => {
              const tokens = vl.isCollapsed
                ? tokenizeJsonLine(vl.prefixText)
                : tokenizeJsonLine(vl.text);

              return (
                <div
                  key={vl.originalLineNumber}
                  className="standalone-line-row"
                  data-line-number={vl.originalLineNumber}
                >
                  <span
                    className="standalone-line-content"
                    contentEditable={!readOnly && !vl.isCollapsed}
                    suppressContentEditableWarning
                    spellCheck={false}
                    onBlur={(e) => {
                      if (!readOnly && !vl.isCollapsed) {
                        handleLineContentChange(
                          vl.originalLineNumber,
                          e.currentTarget.textContent || ''
                        );
                      }
                    }}
                  >
                    {tokens.map((tok, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          color: getTokenColor(tok.type, tok.text, palette),
                        }}
                      >
                        {tok.text}
                      </span>
                    ))}
                    {vl.isCollapsed && (
                      <>
                        <button
                          type="button"
                          className="standalone-fold-pill"
                          onClick={() => handleToggleFold(vl.originalLineNumber)}
                          title="Click to expand"
                          data-testid={`fold-pill-line-${vl.originalLineNumber}`}
                          style={{
                            color:
                              vl.range?.type === 'array' ? palette?.array : palette?.object,
                          }}
                        >
                          {vl.summaryText}
                        </button>
                        {vl.closingDelimiter}
                        {vl.trailingComma && (
                          <span style={{ color: palette?.punctuation }}>,</span>
                        )}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={value}
            onChange={(e) => {
              onChange?.(e.target.value);
              updateCursor(e.target);
            }}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onClick={(e) => updateCursor(e.currentTarget)}
            onKeyUp={(e) => updateCursor(e.currentTarget)}
            onSelect={(e) => updateCursor(e.currentTarget)}
            onFocus={(e) => updateCursor(e.currentTarget)}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck="false"
            autoCapitalize="none"
            autoComplete="off"
            aria-label="Code editor"
            style={{
              fontSize: `${fontSize}px`,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: wordWrap ? 'break-all' : 'normal',
              overflowWrap: wordWrap ? 'anywhere' : 'normal',
            }}
          />
        )}
      </div>

      <div className="editor-status-bar" data-testid={`${footerLabel.toLowerCase()}-status-bar`}>
        <div className="status-bar-left">
          <span data-testid="status-cursor-line">Ln: {cursor.line}</span>
          <span className="status-sep">|</span>
          <span data-testid="status-cursor-col">Col: {cursor.col}</span>
          <span className="status-sep">|</span>
          <span data-testid="status-total-lines">Total Lines: {totalLines}</span>
        </div>
        <div className="status-bar-right">
          <span>{totalChars.toLocaleString()} chars</span>
          <span className="status-sep">|</span>
          <span>{formatByteSize(totalBytes)}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { IndentOption, ValidationIssue } from '@/types/tool';
import { YamlViewMode, YamlTreeNode } from '../types/yaml.types';
import {
  formatYaml,
  validateYaml,
  minifyYaml,
  oneLineYaml,
  escapeYaml,
  unescapeYaml,
  splitYamlDocuments,
} from '../services/yaml-service';
import { parseYamlToTree, updateYamlValueAtPath } from '../services/yaml-parser-service';
import { CodeEditor, countLogicalLines } from '@/components/workspace/CodeEditor';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';

import { YamlToolbar } from './YamlToolbar';
import { YamlTreeView } from './YamlTreeView';
import { YamlStructuredView } from './YamlStructuredView';
import { YamlConverterModal } from './YamlConverterModal';
import { YamlInspectorModal } from './YamlInspectorModal';
import { YamlDiffModal } from './YamlDiffModal';
import { YamlShortcutsModal } from './YamlShortcutsModal';

interface YamlWorkspaceProps {
  initialMode?: 'format' | 'validate';
}

const DEFAULT_SAMPLE_YAML = `version: "3.9"
services:
  api:
    image: node:20-alpine
    container_name: formatnook-api
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
    ports:
      - "3000:3000"
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 512M`;

export function YamlWorkspace({ initialMode = 'format' }: YamlWorkspaceProps) {
  // Input / Output states
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE_YAML);
  const [output, setOutput] = useState<string>('');
  const [indent, setIndent] = useState<IndentOption>('2');
  const [quoteStyle, setQuoteStyle] = useState<'"' | "'" | 'auto'>('auto');
  const [lineWidth, setLineWidth] = useState<number>(-1);

  // View Mode & Active Action
  const [viewMode, setViewMode] = useState<YamlViewMode>('code');
  const [activeAction, setActiveAction] = useState<string>(initialMode);
  const [selectedDocIndex, setSelectedDocIndex] = useState<number | 'all'>('all');

  // Diagnostics & Status
  const [validationState, setValidationState] = useState<{
    isValid: boolean | null;
    issues: ValidationIssue[];
  }>({
    isValid: null,
    issues: [],
  });
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [statusType, setStatusType] = useState<'ready' | 'formatting' | 'success' | 'error'>('ready');

  // Editor Appearance Controls
  const [useMonaco, setUseMonaco] = useState<boolean>(false);
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(13);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [panelsRatio, setPanelsRatio] = useState<number>(50);
  const [mobileTab, setMobileTab] = useState<'both' | 'input' | 'output'>('both');

  // Modals
  const [isConverterOpen, setIsConverterOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isDiffOpen, setIsDiffOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Splitter Ref
  const gridRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Calculate parsed stream documents
  const docInfos = useMemo(() => {
    return splitYamlDocuments(input);
  }, [input]);

  const documentCount = docInfos.length;

  // Tree Nodes for Tree View
  const treeData = useMemo(() => {
    if (viewMode !== 'tree') return { rootNodes: [] as YamlTreeNode[], totalNodes: 0 };
    const textToParse = selectedDocIndex === 'all'
      ? (output && validationState.isValid ? output : input)
      : (docInfos[selectedDocIndex]?.raw || input);

    return parseYamlToTree(textToParse);
  }, [viewMode, input, output, validationState.isValid, selectedDocIndex, docInfos]);

  // Initial execution on mount
  useEffect(() => {
    if (initialMode === 'validate') {
      handleValidate();
    } else {
      handleFormat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primary Action: Beautify / Format
  const handleFormat = useCallback(
    (customInput?: string, customIndent?: IndentOption) => {
      setActiveAction('format');
      const text = customInput !== undefined ? customInput : input;
      const curIndent = customIndent || indent;

      if (!text || !text.trim()) {
        setOutput('');
        setValidationState({ isValid: null, issues: [] });
        setStatusMessage('Ready');
        setStatusType('ready');
        return;
      }

      setStatusMessage('Formatting...');
      setStatusType('formatting');

      // If viewing single document, format that document only
      if (selectedDocIndex !== 'all' && docInfos[selectedDocIndex]) {
        const docText = docInfos[selectedDocIndex].raw;
        const res = formatYaml(docText, curIndent, {
          quoteStyle,
          lineWidth,
        });
        setOutput(res.output);
        setValidationState({ isValid: res.isValid, issues: res.issues });
        setStatusMessage(res.isValid ? 'Document Formatted' : 'Syntax Error');
        setStatusType(res.isValid ? 'success' : 'error');
        return;
      }

      const result = formatYaml(text, curIndent, {
        quoteStyle,
        lineWidth,
      });

      setOutput(result.output);
      setValidationState({ isValid: result.isValid, issues: result.issues });
      setStatusMessage(result.isValid ? 'YAML Beautified' : 'Syntax Error');
      setStatusType(result.isValid ? 'success' : 'error');
    },
    [input, indent, quoteStyle, lineWidth, selectedDocIndex, docInfos]
  );

  // Primary Action: Minify
  const handleMinify = useCallback(() => {
    setActiveAction('minify');
    const targetText = selectedDocIndex !== 'all' && docInfos[selectedDocIndex]
      ? docInfos[selectedDocIndex].raw
      : input;

    const result = minifyYaml(targetText);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
    setStatusMessage(result.isValid ? 'YAML Minified' : 'Minify Failed');
    setStatusType(result.isValid ? 'success' : 'error');
  }, [input, selectedDocIndex, docInfos]);

  // Primary Action: Validate
  const handleValidate = useCallback(() => {
    setActiveAction('validate');
    const targetText = selectedDocIndex !== 'all' && docInfos[selectedDocIndex]
      ? docInfos[selectedDocIndex].raw
      : input;

    const result = validateYaml(targetText);
    setValidationState({ isValid: result.isValid, issues: result.issues });
    setStatusMessage(result.isValid ? 'Valid YAML' : 'Validation Issues Found');
    setStatusType(result.isValid ? 'success' : 'error');
    if (result.isValid && !output) {
      setOutput(targetText);
    }
  }, [input, output, selectedDocIndex, docInfos]);

  // Action: Collapse into One-Line
  const handleOneLine = useCallback(() => {
    const targetText = selectedDocIndex !== 'all' && docInfos[selectedDocIndex]
      ? docInfos[selectedDocIndex].raw
      : input;

    const oneLined = oneLineYaml(targetText);
    setOutput(oneLined);
    setStatusMessage('One-Line Converted');
    setStatusType('success');
  }, [input, selectedDocIndex, docInfos]);

  // Action: Escape string
  const handleEscape = useCallback(() => {
    const escaped = escapeYaml(input);
    setOutput(escaped);
    setStatusMessage('String Escaped');
    setStatusType('success');
  }, [input]);

  // Action: Unescape string
  const handleUnescape = useCallback(() => {
    const unescaped = unescapeYaml(input);
    setInput(unescaped);
    handleFormat(unescaped);
  }, [input, handleFormat]);

  // Reset workspace
  const handleReset = () => {
    setInput('');
    setOutput('');
    setSelectedDocIndex('all');
    setValidationState({ isValid: null, issues: [] });
    setStatusMessage('Ready');
    setStatusType('ready');
  };

  // File loaded via dropzone
  const handleFileLoaded = (content: string) => {
    setInput(content);
    setSelectedDocIndex('all');
    handleFormat(content, indent);
  };

  // Sample loaded from presets
  const handleSelectSample = (sampleData: string) => {
    setInput(sampleData);
    setSelectedDocIndex('all');
    handleFormat(sampleData, indent);
  };

  // Inline edit in Tree View
  const handleEditTreeValue = (path: string, newValue: any, docIdx: number) => {
    const updatedYaml = updateYamlValueAtPath(input, path, newValue, docIdx);
    setInput(updatedYaml);
    handleFormat(updatedYaml, indent);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter -> Format
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleFormat();
      }
      // Ctrl/Cmd + Shift + V -> Validate
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        handleValidate();
      }
      // Esc -> Close modals
      if (e.key === 'Escape') {
        setIsConverterOpen(false);
        setIsInspectorOpen(false);
        setIsDiffOpen(false);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat, handleValidate]);

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
    let newRatio = panelsRatio;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newRatio = Math.max(20, panelsRatio - (e.shiftKey ? 10 : 2));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newRatio = Math.min(80, panelsRatio + (e.shiftKey ? 10 : 2));
    } else if (e.key === 'Home' || e.key === 'Enter') {
      e.preventDefault();
      newRatio = 50;
    } else {
      return;
    }
    setPanelsRatio(newRatio);
  };

  const handleResetRatio = useCallback(() => {
    setPanelsRatio(50);
  }, []);

  const inputBytes = useMemo(() => new Blob([input]).size, [input]);
  const outputBytes = useMemo(() => new Blob([output]).size, [output]);
  const inputLines = useMemo(() => countLogicalLines(input), [input]);
  const outputLines = useMemo(() => countLogicalLines(output), [output]);

  return (
    <div
      className={`tool-workspace-container ${isFullScreen ? 'workspace-fullscreen' : ''}`}
      data-testid="yaml-workspace"
    >
      {/* Comprehensive Workspace Toolbar */}
      <YamlToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeAction={activeAction}
        onFormat={() => handleFormat()}
        onMinify={handleMinify}
        onValidate={handleValidate}
        onOneLine={handleOneLine}
        onOpenConverter={() => setIsConverterOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenDiff={() => setIsDiffOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onEscape={handleEscape}
        onUnescape={handleUnescape}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        indent={indent}
        onIndentChange={(newIndent) => {
          setIndent(newIndent);
          handleFormat(input, newIndent);
        }}
        quoteStyle={quoteStyle}
        onQuoteStyleChange={(style) => {
          setQuoteStyle(style);
          if (output) handleFormat();
        }}
        lineWidth={lineWidth}
        onLineWidthChange={(width) => {
          setLineWidth(width);
          if (output) handleFormat();
        }}
        onSelectSample={handleSelectSample}
        onFileLoaded={handleFileLoaded}
        onReset={handleReset}
        useMonaco={useMonaco}
        onToggleMonaco={() => setUseMonaco(!useMonaco)}
        wordWrap={wordWrap}
        onToggleWordWrap={() => setWordWrap(!wordWrap)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        documentCount={documentCount}
        selectedDocIndex={selectedDocIndex}
        onSelectDocIndex={(idx) => {
          setSelectedDocIndex(idx);
          if (idx === 'all') {
            handleFormat(input);
          } else if (docInfos[idx]) {
            handleFormat(docInfos[idx].raw);
          }
        }}
        statusMessage={statusMessage}
        statusType={statusType}
      />

      {/* Validation Result Diagnostic Banner */}
      <ValidationResult isValid={validationState.isValid} issues={validationState.issues} />

      {/* Main View Area */}
      {viewMode === 'code' && (
        <>
          <div className="workspace-mobile-tabs" role="tablist" aria-label="Editor view selection">
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'both'}
              className={`workspace-mobile-tab ${mobileTab === 'both' ? 'active' : ''}`}
              onClick={() => setMobileTab('both')}
            >
              Both Views
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'input'}
              className={`workspace-mobile-tab ${mobileTab === 'input' ? 'active' : ''}`}
              onClick={() => setMobileTab('input')}
            >
              Original Input
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'output'}
              className={`workspace-mobile-tab ${mobileTab === 'output' ? 'active' : ''}`}
              onClick={() => setMobileTab('output')}
            >
              Formatted Output
            </button>
          </div>

          <div
            ref={gridRef}
            className="editor-workspace-grid json-resizable-grid"
            data-testid="yaml-code-view"
            style={
              {
                '--panels-left': `${panelsRatio}fr`,
                '--panels-right': `${100 - panelsRatio}fr`,
              } as React.CSSProperties
            }
          >
            {/* Input Panel */}
            <div className={`editor-panel ${mobileTab === 'output' ? 'mobile-panel-hidden' : ''}`} data-testid="yaml-input-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <span>Original Input (Raw YAML)</span>
                  <span className="panel-stats">
                    {inputLines.toLocaleString()} {inputLines === 1 ? 'Line' : 'Lines'} &bull; {formatByteSize(inputBytes)}
                    {documentCount > 1 && ` &bull; ${documentCount} docs`}
                  </span>
                </div>
                <div className="panel-actions">
                  <CopyButton text={input} label="Copy" />
                </div>
              </div>
              <div className="panel-body">
                <CodeEditor
                  value={input}
                  onChange={setInput}
                  language="yaml"
                  placeholder="Paste YAML configuration or multi-document stream here..."
                  useMonaco={useMonaco}
                  fontSize={fontSize}
                  wordWrap={wordWrap}
                  footerLabel="YAML Input"
                />
              </div>
            </div>

            {/* Draggable Resizer Gutter */}
            <div
              className="splitter-gutter workspace-panels-resizer"
              role="separator"
              aria-orientation="vertical"
              aria-label="Panel size ratio divider"
              aria-valuenow={panelsRatio}
              aria-valuemin={20}
              aria-valuemax={80}
              tabIndex={0}
              onPointerDown={handlePointerDownResizer}
              onKeyDown={handleResizerKeyDown}
              onDoubleClick={handleResetRatio}
              title="Drag or use Left/Right arrows to resize panels • Double-click to reset (50/50)"
              data-testid="panel-resizer"
            />

            {/* Output Panel */}
            <div className={`editor-panel ${mobileTab === 'input' ? 'mobile-panel-hidden' : ''}`} data-testid="yaml-output-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <span>Standardized Output</span>
                  <span className="panel-stats">
                    {outputLines.toLocaleString()} {outputLines === 1 ? 'Line' : 'Lines'} &bull; {formatByteSize(outputBytes)}
                  </span>
                </div>
                <div className="panel-actions">
                  <CopyButton text={output} label="Copy Output" />
                  <DownloadButton
                    content={output}
                    fileName={selectedDocIndex === 'all' ? 'formatted.yaml' : `document-${(selectedDocIndex as number) + 1}.yaml`}
                    mimeType="text/yaml"
                  />
                </div>
              </div>
              <div className="panel-body">
                <CodeEditor
                  value={output}
                  readOnly
                  language="yaml"
                  placeholder="Formatted YAML will appear here..."
                  useMonaco={useMonaco}
                  fontSize={fontSize}
                  wordWrap={wordWrap}
                  footerLabel="Formatted YAML"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Visual Tree View */}
      {viewMode === 'tree' && (
        <div style={{ flex: 1, minHeight: '520px', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
          <YamlTreeView
            nodes={treeData.rootNodes}
            onEditValue={handleEditTreeValue}
          />
        </div>
      )}

      {/* Structured Multi-Document Grid */}
      {viewMode === 'structured' && (
        <div style={{ flex: 1, minHeight: '520px', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
          <YamlStructuredView yamlInput={output || input} />
        </div>
      )}

      {/* Modals */}
      <YamlConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        currentYaml={output || input}
        onApplyToWorkspace={(newContent) => {
          setInput(newContent);
          handleFormat(newContent);
        }}
      />

      <YamlInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        yamlInput={output || input}
        onLoadSample={handleSelectSample}
      />

      <YamlDiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        originalYaml={input}
        modifiedYaml={output}
      />

      <YamlShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

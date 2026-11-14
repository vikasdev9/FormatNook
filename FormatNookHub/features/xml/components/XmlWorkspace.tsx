'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { IndentOption, ValidationIssue } from '@/types/tool';
import { XmlViewMode } from '../types/xml.types';
import {
  formatXml,
  minifyXml,
  validateXml,
  oneLineXml,
  escapeXml,
  unescapeXml,
} from '../services/xml-service';
import { parseXmlToTree } from '../services/xml-parser-service';
import { CodeEditor, countLogicalLines } from '@/components/workspace/CodeEditor';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';

import { XmlToolbar } from './XmlToolbar';
import { XmlTreeView } from './XmlTreeView';
import { XmlStructuredView } from './XmlStructuredView';
import { XmlXPathModal } from './XmlXPathModal';
import { XmlConverterModal } from './XmlConverterModal';
import { XmlSpecializedModal } from './XmlSpecializedModal';
import { XmlDiffModal } from './XmlDiffModal';
import { XmlShortcutsModal } from './XmlShortcutsModal';

interface XmlWorkspaceProps {
  initialMode?: 'format' | 'validate';
}

const DEFAULT_SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <metadata>
    <name>FormatNook Hub</name>
    <version>1.0.0</version>
    <author>Staff Software Architect</author>
  </metadata>
  <tools>
    <tool id="xml-beautifier" category="xml">
      <description>Beautify and validate XML payloads client-side.</description>
      <enabled>true</enabled>
    </tool>
  </tools>
</project>`;

export function XmlWorkspace({ initialMode = 'format' }: XmlWorkspaceProps) {
  // Input / Output states
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE_XML);
  const [output, setOutput] = useState<string>('');
  const [indent, setIndent] = useState<IndentOption>('2');

  // View Mode & Action State
  const [viewMode, setViewMode] = useState<XmlViewMode>('code');
  const [activeAction, setActiveAction] = useState<string>(initialMode);

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
  const [isXPathOpen, setIsXPathOpen] = useState<boolean>(false);
  const [isConverterOpen, setIsConverterOpen] = useState<boolean>(false);
  const [isSpecializedOpen, setIsSpecializedOpen] = useState<boolean>(false);
  const [isDiffOpen, setIsDiffOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Splitter Ref
  const gridRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Parsed Tree representation for visual view
  const parsedTree = useMemo(() => {
    if (viewMode !== 'tree' && viewMode !== 'structured') return null;
    const textToParse = output && validationState.isValid ? output : input;
    const res = parseXmlToTree(textToParse);
    return res.tree;
  }, [viewMode, input, output, validationState.isValid]);

  // Initial execution on mount
  useEffect(() => {
    if (initialMode === 'validate') {
      handleValidate();
    } else {
      handleFormat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primary Action: Format / Beautify
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

      const result = formatXml(text, curIndent);
      setOutput(result.output);
      setValidationState({ isValid: result.isValid, issues: result.issues });
      setStatusMessage(result.isValid ? 'XML Beautified' : 'Malformed XML');
      setStatusType(result.isValid ? 'success' : 'error');
    },
    [input, indent]
  );

  // Primary Action: Minify
  const handleMinify = useCallback(() => {
    setActiveAction('minify');
    const result = minifyXml(input);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
    setStatusMessage(result.isValid ? 'XML Minified' : 'Minify Failed');
    setStatusType(result.isValid ? 'success' : 'error');
  }, [input]);

  // Primary Action: Validate
  const handleValidate = useCallback(() => {
    setActiveAction('validate');
    const result = validateXml(input);
    setValidationState({ isValid: result.isValid, issues: result.issues });
    setStatusMessage(result.isValid ? 'Valid XML' : 'Syntax Issues Found');
    setStatusType(result.isValid ? 'success' : 'error');
    if (result.isValid && !output) {
      setOutput(input);
    }
  }, [input, output]);

  // Action: Collapse into One-Line
  const handleOneLine = useCallback(() => {
    const oneLined = oneLineXml(input);
    setOutput(oneLined);
    setStatusMessage('One-Line Converted');
    setStatusType('success');
  }, [input]);

  // Action: Escape string
  const handleEscape = useCallback(() => {
    const escaped = escapeXml(input);
    setOutput(escaped);
    setStatusMessage('String Escaped');
    setStatusType('success');
  }, [input]);

  // Action: Unescape string
  const handleUnescape = useCallback(() => {
    const unescaped = unescapeXml(input);
    setInput(unescaped);
    handleFormat(unescaped);
  }, [input, handleFormat]);

  // Reset workspace
  const handleReset = () => {
    setInput('');
    setOutput('');
    setValidationState({ isValid: null, issues: [] });
    setStatusMessage('Ready');
    setStatusType('ready');
  };

  // File loaded via dropzone
  const handleFileLoaded = (content: string) => {
    setInput(content);
    handleFormat(content, indent);
  };

  // Sample loaded from presets
  const handleSelectSample = (sampleData: string) => {
    setInput(sampleData);
    handleFormat(sampleData, indent);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleFormat();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        handleValidate();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        handleMinify();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
        e.preventDefault();
        setIsXPathOpen(true);
      }
      if (e.key === 'Escape') {
        setIsXPathOpen(false);
        setIsConverterOpen(false);
        setIsSpecializedOpen(false);
        setIsDiffOpen(false);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat, handleValidate, handleMinify]);

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
      data-testid="xml-workspace"
    >
      {/* Comprehensive Workspace Toolbar */}
      <XmlToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeAction={activeAction}
        onFormat={() => handleFormat()}
        onMinify={handleMinify}
        onValidate={handleValidate}
        onOneLine={handleOneLine}
        onOpenXPath={() => setIsXPathOpen(true)}
        onOpenConverter={() => setIsConverterOpen(true)}
        onOpenSpecialized={() => setIsSpecializedOpen(true)}
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
        onSelectSample={handleSelectSample}
        onFileLoaded={handleFileLoaded}
        onReset={handleReset}
        useMonaco={useMonaco}
        onToggleMonaco={() => setUseMonaco(!useMonaco)}
        wordWrap={wordWrap}
        onToggleWordWrap={() => setWordWrap(!wordWrap)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
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
            data-testid="xml-code-view"
            style={
              {
                '--panels-left': `${panelsRatio}fr`,
                '--panels-right': `${100 - panelsRatio}fr`,
              } as React.CSSProperties
            }
          >
            {/* Input Panel */}
            <div className={`editor-panel ${mobileTab === 'output' ? 'mobile-panel-hidden' : ''}`} data-testid="xml-input-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <span>Original Input (Raw XML)</span>
                  <span className="panel-stats">
                    {inputLines.toLocaleString()} {inputLines === 1 ? 'Line' : 'Lines'} &bull; {formatByteSize(inputBytes)}
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
                  language="xml"
                  placeholder="Paste XML document here..."
                  useMonaco={useMonaco}
                  fontSize={fontSize}
                  wordWrap={wordWrap}
                  footerLabel="XML Input"
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
            <div className={`editor-panel ${mobileTab === 'input' ? 'mobile-panel-hidden' : ''}`} data-testid="xml-output-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <span>Formatted Output</span>
                <span className="panel-stats">
                  {outputLines.toLocaleString()} {outputLines === 1 ? 'Line' : 'Lines'} &bull; {formatByteSize(outputBytes)}
                </span>
              </div>
              <div className="panel-actions">
                <CopyButton text={output} label="Copy Output" />
                <DownloadButton
                  content={output}
                  fileName="formatted.xml"
                  mimeType="application/xml"
                />
              </div>
            </div>
            <div className="panel-body">
              <CodeEditor
                value={output}
                readOnly
                language="xml"
                placeholder="Formatted XML will appear here..."
                useMonaco={useMonaco}
                fontSize={fontSize}
                wordWrap={wordWrap}
                footerLabel="Formatted XML"
              />
            </div>
          </div>
        </div>
        </>
      )}

      {/* Visual Tree View */}
      {viewMode === 'tree' && (
        <div style={{ flex: 1, minHeight: '520px', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
          <XmlTreeView rootNode={parsedTree} />
        </div>
      )}

      {/* Structured Elements Grid */}
      {viewMode === 'structured' && (
        <div style={{ flex: 1, minHeight: '520px', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
          <XmlStructuredView rootNode={parsedTree} />
        </div>
      )}

      {/* Modals */}
      <XmlXPathModal
        isOpen={isXPathOpen}
        onClose={() => setIsXPathOpen(false)}
        xmlInput={output || input}
      />

      <XmlConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        currentXml={output || input}
        onApplyToWorkspace={(newContent) => {
          setInput(newContent);
          handleFormat(newContent);
        }}
      />

      <XmlSpecializedModal
        isOpen={isSpecializedOpen}
        onClose={() => setIsSpecializedOpen(false)}
        xmlInput={output || input}
        onLoadSample={handleSelectSample}
      />

      <XmlDiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        originalXml={input}
        modifiedXml={output}
      />

      <XmlShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

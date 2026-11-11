'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  Minimize2,
  CheckCircle2,
  Wrench,
  FileUp,
  AlertTriangle,
  Loader2,
  XCircle,
  Copy,
  Download,
} from 'lucide-react';
import { IndentOption, ValidationIssue } from '@/types/tool';
import {
  formatJson,
  minifyJson,
  validateJson,
  repairJson,
  getIndentString,
  stringifyJson,
  unstringifyJson,
  oneLineJson,
} from '../services/json-service';
import {
  validateJson5,
  formatJson5,
  json5ToStandardJson,
} from '../services/json5-service';
import { computeJsonStats } from '../services/json-stats-service';
import { jsonWorkerClient } from '../services/json-worker-client';
import {
  getPreferences,
  savePreferences,
  addRecentFile,
} from '../services/json-storage-service';
import { JsonViewMode } from '../types/json.types';
import { CodeEditor, countLogicalLines } from '@/components/workspace/CodeEditor';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';

import { JsonToolbar } from './JsonToolbar';
import { JsonTreeView } from './JsonTreeView';
import { JsonTableView } from './JsonTableView';
import { JsonPathPanel } from './JsonPathPanel';
import { JsonStatsModal } from './JsonStatsModal';
import { JsonTransformModal } from './JsonTransformModal';
import { JsonRepairModal } from './JsonRepairModal';
import { JsonShortcutsModal } from './JsonShortcutsModal';
import { JsonSchemaModal } from './JsonSchemaModal';
import { JsonRecentModal } from './JsonRecentModal';
import { JsonCodeGenModal } from './JsonCodeGenModal';
import { JsonDiffModal } from './JsonDiffModal';

interface JsonWorkspaceProps {
  initialMode?: 'format' | 'validate' | 'minify';
}

const DEFAULT_SAMPLE_JSON = `{
  "app": "FormatNook",
  "version": "1.0.0",
  "developer": {
    "name": "Alex Mercer",
    "role": "Full-Stack Engineer",
    "skills": ["TypeScript", "Next.js", "Systems Architecture"]
  },
  "settings": {
    "theme": "dark",
    "clientSideProcessing": true,
    "maxPayloadMb": 25
  }
}`;

const LARGE_FILE_THRESHOLD_BYTES = 2.5 * 1024 * 1024; // 2.5 MB

export function JsonWorkspace({ initialMode = 'format' }: JsonWorkspaceProps) {
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE_JSON);
  const [output, setOutput] = useState<string>('');
  const [viewMode, setViewMode] = useState<JsonViewMode>('code');
  const [indent, setIndent] = useState<IndentOption>('2');
  const [activeAction, setActiveAction] = useState<string>(initialMode);
  const [validationState, setValidationState] = useState<{ isValid: boolean | null; issues: ValidationIssue[] }>({
    isValid: null,
    issues: [],
  });

  // Editor preferences & layout
  const [useMonaco, setUseMonaco] = useState<boolean>(false);
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(13);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [panelsRatio, setPanelsRatio] = useState<number>(50); // percentage for input panel
  const [mobileTab, setMobileTab] = useState<'both' | 'input' | 'output'>('both');
  const [autoFormat, setAutoFormat] = useState<boolean>(true);
  const [isOutdated, setIsOutdated] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [statusType, setStatusType] = useState<'ready' | 'formatting' | 'success' | 'error' | 'outdated'>('ready');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Panels & Modals
  const [isJsonPathOpen, setIsJsonPathOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isTransformOpen, setIsTransformOpen] = useState<boolean>(false);
  const [isRepairOpen, setIsRepairOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState<boolean>(false);
  const [isRecentOpen, setIsRecentOpen] = useState<boolean>(false);
  const [isCodeGenOpen, setIsCodeGenOpen] = useState<boolean>(false);
  const [isDiffOpen, setIsDiffOpen] = useState<boolean>(false);
  const [isJson5Mode, setIsJson5Mode] = useState<boolean>(false);

  // Worker & Progress State
  const [isWorkerRunning, setIsWorkerRunning] = useState<boolean>(false);
  const [workerProgressMsg, setWorkerProgressMsg] = useState<string>('');

  const gridRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  const inputBytes = useMemo(() => new Blob([input]).size, [input]);
  const outputBytes = useMemo(() => new Blob([output]).size, [output]);
  const inputLines = useMemo(() => countLogicalLines(input), [input]);
  const outputLines = useMemo(() => countLogicalLines(output), [output]);
  const isLargeFile = inputBytes > LARGE_FILE_THRESHOLD_BYTES;

  // Parsed representation (safe memoized)
  const parsedData = useMemo(() => {
    const textToParse = output && validationState.isValid ? output : input;
    if (!textToParse || !textToParse.trim()) return null;
    try {
      return JSON.parse(textToParse);
    } catch {
      return null;
    }
  }, [input, output, validationState.isValid]);

  // Compute metrics for stats modal
  const stats = useMemo(() => {
    if (!isStatsOpen) return null;
    return computeJsonStats(output || input, parsedData);
  }, [isStatsOpen, output, input, parsedData]);

  // Load saved preferences on mount
  useEffect(() => {
    const prefs = getPreferences();
    if (prefs.fontSize) setFontSize(prefs.fontSize);
    if (prefs.indent) setIndent(prefs.indent as IndentOption);
    if (prefs.wordWrap !== undefined) setWordWrap(prefs.wordWrap);
    if (prefs.panelsRatio) setPanelsRatio(prefs.panelsRatio);
    if (prefs.autoFormat !== undefined) setAutoFormat(prefs.autoFormat);
  }, []);

  // Handle format with Web Worker for large files
  const handleFormat = useCallback(
    async (overrideInput?: string, overrideIndent?: IndentOption, isManual = true) => {
      setActiveAction('format');
      const text = overrideInput !== undefined ? overrideInput : input;
      const curIndent = overrideIndent || indent;

      if (!text || !text.trim()) {
        setOutput('');
        setValidationState({ isValid: null, issues: [] });
        setIsOutdated(false);
        setStatusMessage('Ready');
        setStatusType('ready');
        return;
      }

      const size = new Blob([text]).size;
      setStatusType('formatting');
      setStatusMessage('Formatting...');

      if (isJson5Mode) {
        const val5 = validateJson5(text);
        if (!val5.isValid) {
          setValidationState({
            isValid: false,
            issues: [
              {
                line: val5.line,
                column: val5.column,
                message: val5.error || 'Invalid JSON5 syntax',
                severity: 'error',
              },
            ],
          });
          setIsOutdated(true);
          setStatusMessage('Invalid JSON5');
          setStatusType('error');
          return;
        }

        const formatted5 = formatJson5(text, curIndent);
        setOutput(formatted5);
        setValidationState({ isValid: true, issues: [] });
        setIsOutdated(false);
        setStatusMessage(isManual ? 'JSON5 Formatted' : 'Valid JSON5');
        setStatusType('success');
        return;
      }

      if (size > LARGE_FILE_THRESHOLD_BYTES) {
        setIsWorkerRunning(true);
        setWorkerProgressMsg(`Formatting large JSON (${formatByteSize(size)}) in background worker...`);
        try {
          const res = await jsonWorkerClient.format(text, curIndent);
          if (res.success && res.data !== undefined) {
            setOutput(res.data);
            setValidationState({ isValid: true, issues: [] });
            setIsOutdated(false);
            setStatusMessage('Formatting successful');
            setStatusType('success');
          } else {
            setValidationState({
              isValid: false,
              issues: [{ message: res.error || 'Formatting failed', severity: 'error' }],
            });
            setIsOutdated(true);
            setStatusMessage('Formatting failed');
            setStatusType('error');
          }
        } catch (err: any) {
          setValidationState({
            isValid: false,
            issues: [{ message: err?.message || 'Formatting failed in background worker', severity: 'error' }],
          });
          setIsOutdated(true);
          setStatusMessage('Formatting failed');
          setStatusType('error');
        } finally {
          setIsWorkerRunning(false);
          setWorkerProgressMsg('');
        }
      } else {
        const val = validateJson(text);
        if (!val.isValid) {
          setValidationState({ isValid: false, issues: val.issues });
          setIsOutdated(true);
          setStatusMessage('Invalid JSON - syntax error detected');
          setStatusType('error');
          return;
        }

        const result = formatJson(text, curIndent);
        setOutput(result.output);
        setValidationState({ isValid: true, issues: [] });
        setIsOutdated(false);
        setStatusMessage(isManual ? 'Formatting successful' : 'Valid JSON');
        setStatusType('success');
      }
    },
    [input, indent]
  );

  // Automatic Formatting on Input Change with Debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!input.trim()) {
      setOutput('');
      setValidationState({ isValid: null, issues: [] });
      setIsOutdated(false);
      setStatusMessage('Ready');
      setStatusType('ready');
      return;
    }

    if (!autoFormat) {
      const val = validateJson(input);
      setValidationState({ isValid: val.isValid, issues: val.issues });
      setIsOutdated(true);
      setStatusMessage(val.isValid ? 'Valid JSON (Click Beautify to format)' : 'Invalid JSON');
      setStatusType(val.isValid ? 'ready' : 'error');
      return;
    }

    // Mark output as outdated while typing until debounce completes
    setIsOutdated(true);
    setStatusMessage('Formatting...');
    setStatusType('formatting');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const size = new Blob([input]).size;
    if (size > LARGE_FILE_THRESHOLD_BYTES) {
      setStatusMessage('Large file detected - click Beautify to format');
      setStatusType('ready');
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      handleFormat(input, indent, false);
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input, autoFormat, indent, handleFormat]);

  // Toggle Auto Format handler
  const handleToggleAutoFormat = useCallback(() => {
    setAutoFormat((prev) => {
      const next = !prev;
      savePreferences({ autoFormat: next });
      if (next && input) {
        handleFormat(input, indent, false);
      }
      return next;
    });
  }, [input, indent, handleFormat]);

  // Handle minify with Web Worker for large files
  const handleMinify = useCallback(async () => {
    setActiveAction('minify');
    const size = new Blob([input]).size;

    if (size > LARGE_FILE_THRESHOLD_BYTES) {
      setIsWorkerRunning(true);
      setWorkerProgressMsg(`Minifying large JSON (${formatByteSize(size)}) in background worker...`);
      try {
        const res = await jsonWorkerClient.minify(input);
        if (res.success && res.data !== undefined) {
          setOutput(res.data);
          setValidationState({ isValid: true, issues: [] });
          setIsOutdated(false);
          setStatusMessage('Minification successful');
          setStatusType('success');
        } else {
          setValidationState({
            isValid: false,
            issues: [{ message: res.error || 'Minification failed', severity: 'error' }],
          });
          setIsOutdated(true);
          setStatusMessage('Minification failed');
          setStatusType('error');
        }
      } catch (err: any) {
        setValidationState({
          isValid: false,
          issues: [{ message: err?.message || 'Minification failed in background worker', severity: 'error' }],
        });
        setIsOutdated(true);
        setStatusMessage('Minification failed');
        setStatusType('error');
      } finally {
        setIsWorkerRunning(false);
        setWorkerProgressMsg('');
      }
    } else {
      const val = validateJson(input);
      if (!val.isValid) {
        setValidationState({ isValid: false, issues: val.issues });
        setIsOutdated(true);
        setStatusMessage('Invalid JSON - syntax error detected');
        setStatusType('error');
        return;
      }

      const result = minifyJson(input);
      setOutput(result.output);
      setValidationState({ isValid: true, issues: [] });
      setIsOutdated(false);
      setStatusMessage('Minification successful');
      setStatusType('success');
    }
  }, [input]);

  // Handle validate
  const handleValidate = useCallback(() => {
    setActiveAction('validate');
    if (isJson5Mode) {
      const val5 = validateJson5(input);
      if (!val5.isValid) {
        setValidationState({
          isValid: false,
          issues: [
            {
              line: val5.line,
              column: val5.column,
              message: val5.error || 'Invalid JSON5 syntax',
              severity: 'error',
            },
          ],
        });
        setIsOutdated(true);
        setStatusMessage('Invalid JSON5');
        setStatusType('error');
      } else {
        setOutput(input);
        setValidationState({ isValid: true, issues: [] });
        setIsOutdated(false);
        setStatusMessage('Valid JSON5');
        setStatusType('success');
      }
      return;
    }

    const result = validateJson(input);
    setValidationState({ isValid: result.isValid, issues: result.issues });
    if (result.isValid) {
      setOutput(input);
      setIsOutdated(false);
      setStatusMessage('Valid JSON');
      setStatusType('success');
    } else {
      setIsOutdated(true);
      setStatusMessage('Invalid JSON - syntax error detected');
      setStatusType('error');
    }
  }, [input, isJson5Mode]);

  // Convert JSON5 to standard JSON
  const handleConvertJson5ToStandard = useCallback(() => {
    try {
      const std = json5ToStandardJson(input, indent);
      setInput(std);
      setOutput(std);
      setIsJson5Mode(false);
      setValidationState({ isValid: true, issues: [] });
      setStatusMessage('Converted JSON5 to Standard JSON');
      setStatusType('success');
    } catch (err: any) {
      setStatusMessage(`Conversion failed: ${err?.message || 'Invalid JSON5'}`);
      setStatusType('error');
    }
  }, [input, indent]);

  // Sort Keys (A-Z)
  const handleSortKeys = useCallback(() => {
    setActiveAction('sort-keys');
    const res = formatJson(input, indent, { sortKeys: true });
    if (res.isValid) {
      setOutput(res.output);
      setValidationState({ isValid: true, issues: [] });
      setIsOutdated(false);
      setStatusMessage('Keys sorted alphabetically (A-Z)');
      setStatusType('success');
    } else {
      setValidationState({ isValid: false, issues: res.issues });
      setStatusMessage('Failed to sort keys: syntax error');
      setStatusType('error');
    }
  }, [input, indent]);

  // One-Line JSON
  const handleOneLine = useCallback(() => {
    setActiveAction('one-line');
    const compact = oneLineJson(input);
    setOutput(compact);
    setIsOutdated(false);
    setStatusMessage('Converted to one-line JSON');
    setStatusType('success');
  }, [input]);

  // Stringify JSON
  const handleStringify = useCallback(() => {
    setActiveAction('stringify');
    const str = stringifyJson(output || input);
    setOutput(str);
    setIsOutdated(false);
    setStatusMessage('JSON escaped as string literal');
    setStatusType('success');
  }, [input, output]);

  // Unstringify JSON
  const handleUnstringify = useCallback(() => {
    setActiveAction('unstringify');
    const unstr = unstringifyJson(input);
    setInput(unstr);
    setOutput(unstr);
    setIsOutdated(false);
    setStatusMessage('Unescaped string literal to JSON');
    setStatusType('success');
  }, [input]);

  // In-place Tree Node Value Editing
  const handleTreeEditValue = useCallback(
    (path: string, newValue: any) => {
      if (!parsedData) return;
      const updated = JSON.parse(JSON.stringify(parsedData));
      const cleanPath = path.startsWith('$.') ? path.slice(2) : path.startsWith('$') ? path.slice(1) : path;
      if (!cleanPath) {
        const newStr = JSON.stringify(newValue, null, getIndentString(indent));
        setInput(newStr);
        handleFormat(newStr);
        return;
      }

      const tokens: (string | number)[] = [];
      const regex = /(?:^|\.)([a-zA-Z0-9_$]+)|\[(\d+)\]/g;
      let match;
      while ((match = regex.exec(cleanPath)) !== null) {
        if (match[1] !== undefined) tokens.push(match[1]);
        else if (match[2] !== undefined) tokens.push(parseInt(match[2], 10));
      }

      let cur = updated;
      for (let i = 0; i < tokens.length - 1; i++) {
        const t = tokens[i];
        if (cur[t] === undefined) return;
        cur = cur[t];
      }
      if (tokens.length > 0) {
        cur[tokens[tokens.length - 1]] = newValue;
      }

      const newText = JSON.stringify(updated, null, getIndentString(indent));
      setInput(newText);
      handleFormat(newText);
    },
    [parsedData, indent, handleFormat]
  );

  // Auto Repair direct action
  const handleApplyRepair = useCallback(
    (repairedText: string) => {
      setInput(repairedText);
      handleFormat(repairedText, indent, true);
    },
    [handleFormat, indent]
  );

  // Transform apply
  const handleApplyTransform = useCallback(
    (transformedText: string) => {
      setInput(transformedText);
      setOutput(transformedText);
      setIsOutdated(false);
      const val = validateJson(transformedText);
      setValidationState({ isValid: val.isValid, issues: val.issues });
      setStatusMessage(val.isValid ? 'Transform applied' : 'Invalid JSON result');
      setStatusType(val.isValid ? 'success' : 'error');
    },
    []
  );

  // Reset workspace
  const handleReset = useCallback(() => {
    setInput('');
    setOutput('');
    setValidationState({ isValid: null, issues: [] });
    setIsOutdated(false);
    setStatusMessage('Ready');
    setStatusType('ready');
  }, []);

  // File loaded via dropzone or picker
  const handleFileLoaded = useCallback(
    (content: string, fileName?: string) => {
      setInput(content);
      handleFormat(content);
      addRecentFile(fileName || 'loaded_file.json', content);
    },
    [handleFormat]
  );

  // Sample selected
  const handleSelectSample = useCallback(
    (sampleData: string) => {
      setInput(sampleData);
      handleFormat(sampleData);
    },
    [handleFormat]
  );

  // Cancel background worker
  const handleCancelWorker = () => {
    jsonWorkerClient.terminate();
    setIsWorkerRunning(false);
    setWorkerProgressMsg('');
  };

  // Resizable Panels Pointer Handlers (supports Mouse, Touchscreen, Stylus)
  const handlePointerDownResizer = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary pointer button (left click or touch tap)
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    isDraggingRef.current = true;
    let currentRatio = panelsRatio;

    const targetElement = e.currentTarget;
    const pointerId = e.pointerId;
    if (targetElement.setPointerCapture) {
      try {
        targetElement.setPointerCapture(pointerId);
      } catch {
        // Fallback for environments where setPointerCapture is unsupported
      }
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const newRatio = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      if (newRatio >= 20 && newRatio <= 80) {
        currentRatio = Math.round(newRatio);
        gridRef.current.style.setProperty('--panels-left', `${currentRatio}fr`);
        gridRef.current.style.setProperty('--panels-right', `${100 - currentRatio}fr`);
        setPanelsRatio(currentRatio);
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
      savePreferences({ panelsRatio: currentRatio });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUpOrCancel);
    window.addEventListener('pointercancel', handlePointerUpOrCancel);
  };

  // Keyboard accessibility for resizer
  const handleResizerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let newRatio = panelsRatio;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newRatio = Math.max(20, panelsRatio - (e.shiftKey ? 10 : 2));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newRatio = Math.min(80, panelsRatio + (e.shiftKey ? 10 : 2));
    } else if (e.key === 'Home') {
      e.preventDefault();
      newRatio = 50;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      newRatio = 50;
    } else {
      return;
    }

    setPanelsRatio(newRatio);
    if (gridRef.current) {
      gridRef.current.style.setProperty('--panels-left', `${newRatio}fr`);
      gridRef.current.style.setProperty('--panels-right', `${100 - newRatio}fr`);
    }
    savePreferences({ panelsRatio: newRatio });
  };

  // Reset panels ratio to 50/50
  const handleResetRatio = useCallback(() => {
    setPanelsRatio(50);
    if (gridRef.current) {
      gridRef.current.style.setProperty('--panels-left', '50fr');
      gridRef.current.style.setProperty('--panels-right', '50fr');
    }
    savePreferences({ panelsRatio: 50 });
  }, []);

  // Safe Web Worker lifecycle management: acquire on mount, release on unmount
  useEffect(() => {
    const releaseWorker = jsonWorkerClient.acquire();
    return () => {
      releaseWorker();
    };
  }, []);

  // Auto-format or initialize on mount
  useEffect(() => {
    if (initialMode === 'minify') {
      handleMinify();
    } else if (initialMode === 'validate') {
      handleValidate();
    } else {
      handleFormat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleFormat();
      } else if (isCmdOrCtrl && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        handleMinify();
      } else if (isCmdOrCtrl && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        handleValidate();
      } else if (isCmdOrCtrl && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        setIsRepairOpen(true);
      } else if (e.key === 'Escape') {
        setIsStatsOpen(false);
        setIsTransformOpen(false);
        setIsRepairOpen(false);
        setIsShortcutsOpen(false);
        setIsSchemaOpen(false);
        setIsRecentOpen(false);
        if (isFullScreen) setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat, handleMinify, handleValidate, isFullScreen]);

  return (
    <div
      className={`tool-workspace-container json-workspace-root ${isFullScreen ? 'json-fullscreen-mode' : ''}`}
      data-testid="json-workspace"
    >
      {/* Top Main & Secondary Toolbars */}
      <JsonToolbar
        viewMode={viewMode}
        onViewModeChange={(m) => {
          setViewMode(m);
          savePreferences({ viewMode: m });
        }}
        activeAction={activeAction}
        onFormat={() => handleFormat()}
        onMinify={handleMinify}
        onValidate={handleValidate}
        onOpenRepair={() => setIsRepairOpen(true)}
        onOpenTransform={() => setIsTransformOpen(true)}
        onToggleJsonPath={() => setIsJsonPathOpen(!isJsonPathOpen)}
        isJsonPathOpen={isJsonPathOpen}
        onOpenSchema={() => setIsSchemaOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenRecent={() => setIsRecentOpen(true)}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        indent={indent}
        onIndentChange={(newIndent) => {
          setIndent(newIndent);
          savePreferences({ indent: newIndent });
          if (output) handleFormat(input, newIndent);
        }}
        onSelectSample={handleSelectSample}
        onFileLoaded={handleFileLoaded}
        onReset={handleReset}
        useMonaco={useMonaco}
        onToggleMonaco={() => setUseMonaco(!useMonaco)}
        wordWrap={wordWrap}
        onToggleWordWrap={() => {
          const next = !wordWrap;
          setWordWrap(next);
          savePreferences({ wordWrap: next });
        }}
        fontSize={fontSize}
        onFontSizeChange={(size) => {
          setFontSize(size);
          savePreferences({ fontSize: size });
        }}
        panelsRatio={panelsRatio}
        onResetPanelsRatio={handleResetRatio}
        autoFormat={autoFormat}
        onToggleAutoFormat={handleToggleAutoFormat}
        statusMessage={statusMessage}
        statusType={statusType}
        isJson5Mode={isJson5Mode}
        onToggleJson5Mode={() => {
          const next = !isJson5Mode;
          setIsJson5Mode(next);
          setStatusMessage(next ? 'JSON5 mode active' : 'Standard JSON mode active');
          setStatusType('ready');
        }}
        onOpenCodeGen={() => setIsCodeGenOpen(true)}
        onOpenDiff={() => setIsDiffOpen(true)}
        onSortKeys={handleSortKeys}
        onOneLine={handleOneLine}
        onStringify={handleStringify}
        onUnstringify={handleUnstringify}
      />

      {/* JSON5 Active Mode Notification Banner */}
      {isJson5Mode && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 16px', background: 'rgba(234, 179, 8, 0.12)', borderBottom: '1px solid rgba(234, 179, 8, 0.3)', color: 'var(--color-text-primary)', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} style={{ color: '#eab308' }} />
            <span><strong>JSON5 Mode Active:</strong> Parsing with support for comments, unquoted keys, trailing commas, and hex numbers.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={handleConvertJson5ToStandard}
              title="Convert JSON5 input to standard strict JSON"
            >
              Convert to Standard JSON
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => setIsJson5Mode(false)}
            >
              Exit JSON5 Mode
            </button>
          </div>
        </div>
      )}

      {/* Large File & Worker Processing Indicator */}
      {isLargeFile && (
        <div className="json-large-file-banner" data-testid="large-file-banner">
          <div className="banner-info">
            <AlertTriangle size={16} className="text-warning" />
            <span>
              Large file detected ({formatByteSize(inputBytes)}). Operating in background Web Worker mode to keep the browser fast and responsive.
            </span>
          </div>
          {isWorkerRunning && (
            <div className="banner-worker-status">
              <Loader2 size={14} className="spinner" />
              <span>{workerProgressMsg}</span>
              <button className="btn btn-secondary btn-xs" onClick={handleCancelWorker}>
                <XCircle size={12} />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* JSONPath Evaluator Drawer */}
      {isJsonPathOpen && (
        <JsonPathPanel
          data={parsedData}
          onExtractMatch={(extractedJson) => {
            setInput(extractedJson);
            handleFormat(extractedJson);
          }}
        />
      )}

      {/* Validation Status Banner */}
      <ValidationResult
        isValid={validationState.isValid}
        issues={validationState.issues}
        onOpenRepair={() => setIsRepairOpen(true)}
        isOutdated={isOutdated}
      />

      {/* Main View Area */}
      {viewMode === 'code' && (
        <>
          {/* Mobile Panel Switcher (Visible on small screens only) */}
          <div className="json-mobile-tabs" role="tablist" aria-label="Mobile Panel Selector">
            <button
              type="button"
              className={`json-mobile-tab ${mobileTab === 'both' ? 'active' : ''}`}
              onClick={() => setMobileTab('both')}
              data-testid="mobile-tab-both"
            >
              Both Editors
            </button>
            <button
              type="button"
              className={`json-mobile-tab ${mobileTab === 'input' ? 'active' : ''}`}
              onClick={() => setMobileTab('input')}
              data-testid="mobile-tab-input"
            >
              Original Input
            </button>
            <button
              type="button"
              className={`json-mobile-tab ${mobileTab === 'output' ? 'active' : ''}`}
              onClick={() => setMobileTab('output')}
              data-testid="mobile-tab-output"
            >
              Processed Output
            </button>
          </div>

          <div
            ref={gridRef}
            className="editor-workspace-grid json-resizable-grid"
            data-testid="json-code-view"
            style={
              {
                '--panels-left': `${panelsRatio}fr`,
                '--panels-right': `${100 - panelsRatio}fr`,
              } as React.CSSProperties
            }
          >
            {/* Input Panel */}
            <div
              className={`editor-panel ${mobileTab === 'output' ? 'mobile-panel-hidden' : ''}`}
              data-testid="json-input-panel"
            >
              <div className="panel-header">
                <div className="panel-title-group">
                  <span>Original Input (Raw JSON)</span>
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
                  language="json"
                  placeholder="Paste raw or unformatted JSON here..."
                  useMonaco={useMonaco}
                  fontSize={fontSize}
                  wordWrap={wordWrap}
                  footerLabel="Input"
                />
              </div>
            </div>

            {/* Draggable Resizer Gutter with Pointer Events and Keyboard Accessibility */}
            <div
              className="workspace-split-resizer"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize input and output panels"
              aria-valuenow={panelsRatio}
              aria-valuemin={20}
              aria-valuemax={80}
              tabIndex={0}
              onPointerDown={handlePointerDownResizer}
              onKeyDown={handleResizerKeyDown}
              onDoubleClick={handleResetRatio}
              title="Drag or use Left/Right arrows to resize panels • Double-click to reset (50/50)"
              data-testid="workspace-panels-resizer"
            >
              <div className="workspace-split-resizer-line" />
            </div>

            {/* Output Panel */}
            <div
              className={`editor-panel ${mobileTab === 'input' ? 'mobile-panel-hidden' : ''}`}
              data-testid="json-output-panel"
            >
              <div className="panel-header">
                <div className="panel-title-group">
                  <span>Processed Output</span>
                  <span className="panel-stats">
                    {outputLines.toLocaleString()} {outputLines === 1 ? 'Line' : 'Lines'} &bull; {formatByteSize(outputBytes)}
                  </span>
                  {isOutdated && (
                    <span className="badge badge-warning" data-testid="output-outdated-badge">
                      Outdated
                    </span>
                  )}
                </div>
                <div className="panel-actions">
                  <CopyButton text={output} label="Copy Output" />
                  <DownloadButton
                    content={output}
                    fileName="formatted.json"
                    mimeType="application/json"
                  />
                </div>
              </div>
              <div className="panel-body">
                <CodeEditor
                  value={output}
                  readOnly
                  language="json"
                  placeholder="Formatted JSON output will appear here..."
                  useMonaco={useMonaco}
                  fontSize={fontSize}
                  wordWrap={wordWrap}
                  footerLabel="Output"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tree View */}
      {viewMode === 'tree' && (
        <div className="json-structured-view-container" data-testid="json-tree-container">
          {parsedData !== null ? (
            <JsonTreeView data={parsedData} onEditValue={handleTreeEditValue} />
          ) : (
            <div className="json-empty-structured-state">
              <AlertTriangle size={28} className="text-warning" />
              <h3>Valid JSON Required for Tree View</h3>
              <p>The input currently contains syntax errors. Please click Beautify or Auto Repair to inspect in Tree View.</p>
              <button className="btn btn-primary btn-sm" onClick={() => handleFormat()}>
                <Sparkles size={14} />
                <span>Format & Parse</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="json-structured-view-container" data-testid="json-table-container">
          {parsedData !== null ? (
            <JsonTableView data={parsedData} />
          ) : (
            <div className="json-empty-structured-state">
              <AlertTriangle size={28} className="text-warning" />
              <h3>Valid JSON Required for Table View</h3>
              <p>Table View displays tabular arrays or objects. Please format or repair your JSON first.</p>
              <button className="btn btn-primary btn-sm" onClick={() => handleFormat()}>
                <Sparkles size={14} />
                <span>Format & Parse</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <JsonStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />

      <JsonTransformModal
        isOpen={isTransformOpen}
        onClose={() => setIsTransformOpen(false)}
        jsonContent={output || input}
        onApplyTransform={handleApplyTransform}
      />

      <JsonRepairModal
        isOpen={isRepairOpen}
        onClose={() => setIsRepairOpen(false)}
        originalText={input}
        onApplyRepair={handleApplyRepair}
      />

      <JsonShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <JsonSchemaModal
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
        jsonContent={output || input}
      />

      <JsonRecentModal
        isOpen={isRecentOpen}
        onClose={() => setIsRecentOpen(false)}
        currentContent={output || input}
        onLoadContent={(c, name) => {
          setInput(c);
          handleFormat(c);
          if (name) addRecentFile(name, c);
        }}
      />

      <JsonCodeGenModal
        isOpen={isCodeGenOpen}
        onClose={() => setIsCodeGenOpen(false)}
        jsonContent={output || input}
      />

      <JsonDiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        originalJson={input}
        modifiedJson={output}
      />
    </div>
  );
}

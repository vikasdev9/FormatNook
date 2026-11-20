'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GitCompare,
  ArrowRightLeft,
  Copy,
  Download,
  Check,
  Play,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileCode,
} from 'lucide-react';
import {
  JsonPatchFormat,
  JsonPatchOperation,
  JsonPatchDiffSummary,
} from '../types/json-patch.types';
import {
  createJsonPatch,
  applyJsonPatch,
  summarizePatch,
  createMergePatch,
  applyMergePatch,
} from '../services/json-patch-service';
import { downloadFile } from '@/lib/download';

interface JsonPatchWorkspaceViewProps {
  initialOriginal?: string;
  onApplyResultToWorkspace?: (jsonString: string) => void;
  isDark?: boolean;
}

export function JsonPatchWorkspaceView({
  initialOriginal = '',
  onApplyResultToWorkspace,
  isDark = true,
}: JsonPatchWorkspaceViewProps) {
  // Format: RFC 6902 (JSON Patch) vs RFC 7386 (JSON Merge Patch)
  const [format, setFormat] = useState<JsonPatchFormat>('rfc6902');

  // Mode: generate (Original + Modified -> Patch) vs apply (Original + Patch -> Result)
  const [mode, setMode] = useState<'generate' | 'apply'>('generate');

  // Document states
  const [originalJson, setOriginalJson] = useState<string>(() => {
    return initialOriginal && initialOriginal.trim()
      ? initialOriginal
      : JSON.stringify(
          {
            title: 'FormatNook',
            version: '1.0.0',
            author: { name: 'Alex', location: 'Seattle' },
            tags: ['json', 'tools'],
          },
          null,
          2
        );
  });

  const [modifiedJson, setModifiedJson] = useState<string>(() => {
    return JSON.stringify(
      {
        title: 'FormatNook Hub',
        version: '1.1.0',
        author: { name: 'Alex', role: 'Architect' },
        tags: ['json', 'tools', 'patch'],
      },
      null,
      2
    );
  });

  const [patchOutput, setPatchOutput] = useState<string>('');
  const [applyResultOutput, setApplyResultOutput] = useState<string>('');
  const [patchSummary, setPatchSummary] = useState<JsonPatchDiffSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedToWorkspace, setAppliedToWorkspace] = useState<boolean>(false);

  // Generate patch calculation
  const handleGeneratePatch = useCallback(() => {
    setErrorMessage(null);
    try {
      const orig = originalJson && originalJson.trim() ? JSON.parse(originalJson) : {};
      const mod = modifiedJson && modifiedJson.trim() ? JSON.parse(modifiedJson) : {};

      if (format === 'rfc6902') {
        const patch = createJsonPatch(orig, mod);
        setPatchOutput(JSON.stringify(patch, null, 2));
        setPatchSummary(summarizePatch(patch));
      } else {
        const mergePatch = createMergePatch(orig, mod);
        setPatchOutput(JSON.stringify(mergePatch, null, 2));
        setPatchSummary(null);
      }
    } catch (err: any) {
      setErrorMessage(`Failed to generate patch: ${err.message}`);
    }
  }, [originalJson, modifiedJson, format]);

  // Apply patch calculation
  const handleApplyPatch = useCallback(() => {
    setErrorMessage(null);
    try {
      const orig = originalJson && originalJson.trim() ? JSON.parse(originalJson) : {};
      const patchData = patchOutput && patchOutput.trim() ? JSON.parse(patchOutput) : null;

      if (!patchData) {
        setErrorMessage('Patch input is empty or invalid');
        return;
      }

      if (format === 'rfc6902') {
        const res = applyJsonPatch(orig, patchData);
        if (res.success && res.doc !== undefined) {
          setApplyResultOutput(JSON.stringify(res.doc, null, 2));
        } else {
          setErrorMessage(`Patch application failed: ${res.error}`);
        }
      } else {
        const merged = applyMergePatch(orig, patchData);
        setApplyResultOutput(JSON.stringify(merged, null, 2));
      }
    } catch (err: any) {
      setErrorMessage(`Application error: ${err.message}`);
    }
  }, [originalJson, patchOutput, format]);

  // Initial generation on mount or inputs change
  useEffect(() => {
    if (mode === 'generate') {
      handleGeneratePatch();
    }
  }, [mode, handleGeneratePatch]);

  // Copy patch or result
  const handleCopy = () => {
    const textToCopy = mode === 'apply' && applyResultOutput ? applyResultOutput : patchOutput;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download patch
  const handleDownload = () => {
    const textToDownload = mode === 'apply' && applyResultOutput ? applyResultOutput : patchOutput;
    if (!textToDownload) return;
    const filename =
      mode === 'apply'
        ? 'patched-result.json'
        : format === 'rfc6902'
        ? 'rfc6902-patch.json'
        : 'rfc7386-merge-patch.json';
    downloadFile(textToDownload, filename, 'application/json');
  };

  // Apply to Workspace Editor
  const handleApplyToWorkspace = () => {
    const contentToApply = mode === 'apply' && applyResultOutput ? applyResultOutput : patchOutput;
    if (contentToApply && onApplyResultToWorkspace) {
      onApplyResultToWorkspace(contentToApply);
      setAppliedToWorkspace(true);
      setTimeout(() => setAppliedToWorkspace(false), 2000);
    }
  };

  return (
    <div className="json-patch-container" data-testid="json-patch-view">
      {/* Top Toolbar */}
      <div className="json-patch-toolbar">
        <div className="toolbar-group-left">
          <div className="patch-title-badge">
            <GitCompare size={16} className="text-accent" />
            <span>JSON Patch</span>
          </div>

          {/* Mode Switcher */}
          <div className="patch-pill-group" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'generate'}
              className={`patch-pill ${mode === 'generate' ? 'active' : ''}`}
              onClick={() => setMode('generate')}
              data-testid="patch-mode-generate"
            >
              Generate Patch
            </button>
            <button
              role="tab"
              aria-selected={mode === 'apply'}
              className={`patch-pill ${mode === 'apply' ? 'active' : ''}`}
              onClick={() => {
                setMode('apply');
                handleApplyPatch();
              }}
              data-testid="patch-mode-apply"
            >
              Apply Patch
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Format Switcher */}
          <div className="patch-format-group">
            <label htmlFor="patch-format-select">Format:</label>
            <select
              id="patch-format-select"
              className="select-control select-xs"
              value={format}
              onChange={(e) => setFormat(e.target.value as JsonPatchFormat)}
              data-testid="patch-format-select"
            >
              <option value="rfc6902">RFC 6902 (JSON Patch)</option>
              <option value="rfc7386">RFC 7386 (Merge Patch)</option>
            </select>
          </div>

          {mode === 'generate' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleGeneratePatch}
              data-testid="patch-generate-btn"
            >
              <ArrowRightLeft size={14} />
              <span>Diff & Patch</span>
            </button>
          )}

          {mode === 'apply' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleApplyPatch}
              data-testid="patch-apply-btn"
            >
              <Play size={14} />
              <span>Apply Patch</span>
            </button>
          )}
        </div>

        <div className="toolbar-group-right">
          {mode === 'generate' && patchSummary && (
            <div className="patch-summary-stats" data-testid="patch-summary-stats">
              <span className="badge-add">+{patchSummary.addedCount} add</span>
              <span className="badge-remove">-{patchSummary.removedCount} rem</span>
              <span className="badge-replace">~{patchSummary.replacedCount} rep</span>
            </div>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            data-testid="patch-copy-btn"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleDownload}
            data-testid="patch-download-btn"
          >
            <Download size={14} />
            <span>Download</span>
          </button>

          {onApplyResultToWorkspace && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleApplyToWorkspace}
              title="Insert result into active JSON Workspace editor"
              data-testid="patch-insert-workspace-btn"
            >
              {appliedToWorkspace ? <Check size={14} className="text-success" /> : <ArrowRight size={14} />}
              <span>{appliedToWorkspace ? 'Inserted' : 'Insert to Editor'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="patch-error-banner" data-testid="patch-error-banner">
          <AlertTriangle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Editor Panels Grid */}
      <div className="json-patch-grid">
        {/* Original JSON */}
        <div className="patch-editor-pane">
          <div className="pane-header">
            <span>Original JSON</span>
          </div>
          <textarea
            className="patch-code-textarea"
            value={originalJson}
            onChange={(e) => setOriginalJson(e.target.value)}
            placeholder="Paste original JSON..."
            data-testid="patch-original-textarea"
          />
        </div>

        {/* Middle / Right: Modified JSON or Patch Input */}
        {mode === 'generate' ? (
          <div className="patch-editor-pane">
            <div className="pane-header">
              <span>Modified JSON</span>
            </div>
            <textarea
              className="patch-code-textarea"
              value={modifiedJson}
              onChange={(e) => setModifiedJson(e.target.value)}
              placeholder="Paste modified JSON..."
              data-testid="patch-modified-textarea"
            />
          </div>
        ) : (
          <div className="patch-editor-pane">
            <div className="pane-header">
              <span>Patch Document ({format.toUpperCase()})</span>
            </div>
            <textarea
              className="patch-code-textarea"
              value={patchOutput}
              onChange={(e) => setPatchOutput(e.target.value)}
              placeholder="Paste patch operations..."
              data-testid="patch-input-textarea"
            />
          </div>
        )}

        {/* Resulting Output Panel */}
        <div className="patch-editor-pane">
          <div className="pane-header">
            <span>{mode === 'generate' ? `Generated ${format.toUpperCase()} Output` : 'Resulting Patched JSON'}</span>
          </div>
          <textarea
            className="patch-code-textarea"
            readOnly
            value={mode === 'generate' ? patchOutput : applyResultOutput}
            placeholder="Result will appear here..."
            data-testid="patch-result-textarea"
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Minimize2, CheckCircle2, Wrench, FileUp } from 'lucide-react';
import { IndentOption, ValidationIssue } from '@/types/tool';
import { formatJson, minifyJson, validateJson, repairJson } from '../services/json-service';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';

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

export function JsonWorkspace({ initialMode = 'format' }: JsonWorkspaceProps) {
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE_JSON);
  const [output, setOutput] = useState<string>('');
  const [indent, setIndent] = useState<IndentOption>('2');
  const [validationState, setValidationState] = useState<{ isValid: boolean | null; issues: ValidationIssue[] }>({
    isValid: null,
    issues: [],
  });
  const [activeAction, setActiveAction] = useState<string>(initialMode);

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

  const handleFormat = () => {
    setActiveAction('format');
    const result = formatJson(input, indent);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  const handleMinify = () => {
    setActiveAction('minify');
    const result = minifyJson(input);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  const handleValidate = () => {
    setActiveAction('validate');
    const result = validateJson(input);
    setValidationState({ isValid: result.isValid, issues: result.issues });
    if (result.isValid) {
      setOutput(input);
    }
  };

  const handleRepair = () => {
    setActiveAction('repair');
    const repaired = repairJson(input);
    setInput(repaired);
    const result = formatJson(repaired, indent);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
    setValidationState({ isValid: null, issues: [] });
  };

  const handleFileLoaded = (content: string) => {
    setInput(content);
    const result = formatJson(content, indent);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  const inputBytes = new Blob([input]).size;
  const outputBytes = new Blob([output]).size;

  return (
    <div className="tool-workspace-container">
      {/* Top Toolbar */}
      <div className="tool-toolbar">
        <div className="toolbar-group-left">
          <button
            className={`btn ${activeAction === 'format' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleFormat}
            aria-label="Format and beautify JSON"
          >
            <Sparkles size={15} />
            <span>Beautify</span>
          </button>

          <button
            className={`btn ${activeAction === 'minify' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleMinify}
            aria-label="Minify JSON"
          >
            <Minimize2 size={15} />
            <span>Minify</span>
          </button>

          <button
            className={`btn ${activeAction === 'validate' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleValidate}
            aria-label="Validate JSON syntax"
          >
            <CheckCircle2 size={15} />
            <span>Validate</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleRepair}
            title="Auto-repair common mistakes like single quotes and trailing commas"
            aria-label="Repair invalid JSON"
          >
            <Wrench size={15} />
            <span>Auto Repair</span>
          </button>

          <div className="options-control-group">
            <label htmlFor="json-indent">Indent:</label>
            <select
              id="json-indent"
              className="select-control"
              value={indent}
              onChange={(e) => {
                const nextIndent = e.target.value as IndentOption;
                setIndent(nextIndent);
                if (output) {
                  const res = formatJson(input, nextIndent);
                  setOutput(res.output);
                }
              }}
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </div>
        </div>

        <div className="toolbar-group-right">
          <FileDropzone
            onFileLoaded={handleFileLoaded}
            acceptExtensions={['.json', '.txt']}
          />
          <ResetButton onReset={handleReset} />
        </div>
      </div>

      {/* Validation Status Indicator */}
      <ValidationResult isValid={validationState.isValid} issues={validationState.issues} />

      {/* Split Code Panels */}
      <div className="editor-workspace-grid">
        {/* Input Panel */}
        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <span>Input (Raw JSON)</span>
              <span className="panel-stats">
                {formatByteSize(inputBytes)} &bull; {input.split('\n').length} lines
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
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <span>Output (Processed)</span>
              <span className="panel-stats">
                {formatByteSize(outputBytes)} &bull; {output.split('\n').length} lines
              </span>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { IndentOption, ValidationIssue } from '@/types/tool';
import { formatYaml, validateYaml } from '../services/yaml-service';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';

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
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE_YAML);
  const [output, setOutput] = useState<string>('');
  const [indent, setIndent] = useState<IndentOption>('2');
  const [validationState, setValidationState] = useState<{ isValid: boolean | null; issues: ValidationIssue[] }>({
    isValid: null,
    issues: [],
  });
  const [activeAction, setActiveAction] = useState<string>(initialMode);

  useEffect(() => {
    if (initialMode === 'validate') {
      handleValidate();
    } else {
      handleFormat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormat = () => {
    setActiveAction('format');
    const result = formatYaml(input, indent);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  const handleValidate = () => {
    setActiveAction('validate');
    const result = validateYaml(input);
    setValidationState({ isValid: result.isValid, issues: result.issues });
    if (result.isValid) {
      setOutput(input);
    }
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
    setValidationState({ isValid: null, issues: [] });
  };

  const handleFileLoaded = (content: string) => {
    setInput(content);
    const result = formatYaml(content, indent);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  const inputBytes = new Blob([input]).size;
  const outputBytes = new Blob([output]).size;

  return (
    <div className="tool-workspace-container">
      <div className="tool-toolbar">
        <div className="toolbar-group-left">
          <button
            className={`btn ${activeAction === 'format' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleFormat}
            aria-label="Format and beautify YAML"
          >
            <Sparkles size={15} />
            <span>Beautify</span>
          </button>

          <button
            className={`btn ${activeAction === 'validate' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleValidate}
            aria-label="Validate YAML syntax"
          >
            <CheckCircle2 size={15} />
            <span>Validate</span>
          </button>

          <div className="options-control-group">
            <label htmlFor="yaml-indent">Indent:</label>
            <select
              id="yaml-indent"
              className="select-control"
              value={indent}
              onChange={(e) => {
                const nextIndent = e.target.value as IndentOption;
                setIndent(nextIndent);
                if (output) {
                  const res = formatYaml(input, nextIndent);
                  setOutput(res.output);
                }
              }}
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
            </select>
          </div>
        </div>

        <div className="toolbar-group-right">
          <FileDropzone
            onFileLoaded={handleFileLoaded}
            acceptExtensions={['.yaml', '.yml', '.txt']}
          />
          <ResetButton onReset={handleReset} />
        </div>
      </div>

      <ValidationResult isValid={validationState.isValid} issues={validationState.issues} />

      <div className="editor-workspace-grid">
        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <span>Input (Raw YAML)</span>
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
              language="yaml"
              placeholder="Paste YAML document here..."
            />
          </div>
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <span>Output (Standardized YAML)</span>
              <span className="panel-stats">
                {formatByteSize(outputBytes)} &bull; {output.split('\n').length} lines
              </span>
            </div>
            <div className="panel-actions">
              <CopyButton text={output} label="Copy Output" />
              <DownloadButton
                content={output}
                fileName="formatted.yaml"
                mimeType="text/yaml"
              />
            </div>
          </div>
          <div className="panel-body">
            <CodeEditor
              value={output}
              readOnly
              language="yaml"
              placeholder="Formatted YAML output will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

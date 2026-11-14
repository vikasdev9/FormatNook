'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Code2 } from 'lucide-react';
import { IndentOption, ValidationIssue } from '@/types/tool';
import {
  formatHtml,
  formatCss,
  formatJavascript,
  formatSql,
} from '../services/beautifier-service';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';

export type BeautifierLanguage = 'html' | 'css' | 'javascript' | 'sql';

interface BeautifierWorkspaceProps {
  language: BeautifierLanguage;
  defaultSample: string;
  outputFileName: string;
  mimeType: string;
  fileExtensions: string[];
}

export function BeautifierWorkspace({
  language,
  defaultSample,
  outputFileName,
  mimeType,
  fileExtensions,
}: BeautifierWorkspaceProps) {
  const [input, setInput] = useState<string>(defaultSample);
  const [output, setOutput] = useState<string>('');
  const [indent, setIndent] = useState<IndentOption>('2');
  const [mobileTab, setMobileTab] = useState<'both' | 'input' | 'output'>('both');
  const [validationState, setValidationState] = useState<{ isValid: boolean | null; issues: ValidationIssue[] }>({
    isValid: null,
    issues: [],
  });

  const runFormatter = (content: string, indentOption: IndentOption) => {
    let result;
    if (language === 'sql') result = formatSql(content, indentOption);
    else if (language === 'html') result = formatHtml(content, indentOption);
    else if (language === 'css') result = formatCss(content, indentOption);
    else result = formatJavascript(content, indentOption);

    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  useEffect(() => {
    runFormatter(input, indent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormat = () => {
    runFormatter(input, indent);
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
    setValidationState({ isValid: null, issues: [] });
  };

  const handleFileLoaded = (content: string) => {
    setInput(content);
    runFormatter(content, indent);
  };

  const inputBytes = new Blob([input]).size;
  const outputBytes = new Blob([output]).size;

  return (
    <div className="tool-workspace-container">
      <div className="tool-toolbar">
        <div className="toolbar-group-left">
          <button
            className="btn btn-primary"
            onClick={handleFormat}
            aria-label={`Format ${language.toUpperCase()}`}
          >
            <Sparkles size={15} />
            <span>Beautify {language.toUpperCase()}</span>
          </button>

          <div className="options-control-group">
            <label htmlFor={`${language}-indent`}>Indent:</label>
            <select
              id={`${language}-indent`}
              className="select-control"
              value={indent}
              onChange={(e) => {
                const nextIndent = e.target.value as IndentOption;
                setIndent(nextIndent);
                runFormatter(input, nextIndent);
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
            acceptExtensions={fileExtensions}
          />
          <ResetButton onReset={handleReset} />
        </div>
      </div>

      <ValidationResult isValid={validationState.isValid} issues={validationState.issues} />

      {/* Mobile Panel Switcher for Touch Viewports */}
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
          Input
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'output'}
          className={`workspace-mobile-tab ${mobileTab === 'output' ? 'active' : ''}`}
          onClick={() => setMobileTab('output')}
        >
          Beautified Output
        </button>
      </div>

      <div className="editor-workspace-grid">
        <div className={`editor-panel ${mobileTab === 'output' ? 'mobile-panel-hidden' : ''}`}>
          <div className="panel-header">
            <div className="panel-title-group">
              <span>Input ({language.toUpperCase()})</span>
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
              language={language}
              placeholder={`Paste unformatted ${language.toUpperCase()} here...`}
            />
          </div>
        </div>

        <div className={`editor-panel ${mobileTab === 'input' ? 'mobile-panel-hidden' : ''}`}>
          <div className="panel-header">
            <div className="panel-title-group">
              <span>Output (Beautified)</span>
              <span className="panel-stats">
                {formatByteSize(outputBytes)} &bull; {output.split('\n').length} lines
              </span>
            </div>
            <div className="panel-actions">
              <CopyButton text={output} label="Copy Output" />
              <DownloadButton
                content={output}
                fileName={outputFileName}
                mimeType={mimeType}
              />
            </div>
          </div>
          <div className="panel-body">
            <CodeEditor
              value={output}
              readOnly
              language={language}
              placeholder="Beautified output will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

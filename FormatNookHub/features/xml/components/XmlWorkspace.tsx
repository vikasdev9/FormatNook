'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Minimize2, CheckCircle2 } from 'lucide-react';
import { IndentOption, ValidationIssue } from '@/types/tool';
import { formatXml, minifyXml, validateXml } from '../services/xml-service';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';

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
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE_XML);
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
    const result = formatXml(input, indent);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  const handleMinify = () => {
    setActiveAction('minify');
    const result = minifyXml(input);
    setOutput(result.output);
    setValidationState({ isValid: result.isValid, issues: result.issues });
  };

  const handleValidate = () => {
    setActiveAction('validate');
    const result = validateXml(input);
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
    const result = formatXml(content, indent);
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
            aria-label="Format and beautify XML"
          >
            <Sparkles size={15} />
            <span>Beautify</span>
          </button>

          <button
            className={`btn ${activeAction === 'minify' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleMinify}
            aria-label="Minify XML"
          >
            <Minimize2 size={15} />
            <span>Minify</span>
          </button>

          <button
            className={`btn ${activeAction === 'validate' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleValidate}
            aria-label="Validate XML well-formedness"
          >
            <CheckCircle2 size={15} />
            <span>Validate</span>
          </button>

          <div className="options-control-group">
            <label htmlFor="xml-indent">Indent:</label>
            <select
              id="xml-indent"
              className="select-control"
              value={indent}
              onChange={(e) => {
                const nextIndent = e.target.value as IndentOption;
                setIndent(nextIndent);
                if (output) {
                  const res = formatXml(input, nextIndent);
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
            acceptExtensions={['.xml', '.xsd', '.svg', '.txt']}
          />
          <ResetButton onReset={handleReset} />
        </div>
      </div>

      <ValidationResult isValid={validationState.isValid} issues={validationState.issues} />

      <div className="editor-workspace-grid">
        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <span>Input (Raw XML)</span>
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
              language="xml"
              placeholder="Paste unformatted or raw XML markup here..."
            />
          </div>
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <span>Output (Processed XML)</span>
              <span className="panel-stats">
                {formatByteSize(outputBytes)} &bull; {output.split('\n').length} lines
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
              placeholder="Formatted XML output will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

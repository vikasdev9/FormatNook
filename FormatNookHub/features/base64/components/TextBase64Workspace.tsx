'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Binary, FileText } from 'lucide-react';
import { encodeTextToBase64, decodeBase64ToText } from '../services/base64-service';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { FileDropzone } from '@/components/workspace/FileDropzone';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { ValidationResult } from '@/components/workspace/ValidationResult';
import { formatByteSize } from '@/lib/file-reader';

interface TextBase64WorkspaceProps {
  initialMode: 'encode' | 'decode';
}

export function TextBase64Workspace({ initialMode }: TextBase64WorkspaceProps) {
  const [mode, setMode] = useState<'encode' | 'decode'>(initialMode);
  const [input, setInput] = useState<string>(
    initialMode === 'encode' ? 'Hello, FormatNook Developer! 🚀' : 'SGVsbG8sIEZvcm1hdE5vb2sgRGV2ZWxvcGVyISDwn5mA'
  );
  const [output, setOutput] = useState<string>('');
  const [isUrlSafe, setIsUrlSafe] = useState(false);
  const [validationState, setValidationState] = useState<{ isValid: boolean | null; issues: any[] }>({
    isValid: null,
    issues: [],
  });

  const processData = (text: string, currentMode: 'encode' | 'decode', urlSafe: boolean) => {
    if (!text.trim()) {
      setOutput('');
      setValidationState({ isValid: null, issues: [] });
      return;
    }

    if (currentMode === 'encode') {
      const encoded = encodeTextToBase64(text, urlSafe);
      setOutput(encoded);
      setValidationState({ isValid: true, issues: [] });
    } else {
      const decoded = decodeBase64ToText(text);
      setOutput(decoded.output);
      setValidationState({ isValid: decoded.isValid, issues: decoded.issues });
    }
  };

  useEffect(() => {
    processData(input, mode, isUrlSafe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode, isUrlSafe]);

  const handleSwap = () => {
    const nextMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(nextMode);
    setInput(output);
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
    setValidationState({ isValid: null, issues: [] });
  };

  const inputBytes = new Blob([input]).size;
  const outputBytes = new Blob([output]).size;

  return (
    <div className="tool-workspace-container">
      <div className="tool-toolbar">
        <div className="toolbar-group-left">
          <button
            className={`btn ${mode === 'encode' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('encode')}
          >
            <Binary size={15} />
            <span>Encode to Base64</span>
          </button>

          <button
            className={`btn ${mode === 'decode' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('decode')}
          >
            <FileText size={15} />
            <span>Decode from Base64</span>
          </button>

          <button className="btn btn-secondary" onClick={handleSwap} title="Swap input and output">
            <ArrowLeftRight size={15} />
            <span>Swap</span>
          </button>

          {mode === 'encode' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isUrlSafe}
                onChange={(e) => setIsUrlSafe(e.target.checked)}
              />
              <span>URL-Safe (- and _)</span>
            </label>
          )}
        </div>

        <div className="toolbar-group-right">
          <FileDropzone
            onFileLoaded={(content) => setInput(content)}
            acceptExtensions={['.txt', '.b64', '.json', '.xml']}
          />
          <ResetButton onReset={handleReset} />
        </div>
      </div>

      <ValidationResult
        isValid={validationState.isValid}
        issues={validationState.issues}
        successMessage={mode === 'encode' ? 'Successfully Encoded to Base64' : 'Successfully Decoded from Base64'}
      />

      <div className="editor-workspace-grid">
        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <span>{mode === 'encode' ? 'Input Text (UTF-8)' : 'Input Base64 String'}</span>
              <span className="panel-stats">{formatByteSize(inputBytes)}</span>
            </div>
            <div className="panel-actions">
              <CopyButton text={input} label="Copy" />
            </div>
          </div>
          <div className="panel-body">
            <CodeEditor
              value={input}
              onChange={setInput}
              language="text"
              placeholder={mode === 'encode' ? 'Type or paste plain text here...' : 'Paste Base64 string here...'}
            />
          </div>
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <span>{mode === 'encode' ? 'Output Base64' : 'Output Text'}</span>
              <span className="panel-stats">{formatByteSize(outputBytes)}</span>
            </div>
            <div className="panel-actions">
              <CopyButton text={output} label="Copy" />
              <DownloadButton
                content={output}
                fileName={mode === 'encode' ? 'encoded-base64.txt' : 'decoded-text.txt'}
              />
            </div>
          </div>
          <div className="panel-body">
            <CodeEditor
              value={output}
              readOnly
              language="text"
              placeholder="Conversion result will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

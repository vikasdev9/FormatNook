'use client';

import React, { useState } from 'react';
import { Archive, ArrowRight, Copy, Download, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { gzipCompressToBase64, gzipDecompressFromBase64, GzipCompressionResult, GzipDecompressionResult } from '../services/gzip-base64.service';
import { CopyButton } from '@/components/workspace/CopyButton';
import { downloadFile } from '@/lib/download';

export function GzipBase64View() {
  const [direction, setDirection] = useState<'compress' | 'decompress'>('compress');
  const [textInput, setTextInput] = useState<string>('Hello FormatNook Hub! Gzip compression reduces size for large JSON payloads, text logs, and API payloads.');
  const [base64Input, setBase64Input] = useState<string>('');

  const [compressResult, setCompressResult] = useState<GzipCompressionResult | null>(null);
  const [decompressResult, setDecompressResult] = useState<GzipDecompressionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCompress = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await gzipCompressToBase64(textInput);
      setCompressResult(res);
      if (!res.isValid) {
        setErrorMsg(res.error || 'Failed to compress text.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Compression error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecompress = async () => {
    if (!base64Input.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await gzipDecompressFromBase64(base64Input);
      setDecompressResult(res);
      if (!res.isValid) {
        setErrorMsg(res.error || 'Failed to decompress Gzip Base64 payload.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Decompression error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDecompressed = () => {
    if (!decompressResult || !decompressResult.isValid) return;
    const blob = new Blob([decompressResult.bytes as unknown as BlobPart], {
      type: decompressResult.isText ? 'text/plain' : 'application/octet-stream',
    });
    downloadFile(blob, decompressResult.isText ? 'decompressed.txt' : 'decompressed.bin');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Direction Tabs */}
      <div className="tool-toolbar">
        <div className="toolbar-group-left">
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className={`btn btn-sm ${direction === 'compress' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setDirection('compress');
                setErrorMsg(null);
              }}
            >
              Compress (Text → Gzip → Base64)
            </button>
            <button
              className={`btn btn-sm ${direction === 'decompress' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setDirection('decompress');
                setErrorMsg(null);
              }}
            >
              Decompress (Base64 → Gzip → Text)
            </button>
          </div>
        </div>

        <div className="toolbar-group-right">
          <span style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>
            Protected with 50MB decompression bomb limits
          </span>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F8FAFC', fontSize: '0.8125rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Compression Workflow */}
      {direction === 'compress' ? (
        <div className="editor-workspace-grid">
          {/* Left Column: Text Input */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Uncompressed Text Input</span>
              <div className="panel-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleCompress}
                  disabled={isProcessing || !textInput.trim()}
                >
                  <Archive size={14} />
                  <span>{isProcessing ? 'Compressing...' : 'Gzip & Base64 Encode'}</span>
                </button>
              </div>
            </div>
            <div className="panel-body">
              <textarea
                className="editor-textarea wrap-text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste text or JSON to compress..."
                spellCheck="false"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  overflowY: 'auto',
                }}
              />
            </div>
          </div>

          {/* Right Column: Base64 Compressed Output */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Gzip Compressed Base64 String</span>
              <div className="panel-actions">
                <CopyButton text={compressResult?.base64 || ''} label="Copy Base64" />
              </div>
            </div>
            <div className="panel-body">
              <textarea
                className="editor-textarea wrap-text"
                readOnly
                value={compressResult?.base64 || ''}
                placeholder="Gzip Base64 output will appear here..."
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  overflowY: 'auto',
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Decompression Workflow */
        <div className="editor-workspace-grid">
          {/* Left Column: Gzip Base64 Input */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Gzip Base64 Input String</span>
              <div className="panel-actions">
                {compressResult?.base64 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setBase64Input(compressResult.base64)}
                  >
                    Paste Last Output
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleDecompress}
                  disabled={isProcessing || !base64Input.trim()}
                >
                  <RefreshCw size={14} className={isProcessing ? 'spin' : ''} />
                  <span>{isProcessing ? 'Decompressing...' : 'Decompress Gzip'}</span>
                </button>
              </div>
            </div>
            <div className="panel-body">
              <textarea
                className="editor-textarea wrap-text"
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                placeholder="Paste Gzip Base64 string (begins with H4sI... or 0x1F 0x8B)..."
                spellCheck="false"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  overflowY: 'auto',
                }}
              />
            </div>
          </div>

          {/* Right Column: Decompressed Output */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Decompressed Content</span>
              <div className="panel-actions">
                {decompressResult?.text && <CopyButton text={decompressResult.text} label="Copy Text" />}
                {decompressResult?.isValid && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={handleDownloadDecompressed}>
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
            <div className="panel-body">
              <textarea
                className="editor-textarea wrap-text"
                readOnly
                value={
                  decompressResult?.text ||
                  (decompressResult?.isValid ? `[Binary Gzip Payload Decompressed: ${decompressResult.decompressedBytes} bytes]` : '')
                }
                placeholder="Decompressed content will appear here..."
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  overflowY: 'auto',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Metrics & Ratio Panel */}
      {direction === 'compress' && compressResult && compressResult.isValid && (
        <div
          style={{
            backgroundColor: '#151F31',
            border: '1px solid #263449',
            borderRadius: '8px',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Original Size</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
              {compressResult.originalBytes.toLocaleString()} Bytes
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Gzip Compressed Size</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#22C3EE' }}>
              {compressResult.compressedBytes.toLocaleString()} Bytes
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Base64 Encoded Size</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
              {compressResult.base64Length.toLocaleString()} Chars
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Compression Ratio</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-success)' }}>
              {compressResult.compressionRatioPercent}% Saved
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


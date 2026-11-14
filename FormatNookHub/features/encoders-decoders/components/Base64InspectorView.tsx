'use client';

import React, { useState, useMemo } from 'react';
import { Search, FileCode, CheckCircle2, AlertTriangle, Download, Copy, Play, Eye, Key } from 'lucide-react';
import { inspectBase64, Base64InspectionReport } from '../services/base64-inspector.service';
import { base64ToBytes } from '../services/base64.service';
import { HexViewer } from './HexViewer';
import { downloadFile } from '@/lib/download';
import { CopyButton } from '@/components/workspace/CopyButton';

interface Base64InspectorViewProps {
  initialPayload?: string;
  onNavigateToMode?: (mode: string, payload?: string) => void;
}

const SAMPLE_PAYLOADS = [
  {
    name: 'PNG Image',
    value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  {
    name: 'PDF Document',
    value: 'JVBERi0xLjUKJcfsj6IKNCAwIG9iaiA8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1s1IDAgUl0+PgplbmRvYmoK',
  },
  {
    name: 'JWT Token',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvcm1hdE5vb2sgRGV2IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  },
  {
    name: 'UTF-8 Text (Emoji)',
    value: 'SGVsbG8gRnJvbSBGb3JtYXROb29rIEh1YiEg8J+agA==',
  },
];

export function Base64InspectorView({ initialPayload = '', onNavigateToMode }: Base64InspectorViewProps) {
  const [input, setInput] = useState<string>(initialPayload);
  const [showHexDump, setShowHexDump] = useState(false);

  const report = useMemo<Base64InspectionReport | null>(() => {
    if (!input.trim()) return null;
    return inspectBase64(input);
  }, [input]);

  const rawBytes = useMemo<Uint8Array | null>(() => {
    if (!input.trim()) return null;
    const { bytes, isValid } = base64ToBytes(input);
    return isValid ? bytes : null;
  }, [input]);

  const handleDownload = () => {
    if (!rawBytes || rawBytes.length === 0 || !report) return;
    const blob = new Blob([rawBytes as unknown as BlobPart], { type: report.mimeResult.mimeType });
    downloadFile(blob, `inspected${report.suggestedExtension}`, report.mimeResult.mimeType);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Input Section */}
      <div className="editor-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <Search size={16} />
            <span>Paste Unknown Base64 String to Inspect</span>
          </div>
          <div className="panel-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Samples:</span>
            {SAMPLE_PAYLOADS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setInput(sample.value)}
              >
                {sample.name}
              </button>
            ))}
            {input && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setInput('')}>Clear</button>}
          </div>
        </div>

        <div className="panel-body">
          <textarea
            className="editor-textarea wrap-text"
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste raw Base64 string, URL-safe Base64, Data URI, or JWT here..."
            spellCheck="false"
            style={{
              minHeight: '120px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              overflowWrap: 'anywhere',
              overflowY: 'auto',
            }}
          />
        </div>
      </div>

      {/* Analysis Results */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top Classification Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {/* Card 1: MIME Type & Format */}
            <div
              style={{
                backgroundColor: '#151F31',
                border: '1px solid #263449',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Detected Format
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC', marginTop: '0.25rem' }}>
                {report.mimeResult.mimeType}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className={`badge ${report.confidence === 'high' ? 'badge-success' : 'badge-warning'}`}>
                  {report.confidence.toUpperCase()} CONFIDENCE
                </span>
                <span style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>
                  Ext: {report.suggestedExtension}
                </span>
              </div>
            </div>

            {/* Card 2: Base64 Variant & Padding */}
            <div
              style={{
                backgroundColor: '#151F31',
                border: '1px solid #263449',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Variant & Padding
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                {report.variant} Base64
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#A6B4C8' }}>
                <span>Padding: {report.paddingStatus}</span>
                {report.hasDataUriPrefix && <span className="badge badge-info">Data URI</span>}
              </div>
            </div>

            {/* Card 3: Size & Length */}
            <div
              style={{
                backgroundColor: '#151F31',
                border: '1px solid #263449',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Payload Size
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC', marginTop: '0.25rem' }}>
                {report.actualDecodedBytes.toLocaleString()} Bytes Decoded
              </div>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8', marginTop: '0.5rem' }}>
                Encoded length: {report.encodedLength.toLocaleString()} chars (~{Math.round(((report.encodedLength - report.actualDecodedBytes) / (report.actualDecodedBytes || 1)) * 100)}% overhead)
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          <div
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: '#1C293B',
              border: '1px solid #263449',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <CheckCircle2 size={18} style={{ color: '#22C3EE', flexShrink: 0 }} />
            <div>
              <strong>Inspector Diagnosis:</strong> {report.explanation}
            </div>
          </div>

          {/* Special Section: JWT Token Inspection */}
          {report.jwtInfo?.isJwt && (
            <div
              style={{
                backgroundColor: '#151F31',
                border: '1px solid #263449',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22C3EE', fontWeight: 600, fontSize: '0.9375rem' }}>
                <Key size={18} />
                <span>Decoded JSON Web Token (JWT) Structure</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600, marginBottom: '0.35rem' }}>Header</div>
                  <pre
                    style={{
                      backgroundColor: '#0B1120',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      color: '#22C3EE',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(report.jwtInfo.header, null, 2)}
                  </pre>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600, marginBottom: '0.35rem' }}>Payload Claims</div>
                  <pre
                    style={{
                      backgroundColor: '#0B1120',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      color: '#F8FAFC',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(report.jwtInfo.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Text Preview (if text) */}
          {report.isText && report.textPreview && (
            <div
              style={{
                backgroundColor: '#151F31',
                border: '1px solid #263449',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#A6B4C8' }}>
                  Decoded UTF-8 Text Preview
                </span>
                <CopyButton text={report.textPreview} label="Copy Preview" />
              </div>
              <pre
                style={{
                  backgroundColor: '#0B1120',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: '#F8FAFC',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {report.textPreview}
              </pre>
            </div>
          )}

          {/* Magic Byte Signature View */}
          <div
            style={{
              backgroundColor: '#151F31',
              border: '1px solid #263449',
              borderRadius: '8px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Magic Byte Signature (First 16 Bytes)</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#22C3EE', marginTop: '0.2rem' }}>
                {report.magicBytesHex || 'None'}
                <span style={{ color: '#A6B4C8', marginLeft: '1rem' }}>[{report.magicBytesAscii}]</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setShowHexDump(!showHexDump)}
            >
              <FileCode size={14} />
              <span>{showHexDump ? 'Hide Hex Dump' : 'Inspect Full Hex Dump'}</span>
            </button>
          </div>

          {/* Expandable Hex Viewer */}
          {showHexDump && rawBytes && (
            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '1rem' }}>
              <HexViewer bytes={rawBytes} filename={`decoded${report.suggestedExtension}`} />
            </div>
          )}

          {/* Recommended Next Actions Toolbar */}
          <div
            style={{
              backgroundColor: '#1C293B',
              border: '1px solid #263449',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F8FAFC' }}>
              Recommended Next Actions:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {report.suggestedActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    if (action.id === 'download-file') {
                      handleDownload();
                    } else if (action.id === 'view-hex') {
                      setShowHexDump(true);
                    } else if (action.targetMode && onNavigateToMode) {
                      onNavigateToMode(action.targetMode, input);
                    }
                  }}
                  title={action.description}
                >
                  {action.id === 'download-file' ? <Download size={14} /> : <Play size={14} />}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


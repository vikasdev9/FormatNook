'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Download,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
  Layers,
  Split,
  Eye,
} from 'lucide-react';
import {
  repairBase64,
  Base64RepairOptions,
  Base64RepairCandidate,
  DEFAULT_REPAIR_OPTIONS,
} from '../services/base64-repair.service';
import { base64ToBytes } from '../services/base64.service';
import { CopyButton } from '@/components/workspace/CopyButton';
import { ShareButton } from '@/components/workspace/ShareButton';
import { createBase64RepairSharePayload } from '../adapters/base64-repair-share.adapter';
import { Base64RepairImagePreview } from './Base64RepairImagePreview';
import { Base64RepairErrorsCard } from './Base64RepairErrorsCard';
import { Base64RepairSummaryCard } from './Base64RepairSummaryCard';
import { downloadFile } from '@/lib/download';

interface Base64RepairViewProps {
  initialPayload?: string;
  onSendToDecode?: (payload: string) => void;
  onBackToDecoder?: () => void;
}

const SAMPLE_REPAIR_INPUTS = [
  {
    name: 'JSON with Image Field',
    value: `{\n  "banner_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",\n  "other_field": "some other value"\n}`,
  },
  {
    name: 'Embedded Newlines & Data URI',
    value:
      'data:image/png;base64,\niVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk\n+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  {
    name: 'Missing Padding (=)',
    value: 'SGVsbG8gV29ybGQ', // missing =
  },
  {
    name: 'URL-Safe to Standard',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  {
    name: 'Foreign Characters ($#@)',
    value: 'SGVsbG8$IEZvcm1hdE5vb2s@IQ==',
  },
];

export function Base64RepairView({
  initialPayload = '',
  onSendToDecode,
  onBackToDecoder,
}: Base64RepairViewProps) {
  const [input, setInput] = useState<string>(initialPayload);
  const [options, setOptions] = useState<Base64RepairOptions>({ ...DEFAULT_REPAIR_OPTIONS });
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Sync if initialPayload changes
  useEffect(() => {
    if (initialPayload) {
      setInput(initialPayload);
    }
  }, [initialPayload]);

  // Compute repair result
  const result = useMemo(() => {
    if (!input) return null;
    return repairBase64(input, options);
  }, [input, options]);

  // Default active candidate
  const activeCandidate: Base64RepairCandidate | null = useMemo(() => {
    if (!result || result.extractedCandidates.length === 0) return null;
    if (selectedCandidateId) {
      const match = result.extractedCandidates.find((c) => c.id === selectedCandidateId);
      if (match) return match;
    }
    // Return selected candidate from result orchestrator
    if (result.selectedCandidateId) {
      const match = result.extractedCandidates.find((c) => c.id === result.selectedCandidateId);
      if (match) return match;
    }
    return result.extractedCandidates[0];
  }, [result, selectedCandidateId]);

  // Live image preview generation from decoded bytes
  const activeObjectUrls = useRef<string[]>([]);
  useEffect(() => {
    // Revoke previous URLs
    activeObjectUrls.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    activeObjectUrls.current = [];

    if (activeCandidate && activeCandidate.isImageValid && activeCandidate.repairedPayload) {
      const byteResult = base64ToBytes(activeCandidate.repairedPayload);
      if (byteResult.isValid && byteResult.bytes.length > 0) {
        const mime = activeCandidate.detectedMimeType || 'image/png';
        const blob = new Blob([byteResult.bytes as unknown as BlobPart], { type: mime });
        const url = URL.createObjectURL(blob);
        activeObjectUrls.current.push(url);
        setPreviewBlobUrl(url);
        return;
      }
    }
    setPreviewBlobUrl(null);
  }, [activeCandidate]);

  useEffect(() => {
    return () => {
      activeObjectUrls.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      activeObjectUrls.current = [];
    };
  }, []);

  const handleDownload = () => {
    const payload = activeCandidate?.repairedPayload || result?.repairedOutput;
    if (!payload) return;
    downloadFile(payload, 'repaired-base64.txt', 'text/plain');
  };

  const handleUseRepaired = () => {
    const payload = activeCandidate?.repairedPayload || result?.repairedOutput;
    if (payload && onSendToDecode) {
      onSendToDecode(payload);
    }
  };

  const currentPayloadToUse = activeCandidate?.repairedPayload || result?.repairedOutput || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Top Banner Navigation & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: '#151F31',
          border: '1px solid #263449',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBackToDecoder && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={onBackToDecoder}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Decoder</span>
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
              Base64 Repair & Normalization Engine
            </span>
            {result && (
              <span
                className="badge badge-accent"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                Format: {result.inputFormat.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${compareMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCompareMode(!compareMode)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Split size={14} />
            <span>Compare Input vs Repaired</span>
          </button>

          {onSendToDecode && currentPayloadToUse && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleUseRepaired}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              title="Return repaired Base64 to Image Decoder and preview"
            >
              <ArrowRight size={14} />
              <span>Use Repaired Base64</span>
            </button>
          )}
        </div>
      </div>

      {/* Repair Configuration Options Toolbar */}
      <div
        style={{
          backgroundColor: '#151F31',
          border: '1px solid #263449',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F8FAFC' }}>
              Repair Mode:
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                type="button"
                className={`btn btn-xs ${options.mode === 'safe' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setOptions({ ...options, mode: 'safe', stripInvalidChars: false })}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
              >
                Safe Normalization (Lossless)
              </button>
              <button
                type="button"
                className={`btn btn-xs ${options.mode === 'advanced' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setOptions({ ...options, mode: 'advanced', stripInvalidChars: true })}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
              >
                Advanced Repair (Aggressive)
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: options.mode === 'advanced' ? 'var(--color-warning)' : '#A6B4C8' }}>
            {options.mode === 'advanced'
              ? 'Advanced mode strips invalid foreign characters from corrupted payloads.'
              : 'Safe mode preserves raw characters and only fixes whitespace, headers, and padding.'}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: '#A6B4C8' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.stripDataUriPrefix}
              onChange={(e) => setOptions({ ...options, stripDataUriPrefix: e.target.checked })}
            />
            <span>Strip Data URI header (data:...;base64,)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.removeWhitespace}
              onChange={(e) => setOptions({ ...options, removeWhitespace: e.target.checked })}
            />
            <span>Remove Whitespace & Line Breaks</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.fixPadding}
              onChange={(e) => setOptions({ ...options, fixPadding: e.target.checked })}
            />
            <span>Repair Missing Padding (= / ==)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.convertUrlSafeToStandard}
              onChange={(e) =>
                setOptions({
                  ...options,
                  convertUrlSafeToStandard: e.target.checked,
                  convertStandardToUrlSafe: e.target.checked ? false : options.convertStandardToUrlSafe,
                })
              }
            />
            <span>Convert URL-Safe (- _) to Standard (+ /)</span>
          </label>

          {options.mode === 'advanced' && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                color: '#EF4444',
              }}
            >
              <input
                type="checkbox"
                checked={options.stripInvalidChars}
                onChange={(e) => setOptions({ ...options, stripInvalidChars: e.target.checked })}
              />
              <span>Strip Non-Alphabet Characters</span>
            </label>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Line Wrapping:</span>
            <select
              className="select-control"
              value={options.lineWrap}
              onChange={(e) => setOptions({ ...options, lineWrap: e.target.value as any })}
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            >
              <option value="none">None (Single Line)</option>
              <option value="64">64 Chars (MIME standard)</option>
              <option value="76">76 Chars (PEM standard)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Multiple Candidate Extraction Selector */}
      {result && result.extractedCandidates.length > 1 && (
        <div
          style={{
            backgroundColor: '#151F31',
            border: '1px solid #263449',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={14} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F8FAFC' }}>
              Extracted Base64 Candidates ({result.extractedCandidates.length} found):
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {result.extractedCandidates.map((cand) => {
              const isSelected = activeCandidate?.id === cand.id;
              return (
                <button
                  key={cand.id}
                  type="button"
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setSelectedCandidateId(cand.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  {cand.isImageValid ? <ImageIcon size={13} /> : <Wrench size={13} />}
                  <span>
                    {cand.propertyName ? `"${cand.propertyName}"` : cand.id}
                    {cand.detectedFormat ? ` (${cand.detectedFormat})` : ''}
                    {cand.decodedByteLength > 0 ? ` · ${cand.decodedByteLength} bytes` : ''}
                  </span>
                  {cand.confidence === 'high' && (
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
                      Image
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Grid: Left = Original, Right = Repaired & Preview */}
      <div className="editor-workspace-grid">
        {/* Left Column: Original Input */}
        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-title-group">
              Original Base64 Input ({input.length} chars)
            </span>
            <div className="panel-actions" style={{ display: 'flex', gap: '0.4rem' }}>
              {SAMPLE_REPAIR_INPUTS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setInput(sample.value)}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  {sample.name}
                </button>
              ))}
              <CopyButton text={input} label="Copy" />
            </div>
          </div>
          <div className="panel-body">
            <textarea
              className="editor-textarea wrap-text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste malformed, unpadded, JSON, or whitespace-polluted Base64 here..."
              spellCheck="false"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                overflowY: 'auto',
                minHeight: '260px',
              }}
            />
          </div>
        </div>

        {/* Right Column: Repaired Output & Live Preview */}
        <div className="editor-panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="panel-title-group">
                Repaired Output ({currentPayloadToUse.length} chars)
              </span>
              {activeCandidate && (
                <span
                  className={`badge ${
                    activeCandidate.isImageValid
                      ? 'badge-success'
                      : activeCandidate.isBase64Valid
                      ? 'badge-info'
                      : 'badge-warning'
                  }`}
                  style={{ fontSize: '0.7rem' }}
                >
                  {activeCandidate.isImageValid
                    ? `Valid ${activeCandidate.detectedFormat || 'Image'}`
                    : activeCandidate.isBase64Valid
                    ? 'Valid Base64'
                    : 'Corrupted'}
                </span>
              )}
            </div>
            <div className="panel-actions" style={{ display: 'flex', gap: '0.4rem' }}>
              <ShareButton
                getPayload={() => createBase64RepairSharePayload(result, activeCandidate)}
                disabled={!currentPayloadToUse}
              />
              <CopyButton text={currentPayloadToUse} label="Copy Repaired" />
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={handleDownload}
                disabled={!currentPayloadToUse}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                <Download size={13} />
                <span>Download</span>
              </button>
              {onSendToDecode && currentPayloadToUse && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleUseRepaired}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                >
                  <ArrowRight size={13} />
                  <span>Use Repaired</span>
                </button>
              )}
            </div>
          </div>

          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column' }}>
            <textarea
              className="editor-textarea wrap-text"
              readOnly
              value={currentPayloadToUse}
              placeholder="Repaired output will appear here..."
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                overflowY: 'auto',
                minHeight: '260px',
                flex: 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* Decoded Image Preview (Independent Section Below Editor) */}
      <Base64RepairImagePreview candidate={activeCandidate} blobUrl={previewBlobUrl} />

      {/* Comparison View (when enabled) */}
      {compareMode && result && (
        <div
          style={{
            backgroundColor: '#151F31',
            border: '1px solid #263449',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F8FAFC' }}>
            Original vs Repaired Comparison
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.75rem' }}>
            <div>
              <div style={{ color: '#94A3B8', marginBottom: '0.25rem' }}>
                Original Length: {result.originalLength} chars
              </div>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                }}
              >
                {result.originalInput}
              </div>
            </div>
            <div>
              <div style={{ color: '#94A3B8', marginBottom: '0.25rem' }}>
                Repaired Length: {result.repairedLength} chars (Delta:{' '}
                {result.repairedLength - result.originalLength} chars)
              </div>
              <div
                style={{
                  backgroundColor: '#0F172A',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  color: 'var(--color-success)',
                }}
              >
                {currentPayloadToUse}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detected Errors & Malformations Card */}
      <Base64RepairErrorsCard candidate={activeCandidate} rawInput={input} />

      {/* Transformation Log & Repair Summary Card */}
      <Base64RepairSummaryCard result={result} candidate={activeCandidate} />
    </div>
  );
}

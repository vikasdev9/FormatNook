'use client';

import React, { useState, useMemo } from 'react';
import { ScanSearch, FileSearch, Copy, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { extractBase64Payloads, ExtractedBase64Candidate } from '../services/payload-extractor.service';
import { CopyButton } from '@/components/workspace/CopyButton';

interface PayloadExtractorViewProps {
  onInspectCandidate?: (base64Payload: string) => void;
  onDecodeCandidate?: (base64Payload: string) => void;
}

const SAMPLE_LOG_INPUT = `[2026-11-12T14:30:15.123Z] INFO  API Gateway Response:
HTTP/1.1 200 OK
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvcm1hdE5vb2sgRGV2IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

{
  "status": "success",
  "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "welcomeMessage": "SGVsbG8gRnJvbSBGb3JtYXROb29rIEh1YiE=",
  "docToken": "JVBERi0xLjUKJcfsj6IKNCAwIG9iaiA8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1s1IDAgUl0+PgplbmRvYmoK"
}`;

export function PayloadExtractorView({ onInspectCandidate, onDecodeCandidate }: PayloadExtractorViewProps) {
  const [inputText, setInputText] = useState<string>(SAMPLE_LOG_INPUT);

  const candidates = useMemo<ExtractedBase64Candidate[]>(() => {
    return extractBase64Payloads(inputText);
  }, [inputText]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Input panel */}
      <div className="editor-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <ScanSearch size={16} />
            <span>Paste Mixed Text, Log Files, or JSON to Scan for Base64 Strings</span>
          </div>
          <div className="panel-actions" style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setInputText(SAMPLE_LOG_INPUT)}
            >
              Load Log Sample
            </button>
            {inputText && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setInputText('')}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="panel-body">
          <textarea
            className="editor-textarea wrap-text"
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw server logs, curl commands, JSON responses, or documents containing embedded Base64 strings..."
            spellCheck="false"
            style={{
              minHeight: '130px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              overflowWrap: 'anywhere',
              overflowY: 'auto',
            }}
          />
        </div>
      </div>

      {/* Extracted Candidates Summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
          Detected Base64 Payloads ({candidates.length})
        </span>
        <span style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>
          Filtered by RFC 4648 structure & byte validity
        </span>
      </div>

      {candidates.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {candidates.map((cand, idx) => (
            <div
              key={cand.id}
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
              {/* Header row of candidate */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#22C3EE' }}>
                    #{idx + 1}
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                    {cand.detectedMime}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>
                    Offset: {cand.startIndex}–{cand.endIndex} ({cand.length} chars, ~{cand.estimatedBytes} bytes)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CopyButton text={cand.value} label="Copy" />
                  {onInspectCandidate && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => onInspectCandidate(cand.value)}
                      title="Inspect this Base64 string in Smart Inspector"
                    >
                      <FileSearch size={14} />
                      <span>Inspect</span>
                    </button>
                  )}
                  {onDecodeCandidate && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => onDecodeCandidate(cand.value)}
                      title="Decode this payload"
                    >
                      <Play size={14} />
                      <span>Decode</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Surrounding Context snippet */}
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8', fontStyle: 'italic' }}>
                Context: &quot;{cand.contextSnippet}&quot;
              </div>

              {/* Decoded preview if text */}
              {cand.previewText && (
                <div style={{ fontSize: '0.8125rem', color: '#F8FAFC', backgroundColor: '#0B1120', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                  Decoded text: <span style={{ color: '#22C3EE' }}>{cand.previewText}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        inputText.trim() && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#A6B4C8' }}>
            No valid Base64 payloads detected in the provided input. Check that strings are at least 16 characters and form valid RFC 4648 blocks.
          </div>
        )
      )}
    </div>
  );
}


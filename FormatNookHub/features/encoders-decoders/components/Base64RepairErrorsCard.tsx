'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Base64RepairCandidate } from '../types/base64-repair.types';

interface Base64RepairErrorsCardProps {
  candidate: Base64RepairCandidate | null;
  rawInput: string;
}

export function Base64RepairErrorsCard({ candidate, rawInput }: Base64RepairErrorsCardProps) {
  if (!candidate) return null;

  // Derive all detected malformations
  const malformations: { title: string; detail: string; severity: 'error' | 'warning' }[] = [];

  // 1. Data URI prefix
  if (/^data:([^;]+);base64,/i.test(rawInput) || /data:image\/[a-zA-Z0-9.+_-]+;base64,/i.test(rawInput)) {
    malformations.push({
      title: 'Embedded Data URI Header',
      detail: 'Data URI prefix (data:...;base64,) detected inside payload. Standard Base64 decoders will reject this prefix.',
      severity: 'warning',
    });
  }

  // 2. Escaped newlines
  if (/\\r\\n|\\n|\\r/.test(rawInput)) {
    malformations.push({
      title: 'Escaped String Literal Newlines',
      detail: 'Literal escaped newlines (\\r\\n or \\n) detected from JSON or code serialization.',
      severity: 'warning',
    });
  }

  // 3. Raw whitespace / line breaks
  if (/\r|\n|\t/.test(rawInput)) {
    malformations.push({
      title: 'Raw Line Breaks & Whitespace',
      detail: 'Payload contains embedded newlines or tabs that disrupt continuous byte streams.',
      severity: 'warning',
    });
  }

  // 4. URL-safe characters
  if (/[-_]/.test(rawInput)) {
    malformations.push({
      title: 'URL-Safe Character Alphabet',
      detail: 'Found URL-safe characters ("-" or "_") instead of standard Base64 characters ("+" or "/").',
      severity: 'warning',
    });
  }

  // 5. Unpadded remainder
  const sanitizedLen = rawInput.replace(/[^A-Za-z0-9+/=_-]/g, '').replace(/=+$/, '').length;
  if (sanitizedLen % 4 === 1) {
    malformations.push({
      title: 'Fatal Remainder Modulo 1',
      detail: 'Base64 stream length modulo 4 equals 1 (isolated 6 bits), which cannot form a complete byte and indicates truncated data.',
      severity: 'error',
    });
  } else if (sanitizedLen % 4 !== 0 && !rawInput.includes('=')) {
    malformations.push({
      title: 'Missing Standard Padding (=)',
      detail: `Payload ends prematurely without RFC 4648 padding (missing ${4 - (sanitizedLen % 4)} "=" characters).`,
      severity: 'warning',
    });
  }

  // 6. JSON Wrapping
  if (/^[\s]*[{"'\[]/.test(rawInput)) {
    malformations.push({
      title: 'JSON or Serialized Payload Encapsulation',
      detail: 'The Base64 string was embedded within JSON keys, values, quotes, or array wrappers.',
      severity: 'warning',
    });
  }

  // 7. Non-alphabet characters from candidate
  if (candidate.removedCharCount > 0) {
    const charsList = candidate.removedCharsDetails
      ?.map((d) => `'${d.char}' (×${d.count})`)
      .join(', ') || `${candidate.removedCharCount} characters`;
    malformations.push({
      title: 'Non-Alphabet Foreign Characters',
      detail: `Found foreign characters not belonging to the Base64 alphabet: ${charsList}.`,
      severity: 'error',
    });
  }

  // Add explicit errors from candidate
  candidate.errors.forEach((err) => {
    if (!malformations.some((m) => m.title === err || m.detail === err)) {
      malformations.push({
        title: 'Validation Error',
        detail: err,
        severity: 'error',
      });
    }
  });

  // Add explicit warnings from candidate
  candidate.warnings.forEach((warn) => {
    if (!malformations.some((m) => m.title === warn || m.detail === warn)) {
      malformations.push({
        title: 'Encoding Anomaly',
        detail: warn,
        severity: 'warning',
      });
    }
  });

  const errorCount = malformations.filter((m) => m.severity === 'error').length;
  const warningCount = malformations.filter((m) => m.severity === 'warning').length;

  return (
    <div
      className="repair-errors-card"
      data-testid="base64-repair-errors-card"
      style={{
        backgroundColor: '#151F31',
        border: '1px solid #263449',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={16} style={{ color: errorCount > 0 ? '#EF4444' : warningCount > 0 ? '#F59E0B' : 'var(--color-success)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
            Detected Errors & Malformations
          </span>
        </div>
        <span
          className={`badge ${
            errorCount > 0
              ? 'badge-error'
              : warningCount > 0
              ? 'badge-warning'
              : 'badge-success'
          }`}
          style={{ fontSize: '0.7rem' }}
        >
          {errorCount > 0
            ? `${errorCount} Critical Error${errorCount > 1 ? 's' : ''}`
            : warningCount > 0
            ? `${warningCount} Malformation${warningCount > 1 ? 's' : ''}`
            : 'Clean Input'}
        </span>
      </div>

      {malformations.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontSize: '0.8125rem' }}>
          <CheckCircle2 size={16} />
          <span>No malformations or syntax anomalies detected in this candidate.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {malformations.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                backgroundColor: m.severity === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${m.severity === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              }}
            >
              {m.severity === 'error' ? (
                <AlertCircle size={15} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertTriangle size={15} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: m.severity === 'error' ? '#F87171' : '#FBBF24' }}>
                  {m.title}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{m.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { Wrench, CheckCircle2, ArrowRight } from 'lucide-react';
import { Base64RepairCandidate, Base64RepairResult } from '../types/base64-repair.types';

interface Base64RepairSummaryCardProps {
  result: Base64RepairResult | null;
  candidate: Base64RepairCandidate | null;
}

export function Base64RepairSummaryCard({ result, candidate }: Base64RepairSummaryCardProps) {
  if (!result || !candidate) return null;

  const originalLength = result.originalLength;
  const repairedLength = candidate.normalizedPayload.length;
  const delta = repairedLength - originalLength;

  return (
    <div
      className="repair-summary-card"
      data-testid="base64-repair-summary-card"
      style={{
        backgroundColor: '#151F31',
        border: '1px solid #263449',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
            Repair Transformations Summary
          </span>
        </div>
        <span
          className={`badge ${
            candidate.isDecodable ? 'badge-success' : 'badge-warning'
          }`}
          style={{ fontSize: '0.7rem' }}
        >
          {candidate.isDecodable ? 'Successfully Decodable' : 'Attention Needed'}
        </span>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          backgroundColor: '#0F172A',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          border: '1px solid #1E293B',
          fontSize: '0.75rem',
        }}
      >
        <div>
          <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Original Length</span>
          <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{originalLength.toLocaleString()} chars</span>
        </div>
        <div>
          <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Repaired Length</span>
          <span style={{ fontWeight: 600, color: '#10B981' }}>{repairedLength.toLocaleString()} chars</span>
        </div>
        <div>
          <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Delta</span>
          <span style={{ fontWeight: 600, color: delta === 0 ? '#94A3B8' : delta > 0 ? '#38BDF8' : '#F59E0B' }}>
            {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} chars
          </span>
        </div>
        <div>
          <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Decoded Bytes</span>
          <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{candidate.decodedByteLength.toLocaleString()} bytes</span>
        </div>
        <div>
          <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>MIME Classification</span>
          <span style={{ fontWeight: 600, color: candidate.detectedMimeType ? '#A78BFA' : '#94A3B8' }}>
            {candidate.detectedMimeType || 'application/octet-stream'}
          </span>
        </div>
      </div>

      {/* Applied Transformations List */}
      <div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0', display: 'block', marginBottom: '0.4rem' }}>
          Applied Transformations ({candidate.transformations.length}):
        </span>
        {candidate.transformations.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#A6B4C8' }}>
            {candidate.transformations.map((t, idx) => (
              <li key={idx} style={{ marginTop: '0.25rem', lineHeight: '1.4' }}>
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontSize: '0.8125rem' }}>
            <CheckCircle2 size={14} />
            <span>No transformations needed. Candidate payload was already strictly valid and normalized.</span>
          </div>
        )}
      </div>

      {/* Advanced Stripped Characters Notice */}
      {candidate.removedCharCount > 0 && (
        <div
          style={{
            fontSize: '0.75rem',
            color: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <strong>Advanced Character Stripping:</strong> {candidate.removedCharCount} non-Base64 character
          {candidate.removedCharCount > 1 ? 's' : ''} removed.{' '}
          {candidate.removedCharsDetails &&
            candidate.removedCharsDetails.map((d) => `'${d.char}' (×${d.count})`).join(', ')}
        </div>
      )}
    </div>
  );
}
